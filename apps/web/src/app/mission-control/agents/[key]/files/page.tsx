import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@mission-control/db";
import { ensureCoreAgents } from "@/lib/core-agents";
import { formatDateTime } from "@/lib/formatters";
import { getStaleCutoffDate } from "@/lib/task-metrics";
import { AgentFolderViewer, type AgentFolder } from "@/components/agents/agent-folder-viewer";

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
      memories: { orderBy: { createdAt: "desc" }, take: 50 },
      tasks: {
        orderBy: { createdAt: "desc" },
        take: 25
      }
    }
  });

  if (!agent) {
    notFound();
  }

  const auditLogs = await prisma.auditLog.findMany({
    where: {
      task: {
        agentId: agent.id
      }
    },
    orderBy: { createdAt: "desc" },
    take: 25,
    include: {
      task: { select: { title: true } }
    }
  });

  const now = new Date();
  const staleThreshold = getStaleCutoffDate(now.getTime());

  const openTasks = agent.tasks.filter((task) => task.status !== "DONE");
  const doneTasks = agent.tasks.filter((task) => task.status === "DONE");
  const stuckTasks = agent.tasks.filter((task) => task.status === "DOING" && task.updatedAt < staleThreshold);

  const folderData: AgentFolder[] = [
    {
      id: "role",
      title: "Role Brief",
      summary: agent.role,
      copyText: agent.role,
      entries: [
        {
          title: "Role",
          content: agent.role
        }
      ]
    },
    {
      id: "soul",
      title: "Soul File",
      summary: agent.soul.slice(0, 120),
      copyText: agent.soul,
      entries: [
        {
          title: "Soul",
          content: agent.soul
        }
      ]
    },
    {
      id: "memories",
      title: "Memory Roll",
      summary: agent.memories.length ? `${agent.memories.length} captured` : "No memories yet",
      copyText: agent.memories.map((memory) => `${formatDateTime(memory.createdAt)} — ${memory.content}`).join("\n"),
      entries: agent.memories.slice(0, 8).map((memory) => ({
        title: formatDateTime(memory.createdAt),
        content: memory.content
      }))
    },
    {
      id: "audits",
      title: "Audit Trail",
      summary: auditLogs.length ? `${auditLogs.length} events` : "No activity",
      copyText: auditLogs.map((log) => `${formatDateTime(log.createdAt)} — ${log.action} (${log.task?.title ?? "General"})`).join("\n"),
      entries: auditLogs.slice(0, 8).map((log) => ({
        title: log.action,
        content: log.task?.title ?? "General event",
        meta: formatDateTime(log.createdAt)
      }))
    },
    {
      id: "tasks",
      title: "Task Ledger",
      summary: `${openTasks.length} open / ${doneTasks.length} done / ${stuckTasks.length} stuck`,
      copyText: agent.tasks
        .map((task) => `[${task.status}] ${task.title}`)
        .join("\n"),
      entries: agent.tasks.slice(0, 8).map((task) => ({
        title: task.title,
        content: task.description ?? "No description",
        meta: `${task.status} • ${formatDateTime(task.updatedAt)}`
      }))
    }
  ];

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
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

        <AgentFolderViewer
          agentName={agent.name}
          folders={folderData}
        />
      </div>
    </main>
  );
}
