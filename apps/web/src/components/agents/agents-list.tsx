import Link from "next/link";
import type { Agent, RecentMemory, Task } from "@mission-control/db";
import { formatDateTime } from "@/lib/formatters";
import { TASK_STATUSES, type TaskStatus } from "@/lib/constants";
import { getStaleCutoffDate } from "@/lib/task-metrics";
import { AgentQuickActions } from "./agent-quick-actions";

export type AgentWithMeta = Agent & {
  memories: RecentMemory[];
  tasks: Task[];
};

interface AgentsListProps {
  agents: AgentWithMeta[];
  hrefPrefix?: string;
  referenceTime: string;
}

const STATUS_COLORS: Record<TaskStatus, string> = {
  TODO: "bg-indigo-500/15 text-indigo-100",
  DOING: "bg-amber-500/15 text-amber-100",
  DONE: "bg-emerald-500/15 text-emerald-100"
};

const CAPACITY_LANES = [
  {
    id: "IDLE",
    label: "Idle",
    description: "No active tasks — deploy them.",
    border: "border-emerald-400/50",
    matches: (activeCount: number) => activeCount === 0
  },
  {
    id: "ENGAGED",
    label: "Engaged",
    description: "1-3 active tasks — operating in band.",
    border: "border-indigo-400/40",
    matches: (activeCount: number) => activeCount > 0 && activeCount <= 3
  },
  {
    id: "OVERLOADED",
    label: "Overloaded",
    description: "4+ active tasks — lighten the load.",
    border: "border-rose-500/40",
    matches: (activeCount: number) => activeCount > 3
  }
] as const;

export function AgentsList({ agents, hrefPrefix = "/agents", referenceTime }: AgentsListProps) {
  if (!agents.length) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
        No agents yet. Create one to begin staffing Mission Control.
      </div>
    );
  }

  const reference = new Date(referenceTime);
  const staleCutoff = getStaleCutoffDate(reference.getTime());
  const enriched = agents.map((agent) => ({
    ...agent,
    workload: computeWorkload(agent.tasks, staleCutoff)
  }));

  const lanes = CAPACITY_LANES.map((lane) => ({
    ...lane,
    agents: enriched.filter(({ workload }) => lane.matches(workload.activeCount))
  }));

  return (
    <div className="space-y-6">
      {lanes.map((lane) => (
        <section
          key={lane.id}
          className={`rounded-2xl border border-white/10 bg-white/5 p-4 ${lane.agents.length ? lane.border : ""}`}
        >
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-white/60">{lane.label}</p>
              <p className="text-sm text-white/70">{lane.description}</p>
            </div>
            <span className="text-xs uppercase tracking-wide text-white/50">
              {lane.agents.length} agent{lane.agents.length === 1 ? "" : "s"}
            </span>
          </header>

          {lane.agents.length === 0 ? (
            <p className="mt-3 text-sm text-white/60">No agents in this lane.</p>
          ) : (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {lane.agents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} hrefPrefix={hrefPrefix} />
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

function AgentCard({ agent, hrefPrefix }: { agent: AgentWithMeta & { workload: Workload }; hrefPrefix: string }) {
  const latestMemory = agent.memories[0];
  const needsBriefing = agent.memories.length === 0;
  const { breakdown, activeCount, stuckCount } = agent.workload;

  return (
    <article className="rounded-xl border border-white/10 bg-black/40 p-5 shadow-lg shadow-black/10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-wide text-indigo-300">{agent.role}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Link
              href={`${hrefPrefix}/${agent.id}`}
              className="text-lg font-semibold text-white transition hover:text-indigo-200"
            >
              {agent.name}
            </Link>
            {needsBriefing ? (
              <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-100">
                Needs briefing
              </span>
            ) : null}
            {stuckCount > 0 ? (
              <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-100">
                Stuck {stuckCount}
              </span>
            ) : null}
          </div>
        </div>
        <div className="text-right text-xs text-white/60">
          <p>{agent.tasks.length} tasks</p>
          <p className="text-[11px] text-white/50">{activeCount} active</p>
        </div>
      </div>

      <p className="mt-3 line-clamp-2 text-sm text-white/70">{agent.soul}</p>

      <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-wide">
        <span className={`rounded-full px-3 py-1 ${STATUS_COLORS.TODO}`}>Open {breakdown.TODO}</span>
        <span className={`rounded-full px-3 py-1 ${STATUS_COLORS.DOING}`}>Doing {breakdown.DOING}</span>
        <span className={`rounded-full px-3 py-1 ${STATUS_COLORS.DONE}`}>Done {breakdown.DONE}</span>
        {stuckCount > 0 ? (
          <span className="rounded-full bg-rose-500/20 px-3 py-1 text-rose-100">Stuck {stuckCount}</span>
        ) : null}
      </div>

      {latestMemory ? (
        <div className="mt-4 rounded-lg bg-black/40 p-3 text-xs text-white/70">
          <p className="font-semibold text-white/80">Recent memory</p>
          <p className="mt-1 text-white/80">{latestMemory.content}</p>
          <p className="mt-1 text-[10px] uppercase tracking-wide text-white/50">{formatDateTime(latestMemory.createdAt)}</p>
        </div>
      ) : (
        <p className="mt-4 text-xs text-white/50">No memories yet.</p>
      )}

      <AgentQuickActions agentId={agent.id} agentName={agent.name} />
    </article>
  );
}

type Workload = {
  breakdown: Record<TaskStatus, number>;
  activeCount: number;
  stuckCount: number;
};

function isKnownStatus(status: string): status is TaskStatus {
  return TASK_STATUSES.some((entry) => entry.id === status);
}

function computeWorkload(tasks: Task[], staleCutoff: Date): Workload {
  const base: Record<TaskStatus, number> = {
    TODO: 0,
    DOING: 0,
    DONE: 0
  };
  let stuckCount = 0;

  for (const task of tasks) {
    if (isKnownStatus(task.status)) {
      base[task.status] += 1;
      if (task.status === "DOING") {
        const updated = new Date(task.updatedAt).getTime();
        if (updated < staleCutoff.getTime()) {
          stuckCount += 1;
        }
      }
    }
  }

  return {
    breakdown: base,
    activeCount: base.TODO + base.DOING,
    stuckCount
  };
}
