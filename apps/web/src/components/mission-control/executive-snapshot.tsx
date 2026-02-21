interface ExecutiveSnapshotPanelProps {
  snapshot: {
    totalAgents: number;
    idleAgents24h: number;
    tasksAtRisk: number;
    tasksBreached: number;
    oldestOpenTaskLabel: string;
    highPriorityStale: number;
  };
}

const CARD_CLASSES = "rounded-2xl border border-white/10 bg-black/40 px-4 py-3 shadow-lg shadow-black/30";
const VALUE_CLASSES = "text-2xl font-semibold";

export function ExecutiveSnapshotPanel({ snapshot }: ExecutiveSnapshotPanelProps) {
  const metrics = [
    { label: "Total agents", value: snapshot.totalAgents, accent: "text-white" },
    { label: "Idle >24h", value: snapshot.idleAgents24h, accent: snapshot.idleAgents24h ? "text-amber-200" : "text-white" },
    { label: "SLA warning", value: snapshot.tasksAtRisk, accent: snapshot.tasksAtRisk ? "text-amber-200" : "text-white" },
    { label: "SLA breach", value: snapshot.tasksBreached, accent: snapshot.tasksBreached ? "text-rose-300" : "text-white" },
    { label: "Oldest open", value: snapshot.oldestOpenTaskLabel, accent: "text-indigo-100" },
    { label: "High-pri stale", value: snapshot.highPriorityStale, accent: snapshot.highPriorityStale ? "text-rose-200" : "text-white" }
  ];

  return (
    <aside className="w-full min-w-[260px] rounded-3xl border border-white/15 bg-gradient-to-br from-slate-900/90 to-black/80 p-4 text-white shadow-2xl shadow-black/50">
      <header className="mb-3">
        <p className="text-[11px] uppercase tracking-[0.4em] text-indigo-300">Executive snapshot</p>
        <p className="text-sm text-white/70">Control room overview</p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2">
        {metrics.map((metric) => (
          <div key={metric.label} className={`${CARD_CLASSES} backdrop-blur`}> 
            <p className="text-[11px] uppercase tracking-wide text-white/60">{metric.label}</p>
            <p className={`${VALUE_CLASSES} ${metric.accent}`}>{metric.value}</p>
          </div>
        ))}
      </div>
    </aside>
  );
}
