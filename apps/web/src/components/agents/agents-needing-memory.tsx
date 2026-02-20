import Link from "next/link";
import type { Agent, RecentMemory } from "@mission-control/db";

export type AgentWithLatestMemory = Agent & { memories: RecentMemory[] };

interface AgentsNeedingMemoryProps {
  agents: AgentWithLatestMemory[];
}

export function AgentsNeedingMemory({ agents }: AgentsNeedingMemoryProps) {
  const withoutMemories = agents.filter((agent) => agent.memories.length === 0);

  if (!withoutMemories.length) {
    return null;
  }

  return (
    <div className="space-y-3 rounded-3xl border border-rose-400/40 bg-rose-400/10 p-5 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-rose-200">Memory hygiene</p>
          <h3 className="text-lg font-semibold">Agents missing souls/memories</h3>
        </div>
        <span className="rounded-full bg-rose-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-rose-50">
          {withoutMemories.length} to update
        </span>
      </div>
      <ul className="space-y-2 text-sm">
        {withoutMemories.map((agent) => (
          <li key={agent.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-black/30 px-3 py-2">
            <div>
              <p className="text-sm font-semibold">{agent.name}</p>
              <p className="text-xs uppercase tracking-wide text-white/60">{agent.role}</p>
            </div>
            <Link
              href={`/mission-control/agents/${agent.id}`}
              className="text-xs font-semibold uppercase tracking-wide text-rose-100 hover:text-white"
            >
              Append memory
            </Link>
          </li>
        ))}
      </ul>
      <p className="text-xs uppercase tracking-wide text-white/60">
        Add at least one memory to fully brief each agent before giving tasks.
      </p>
    </div>
  );
}
