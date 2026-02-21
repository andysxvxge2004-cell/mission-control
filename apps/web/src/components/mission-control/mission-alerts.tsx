import Link from "next/link";
import { formatDateTime, formatRelativeTime } from "@/lib/formatters";

interface MissionAlertsStripProps {
  alerts: {
    needsBriefing: Array<{ id: string; name: string; lastMemoryAt?: Date | null }>;
    stuckTasks: Array<{ id: string; title: string; updatedAt: Date }>;
  };
  referenceTime: Date;
}

export function MissionAlertsStrip({ alerts, referenceTime }: MissionAlertsStripProps) {
  const hasAlerts = alerts.needsBriefing.length > 0 || alerts.stuckTasks.length > 0;

  if (!hasAlerts) {
    return null;
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-black/70 p-5 text-sm text-white/80 shadow-lg shadow-black/40">
      <div className="grid gap-6 md:grid-cols-2">
        {alerts.needsBriefing.length > 0 ? (
          <section>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-200">Needs briefing</p>
            <ul className="mt-3 space-y-2">
              {alerts.needsBriefing.map((agent) => (
                <li key={agent.id} className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/5 bg-white/5 px-3 py-2">
                  <span className="font-medium text-white">{agent.name}</span>
                  <span className="text-xs text-white/60">
                    {agent.lastMemoryAt ? `Last briefing ${formatRelativeTime(agent.lastMemoryAt, referenceTime)}` : "No memories yet"}
                  </span>
                  <Link
                    href={`/mission-control/agents/${agent.id}`}
                    className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/80 transition hover:border-amber-200 hover:text-amber-100"
                  >
                    Brief agent ↗
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {alerts.stuckTasks.length > 0 ? (
          <section>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-200">Stuck tasks</p>
            <ul className="mt-3 space-y-2">
              {alerts.stuckTasks.map((task) => (
                <li key={task.id} className="rounded-2xl border border-rose-300/30 bg-rose-500/10 p-3">
                  <span className="font-semibold text-white">{task.title}</span>
                  <span className="text-xs text-white/70">
                    Last update {formatRelativeTime(task.updatedAt, referenceTime)} ({formatDateTime(task.updatedAt)})
                  </span>
                  <Link
                    href={`/mission-control/tasks?task=${task.id}`}
                    className="mt-2 inline-flex items-center text-xs font-semibold text-rose-200 transition hover:text-rose-50"
                  >
                    Inspect task ↗
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
