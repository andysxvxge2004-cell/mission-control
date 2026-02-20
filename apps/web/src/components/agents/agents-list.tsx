import Link from "next/link";
import type { Agent, RecentMemory, Task } from "@mission-control/db";
import { formatDateTime } from "@/lib/formatters";

export type AgentWithMeta = Agent & {
  memories: RecentMemory[];
  tasks: Task[];
};

interface AgentsListProps {
  agents: AgentWithMeta[];
  hrefPrefix?: string;
}

export function AgentsList({ agents, hrefPrefix = "/agents" }: AgentsListProps) {
  if (!agents.length) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
        No agents yet. Create one to begin staffing Mission Control.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {agents.map((agent) => {
        const latestMemory = agent.memories[0];
        return (
          <Link
            key={agent.id}
            href={`${hrefPrefix}/${agent.id}`}
            className="group rounded-xl border border-white/10 bg-white/5 p-5 transition hover:border-indigo-400/60 hover:bg-white/10"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-wide text-indigo-300">{agent.role}</p>
                <h3 className="text-lg font-semibold text-white">{agent.name}</h3>
              </div>
              <span className="text-xs text-white/60">{agent.tasks.length} tasks</span>
            </div>
            <p className="mt-3 line-clamp-2 text-sm text-white/70">{agent.soul}</p>
            {latestMemory ? (
              <div className="mt-4 rounded-lg bg-black/40 p-3 text-xs text-white/70">
                <p className="font-semibold text-white/80">Recent memory</p>
                <p className="mt-1 text-white/80">{latestMemory.content}</p>
                <p className="mt-1 text-[10px] uppercase tracking-wide text-white/50">
                  {formatDateTime(latestMemory.createdAt)}
                </p>
              </div>
            ) : (
              <p className="mt-4 text-xs text-white/50">No memories yet.</p>
            )}
          </Link>
        );
      })}
    </div>
  );
}
