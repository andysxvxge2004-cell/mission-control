import { prisma, type Prisma } from "@mission-control/db";
import { AgentsList } from "@/components/agents/agents-list";
import { CreateAgentForm } from "@/components/agents/create-agent-form";
import { TaskForm } from "@/components/tasks/task-form";
import { TaskList } from "@/components/tasks/task-list";
import { TaskFilters } from "@/components/tasks/task-filters";
import { TaskAgingAlerts } from "@/components/tasks/task-aging-alerts";
import { SlaCommandBoard } from "@/components/tasks/sla-command-board";
import { AuditLogPanel } from "@/components/audit/audit-log-panel";
import { AgentPerformanceRollup } from "@/components/agents/agent-performance-rollup";
import { AgentsNeedingMemory } from "@/components/agents/agents-needing-memory";
import { AgentsSearch } from "@/components/agents/agents-search";
import { AgentRecommendations } from "@/components/agents/agent-recommendations";
import { ensureCoreAgents } from "@/lib/core-agents";
import { TASK_PRIORITIES, TASK_STATUSES, type TaskPriority, type TaskStatus } from "@/lib/constants";
import { evaluateTaskSla, getStaleCutoffDate } from "@/lib/task-metrics";

export const dynamic = "force-dynamic";

interface MissionControlPageProps {
  searchParams?: {
    agent?: string;
    status?: string;
    priority?: string;
    search?: string;
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

export default async function MissionControlPage({ searchParams }: MissionControlPageProps) {
  await ensureCoreAgents();

  const agentFilter = typeof searchParams?.agent === "string" && searchParams.agent.length > 0 ? searchParams.agent : undefined;
  const statusFilter = parseStatus(typeof searchParams?.status === "string" ? searchParams.status : undefined);
  const priorityFilter = parsePriority(typeof searchParams?.priority === "string" ? searchParams.priority : undefined);
  const searchQuery = typeof searchParams?.search === "string" ? searchParams.search : "";

  const taskWhere: Prisma.TaskWhereInput = {};
  if (agentFilter) {
    taskWhere.agentId = agentFilter;
  }
  if (statusFilter) {
    taskWhere.status = statusFilter;
  }
  if (priorityFilter) {
    taskWhere.priority = priorityFilter;
  }

  const now = new Date();
  const agingThreshold = getStaleCutoffDate(now.getTime());

  const [agents, filteredTasks, auditLogs, agingTasks, unassignedTasks, slaTasks] = await Promise.all([
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
    }),
    prisma.task.findMany({
      where: {
        status: { in: ["TODO", "DOING"] },
        agentId: null
      },
      select: { id: true, priority: true }
    }),
    prisma.task.findMany({
      where: {
        status: { in: ["TODO", "DOING"] }
      },
      select: { id: true, title: true, priority: true, status: true, createdAt: true, updatedAt: true }
    })
  ]);

  const agentsForSelect = agents.map(({ id, name }) => ({ id, name }));
  const filteredAgents = searchQuery
    ? agents.filter((agent) => agent.name.toLowerCase().includes(searchQuery.toLowerCase()) || agent.role.toLowerCase().includes(searchQuery.toLowerCase()))
    : agents;
  const hasActiveFilters = Boolean(agentFilter || statusFilter || priorityFilter);
  const stuckCount = agingTasks.length;
  const agentsWithWorkload = agents.map((agent) => {
    const activeLoad = agent.tasks.filter((task) => task.status !== "DONE").length;
    return { ...agent, activeLoad };
  });

  const recommendations = agentsWithWorkload
    .filter(({ activeLoad }) => activeLoad <= 3)
    .sort((a, b) => a.activeLoad - b.activeLoad || a.name.localeCompare(b.name))
    .slice(0, 3)
    .map((agent) => ({ id: agent.id, name: agent.name, role: agent.role, workload: agent.activeLoad }));

  const backlogSummary = TASK_PRIORITIES.reduce(
    (acc, priority) => {
      acc.byPriority[priority.id] = 0;
      return acc;
    },
    { total: 0, byPriority: {} as Record<TaskPriority, number> }
  );

  unassignedTasks.forEach((task) => {
    const priority = parsePriority(task.priority) ?? "MEDIUM";
    backlogSummary.byPriority[priority] = (backlogSummary.byPriority[priority] ?? 0) + 1;
    backlogSummary.total += 1;
  });

  const slaSummary = filteredTasks.reduce(
    (acc, task) => {
      const meta = evaluateTaskSla(task.priority as TaskPriority, task.status, task.createdAt, now);
      if (meta.state === "BREACH") {
        acc.breach += 1;
      } else if (meta.state === "WARNING") {
        acc.warning += 1;
      }
      return acc;
    },
    { breach: 0, warning: 0 }
  );

  return (
    <div className="flex flex-col gap-10">
      <AgentsNeedingMemory agents={agents} referenceTime={now} />

      <AgentsSearch
        basePath="/mission-control"
        quickLinkPrefix="/mission-control/agents"
        query={searchQuery}
        matches={filteredAgents.map(({ id, name, role }) => ({ id, name, role }))}
        hiddenParams={{ agent: agentFilter ?? undefined, status: statusFilter ?? undefined, priority: priorityFilter ?? undefined }}
      />

      <AgentRecommendations backlogSummary={backlogSummary} recommendations={recommendations} />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/10 bg-white/5 p-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-white/60">Reporting</p>
          <p className="text-sm text-white/70">
            Export a markdown snapshot for daily handoffs or pull the weekly digest that summarizes agent load and stuck work.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href="/api/mission-control/snapshot"
            className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:border-indigo-300 hover:text-indigo-200"
          >
            Export snapshot
          </a>
          <a
            href="/api/mission-control/digest"
            className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:border-indigo-300 hover:text-indigo-200"
          >
            Weekly digest
          </a>
          <a
            href="/api/mission-control/digest?format=slack"
            className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:border-indigo-300 hover:text-indigo-200"
          >
            Slack preview
          </a>
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Agent roster</h2>
              <span className="text-xs uppercase tracking-wide text-white/50">Live</span>
            </div>
            <AgentsList agents={filteredAgents} hrefPrefix="/mission-control/agents" referenceTime={now.toISOString()} />
          </div>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Create new agent</h2>
            <CreateAgentForm />
          </div>
        </section>

        <section className="space-y-4">
          <AgentPerformanceRollup agents={agents} />
          <SlaCommandBoard tasks={slaTasks} referenceTime={now.toISOString()} />
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
            {slaSummary.breach > 0 ? (
              <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                {slaSummary.breach} task{slaSummary.breach === 1 ? "" : "s"} breached SLA thresholds{
                  slaSummary.warning > 0 ? ` and ${slaSummary.warning} due soon` : ""
                }.
              </div>
            ) : slaSummary.warning > 0 ? (
              <div className="rounded-2xl border border-amber-300/40 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
                {slaSummary.warning} task{slaSummary.warning === 1 ? "" : "s"} approaching SLA limits.
              </div>
            ) : null}
            <TaskFilters
              agents={agentsForSelect}
              currentAgentId={agentFilter}
              currentStatus={statusFilter}
              currentPriority={priorityFilter}
              basePath="/mission-control"
            />
            <TaskList tasks={filteredTasks} agents={agentsForSelect} isFiltered={hasActiveFilters} />
          </div>
        </section>

        <AuditLogPanel logs={auditLogs} />
      </div>
  );
}
