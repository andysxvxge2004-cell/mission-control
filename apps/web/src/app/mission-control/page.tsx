import { prisma, type Prisma } from "@mission-control/db";
import { AgentsList } from "@/components/agents/agents-list";
import { CreateAgentForm } from "@/components/agents/create-agent-form";
import { TaskForm } from "@/components/tasks/task-form";
import { TaskList } from "@/components/tasks/task-list";
import { TaskFilters } from "@/components/tasks/task-filters";
import { TaskAgingAlerts } from "@/components/tasks/task-aging-alerts";
import { AuditLogList } from "@/components/audit/audit-log";
import { AgentPerformanceRollup } from "@/components/agents/agent-performance-rollup";
import { AgentsNeedingMemory } from "@/components/agents/agents-needing-memory";
import { ensureCoreAgents } from "@/lib/core-agents";
import { TASK_STATUSES, type TaskStatus } from "@/lib/constants";
import { getStaleCutoffDate } from "@/lib/task-metrics";

export const dynamic = "force-dynamic";

interface MissionControlPageProps {
  searchParams?: {
    agent?: string;
    status?: string;
  };
}

function parseStatus(value?: string): TaskStatus | undefined {
  if (!value) return undefined;
  return (TASK_STATUSES.find((status) => status.id === value)?.id as TaskStatus | undefined) ?? undefined;
}

export default async function MissionControlPage({ searchParams }: MissionControlPageProps) {
  await ensureCoreAgents();

  const agentFilter = typeof searchParams?.agent === "string" && searchParams.agent.length > 0 ? searchParams.agent : undefined;
  const statusFilter = parseStatus(typeof searchParams?.status === "string" ? searchParams.status : undefined);

  const taskWhere: Prisma.TaskWhereInput = {};
  if (agentFilter) {
    taskWhere.agentId = agentFilter;
  }
  if (statusFilter) {
    taskWhere.status = statusFilter;
  }

  const now = new Date();
  const agingThreshold = getStaleCutoffDate(now.getTime());

  const [agents, filteredTasks, auditLogs, agingTasks] = await Promise.all([
    prisma.agent.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        tasks: true,
        memories: { orderBy: { createdAt: "desc" }, take: 1 }
      }
    }),
    prisma.task.findMany({
      where: taskWhere,
      orderBy: { createdAt: "desc" },
      include: {
        agent: { select: { id: true, name: true } },
        auditLogs: {
          orderBy: { createdAt: "desc" },
          take: 3,
          select: { id: true, action: true, createdAt: true }
        }
      }
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        task: { select: { id: true, title: true } }
      }
    }),
    prisma.task.findMany({
      where: {
        status: "DOING",
        updatedAt: { lt: agingThreshold }
      },
      orderBy: { updatedAt: "asc" },
      include: { agent: { select: { id: true, name: true } } }
    })
  ]);

  const agentsForSelect = agents.map(({ id, name }) => ({ id, name }));
  const hasActiveFilters = Boolean(agentFilter || statusFilter);
  const stuckCount = agingTasks.length;

  return (
    <div className="flex flex-col gap-10">
      <AgentsNeedingMemory agents={agents} referenceTime={now} />

      <section className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Agent roster</h2>
              <span className="text-xs uppercase tracking-wide text-white/50">Live</span>
            </div>
            <AgentsList agents={agents} hrefPrefix="/mission-control/agents" />
          </div>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Create new agent</h2>
            <CreateAgentForm />
          </div>
        </section>

        <section className="space-y-4">
          <AgentPerformanceRollup agents={agents} />
          <TaskAgingAlerts tasks={agingTasks} referenceTime={now} />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Log a task</h2>
            <TaskForm agents={agentsForSelect} />
          </div>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Execution queue</h2>
            {stuckCount > 0 ? (
              <div className="rounded-2xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                {stuckCount} task{stuckCount === 1 ? "" : "s"} have been in Doing for 48h+.
              </div>
            ) : null}
            <TaskFilters
              agents={agentsForSelect}
              currentAgentId={agentFilter}
              currentStatus={statusFilter}
              basePath="/mission-control"
            />
            <TaskList tasks={filteredTasks} agents={agentsForSelect} isFiltered={hasActiveFilters} />
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Audit log</h2>
            <span className="text-xs uppercase tracking-wide text-white/50">Last 20 events</span>
          </div>
          <AuditLogList logs={auditLogs} />
        </section>
      </div>
  );
}
