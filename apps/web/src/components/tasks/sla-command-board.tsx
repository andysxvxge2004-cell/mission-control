import { TASK_PRIORITIES, TASK_PRIORITY_SLA_HOURS, type TaskPriority } from "@/lib/constants";
import { evaluateTaskSla, type SlaState, type TaskSlaMeta } from "@/lib/task-metrics";

export interface SlaTaskSummary {
  id: string;
  title: string;
  priority: TaskPriority;
  status: string;
  createdAt: Date | string;
  updatedAt: Date | string | null;
}

interface SlaCommandBoardProps {
  tasks: SlaTaskSummary[];
  referenceTime: string;
}

interface PriorityStats {
  priority: TaskPriority;
  label: string;
  thresholdHours: number;
  open: number;
  warning: number;
  breach: number;
  avgElapsed: number;
  worstElapsed: number;
  deltaLabel?: string;
  progressPercent: number;
  statusLabel: string;
  badgeClass: string;
  progressClass: string;
  topTask?: {
    title: string;
    elapsed: number;
    state: SlaState;
  };
}

interface RiskBandMeta {
  state: SlaState;
  label: string;
  count: number;
  percent: number;
  widthPercent: number;
  barClass: string;
  dotClass: string;
}

interface TaskClockMeta {
  id: string;
  title: string;
  priority: TaskPriority;
  status: string;
  elapsedHours: number;
  sinceUpdateHours: number;
  sla: TaskSlaMeta;
}

const HOURS_IN_MS = 1000 * 60 * 60;
const PRIORITY_LABEL_MAP: Record<TaskPriority, string> = TASK_PRIORITIES.reduce(
  (acc, priority) => ({ ...acc, [priority.id]: priority.label }),
  {} as Record<TaskPriority, string>
);
const RISK_ORDER: Record<SlaState, number> = {
  BREACH: 0,
  WARNING: 1,
  OK: 2
};
const CHIP_BASE = "rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em]";
const RISK_META: Record<SlaState, { label: string; badge: string; bar: string; dot: string }> = {
  BREACH: {
    label: "Breach",
    badge: `${CHIP_BASE} border border-rose-400/60 bg-gradient-to-r from-rose-600/30 to-rose-500/20 text-rose-50`,
    bar: "bg-gradient-to-r from-rose-600 via-rose-500 to-rose-400",
    dot: "bg-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.45)]"
  },
  WARNING: {
    label: "Warning",
    badge: `${CHIP_BASE} border border-amber-300/60 bg-gradient-to-r from-amber-400/30 to-amber-300/20 text-amber-50`,
    bar: "bg-gradient-to-r from-amber-400 via-amber-300 to-amber-200",
    dot: "bg-amber-200 shadow-[0_0_12px_rgba(251,191,36,0.45)]"
  },
  OK: {
    label: "On track",
    badge: `${CHIP_BASE} border border-emerald-300/60 bg-gradient-to-r from-emerald-400/25 to-emerald-300/15 text-emerald-50`,
    bar: "bg-gradient-to-r from-emerald-400 via-emerald-300 to-emerald-200",
    dot: "bg-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.35)]"
  }
};

export function SlaCommandBoard({ tasks, referenceTime }: SlaCommandBoardProps) {
  const now = new Date(referenceTime);
  const taskClocks = buildTaskClocks(tasks, now);
  const priorityStats = TASK_PRIORITIES.map(({ id, label }) => buildPriorityStats(id, label, taskClocks));
  const riskBands = buildRiskBands(taskClocks);
  const attentionList = buildNeedsAttention(taskClocks);

  return (
    <section className="space-y-5 rounded-3xl border border-white/10 bg-slate-900/70 p-5 text-white">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-indigo-200">Command board</p>
          <h2 className="text-2xl font-semibold">SLA intelligence</h2>
          <p className="text-sm text-white/70">Per-priority clocks, breach risk bands, and tasks that need intervention.</p>
        </div>
        <span className={`${CHIP_BASE} border border-white/15 bg-white/10 text-white/80`}>
          {tasks.length} open clock{tasks.length === 1 ? "" : "s"}
        </span>
      </header>

      <div className="space-y-4 rounded-2xl border border-white/10 bg-black/40 p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-wide text-white/60">Breach risk bands</p>
          <span className="text-xs text-white/50">Derived from created/updated timestamps</span>
        </div>
        <div className="flex h-3 overflow-hidden rounded-full border border-white/10 bg-white/5">
          {riskBands.map((band) => (
            <div
              key={band.state}
              className={`${band.barClass}`}
              style={{ width: `${band.widthPercent}%` }}
              aria-label={`${band.label}: ${band.count}`}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-4 text-xs text-white/70">
          {riskBands.map((band) => (
            <span key={band.state} className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${band.dotClass}`} />
              {band.label}
              <strong className="text-white">{band.count}</strong>
              <span className="text-white/50">({band.percent}%)</span>
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[3fr_2fr]">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {priorityStats.map((section) => (
              <article key={section.priority} className="rounded-2xl border border-white/10 bg-black/30 p-4 shadow-inner shadow-black/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-white/50">{section.label}</p>
                    <p className="text-2xl font-semibold text-white">{section.worstElapsed.toFixed(1)}h</p>
                    <p className="text-xs text-white/60">SLA clock (target {section.thresholdHours}h)</p>
                  </div>
                  <span className={section.badgeClass}>{section.statusLabel}</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-white/10">
                  <div className={`h-full rounded-full ${section.progressClass}`} style={{ width: `${section.progressPercent}%` }} />
                </div>
                {section.deltaLabel ? (
                  <p className="mt-1 text-[11px] uppercase tracking-wide text-white/50">{section.deltaLabel}</p>
                ) : null}

                <dl className="mt-4 grid grid-cols-3 gap-2 text-center text-xs text-white/70">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-2">
                    <dt>Open</dt>
                    <dd className="text-lg font-semibold text-white">{section.open}</dd>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-2">
                    <dt>Warning</dt>
                    <dd className="text-lg font-semibold text-amber-100">{section.warning}</dd>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-2">
                    <dt>Breach</dt>
                    <dd className="text-lg font-semibold text-rose-100">{section.breach}</dd>
                  </div>
                </dl>
                <p className="mt-3 text-xs text-white/60">Average time in lane {section.avgElapsed.toFixed(1)}h</p>

                {section.topTask ? (
                  <div className="mt-4 rounded-xl border border-white/10 bg-black/50 p-3 text-xs text-white/80">
                    <p className="text-[10px] uppercase tracking-wide text-white/50">Hottest clock</p>
                    <p className="text-sm font-semibold text-white">{section.topTask.title}</p>
                    <p className="mt-1 text-white/60">
                      {section.topTask.elapsed.toFixed(1)}h elapsed · {RISK_META[section.topTask.state].label}
                    </p>
                  </div>
                ) : (
                  <p className="mt-4 text-xs text-white/50">No open work in this lane.</p>
                )}
              </article>
            ))}
          </div>
        </div>

        <aside className="space-y-4 rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900/80 to-slate-950/80 p-5 shadow-xl shadow-black/40">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">Needs attention</p>
              <p className="text-lg font-semibold text-white">Highest-risk tasks</p>
            </div>
            <span className={`${CHIP_BASE} border border-white/15 bg-white/10 text-white/70`}>
              {attentionList.length ? `${attentionList.length} flagged` : "All clear"}
            </span>
          </div>

          {attentionList.length === 0 ? (
            <p className="text-sm text-white/60">No warning or breach clocks. Keep tempo steady.</p>
          ) : (
            <ol className="space-y-3">
              {attentionList.map((entry) => (
                <li
                  key={entry.id}
                  className="group rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/70 via-slate-950/40 to-black/70 p-4 shadow-inner shadow-black/40 transition hover:border-indigo-300/60"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-white">{entry.title}</p>
                    <span className={RISK_META[entry.sla.state].badge}>{RISK_META[entry.sla.state].label}</span>
                  </div>
                  <p className="mt-1 text-[11px] uppercase tracking-wide text-white/50">
                    {PRIORITY_LABEL_MAP[entry.priority]} · {entry.status === "TODO" ? "Todo" : entry.status === "DOING" ? "In progress" : entry.status}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-white/70">
                    <span className="font-semibold text-white">
                      {entry.sla.state === "BREACH"
                        ? `+${entry.sla.hoursOverdue.toFixed(1)}h past target`
                        : `${Math.max(0, entry.sla.hoursRemaining).toFixed(1)}h until breach`}
                    </span>
                    <span className="text-white/60">Last update {formatHours(entry.sinceUpdateHours)} ago</span>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </aside>
      </div>
    </section>
  );
}

function buildTaskClocks(tasks: SlaTaskSummary[], reference: Date): TaskClockMeta[] {
  return tasks.map((task) => {
    const createdAt = new Date(task.createdAt);
    const updatedAt = new Date(task.updatedAt ?? task.createdAt);
    const elapsedHours = Math.max(0, (reference.getTime() - createdAt.getTime()) / HOURS_IN_MS);
    const sinceUpdateHours = Math.max(0, (reference.getTime() - updatedAt.getTime()) / HOURS_IN_MS);
    const sla = evaluateTaskSla(task.priority, task.status, task.createdAt, reference);

    return {
      id: task.id,
      title: task.title,
      priority: task.priority,
      status: task.status,
      elapsedHours,
      sinceUpdateHours,
      sla
    };
  });
}

function buildPriorityStats(priority: TaskPriority, label: string, clocks: TaskClockMeta[]): PriorityStats {
  const relevant = clocks.filter((clock) => clock.priority === priority);
  const thresholdHours = TASK_PRIORITY_SLA_HOURS[priority];

  if (!relevant.length) {
    return {
      priority,
      label,
      thresholdHours,
      open: 0,
      warning: 0,
      breach: 0,
      avgElapsed: 0,
      worstElapsed: 0,
      progressPercent: 0,
      statusLabel: "Clear",
      badgeClass: "bg-emerald-500/20 text-emerald-100",
      progressClass: "bg-emerald-400"
    };
  }

  const warning = relevant.filter((clock) => clock.sla.state === "WARNING").length;
  const breach = relevant.filter((clock) => clock.sla.state === "BREACH").length;
  const worst = relevant.reduce((acc, entry) => (entry.elapsedHours > acc.elapsedHours ? entry : acc));
  const avgElapsed = relevant.reduce((sum, entry) => sum + entry.elapsedHours, 0) / relevant.length;
  const delta = thresholdHours - worst.elapsedHours;

  const statusLabel = breach > 0 ? "Breach" : warning > 0 ? "Warning" : "On track";
  const badgeClass = breach > 0 ? RISK_META.BREACH.badge : warning > 0 ? RISK_META.WARNING.badge : RISK_META.OK.badge;
  const progressPercent = Math.min(100, Math.max(0, (worst.elapsedHours / thresholdHours) * 100));
  const progressClass = breach > 0 ? "bg-rose-400" : warning > 0 ? "bg-amber-300" : "bg-emerald-400";

  return {
    priority,
    label,
    thresholdHours,
    open: relevant.length,
    warning,
    breach,
    avgElapsed,
    worstElapsed: worst.elapsedHours,
    deltaLabel: delta >= 0 ? `${delta.toFixed(1)}h remaining` : `+${Math.abs(delta).toFixed(1)}h over`,
    progressPercent,
    statusLabel,
    badgeClass,
    progressClass,
    topTask: {
      title: worst.title,
      elapsed: worst.elapsedHours,
      state: worst.sla.state
    }
  };
}

function buildRiskBands(clocks: TaskClockMeta[]): RiskBandMeta[] {
  const total = clocks.length;
  const denominator = total || 1;
  return (Object.keys(RISK_META) as SlaState[]).map((state) => {
    const count = clocks.filter((clock) => clock.sla.state === state).length;
    const percent = Math.round((count / denominator) * 100);
    return {
      state,
      label: RISK_META[state].label,
      count,
      percent,
      widthPercent: total === 0 ? (state === "OK" ? 100 : 0) : percent,
      barClass: RISK_META[state].bar,
      dotClass: RISK_META[state].dot
    };
  });
}

function buildNeedsAttention(clocks: TaskClockMeta[]): TaskClockMeta[] {
  return clocks
    .filter((clock) => clock.sla.state !== "OK")
    .sort((a, b) => {
      const orderDiff = RISK_ORDER[a.sla.state] - RISK_ORDER[b.sla.state];
      if (orderDiff !== 0) return orderDiff;
      if (a.sla.state === "BREACH" && b.sla.state === "BREACH") {
        return b.sla.hoursOverdue - a.sla.hoursOverdue;
      }
      if (a.sla.state === "WARNING" && b.sla.state === "WARNING") {
        return a.sla.hoursRemaining - b.sla.hoursRemaining;
      }
      return b.elapsedHours - a.elapsedHours;
    })
    .slice(0, 6);
}

function formatHours(hours: number): string {
  if (hours < 1) {
    return "<1h";
  }
  return `${hours.toFixed(1)}h`;
}
