import Link from "next/link";
import { prisma } from "@mission-control/db";
import { ensureCoreAgents } from "@/lib/core-agents";

export const dynamic = "force-dynamic";

export default async function MissionControlFilesPage() {
  await ensureCoreAgents();

  const agents = await prisma.agent.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      role: true,
      memories: { orderBy: { createdAt: "desc" }, take: 1 }
    }
  });

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-indigo-300">Mission Control</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Files</h1>
        <p className="text-white/70">Jump into any agent&rsquo;s dossier to review role, soul, memories, and activity.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {agents.map((agent) => (
          <Link
            key={agent.id}
            href={`/mission-control/agents/${agent.id}/files`}
            className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-indigo-300/70 hover:bg-white/10"
          >
            <p className="text-xs uppercase tracking-wide text-indigo-300">{agent.role}</p>
            <h2 className="text-xl font-semibold text-white">{agent.name}</h2>
            <p className="mt-2 text-sm text-white/70">
              {agent.memories.length ? `Last memory ${new Date(agent.memories[0]!.createdAt).toLocaleDateString()}` : "No memories yet"}
            </p>
            <p className="mt-3 text-xs text-white/50">Open dossier ↗</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
