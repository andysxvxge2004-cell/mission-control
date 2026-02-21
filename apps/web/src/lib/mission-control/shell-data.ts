import { prisma } from "@mission-control/db";
import type { TaskPriority } from "@/lib/constants";
import { evaluateTaskSla, getStaleCutoffDate } from "@/lib/task-metrics";

export interface MissionControlShellData {
  counts: {
    todo: number;
    doing: number;
    done: number;
    stuck: number;
    needsBriefing: number;
    highPriority: number;
  };
  alerts: {
    needsBriefing: Array<{ id: string; name: string; lastMemoryAt?: Date | null }>;
    stuckTasks: Array<{ id: string; title: string; updatedAt: Date }>;
  };
  snapshot: {
    totalAgents: number;
    idleAgents24h: number;
    tasksAtRisk: number;
    tasksBreached: number;
    oldestOpenTaskLabel: string;
    highPriorityStale: number;
  };
}

const HOURS_IN_MS = 1000 * 60 * 60;
const TWENTY_FOUR_HOURS_MS = 24 * HOURS_IN_MS;
const TWELVE_HOURS_MS = 12 * HOURS_IN_MS;

export async function getMissionControlShellData(referenceTime = new Date()): Promise<MissionControlShellData> {
  const referenceMs = referenceTime.getTime();
  const agingThreshold = getStaleCutoffDate(referenceTime.getTime());

  const [agents, stuckTasksRaw, todoCount, doingCount, doneCount, activeTasks] = await Promise.all([
    prisma.agent.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        updatedAt: true,
        memories: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } }
      }
    }),
    prisma.task.findMany({
      where: { status: "DOING", updatedAt: { lt: agingThreshold } },
      orderBy: { updatedAt: "asc" },
      select: { id: true, title: true, updatedAt: true },
      take: 5
    }),
    prisma.task.count({ where: { status: "TODO" } }),
    prisma.task.count({ where: { status: "DOING" } }),
    prisma.task.count({ where: { status: "DONE" } }),
    prisma.task.findMany({
      where: { status: { in: ["TODO", "DOING"] } },
      select: { id: true, priority: true, status: true, createdAt: true, updatedAt: true, agentId: true }
    })
  ]);

  const agentsNeedingBriefing = agents.filter((agent) => agent.memories.length === 0);
  const tasksByAgentLastTouch = activeTasks.reduce<Record<string, number>>((acc, task) => {
    if (!task.agentId) return acc;
    const updated = new Date(task.updatedAt ?? task.createdAt).getTime();
    acc[task.agentId] = Math.max(acc[task.agentId] ?? 0, updated);
    return acc;
  }, {});

  let tasksAtRisk = 0;
  let tasksBreached = 0;
  let oldestOpenTaskHours = 0;
  let highPriorityStale = 0;

  activeTasks.forEach((task) => {
    const priority = task.priority as TaskPriority;
    const sla = evaluateTaskSla(priority, task.status, task.createdAt, referenceTime);

    if (sla.state === "WARNING") {
      tasksAtRisk += 1;
    } else if (sla.state === "BREACH") {
      tasksBreached += 1;
    }

    const ageHours = (referenceMs - new Date(task.createdAt).getTime()) / HOURS_IN_MS;
    if (ageHours > oldestOpenTaskHours) {
      oldestOpenTaskHours = ageHours;
    }

    if (priority === "HIGH") {
      const updated = new Date(task.updatedAt ?? task.createdAt).getTime();
      if (referenceMs - updated >= TWELVE_HOURS_MS) {
        highPriorityStale += 1;
      }
    }
  });

  const idleAgents24h = agents.filter((agent) => {
    const lastMemoryMs = agent.memories[0]?.createdAt?.getTime() ?? 0;
    const lastTaskMs = tasksByAgentLastTouch[agent.id] ?? 0;
    const lastTouch = Math.max(agent.updatedAt.getTime(), lastMemoryMs, lastTaskMs);
    return referenceMs - lastTouch >= TWENTY_FOUR_HOURS_MS;
  }).length;

  return {
    counts: {
      todo: todoCount,
      doing: doingCount,
      done: doneCount,
      stuck: stuckTasksRaw.length,
      needsBriefing: agentsNeedingBriefing.length,
      highPriority: activeTasks.filter((task) => task.priority === "HIGH" && task.status !== "DONE").length
    },
    alerts: {
      needsBriefing: agentsNeedingBriefing.map((agent) => ({
        id: agent.id,
        name: agent.name,
        lastMemoryAt: agent.memories[0]?.createdAt ?? null
      })),
      stuckTasks: stuckTasksRaw
    },
    snapshot: {
      totalAgents: agents.length,
      idleAgents24h,
      tasksAtRisk,
      tasksBreached,
      oldestOpenTaskLabel: formatHoursLabel(oldestOpenTaskHours),
      highPriorityStale
    }
  };
}

function formatHoursLabel(hours: number): string {
  if (hours <= 0) {
    return "<1h";
  }
  const days = Math.floor(hours / 24);
  const remainingHours = Math.floor(hours % 24);
  if (days > 0) {
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  }
  const rounded = Math.max(1, Math.floor(hours));
  return `${rounded}h`;
}
