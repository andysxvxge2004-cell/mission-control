interface MissionKpiStripProps {
  counts: {
    agents: number;
    openTasks: number;
    stuckTasks: number;
    needsBriefing: number;
  };
}

export function MissionKpiStrip({ counts }: MissionKpiStripProps) {
  const cards = [
    { label: "Agents", value: counts.agents },
    { label: "Open tasks", value: counts.openTasks },
    { label: "Stuck tasks", value: counts.stuckTasks, highlight: counts.stuckTasks > 0 },
    { label: "Needs briefing", value: counts.needsBriefing, highlight: counts.needsBriefing > 0 }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-2xl border p-4 ${
            card.highlight ? "border-amber-300/60 bg-amber-400/10" : "border-white/10 bg-white/5"
          }`}
        >
          <p className={`text-xs uppercase tracking-wide ${card.highlight ? "text-amber-100" : "text-white/60"}`}>
            {card.label}
          </p>
          <p className={`mt-2 text-3xl font-semibold ${card.highlight ? "text-amber-50" : "text-white"}`}>
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
