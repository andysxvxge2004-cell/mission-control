import { prisma } from "@mission-control/db";
import { formatRelativeTime } from "@/lib/formatters";
import { TASK_STATUSES } from "@/lib/constants";
import { STALE_THRESHOLD_MS } from "@/lib/task-metrics";

const SECTION_MAP = {
  load: "load",
  stuck: "stuck",
  tasks: "tasks",
  audits: "audits"
} as const;

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeStyle: "short"
  }).format(date);
}

function parseSections(param?: string | string[]) {
  if (!param) return Object.keys(SECTION_MAP);
  const values = Array.isArray(param) ? param : param.split(",");
  const valid = values.filter((value) => value in SECTION_MAP);
  return valid.length ? valid : Object.keys(SECTION_MAP);
}

function parseFormat(param?: string | string[]) {
  if (param === "slack") return "slack" as const;
  return "markdown" as const;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const selectedSections = parseSections(searchParams.get("sections") ?? undefined);
  const format = parseFormat(searchParams.get("format") ?? undefined);
  const now = new Date();
  const staleCutoff = new Date(now.getTime() - STALE_THRESHOLD_MS);

  const [agents, tasks, stuckTasks] = await Promise.all([
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
    prisma.task.findMany({
      where: {
        status: "DOING",
        updatedAt: { lt: staleCutoff }
      },
      orderBy: { updatedAt: "asc" },
      include: { agent: { select: { name: true } } }
    })
  ]);

  const statusCounts = TASK_STATUSES.map((status) => ({
    id: status.id,
    label: status.label,
    count: tasks.filter((task) => task.status === status.id).length
  }));

  const agentsWithLoad = agents.map((agent) => {
    const workload = agent.tasks.reduce(
      (acc, task) => {
        if (task.status === "DONE") return acc;
        return acc + 1;
      },
      0
    );
    return { agent, workload };
  });

  const idleAgents = agentsWithLoad.filter(({ workload }) => workload === 0).length;
  const engagedAgents = agentsWithLoad.filter(({ workload }) => workload > 0 && workload <= 3).length;
  const overloadedAgents = agentsWithLoad.filter(({ workload }) => workload > 3).length;

  const busiestAgent = agentsWithLoad.reduce((top, current) => {
    if (!top || current.workload > top.workload) return current;
    return top;
  }, null as (typeof agentsWithLoad)[number] | null);

  const header = `Subject: Mission Control Weekly Digest — ${formatDate(now)}\n\n`;
  const intro = `# Mission Control Weekly Digest\nGenerated ${formatDate(now)}\n\n`;

  const loadSection = `## Agent load\n- Idle: ${idleAgents}\n- Engaged (1-3 active): ${engagedAgents}\n- Overloaded (4+ active): ${overloadedAgents}\n$${
    busiestAgent
      ? `\nTop load: **${busiestAgent.agent.name}** with ${busiestAgent.workload} active task${
          busiestAgent.workload === 1 ? "" : "s"
        }.`
      : ""
  }\n\n`;

  const stuckSection = `## Stuck tasks (48h+)\n${
    stuckTasks.length
      ? stuckTasks
          .map((task) => {
            const assignee = task.agent?.name ?? "Unassigned";
            return `- [${task.status}] ${task.title} — ${assignee} (stuck ${formatRelativeTime(task.updatedAt, now)})`;
          })
          .join("\n")
      : "No tasks have been stuck for more than 48 hours."
  }\n\n`;

  const overallTasks = `## Task status\n${statusCounts.map((status) => `- ${status.label}: ${status.count}`).join("\n")}\n\n`;

  const sections: string[] = [];
  if (selectedSections.includes("load")) sections.push(loadSection);
  if (selectedSections.includes("stuck")) sections.push(stuckSection);
  if (selectedSections.includes("tasks")) sections.push(overallTasks);

  let body: string;
  if (format === "slack") {
    const lines = sections
      .map((section) => section.trim().split("\n").filter(Boolean))
      .flat();
    body = lines.join("\n");
  } else {
    body = `${header}${intro}${sections.join("\n")}`;
  }

  const contentType = format === "slack" ? "text/plain; charset=utf-8" : "text/plain; charset=utf-8";
  const filename = `mission-control-digest-${now.toISOString().slice(0, 10)}${format === "slack" ? "-slack.txt" : ".txt"}`;

  return new Response(body, {
    headers: {
      "content-type": contentType,
      "content-disposition": `attachment; filename="${filename}"`
    }
  });
}
