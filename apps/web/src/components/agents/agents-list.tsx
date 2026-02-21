import Link from "next/link";
import type { Agent, RecentMemory, Task } from "@mission-control/db";
import { formatDateTime, formatRelativeTime } from "@/lib/formatters";
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
  TODO: "from-indigo-400/30 via-indigo-500/10 to-transparent",
  DOING: "from-amber-400/30 via-amber-500/10 to-transparent",
  DONE: "from-emerald-400/30 via-emerald-500/10 to-transparent"
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "Todo",
  DOING: "Doing",
  DONE: "Done"
};

const STATUS_ORDER: TaskStatus[] = ["TODO", "DOING", "DONE"];

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

const IDLE_THRESHOLD_HOURS = 48;

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
    workload: computeWorkload(agent.tasks, staleCutoff),
    presence: computePresence(agent, reference)
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
                <AgentCard key={agent.id} agent={agent} hrefPrefix={hrefPrefix} reference={reference} />
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

interface AgentCardProps {
  agent: AgentWithMeta & { workload: Workload; presence: PresenceMeta };
  hrefPrefix: string;
  reference: Date;
}

function AgentCard({ agent, hrefPrefix, reference }: AgentCardProps) {
  const latestMemory = agent.memories[0];
  const needsBriefing = agent.memories.length === 0;
  const { breakdown, activeCount, stuckCount } = agent.workload;
  const { isIdle, idleForHours, lastInteraction } = agent.presence;

  return (
    <article className="rounded-2xl border border-white/10 bg-black/40 p-5 shadow-lg shadow-black/10">
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
            {isIdle ? (
              <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-100">
                Idle {Math.floor(idleForHours / 24)}d
              </span>
            ) : null}
          </div>
        </div>
        <div className="text-right text-xs text-white/60">
          <p>{agent.tasks.length} tasks</p>
          <p className="text-[11px] text-white/50">{activeCount} active</p>
          <p className="text-[11px] text-white/40">Last touch {formatRelativeTime(lastInteraction, reference)}</p>
        </div>
      </div>

      <p className="mt-3 line-clamp-2 text-sm text-white/70">{agent.soul}</p>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-white/80">
        {STATUS_ORDER.map((status) => (
          <div
            key={status}
            className={`rounded-xl border border-white/10 bg-gradient-to-b px-3 py-2 text-sm font-semibold ${STATUS_COLORS[status]}`}
          >
            <p className="text-[10px] uppercase tracking-wide text-white/60">{STATUS_LABELS[status]}</p>
            <p className="text-2xl font-bold text-white">{breakdown[status]}</p>
          </div>
        ))}
      </div>

      {stuckCount > 0 ? (
        <div className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
          {stuckCount} task{stuckCount === 1 ? "" : "s"} in Doing have been untouched for 48h+.
        </div>
      ) : null}

      {latestMemory ? (
        <div className="mt-4 rounded-xl border border-white/5 bg-black/40 p-3 text-xs text-white/70">
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

interface PresenceMeta {
  lastInteraction: Date;
  idleForHours: number;
  isIdle: boolean;
}

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

function computePresence(agent: AgentWithMeta, reference: Date): PresenceMeta {
  const timestamps: number[] = [new Date(agent.createdAt).getTime(), new Date(agent.updatedAt).getTime()];

  agent.tasks.forEach((task) => {
    timestamps.push(new Date(task.updatedAt ?? task.createdAt).getTime());
  });

  agent.memories.forEach((memory) => {
    timestamps.push(new Date(memory.createdAt).getTime());
  });

  const lastInteractionMs = timestamps.length ? Math.max(...timestamps) : reference.getTime();
  const idleForHours = (reference.getTime() - lastInteractionMs) / (1000 * 60 * 60);

  return {
    lastInteraction: new Date(lastInteractionMs),
    idleForHours,
    isIdle: idleForHours >= IDLE_THRESHOLD_HOURS
  };
}
