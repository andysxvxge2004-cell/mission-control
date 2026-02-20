import { prisma } from "@mission-control/db";
import { AgentPerformanceRollup } from "@/components/agents/agent-performance-rollup";
import { TaskAgingAlerts } from "@/components/tasks/task-aging-alerts";
import { getStaleCutoffDate } from "@/lib/task-metrics";

export const dynamic = "force-dynamic";

export default async function MissionControlIntelligencePage() {
  const now = new Date();
  const agingThreshold = getStaleCutoffDate(now.getTime());

  const [agents, agingTasks] = await Promise.all([
    prisma.agent.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        tasks: true,
        memories: { orderBy: { createdAt: "desc" }, take: 1 }
      }
    }),
    prisma.task.findMany({
      where: { status: "DOING", updatedAt: { lt: agingThreshold } },
      orderBy: { updatedAt: "asc" },
      include: { agent: { select: { id: true, name: true } } }
    })
  ]);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-indigo-300">Mission Control</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Intelligence</h1>
        <p className="text-white/70">High-level signals about throughput, bottlenecks, and operator load.</p>
      </header>

      <AgentPerformanceRollup agents={agents} />

      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Stuck work summary</h2>
          <span className="text-xs uppercase tracking-wide text-white/50">48h+ in Doing</span>
        </div>
        <TaskAgingAlerts tasks={agingTasks} referenceTime={now} />
      </div>
    </div>
  );
}
