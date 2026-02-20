import Link from "next/link";
import type { Agent, RecentMemory } from "@mission-control/db";
import { formatRelativeTime } from "@/lib/formatters";

export type AgentWithLatestMemory = Agent & { memories: RecentMemory[] };

interface AgentsNeedingMemoryProps {
  agents: AgentWithLatestMemory[];
  referenceTime?: Date;
}

const STALE_MEMORY_MS = 1000 * 60 * 60 * 24 * 3; // 3 days

export function AgentsNeedingMemory({ agents, referenceTime }: AgentsNeedingMemoryProps) {
  const now = (referenceTime ?? new Date()).getTime();
  const needingAttention = agents
    .map((agent) => {
      const latest = agent.memories[0];
      if (!latest) {
        return { agent, status: "never" as const, lastMemory: null, ageMs: Infinity };
      }
      const ageMs = now - new Date(latest.createdAt).getTime();
      if (ageMs > STALE_MEMORY_MS) {
        return { agent, status: "stale" as const, lastMemory: latest, ageMs };
      }
      return null;
    })
    .filter(Boolean) as { agent: AgentWithLatestMemory; status: "never" | "stale"; lastMemory: RecentMemory | null; ageMs: number }[];

  if (!needingAttention.length) {
    return null;
  }

  needingAttention.sort((a, b) => b.ageMs - a.ageMs);

  return (
    <div className="space-y-3 rounded-3xl border border-rose-400/40 bg-rose-400/10 p-5 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-rose-200">Memory hygiene</p>
          <h3 className="text-lg font-semibold">Agents needing briefing</h3>
        </div>
        <span className="rounded-full bg-rose-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-rose-50">
          {needingAttention.length} to update
        </span>
      </div>
      <ul className="space-y-2 text-sm">
        {needingAttention.map(({ agent, status, lastMemory }) => (
          <li key={agent.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-black/30 px-3 py-3">
            <div>
              <p className="text-sm font-semibold">{agent.name}</p>
              <p className="text-xs uppercase tracking-wide text-white/60">{agent.role}</p>
              <p className="text-xs text-white/60">
                {status === "never" ? "Never briefed" : `Last briefing ${formatRelativeTime(lastMemory!.createdAt)}`}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/mission-control/agents/${agent.id}`}
                className="rounded-full bg-rose-500/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-rose-100 hover:bg-rose-500/30"
              >
                Brief agent ↗
              </Link>
              <Link
                href={`/mission-control/agents/${agent.id}`}
                className="rounded-full border border-rose-400/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-rose-50 hover:bg-rose-400/10"
              >
                Append memory
              </Link>
            </div>
          </li>
        ))}
      </ul>
      <p className="text-xs uppercase tracking-wide text-white/60">
        Add at least one memory and refresh stale ones to keep agents aligned before assigning work.
      </p>
    </div>
  );
}
