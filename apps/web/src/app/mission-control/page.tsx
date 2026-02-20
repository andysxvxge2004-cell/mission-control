import Link from "next/link";
import { prisma } from "@mission-control/db";
import { AgentsList } from "@/components/agents/agents-list";
import { CreateAgentForm } from "@/components/agents/create-agent-form";
import { TaskForm } from "@/components/tasks/task-form";
import { TaskList } from "@/components/tasks/task-list";
import { AuditLogList } from "@/components/audit/audit-log";
import { ensureCoreAgents } from "@/lib/core-agents";

export const dynamic = "force-dynamic";

export default async function MissionControlPage() {
  await ensureCoreAgents();

  const [agents, tasks, auditLogs] = await Promise.all([
    prisma.agent.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        tasks: true,
        memories: { orderBy: { createdAt: "desc" }, take: 1 }
      }
    }),
    prisma.task.findMany({
      orderBy: { createdAt: "desc" },
      include: { agent: { select: { id: true, name: true } } }
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        task: { select: { id: true, title: true } }
      }
    })
  ]);

  const statusCounts = tasks.reduce(
    (acc, task) => {
      acc[task.status as keyof typeof acc] = (acc[task.status as keyof typeof acc] ?? 0) + 1;
      return acc;
    },
    { TODO: 0, DOING: 0, DONE: 0 } as Record<string, number>
  );

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <header className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 to-black p-8 text-white shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-indigo-300">Mission Control</p>
              <h1 className="mt-4 text-3xl font-semibold leading-tight text-white md:text-4xl">
                Internal AI office for TradeWise operations.
              </h1>
              <p className="mt-3 max-w-2xl text-white/70">
                Staff and audit every specialist agent from one command deck.
              </p>
            </div>
            <Link
              href="/"
              className="rounded-full border border-white/20 px-5 py-2 text-sm font-semibold tracking-wide text-white transition hover:border-indigo-300 hover:text-indigo-200"
            >
              TradeWise Dev Dashboard
            </Link>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              { label: "Agents", value: agents.length },
              { label: "Tasks open", value: statusCounts.TODO + statusCounts.DOING },
              { label: "Completed", value: statusCounts.DONE }
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-wide text-white/60">{stat.label}</p>
                <p className="mt-2 text-3xl font-semibold text-white">{stat.value}</p>
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

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Log a task</h2>
            <TaskForm agents={agents.map(({ id, name }) => ({ id, name }))} />
          </div>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Execution queue</h2>
            <TaskList tasks={tasks} agents={agents.map(({ id, name }) => ({ id, name }))} />
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
