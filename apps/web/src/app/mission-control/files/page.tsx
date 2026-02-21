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
      soul: true,
      memories: {
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { content: true, createdAt: true }
      },
      tasks: {
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          status: true,
          updatedAt: true
        }
      }
    }
  });

  const agentIds = agents.map((agent) => agent.id);
  const auditLogs = agentIds.length
    ? await prisma.auditLog.findMany({
        where: {
          task: {
            agentId: { in: agentIds }
          }
        },
        orderBy: { createdAt: "desc" },
        take: 250,
        select: {
          action: true,
          createdAt: true,
          task: {
            select: {
              agentId: true,
              title: true
            }
          }
        }
      })
    : [];

  const auditsByAgent = auditLogs.reduce<Record<string, Array<{ action: string; createdAt: Date; taskTitle: string | null }>>>((acc, log) => {
    const agentId = log.task?.agentId;
    if (!agentId) {
      return acc;
    }
    const list = acc[agentId] ?? [];
    if (list.length < 5) {
      list.push({ action: log.action, createdAt: log.createdAt, taskTitle: log.task?.title ?? null });
    }
    acc[agentId] = list;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-indigo-300">Mission Control</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Files</h1>
        <p className="text-white/70">Dive into each dossier&rsquo;s faux folders to review role, soul, memories, tasks, and audits in one place.</p>
      </header>

      <AgentFilesGrid
        agents={agents.map((agent) => ({
          id: agent.id,
          name: agent.name,
          role: agent.role,
          soul: agent.soul,
          memories: agent.memories.map((memory) => ({
            content: memory.content ?? "",
            createdAt: memory.createdAt.toISOString()
          })),
          tasks: agent.tasks.map((task) => ({
            title: task.title,
            status: task.status,
            updatedAt: task.updatedAt.toISOString()
          })),
          audits: (auditsByAgent[agent.id] ?? []).map((log) => ({
            action: log.action,
            taskTitle: log.taskTitle,
            createdAt: log.createdAt.toISOString()
          }))
        }))}
      />
    </div>
  );
}
