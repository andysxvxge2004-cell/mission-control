import type { Agent, Task } from "@mission-control/db";
import { formatDateTime } from "@/lib/formatters";

export type AgingTask = Task & { agent?: Pick<Agent, "id" | "name"> | null };

interface TaskAgingAlertsProps {
  tasks: AgingTask[];
  referenceTime: Date;
}

export function TaskAgingAlerts({ tasks, referenceTime }: TaskAgingAlertsProps) {
  if (!tasks.length) {
    return (
      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
        No tasks have been stuck in Doing for more than 48 hours. ✅
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-3xl border border-amber-300/30 bg-amber-300/10 p-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-amber-200">Aging alerts</p>
          <h3 className="text-lg font-semibold text-white">Tasks stuck in Doing</h3>
        </div>
        <span className="rounded-full bg-amber-400/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-100">
          {tasks.length} alert{tasks.length === 1 ? "" : "s"}
        </span>
      </header>
      <ol className="space-y-3">
        {tasks.map((task) => (
          <li key={task.id} className="rounded-2xl border border-white/15 bg-black/30 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-amber-200">
                  {task.agent?.name ?? "Unassigned"}
                </p>
                <p className="text-base font-semibold text-white">{task.title}</p>
              </div>
              <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-100">
                {ageInHours(task.updatedAt, referenceTime)}h stale
              </span>
            </div>
            {task.description ? <p className="mt-2 text-sm text-white/80">{task.description}</p> : null}
            <p className="mt-2 text-[11px] uppercase tracking-wide text-white/50">
              Last update {formatDateTime(task.updatedAt)}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}

function ageInHours(date: Date, referenceTime: Date) {
  const diffMs = referenceTime.getTime() - new Date(date).getTime();
  return Math.max(48, Math.floor(diffMs / (1000 * 60 * 60)));
}
