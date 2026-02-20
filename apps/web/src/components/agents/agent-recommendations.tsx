import Link from "next/link";
import { TASK_PRIORITIES, type TaskPriority } from "@/lib/constants";

interface AgentRecommendationsProps {
  backlogSummary: {
    total: number;
    byPriority: Record<TaskPriority, number>;
  };
  recommendations: Array<{
    id: string;
    name: string;
    role: string;
    workload: number;
  }>;
}

const priorityStyles: Record<TaskPriority, string> = {
  HIGH: "border-rose-400/40 bg-rose-400/10 text-rose-100",
  MEDIUM: "border-amber-300/40 bg-amber-300/10 text-amber-100",
  LOW: "border-emerald-300/40 bg-emerald-300/10 text-emerald-100"
};

function describeLoad(workload: number) {
  if (workload === 0) {
    return { label: "Idle", tone: "text-emerald-100", chip: "border-emerald-300/40 bg-emerald-400/10" };
  }
  if (workload <= 2) {
    return { label: "Light load", tone: "text-amber-100", chip: "border-amber-300/40 bg-amber-300/10" };
  }
  return { label: "Engaged", tone: "text-indigo-100", chip: "border-indigo-300/40 bg-indigo-300/10" };
}

export function AgentRecommendations({ backlogSummary, recommendations }: AgentRecommendationsProps) {
  const shouldHide = backlogSummary.total === 0 && recommendations.length === 0;
  if (shouldHide) return null;

  return (
    <section className="space-y-3 rounded-3xl border border-indigo-300/30 bg-indigo-300/10 p-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-indigo-200">Staffing intelligence</p>
          <h3 className="text-lg font-semibold text-white">Smart agent recommendations</h3>
        </div>
        <span className="rounded-full border border-indigo-200/40 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-100">
          {backlogSummary.total} unassigned
        </span>
      </header>

      {backlogSummary.total === 0 ? (
        <p className="text-sm text-white/70">All open missions are staffed. Keep an eye here when new backlog lands.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {TASK_PRIORITIES.map((priority) => (
            <div
              key={priority.id}
              className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${priorityStyles[priority.id]}`}
            >
              <span>{priority.label}</span>
              <span className="text-white">{backlogSummary.byPriority[priority.id] ?? 0}</span>
            </div>
          ))}
        </div>
      )}

      {recommendations.length === 0 ? (
        <p className="text-sm text-white/70">Every agent is currently overloaded. Rebalance or create capacity before assigning fresh work.</p>
      ) : (
        <ol className="space-y-3">
          {recommendations.map((agent) => {
            const load = describeLoad(agent.workload);
            return (
              <li key={agent.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                <div>
                  <Link href={`/mission-control/agents/${agent.id}`} className="text-base font-semibold text-white hover:text-indigo-100">
                    {agent.name}
                  </Link>
                  <p className="text-sm text-white/60">{agent.role}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${load.chip}`}>
                    {load.label}
                  </span>
                  <p className={`text-xs ${load.tone}`}>{agent.workload} active task{agent.workload === 1 ? "" : "s"}</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
