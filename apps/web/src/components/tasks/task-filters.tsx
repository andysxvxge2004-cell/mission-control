import Link from "next/link";
import type { Agent } from "@mission-control/db";
import { TASK_STATUSES } from "@/lib/constants";

interface TaskFiltersProps {
  agents: Pick<Agent, "id" | "name">[];
  currentAgentId?: string;
  currentStatus?: string;
  basePath: string;
}

export function TaskFilters({ agents, currentAgentId, currentStatus, basePath }: TaskFiltersProps) {
  const hasFilters = Boolean(currentAgentId || currentStatus);
  const agentLabel = currentAgentId ? agents.find((agent) => agent.id === currentAgentId)?.name ?? "Selected agent" : null;
  const statusLabel = currentStatus
    ? TASK_STATUSES.find((status) => status.id === currentStatus)?.label ?? "Selected status"
    : null;

  return (
    <form
      method="get"
      action={basePath}
      className="space-y-3 rounded-2xl border border-white/10 bg-black/30 p-4"
    >
      <div className="grid gap-3 md:grid-cols-3">
        <label className="text-xs font-semibold uppercase tracking-wide text-white/60">
          Agent
          <select
            name="agent"
            defaultValue={currentAgentId ?? ""}
            className="mt-1 w-full rounded-md border border-white/20 bg-black/40 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none"
          >
            <option value="">All agents</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold uppercase tracking-wide text-white/60">
          Status
          <select
            name="status"
            defaultValue={currentStatus ?? ""}
            className="mt-1 w-full rounded-md border border-white/20 bg-black/40 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none"
          >
            <option value="">All statuses</option>
            {TASK_STATUSES.map((status) => (
              <option key={status.id} value={status.id}>
                {status.label}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-col gap-2 pt-4 md:pt-0">
          <button
            type="submit"
            className="rounded-md bg-indigo-500/80 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            Apply filters
          </button>
          {hasFilters ? (
            <Link
              href={basePath}
              className="text-center text-xs font-semibold uppercase tracking-wide text-white/60 hover:text-white"
            >
              Reset
            </Link>
          ) : null}
        </div>
      </div>
      {hasFilters ? (
        <p className="text-xs uppercase tracking-wide text-white/50">
          Filters active:
          <span className="ml-1 inline-flex items-center space-x-3">
            {agentLabel ? <span>Agent · {agentLabel}</span> : null}
            {statusLabel ? <span>Status · {statusLabel}</span> : null}
          </span>
        </p>
      ) : (
        <p className="text-xs uppercase tracking-wide text-white/40">Showing every task.</p>
      )}
    </form>
  );
}
