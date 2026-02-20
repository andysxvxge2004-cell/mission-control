import { updateTaskStatus } from "@/app/actions";
import type { Task, Agent } from "@mission-control/db";
import { TASK_STATUSES } from "@/lib/constants";
import { formatDateTime } from "@/lib/formatters";
import { SubmitButton } from "../submit-button";

export type TaskWithAgent = Task & { agent?: Pick<Agent, "id" | "name"> | null };

export function TaskList({ tasks }: { tasks: TaskWithAgent[] }) {
  if (!tasks.length) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
        No tasks logged yet.
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {tasks.map((task) => (
        <li key={task.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-indigo-300">{task.agent?.name ?? "Unassigned"}</p>
              <h4 className="text-lg font-semibold text-white">{task.title}</h4>
            </div>
            <span className="rounded-full bg-black/40 px-3 py-1 text-xs font-semibold text-white/80">
              {task.status}
            </span>
          </div>
          {task.description ? (
            <p className="mt-2 text-sm text-white/70">{task.description}</p>
          ) : null}
          <p className="mt-2 text-[11px] uppercase tracking-wide text-white/50">
            Opened {formatDateTime(task.createdAt)}
          </p>
          <form action={updateTaskStatus} className="mt-3 flex flex-wrap items-center gap-2">
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
            <SubmitButton label="Update" pendingLabel="Updating..." />
          </form>
        </li>
      ))}
    </ul>
  );
}
