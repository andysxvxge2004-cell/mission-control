interface MissionKpiStripProps {
  counts: {
    todo: number;
    doing: number;
    done: number;
    stuck: number;
    needsBriefing: number;
    highPriority: number;
  };
}

type Tone = "indigo" | "amber" | "emerald" | "rose" | "violet";

const CARD_BASE = "rounded-2xl border px-4 py-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-2xl";

const TONE_STYLES: Record<
  Tone,
  { base: string; glow: string; label: string; value: string }
> = {
  indigo: {
    base: "border-white/10 bg-white/5",
    glow: "border-indigo-400/50 bg-gradient-to-br from-indigo-500/20 via-indigo-400/10 to-transparent",
    label: "text-white/70",
    value: "text-white"
  },
  amber: {
    base: "border-white/10 bg-white/5",
    glow: "border-amber-400/60 bg-gradient-to-br from-amber-400/20 via-amber-300/10 to-transparent",
    label: "text-white/70",
    value: "text-white"
  },
  emerald: {
    base: "border-white/10 bg-white/5",
    glow: "border-emerald-400/60 bg-gradient-to-br from-emerald-400/20 via-emerald-300/10 to-transparent",
    label: "text-white/70",
    value: "text-white"
  },
  rose: {
    base: "border-white/10 bg-white/5",
    glow: "border-rose-400/60 bg-gradient-to-br from-rose-500/25 via-rose-400/10 to-transparent",
    label: "text-rose-100",
    value: "text-rose-50"
  },
  violet: {
    base: "border-white/10 bg-white/5",
    glow: "border-violet-400/60 bg-gradient-to-br from-violet-500/20 via-violet-400/10 to-transparent",
    label: "text-violet-100",
    value: "text-violet-50"
  }
};

export function MissionKpiStrip({ counts }: MissionKpiStripProps) {
  const cards: Array<{ label: string; value: number; tone: Tone; highlight?: boolean }> = [
    { label: "To Do", value: counts.todo, tone: "indigo" },
    { label: "In Progress", value: counts.doing, tone: "amber" },
    { label: "Done", value: counts.done, tone: "emerald" },
    { label: "Stuck", value: counts.stuck, tone: "rose", highlight: counts.stuck > 0 },
    { label: "Needs briefing", value: counts.needsBriefing, tone: "violet", highlight: counts.needsBriefing > 0 }
  ];
  if (counts.highPriority > 0) {
    cards.push({ label: "High priority", value: counts.highPriority, tone: "rose", highlight: true });
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => {
        const tone = TONE_STYLES[card.tone];
        const cardClasses = `${CARD_BASE} ${card.highlight ? tone.glow : tone.base}`;
        return (
          <div key={card.label} className={cardClasses}>
            <p className={`text-xs uppercase tracking-wide ${card.highlight ? tone.label : "text-white/60"}`}>{card.label}</p>
            <p className={`mt-2 text-3xl font-semibold ${card.highlight ? tone.value : "text-white"}`}>{card.value}</p>
          </div>
        );
      })}
    </div>
  );
}
