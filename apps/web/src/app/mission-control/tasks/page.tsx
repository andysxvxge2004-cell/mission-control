import { prisma, type Prisma } from "@mission-control/db";
import { TaskFilters } from "@/components/tasks/task-filters";
import { TaskList } from "@/components/tasks/task-list";
import { TaskAgingAlerts } from "@/components/tasks/task-aging-alerts";
import { AuditLogList } from "@/components/audit/audit-log";
import { ensureCoreAgents } from "@/lib/core-agents";
import { TASK_PRIORITIES, TASK_STATUSES, type TaskPriority, type TaskStatus } from "@/lib/constants";
import { getStaleCutoffDate } from "@/lib/task-metrics";

export const dynamic = "force-dynamic";

interface TasksPageProps {
  searchParams?: {
    agent?: string;
    status?: string;
    priority?: string;
  };
}

function parseStatus(value?: string): TaskStatus | undefined {
  if (!value) return undefined;
  return (TASK_STATUSES.find((status) => status.id === value)?.id as TaskStatus | undefined) ?? undefined;
}

function parsePriority(value?: string): TaskPriority | undefined {
  if (!value) return undefined;
  return (TASK_PRIORITIES.find((priority) => priority.id === value)?.id as TaskPriority | undefined) ?? undefined;
}

export default async function MissionControlTasksPage({ searchParams }: TasksPageProps) {
  await ensureCoreAgents();

  const agentFilter = typeof searchParams?.agent === "string" && searchParams.agent.length > 0 ? searchParams.agent : undefined;
  const statusFilter = parseStatus(searchParams?.status);
  const priorityFilter = parsePriority(searchParams?.priority);

  const taskWhere: Prisma.TaskWhereInput = {};
  if (agentFilter) taskWhere.agentId = agentFilter;
  if (statusFilter) taskWhere.status = statusFilter;
  if (priorityFilter) taskWhere.priority = priorityFilter;

  const now = new Date();
  const agingThreshold = getStaleCutoffDate(now.getTime());

  const [agents, filteredTasks, agingTasks, auditLogs] = await Promise.all([
    prisma.agent.findMany({
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true }
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
    prisma.task.findMany({
      where: {
        status: "DOING",
        updatedAt: { lt: agingThreshold }
      },
      orderBy: { updatedAt: "asc" },
      include: { agent: { select: { id: true, name: true } } }
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        task: { select: { id: true, title: true } }
      }
    })
  ]);

  const agentsForSelect = agents.map(({ id, name }) => ({ id, name }));
  const hasActiveFilters = Boolean(agentFilter || statusFilter || priorityFilter);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-indigo-300">Mission Control</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Tasks</h1>
        <p className="text-white/70">Filter, triage, and audit every mission task from one view.</p>
      </header>

      <TaskFilters
        agents={agentsForSelect}
        currentAgentId={agentFilter}
        currentStatus={statusFilter}
        currentPriority={priorityFilter}
        basePath="/mission-control/tasks"
      />

      <TaskAgingAlerts tasks={agingTasks} referenceTime={now} />

      <TaskList tasks={filteredTasks} agents={agentsForSelect} isFiltered={hasActiveFilters} />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Recent audit trail</h2>
          <span className="text-xs uppercase tracking-wide text-white/50">Last 30 events</span>
        </div>
        <AuditLogList logs={auditLogs} />
      </section>
    </div>
  );
}
