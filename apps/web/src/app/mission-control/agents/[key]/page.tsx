import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@mission-control/db";
import { MemoryTimeline } from "@/components/agents/memory-timeline";
import { AddMemoryForm } from "@/components/agents/add-memory-form";
import { TaskList } from "@/components/tasks/task-list";
import { ensureCoreAgents } from "@/lib/core-agents";

interface AgentDetailParams {
  params: {
    key: string;
  };
}

export const dynamic = "force-dynamic";

export default async function AgentDetailPage({ params }: AgentDetailParams) {
  await ensureCoreAgents();

  const agent = await prisma.agent.findUnique({
    where: { id: params.key },
    include: {
      memories: { orderBy: { createdAt: "desc" }, take: 20 }
    }
  });

  if (!agent) {
    notFound();
  }

  const tasks = await prisma.task.findMany({
    where: { agentId: agent.id },
    orderBy: { createdAt: "desc" },
    include: { agent: { select: { id: true, name: true } } }
  });

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-indigo-300">Agent dossier</p>
            <h1 className="mt-2 text-3xl font-semibold">{agent.name}</h1>
            <p className="text-white/70">{agent.role}</p>
          </div>
          <div className="flex gap-3">
            <Link
              href={`/mission-control/agents/${agent.id}/files`}
              className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:border-indigo-400"
            >
              Files
            </Link>
            <Link
              href="/mission-control"
              className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:border-indigo-400"
            >
              Mission Control
            </Link>
          </div>
        </div>

        <section className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold text-white">Soul</h2>
          <p className="text-white/80">{agent.soul}</p>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Recent memories</h2>
              <span className="text-xs uppercase tracking-wide text-white/50">{agent.memories.length} entries</span>
            </div>
            <MemoryTimeline memories={agent.memories} />
          </div>
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Append memory</h2>
            <AddMemoryForm agentId={agent.id} />
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Assigned tasks</h2>
            <span className="text-xs uppercase tracking-wide text-white/50">{tasks.length} open</span>
          </div>
          <TaskList tasks={tasks} />
        </section>
      </div>
    </main>
  );
}
