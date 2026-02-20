import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@mission-control/db";
import { ensureCoreAgents } from "@/lib/core-agents";
import { formatDateTime } from "@/lib/formatters";

interface AgentFilesParams {
  params: {
    key: string;
  };
}

export const dynamic = "force-dynamic";

export default async function AgentFilesPage({ params }: AgentFilesParams) {
  await ensureCoreAgents();

  const agent = await prisma.agent.findUnique({
    where: { id: params.key },
    include: {
      memories: { orderBy: { createdAt: "desc" }, take: 50 }
    }
  });

  if (!agent) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-indigo-300">Agent files</p>
            <h1 className="mt-2 text-3xl font-semibold">{agent.name}</h1>
            <p className="text-white/70">{agent.role}</p>
          </div>
          <Link
            href={`/mission-control/agents/${agent.id}`}
            className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:border-indigo-400"
          >
            Back to dossier
          </Link>
        </div>

        <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
          <header>
            <p className="text-xs uppercase tracking-wide text-white/60">Role file</p>
            <h2 className="text-2xl font-semibold text-white">{agent.role}</h2>
          </header>
          <article className="text-white/80">{agent.soul}</article>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Recent memory roll</h3>
            <span className="text-xs uppercase tracking-wide text-white/50">{agent.memories.length} entries</span>
          </div>
          <div className="space-y-3">
            {agent.memories.length === 0 ? (
              <p className="text-sm text-white/60">No memories recorded.</p>
            ) : (
              agent.memories.map((memory) => (
                <article
                  key={memory.id}
                  className="rounded-2xl border border-white/10 bg-black/30 p-4"
                >
                  <p className="text-sm text-white/80">{memory.content}</p>
                  <p className="mt-2 text-[11px] uppercase tracking-wide text-white/50">
                    {formatDateTime(memory.createdAt)}
                  </p>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
