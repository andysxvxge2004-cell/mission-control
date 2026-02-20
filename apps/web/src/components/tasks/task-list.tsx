import { updateTask } from "@/app/actions";
import type { Task, Agent, AuditLog } from "@mission-control/db";
import { TASK_STATUSES, type TaskStatus } from "@/lib/constants";
import { formatDateTime } from "@/lib/formatters";
import { STALE_THRESHOLD_MS } from "@/lib/task-metrics";
import { SubmitButton } from "../submit-button";

export type TaskWithAgent = Task & {
  agent?: Pick<Agent, "id" | "name"> | null;
  auditLogs?: Pick<AuditLog, "id" | "action" | "createdAt">[];
};

type TaskListProps = {
  tasks: TaskWithAgent[];
  agents?: Pick<Agent, "id" | "name">[];
  isFiltered?: boolean;
};

const STATUS_BADGES: Record<TaskStatus, string> = {
  TODO: "bg-indigo-500/20 text-indigo-100",
  DOING: "bg-amber-500/20 text-amber-100",
  DONE: "bg-emerald-500/20 text-emerald-100"
};

export function TaskList({ tasks, agents = [], isFiltered = false }: TaskListProps) {
  if (!tasks.length) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
        {isFiltered ? "No tasks match the current filters." : "No tasks logged yet."}
      </div>
    );
  }

  const tasksByStatus = TASK_STATUSES.map((status) => ({
    ...status,
    tasks: tasks.filter((task) => task.status === status.id)
  }));

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {tasksByStatus.map((lane) => (
        <section key={lane.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <header className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-white/60">{lane.label}</p>
              <p className="text-sm text-white/70">{lane.tasks.length} task{lane.tasks.length === 1 ? "" : "s"}</p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGES[lane.id as TaskStatus]}`}
            >
              {lane.label}
            </span>
          </header>

          <div className="mt-4 space-y-3">
            {lane.tasks.length === 0 ? (
              <p className="text-sm text-white/60">No tasks in this lane.</p>
            ) : (
              lane.tasks.map((task) => <TaskCard key={task.id} task={task} agents={agents} />)
            )}
          </div>
        </section>
      ))}
    </div>
  );
}

function TaskCard({ task, agents }: { task: TaskWithAgent; agents: Pick<Agent, "id" | "name">[] }) {
  const staleness = getTaskStaleness(task);

  return (
    <article
      className={`rounded-xl border ${staleness.isStale ? "border-amber-400/70 bg-amber-500/5" : "border-white/10 bg-black/40"} p-4`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-indigo-300">{task.agent?.name ?? "Unassigned"}</p>
          <h4 className="text-lg font-semibold text-white">{task.title}</h4>
        </div>
        <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-white/70">{task.status}</span>
      </div>
      {task.description ? <p className="mt-2 text-sm text-white/70">{task.description}</p> : null}
      <p className="mt-2 text-[11px] uppercase tracking-wide text-white/50">Opened {formatDateTime(task.createdAt)}</p>
      {task.auditLogs && task.auditLogs.length ? (
        <div className="mt-3 rounded-lg border border-white/10 bg-white/5 p-3">
          <p className="text-[11px] uppercase tracking-wide text-white/50">Recent activity</p>
          <ol className="mt-2 space-y-2">
            {task.auditLogs.map((log) => (
              <li key={log.id} className="flex items-center justify-between gap-3 text-xs text-white/80">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-300" />
                  <span className="font-semibold text-white">{formatAuditAction(log.action)}</span>
                </div>
                <span className="text-white/60">{formatDateTime(log.createdAt)}</span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
      {staleness.isStale ? (
        <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-100">
          <span className="rounded-full bg-amber-500/30 px-2 py-1 text-[10px] uppercase tracking-wide">Stuck</span>
          <span>Last movement {staleness.lastMovedLabel} ago</span>
        </div>
      ) : null}
      <form action={updateTask} className="mt-3 flex flex-wrap items-center gap-2">
        <input type="hidden" name="taskId" value={task.id} />
        <select
          name="status"
          defaultValue={task.status}
          className="rounded-md border border-white/20 bg-black/40 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none"
        >
          {TASK_STATUSES.map((status) => (
            <option key={status.id} value={status.id}>
              {status.label}
            </option>
          ))}
        </select>
        <select
          name="agentId"
          defaultValue={task.agent?.id ?? ""}
          className="rounded-md border border-white/20 bg-black/40 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none"
        >
          <option value="">Unassigned</option>
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name}
            </option>
          ))}
        </select>
        <SubmitButton label="Update" pendingLabel="Updating..." />
      </form>
    </article>
  );
}

function getTaskStaleness(task: TaskWithAgent) {
  const lastUpdate = task.updatedAt ?? task.createdAt;
  const timeSinceUpdate = Date.now() - new Date(lastUpdate).getTime();
  const isStale = task.status === "DOING" && timeSinceUpdate > STALE_THRESHOLD_MS;

  return {
    isStale,
    lastMovedLabel: formatDuration(timeSinceUpdate)
  };
}

function formatDuration(durationMs: number) {
  const totalHours = Math.floor(durationMs / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;

  if (days > 0) {
    return `${days}d${hours ? ` ${hours}h` : ""}`;
  }

  return `${Math.max(hours, 1)}h`;
}

function formatAuditAction(action: string) {
  return action
    .split(".")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
