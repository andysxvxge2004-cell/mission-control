import { TASK_PRIORITIES, TASK_PRIORITY_SLA_HOURS, type TaskPriority } from "@/lib/constants";
import { evaluateTaskSla } from "@/lib/task-metrics";

export interface SlaTaskSummary {
  id: string;
  title: string;
  priority: TaskPriority;
  status: string;
  createdAt: string;
}

interface SlaCommandBoardProps {
  tasks: SlaTaskSummary[];
  referenceTime: string;
}

const PRIORITY_DESCRIPTIONS: Record<TaskPriority, string> = {
  HIGH: "Critical missions (target 12h)",
  MEDIUM: "Standard missions (target 48h)",
  LOW: "Backlog missions (target 120h)"
};

export function SlaCommandBoard({ tasks, referenceTime }: SlaCommandBoardProps) {
  const now = new Date(referenceTime);
  const sections = TASK_PRIORITIES.map((priority) => buildPriorityStats(priority.id, tasks, now));

  return (
    <section className="space-y-4 rounded-3xl border border-white/10 bg-slate-900/60 p-5 text-white">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-indigo-200">Command board</p>
          <h2 className="text-2xl font-semibold">SLA clocks</h2>
          <p className="text-sm text-white/70">Target vs. actual runtime for every priority lane.</p>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {sections.map((section) => (
          <article
            key={section.priority}
            className="rounded-2xl border border-white/10 bg-black/30 p-4 shadow-inner shadow-black/20"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-white/50">{section.priority}</p>
                <h3 className="text-lg font-semibold text-white">{section.label}</h3>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${section.badgeClass}`}>
                {section.statusLabel}
              </span>
            </div>
            <p className="mt-1 text-xs text-white/60">{PRIORITY_DESCRIPTIONS[section.priority]}</p>

            <div className="mt-4 space-y-1 text-sm">
              <p className="flex items-center justify-between text-white/70">
                <span>Target</span>
                <span>{section.thresholdHours}h</span>
              </p>
              <div className="h-2 rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full ${section.progressClass}`}
                  style={{ width: `${section.progressPercent}%` }}
                />
              </div>
              <p className="flex items-center justify-between text-white/80">
                <span>Worst clock</span>
                <span>
                  {section.worstElapsed.toFixed(1)}h
                  {section.deltaLabel ? <span className="ml-2 text-xs text-white/60">({section.deltaLabel})</span> : null}
                </span>
              </p>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-2 text-xs text-white/70">
              <div className="rounded-xl border border-white/10 bg-white/5 p-2 text-center">
                <dt>Open</dt>
                <dd className="text-white text-lg font-semibold">{section.open}</dd>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-2 text-center">
                <dt>Warning</dt>
                <dd className="text-amber-200 text-lg font-semibold">{section.warning}</dd>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-2 text-center">
                <dt>Breach</dt>
                <dd className="text-rose-200 text-lg font-semibold">{section.breach}</dd>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-2 text-center">
                <dt>Avg elapsed</dt>
                <dd className="text-white text-lg font-semibold">{section.avgElapsed.toFixed(1)}h</dd>
              </div>
            </dl>

            {section.topTask ? (
              <div className="mt-4 rounded-xl border border-white/10 bg-black/40 p-3 text-xs text-white/80">
                <p className="font-semibold text-white">Top risk</p>
                <p className="mt-1 text-white/70">{section.topTask.title}</p>
                <p className="mt-1 text-[10px] uppercase tracking-wide text-white/50">
                  {section.topTask.elapsed.toFixed(1)}h elapsed
                </p>
              </div>
            ) : (
              <p className="mt-4 text-xs text-white/50">No open work in this lane.</p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

function buildPriorityStats(priority: TaskPriority, tasks: SlaTaskSummary[], now: Date) {
  const relevant = tasks.filter((task) => task.priority === priority);
  const thresholdHours = TASK_PRIORITY_SLA_HOURS[priority];
  if (!relevant.length) {
    return {
      priority,
      label: `${priority.charAt(0) + priority.slice(1).toLowerCase()} priority`,
      thresholdHours,
      worstElapsed: 0,
      avgElapsed: 0,
      deltaLabel: undefined,
      open: 0,
      warning: 0,
      breach: 0,
      progressPercent: 0,
      progressClass: "bg-emerald-400",
      statusLabel: "Clear",
      badgeClass: "bg-emerald-400/20 text-emerald-100",
      topTask: null
    };
  }

  const metrics = relevant.map((task) => {
    const elapsedHours = (now.getTime() - new Date(task.createdAt).getTime()) / (1000 * 60 * 60);
    const sla = evaluateTaskSla(task.priority, task.status, task.createdAt, now);
    return { task, elapsedHours, sla };
  });

  const warning = metrics.filter((entry) => entry.sla.state === "WARNING").length;
  const breach = metrics.filter((entry) => entry.sla.state === "BREACH").length;
  const avgElapsed = metrics.reduce((sum, entry) => sum + entry.elapsedHours, 0) / metrics.length;
  const worst = metrics.reduce((acc, entry) => (entry.elapsedHours > acc.elapsedHours ? entry : acc));
  const delta = worst.elapsedHours - thresholdHours;

  const statusLabel = breach > 0 ? "Breach" : warning > 0 ? "Warning" : "On track";
  const badgeClass =
    breach > 0
      ? "bg-rose-500/20 text-rose-100"
      : warning > 0
        ? "bg-amber-400/20 text-amber-100"
        : "bg-emerald-500/20 text-emerald-100";

  const progressPercent = Math.min(100, Math.max(0, (worst.elapsedHours / thresholdHours) * 100));
  const progressClass = breach > 0 ? "bg-rose-400" : warning > 0 ? "bg-amber-300" : "bg-emerald-400";

  return {
    priority,
    label: `${priority.charAt(0) + priority.slice(1).toLowerCase()} priority`,
    thresholdHours,
    worstElapsed: worst.elapsedHours,
    avgElapsed,
    deltaLabel: delta > 0 ? `+${delta.toFixed(1)}h` : `${Math.abs(delta).toFixed(1)}h remaining`,
    open: relevant.length,
    warning,
    breach,
    progressPercent,
    progressClass,
    statusLabel,
    badgeClass,
    topTask: {
      title: worst.task.title,
      elapsed: worst.elapsedHours
    }
  };
}
