import { prisma } from "@mission-control/db";
import { ensureCoreAgents } from "@/lib/core-agents";
import { AgentFilesGrid } from "@/components/agents/agent-files-grid";

export const dynamic = "force-dynamic";

export default async function MissionControlFilesPage() {
  await ensureCoreAgents();

  const agents = await prisma.agent.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      role: true,
      memories: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { content: true, createdAt: true }
      }
    }
  });

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-indigo-300">Mission Control</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Files</h1>
        <p className="text-white/70">Jump into any agent&rsquo;s dossier to review role, soul, memories, and activity.</p>
      </header>

      <AgentFilesGrid
        agents={agents.map((agent) => ({
          id: agent.id,
          name: agent.name,
          role: agent.role,
          lastMemory: agent.memories[0]
            ? { content: agent.memories[0]!.content, createdAt: agent.memories[0]!.createdAt.toISOString() }
            : null
        }))}
      />
    </div>
  );
}
