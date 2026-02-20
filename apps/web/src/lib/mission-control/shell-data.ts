import { prisma } from "@mission-control/db";
import { getStaleCutoffDate } from "@/lib/task-metrics";

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
}

export async function getMissionControlShellData(referenceTime = new Date()): Promise<MissionControlShellData> {
  const agingThreshold = getStaleCutoffDate(referenceTime.getTime());

  const [agents, stuckTasksRaw, todoCount, doingCount, doneCount, highPriorityCount] = await Promise.all([
    prisma.agent.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
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
    prisma.task.count({ where: { priority: "HIGH", NOT: { status: "DONE" } } })
  ]);

  const agentsNeedingBriefing = agents.filter((agent) => agent.memories.length === 0);

  return {
    counts: {
      todo: todoCount,
      doing: doingCount,
      done: doneCount,
      stuck: stuckTasksRaw.length,
      needsBriefing: agentsNeedingBriefing.length,
      highPriority: highPriorityCount
    },
    alerts: {
      needsBriefing: agentsNeedingBriefing.map((agent) => ({
        id: agent.id,
        name: agent.name,
        lastMemoryAt: agent.memories[0]?.createdAt ?? null
      })),
      stuckTasks: stuckTasksRaw
    }
  };
}
