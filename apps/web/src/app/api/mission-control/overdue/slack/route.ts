import { prisma } from "@mission-control/db";
import { formatDateTime, formatRelativeTime } from "@/lib/formatters";
import { getStaleCutoffDate, STALE_THRESHOLD_MS } from "@/lib/task-metrics";
import { sendSlackMessage, type SlackMessagePayload } from "@/lib/slack";

export const dynamic = "force-dynamic";

const MAX_TASKS_IN_MESSAGE = 10;

function buildMissionControlUrl() {
  const base = process.env.MISSION_CONTROL_BASE_URL?.replace(/\/$/, "");
  if (!base) return null;
  return `${base}/mission-control/tasks?status=DOING`;
}

function buildSlackPayload(tasks: Awaited<ReturnType<typeof fetchOverdueTasks>>["tasks"], now: Date): SlackMessagePayload {
  const queueUrl = buildMissionControlUrl();
  const headerCount = tasks.length === 1 ? "1 task" : `${tasks.length} tasks`;
  const intro = `${headerCount} stuck in Doing for 48h+`;
  const lines = tasks.slice(0, MAX_TASKS_IN_MESSAGE).map((task) => {
    const assignee = task.agent?.name ?? "Unassigned";
    const age = formatRelativeTime(task.updatedAt, now);
    return `• *${task.title}* — ${assignee} (${age})`;
  });
  const overflow = tasks.length > MAX_TASKS_IN_MESSAGE ? `\n…plus ${tasks.length - MAX_TASKS_IN_MESSAGE} more.` : "";
  const cta = queueUrl ? `<${queueUrl}|Open Mission Control>` : "Open Mission Control → /mission-control/tasks";
  const text = `${intro}\n${lines.join("\n")}${overflow}\n${cta}`;

  const blocks = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `Mission Control: ${headerCount} overdue`,
        emoji: true
      }
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${intro}*\n${lines.join("\n")} ${overflow}`.trim()
      }
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `${cta} • Generated ${formatDateTime(now)} (threshold ${Math.round(STALE_THRESHOLD_MS / (1000 * 60 * 60))}h)`
        }
      ]
    }
  ];

  return { text, blocks };
}

async function fetchOverdueTasks() {
  const now = new Date();
  const cutoff = getStaleCutoffDate(now.getTime());

  const tasks = await prisma.task.findMany({
    where: {
      status: "DOING",
      updatedAt: { lt: cutoff }
    },
    orderBy: { updatedAt: "asc" },
    include: { agent: { select: { name: true } } }
  });

  return { tasks, now };
}

async function triggerSlackNotification() {
  const { tasks, now } = await fetchOverdueTasks();

  if (tasks.length === 0) {
    return Response.json({ ok: true, sent: false, reason: "no_overdue_tasks" });
  }

  const payload = buildSlackPayload(tasks, now);
  const slackResult = await sendSlackMessage(payload);

  if (!slackResult.ok) {
    if (slackResult.reason === "missing_webhook_url") {
      return Response.json({ ok: true, sent: false, reason: "missing_webhook", preview: payload });
    }

    return Response.json(
      {
        ok: false,
        sent: false,
        reason: slackResult.reason ?? "slack_error",
        status: slackResult.status,
        body: slackResult.body
      },
      { status: 502 }
    );
  }

  return Response.json({ ok: true, sent: true, count: tasks.length });
}

export async function POST() {
  return triggerSlackNotification();
}

export async function GET() {
  return triggerSlackNotification();
}
