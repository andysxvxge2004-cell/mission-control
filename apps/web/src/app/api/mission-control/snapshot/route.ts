import { prisma } from "@mission-control/db";
import { TASK_STATUSES } from "@/lib/constants";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeStyle: "short"
  }).format(date);
}

export async function GET() {
  const now = new Date();

  const [agents, tasks, auditLogs] = await Promise.all([
    prisma.agent.findMany({
      orderBy: { name: "asc" },
      include: {
        tasks: true,
        memories: { orderBy: { createdAt: "desc" }, take: 1 }
      }
    }),
    prisma.task.findMany({
      orderBy: { createdAt: "desc" },
      include: { agent: { select: { name: true } } }
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { task: { select: { title: true } } }
    })
  ]);

  const statusCounts = TASK_STATUSES.map((status) => ({
    id: status.id,
    label: status.label,
    count: tasks.filter((task) => task.status === status.id).length
  }));

  const header = `# Mission Control Snapshot\n\n`;
  const meta = `Generated: ${formatDate(now)}\nAgents: ${agents.length}\nTasks (open): ${statusCounts
    .filter((status) => status.id !== "DONE")
    .reduce((acc, status) => acc + status.count, 0)}\nCompleted: ${statusCounts.find((status) => status.id === "DONE")?.count ?? 0}\n\n`;

  const agentsSection = `## Agents\n${agents
    .map((agent) => {
      const latestMemory = agent.memories[0];
      const activeTasks = agent.tasks.filter((task) => task.status !== "DONE").length;
      return `- **${agent.name}** (${agent.role}) — ${activeTasks} active / ${agent.tasks.length} total${
        latestMemory ? ` | Last memory: ${latestMemory.content}` : ""
      }`;
    })
    .join("\n")}\n\n`;

  const tasksSection = `## Tasks\n${statusCounts
    .map((status) => `- ${status.label}: ${status.count}`)
    .join("\n")}\n\n${tasks
    .slice(0, 20)
    .map((task) => `- [${task.status}] ${task.title}${task.agent ? ` — ${task.agent.name}` : ""}`)
    .join("\n")}\n\n`;

  const auditSection = `## Recent audit log\n${auditLogs
    .map((log) => `- ${formatDate(log.createdAt)} — ${log.action}${log.task ? ` (${log.task.title})` : ""}`)
    .join("\n")}\n`;

  const markdown = `${header}${meta}${agentsSection}${tasksSection}${auditSection}`;

  return new Response(markdown, {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "content-disposition": `attachment; filename="mission-control-snapshot-${now.toISOString()}.md"`
    }
  });
}
