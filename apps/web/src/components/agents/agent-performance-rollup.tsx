import type { Agent, Task } from "@mission-control/db";

interface AgentWithTasks extends Agent {
  tasks: Pick<Task, "id" | "status" | "updatedAt">[];
}

interface AgentPerformanceRollupProps {
  agents: AgentWithTasks[];
}

const OPEN_STATUSES = new Set(["TODO", "DOING"]);

export function AgentPerformanceRollup({ agents }: AgentPerformanceRollupProps) {
  if (!agents.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
        No agents available yet.
      </div>
    );
  }

  const sortedAgents = [...agents].sort((a, b) => {
    const openA = countOpen(a.tasks);
    const openB = countOpen(b.tasks);
    if (openA === openB) {
      return a.name.localeCompare(b.name);
    }
    return openB - openA;
  });

  return (
    <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-indigo-300">Performance overview</p>
          <h3 className="text-lg font-semibold text-white">Agent rollups</h3>
        </div>
        <p className="text-xs uppercase tracking-wide text-white/50">Sorted by open load</p>
      </header>
      <div className="divide-y divide-white/10">
        {sortedAgents.map((agent) => {
          const open = countOpen(agent.tasks);
          const completed = countCompleted(agent.tasks);
          const total = open + completed;
          const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);
          return (
            <article key={agent.id} className="flex flex-wrap items-center gap-4 py-3">
              <div className="min-w-[160px] flex-1">
                <p className="text-xs uppercase tracking-wide text-indigo-200">{agent.role}</p>
                <p className="text-base font-semibold text-white">{agent.name}</p>
              </div>
              <div className="flex items-center gap-4 text-sm text-white/80">
                <Metric label="Open" value={open} accent="text-amber-300" />
                <Metric label="Completed" value={completed} accent="text-emerald-300" />
                <div className="min-w-[120px]">
                  <p className="text-xs uppercase tracking-wide text-white/50">Completion</p>
                  <div className="mt-1 h-2 rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-emerald-400"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                  <p className="mt-1 text-sm text-white/80">{completionRate}%</p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function Metric({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="min-w-[90px]">
      <p className="text-xs uppercase tracking-wide text-white/50">{label}</p>
      <p className={`text-xl font-semibold ${accent}`}>{value}</p>
    </div>
  );
}

function countOpen(tasks: Pick<Task, "status">[]) {
  return tasks.reduce((acc, task) => (OPEN_STATUSES.has(task.status) ? acc + 1 : acc), 0);
}

function countCompleted(tasks: Pick<Task, "status">[]) {
  return tasks.reduce((acc, task) => (task.status === "DONE" ? acc + 1 : acc), 0);
}
