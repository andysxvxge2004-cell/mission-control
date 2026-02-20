import Link from "next/link";
import type { Agent, RecentMemory, Task } from "@mission-control/db";
import { formatDateTime } from "@/lib/formatters";
import { TASK_STATUSES, type TaskStatus } from "@/lib/constants";

export type AgentWithMeta = Agent & {
  memories: RecentMemory[];
  tasks: Task[];
};

interface AgentsListProps {
  agents: AgentWithMeta[];
  hrefPrefix?: string;
}

const STATUS_BADGES: Record<TaskStatus, string> = {
  TODO: "bg-indigo-500/15 text-indigo-100",
  DOING: "bg-amber-500/15 text-amber-100",
  DONE: "bg-emerald-500/15 text-emerald-100"
};

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
        const workload = agent.tasks.reduce<Record<TaskStatus, number>>(
          (acc, task) => {
            if (isKnownStatus(task.status)) {
              acc[task.status] += 1;
            }
            return acc;
          },
          { TODO: 0, DOING: 0, DONE: 0 }
        );
        const activeCount = workload.TODO + workload.DOING;

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
              <div className="text-right text-xs text-white/60">
                <p>{agent.tasks.length} tasks</p>
                <p className="text-[11px] text-white/50">{activeCount} active</p>
              </div>
            </div>
            <p className="mt-3 line-clamp-2 text-sm text-white/70">{agent.soul}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {TASK_STATUSES.map((status) => (
                <span
                  key={status.id}
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${STATUS_BADGES[status.id]}`}
                >
                  {status.label}: {workload[status.id]}
                </span>
              ))}
            </div>
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

function isKnownStatus(status: string): status is TaskStatus {
  return TASK_STATUSES.some((entry) => entry.id === status);
}
