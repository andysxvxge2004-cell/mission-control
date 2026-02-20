import Link from "next/link";
import { prisma, type Prisma } from "@mission-control/db";
import { AgentsList } from "@/components/agents/agents-list";
import { CreateAgentForm } from "@/components/agents/create-agent-form";
import { TaskForm } from "@/components/tasks/task-form";
import { TaskList } from "@/components/tasks/task-list";
import { TaskFilters } from "@/components/tasks/task-filters";
import { TaskAgingAlerts } from "@/components/tasks/task-aging-alerts";
import { AuditLogList } from "@/components/audit/audit-log";
import { AgentPerformanceRollup } from "@/components/agents/agent-performance-rollup";
import { ensureCoreAgents } from "@/lib/core-agents";
import { TASK_STATUSES, type TaskStatus } from "@/lib/constants";
import { getStaleCutoffDate } from "@/lib/task-metrics";

export const dynamic = "force-dynamic";

interface HomePageProps {
  searchParams?: {
    agent?: string;
    status?: string;
  };
}

function parseStatus(value?: string): TaskStatus | undefined {
  if (!value) return undefined;
  return (TASK_STATUSES.find((status) => status.id === value)?.id as TaskStatus | undefined) ?? undefined;
}

export default async function Home({ searchParams }: HomePageProps) {
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

  const [agents, filteredTasks, auditLogs, todoCount, doingCount, doneCount, agingTasks] = await Promise.all([
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
      include: { agent: { select: { id: true, name: true } } }
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        task: { select: { id: true, title: true } }
      }
    }),
    prisma.task.count({ where: { status: "TODO" } }),
    prisma.task.count({ where: { status: "DOING" } }),
    prisma.task.count({ where: { status: "DONE" } }),
    prisma.task.findMany({
      where: {
        status: "DOING",
        updatedAt: { lt: agingThreshold }
      },
      orderBy: { updatedAt: "asc" },
      include: { agent: { select: { id: true, name: true } } }
    })
  ]);

  const statusCounts: Record<TaskStatus, number> = {
    TODO: todoCount,
    DOING: doingCount,
    DONE: doneCount
  };

  const agentsForSelect = agents.map(({ id, name }) => ({ id, name }));
  const hasActiveFilters = Boolean(agentFilter || statusFilter);
  const stuckCount = agingTasks.length;
  const statCards = [
    { label: "Agents", value: agents.length },
    { label: "Tasks open", value: statusCounts.TODO + statusCounts.DOING },
    { label: "Completed", value: statusCounts.DONE },
    { label: "Stuck in Doing", value: stuckCount, highlight: stuckCount > 0 }
  ];

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <header className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 to-black p-8 text-white shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-indigo-300">Mission Control</p>
              <h1 className="mt-4 text-3xl font-semibold leading-tight text-white md:text-4xl">
                Staff, brief, and audit every AI operator from one command deck.
              </h1>
              <p className="mt-3 max-w-2xl text-white/70">
                Spin up specialist agents, track their tasks, and keep a permanent memory trail.
              </p>
            </div>
            <Link
              href="/mission-control"
              className="rounded-full border border-white/20 px-5 py-2 text-sm font-semibold tracking-wide text-white transition hover:border-indigo-300 hover:text-indigo-200"
            >
              View all agents
            </Link>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat) => (
              <div
                key={stat.label}
                className={`rounded-2xl border p-4 ${
                  stat.highlight ? "border-amber-300/60 bg-amber-400/10" : "border-white/10 bg-white/5"
                }`}
              >
                <p
                  className={`text-xs uppercase tracking-wide ${
                    stat.highlight ? "text-amber-100" : "text-white/60"
                  }`}
                >
                  {stat.label}
                </p>
                <p
                  className={`mt-2 text-3xl font-semibold ${
                    stat.highlight ? "text-amber-50" : "text-white"
                  }`}
                >
                  {stat.value}
                </p>
                {stat.highlight ? (
                  <p className="mt-1 text-[11px] uppercase tracking-wide text-amber-100/80">Needs attention</p>
                ) : null}
              </div>
            ))}
          </div>
        </header>

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
              basePath="/"
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
    </main>
  );
}
