import { updateTask } from "@/app/actions";
import type { Task, Agent } from "@mission-control/db";
import { TASK_STATUSES, type TaskStatus } from "@/lib/constants";
import { formatDateTime } from "@/lib/formatters";
import { SubmitButton } from "../submit-button";

export type TaskWithAgent = Task & { agent?: Pick<Agent, "id" | "name"> | null };

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
  return (
    <article className="rounded-xl border border-white/10 bg-black/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-indigo-300">{task.agent?.name ?? "Unassigned"}</p>
          <h4 className="text-lg font-semibold text-white">{task.title}</h4>
        </div>
        <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-white/70">{task.status}</span>
      </div>
      {task.description ? <p className="mt-2 text-sm text-white/70">{task.description}</p> : null}
      <p className="mt-2 text-[11px] uppercase tracking-wide text-white/50">Opened {formatDateTime(task.createdAt)}</p>
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
