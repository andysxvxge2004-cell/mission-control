import { prisma } from "@mission-control/db";
import { getStaleCutoffDate } from "@/lib/task-metrics";

export interface MissionControlShellData {
  counts: {
    agents: number;
    openTasks: number;
    stuckTasks: number;
    needsBriefing: number;
  };
  alerts: {
    needsBriefing: Array<{ id: string; name: string; lastMemoryAt?: Date | null }>;
    stuckTasks: Array<{ id: string; title: string; updatedAt: Date }>;
  };
}

export async function getMissionControlShellData(referenceTime = new Date()): Promise<MissionControlShellData> {
  const agingThreshold = getStaleCutoffDate(referenceTime.getTime());

  const [agents, stuckTasksRaw, todoCount, doingCount] = await Promise.all([
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
    prisma.task.count({ where: { status: "DOING" } })
  ]);

  const agentsNeedingBriefing = agents.filter((agent) => agent.memories.length === 0);
  const openTasks = todoCount + doingCount;

  return {
    counts: {
      agents: agents.length,
      openTasks,
      stuckTasks: stuckTasksRaw.length,
      needsBriefing: agentsNeedingBriefing.length
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
