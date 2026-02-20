'use client';

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Agent, Task } from "@mission-control/db";
import { formatDateTime, formatRelativeTime } from "@/lib/formatters";

export type AgingTask = Task & { agent?: Pick<Agent, "id" | "name"> | null };

interface TaskAgingAlertsProps {
  tasks: AgingTask[];
  referenceTime: Date;
}

const AGENT_COLOR_MAP = [
  "text-rose-200",
  "text-indigo-200",
  "text-emerald-200",
  "text-amber-200",
  "text-cyan-200"
];

function getAgentBadgeClass(agentId: string, index: number) {
  const color = AGENT_COLOR_MAP[index % AGENT_COLOR_MAP.length];
  return `${color} border-white/20`;
}
type SortOrder = "oldest" | "newest";
type QuickFilter = {
  label: string;
  value: string;
  count: number;
  share: number;
  pinnable: boolean;
  pinned: boolean;
};

export function TaskAgingAlerts({ tasks, referenceTime }: TaskAgingAlertsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const agentFilter = searchParams.get('agingAgent') ?? 'all';
  const sortOrder: SortOrder = searchParams.get('agingSort') === 'newest' ? 'newest' : 'oldest';
  const pinnedParam = searchParams.get('agingPinned') ?? '';
  const pinnedAgents = useMemo(() => new Set(pinnedParam ? pinnedParam.split(',').filter(Boolean) : []), [pinnedParam]);

  const updateQuery = (nextAgent: string, nextSort: SortOrder, nextPinned?: string[]) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextAgent === 'all') {
      params.delete('agingAgent');
    } else {
      params.set('agingAgent', nextAgent);
    }

    if (nextSort === 'oldest') {
      params.delete('agingSort');
    } else {
      params.set('agingSort', nextSort);
    }

    const pins = nextPinned ?? Array.from(pinnedAgents);
    if (!pins.length) {
      params.delete('agingPinned');
    } else {
      params.set('agingPinned', pins.join(','));
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const agentOptions = useMemo(() => {
    const map = new Map<string, string>();
    tasks.forEach((task) => {
      if (task.agent?.id) {
        map.set(task.agent.id, task.agent.name);
      }
    });
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [tasks]);

  const ownershipCounts = useMemo(() => {
    const map = new Map<string, { name: string; count: number }>();
    tasks.forEach((task) => {
      const key = task.agent?.id ?? 'unassigned';
      const name = task.agent?.name ?? 'Unassigned';
      map.set(key, { name, count: (map.get(key)?.count ?? 0) + 1 });
    });
    return Array.from(map.entries())
      .map(([id, meta]) => ({ id, ...meta }))
      .sort((a, b) => b.count - a.count);
  }, [tasks]);

  const totalStuck = tasks.length;

  const handleTogglePin = (agentId: string) => {
    if (agentId === 'all' || agentId === 'unassigned') {
      return;
    }
    const next = new Set(pinnedAgents);
    if (next.has(agentId)) {
      next.delete(agentId);
    } else {
      next.add(agentId);
    }
    updateQuery(agentFilter, sortOrder, Array.from(next));
  };

  const quickFilters = useMemo<QuickFilter[]>(() => {
    const unassignedCount = ownershipCounts.find((entry) => entry.id === 'unassigned')?.count ?? 0;
    const pinnedEntries = Array.from(pinnedAgents).map((id) => {
      const owned = ownershipCounts.find((entry) => entry.id === id);
      const fallbackName = owned?.name ?? agentOptions.find((agent) => agent.id === id)?.name ?? 'Pinned agent';
      return { label: fallbackName, value: id, count: owned?.count ?? 0, pinnable: true, pinned: true };
    });
    const dynamicEntries = ownershipCounts
      .filter((entry) => entry.id !== 'unassigned' && !pinnedAgents.has(entry.id))
      .slice(0, 4)
      .map((entry) => ({ label: entry.name, value: entry.id, count: entry.count, pinnable: true, pinned: false }));
    const base = [
      { label: 'All agents', value: 'all', count: totalStuck, pinnable: false, pinned: false },
      { label: 'Unassigned', value: 'unassigned', count: unassignedCount, pinnable: false, pinned: false },
      ...pinnedEntries,
      ...dynamicEntries
    ];
    const seen = new Set<string>();
    return base
      .filter((entry) => {
        if (seen.has(entry.value)) return false;
        seen.add(entry.value);
        return entry.count > 0 || entry.value === 'all' || entry.value === 'unassigned' || entry.pinned;
      })
      .map((entry) => ({
        ...entry,
        share: totalStuck ? Math.max(5, Math.round((entry.count / totalStuck) * 100)) : 0
      }));
  }, [ownershipCounts, totalStuck, pinnedAgents, agentOptions]);

  const filteredTasks = tasks
    .filter((task) => {
      if (agentFilter === "all") return true;
      if (agentFilter === "unassigned") return !task.agent?.id;
      return task.agent?.id === agentFilter;
    })
    .sort((a, b) => {
      const diff = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      return sortOrder === "oldest" ? diff : -diff;
    });

  if (!tasks.length) {
    return (
      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
        No tasks have been stuck in Doing for more than 48 hours. ✅
      </div>
    );
  }

  const hasFilters = agentFilter !== "all" || sortOrder !== "oldest";

  return (
    <div className="space-y-3 rounded-3xl border border-amber-300/30 bg-amber-300/10 p-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-amber-200">Aging alerts</p>
          <h3 className="text-lg font-semibold text-white">Tasks stuck in Doing</h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-amber-400/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-100">
            {tasks.length} alert{tasks.length === 1 ? "" : "s"}
          </span>
          <details className="group">
            <summary className="flex cursor-pointer items-center text-xs uppercase tracking-wide text-amber-100 underline decoration-dotted decoration-amber-300/80">
              Legend
            </summary>
            <div className="mt-2 space-y-1 rounded-lg border border-amber-200/30 bg-black/30 p-2 text-[11px] text-white/80">
              <p>Agent badge colors rotate to help differentiate owners:</p>
              <div className="flex flex-wrap gap-2">
                {AGENT_COLOR_MAP.map((color, idx) => (
                  <span
                    key={color}
                    className={`rounded-full border px-2 py-0.5 ${color} border-white/10 text-[10px] uppercase tracking-wide`}
                  >
                    Agent {idx + 1}
                  </span>
                ))}
              </div>
            </div>
          </details>
        </div>
      </header>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2 text-xs">
          {quickFilters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              className={`flex w-40 flex-col gap-1 rounded-2xl border px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide ${
                agentFilter === filter.value
                  ? 'border-amber-300 bg-amber-400/15 text-amber-50'
                  : 'border-white/15 text-white/70 hover:border-amber-200 hover:text-amber-100'
              }`}
              onClick={() => updateQuery(filter.value, sortOrder)}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="truncate">{filter.label}</span>
                <span className="flex items-center gap-1 text-[10px] text-white/60">
                  {filter.pinnable ? (
                    <button
                      type="button"
                      aria-label={filter.pinned ? `Unpin ${filter.label}` : `Pin ${filter.label}`}
                      className={`text-xs ${filter.pinned ? 'text-amber-200' : 'text-white/40'} hover:text-amber-100`}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        handleTogglePin(filter.value);
                      }}
                    >
                      {filter.pinned ? '★' : '☆'}
                    </button>
                  ) : null}
                  <span>{filter.count}</span>
                </span>
              </span>
              <span className="block h-1.5 rounded-full bg-white/10">
                <span
                  className="block h-full rounded-full bg-amber-300/80"
                  style={{ width: `${Math.min(100, filter.share)}%` }}
                />
              </span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-white/80">
          <label className="flex flex-col gap-1">
            Agent
            <select
              className="rounded-md border border-white/20 bg-black/30 px-3 py-1 text-sm text-white focus:border-amber-300 focus:outline-none"
              value={agentFilter}
              onChange={(event) => {
                const value = event.target.value;
                updateQuery(value, sortOrder);
              }}
            >
              <option value="all">All agents</option>
              <option value="unassigned">Unassigned</option>
              {agentOptions.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            Order
            <select
              className="rounded-md border border-white/20 bg-black/30 px-3 py-1 text-sm text-white focus:border-amber-300 focus:outline-none"
              value={sortOrder}
              onChange={(event) => {
                const value = event.target.value as SortOrder;
                updateQuery(agentFilter, value);
              }}
            >
              <option value="oldest">Oldest first</option>
              <option value="newest">Newest first</option>
            </select>
          </label>
          {hasFilters ? (
            <button
              type="button"
              className="rounded-md border border-amber-300/60 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-100 hover:bg-amber-400/10"
              onClick={() => {
                updateQuery('all', 'oldest');
              }}
            >
              Reset
            </button>
          ) : null}
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <p className="text-sm text-white/70">No stuck tasks match the current filters.</p>
      ) : (
        <ol className="space-y-3">
          {filteredTasks.map((task, index) => (
            <li key={task.id} className="rounded-2xl border border-white/15 bg-black/30 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/80 ${getAgentBadgeClass(
                      task.agent?.id ?? "unassigned",
                      index
                    )}`}
                  >
                    {task.agent?.name ?? "Unassigned"}
                  </span>
                  <p className="text-base font-semibold text-white">{task.title}</p>
                </div>
                <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-100">
                  {ageInHours(task.updatedAt, referenceTime)}h stale
                </span>
              </div>
              {task.description ? <p className="mt-2 text-sm text-white/80">{task.description}</p> : null}
              <p className="mt-2 text-[11px] uppercase tracking-wide text-white/50">
                Last update {formatDateTime(task.updatedAt)}
                <span className="ml-2 text-[10px] uppercase tracking-wide text-white/40">
                  ({formatRelativeTime(task.updatedAt, referenceTime)})
                </span>
              </p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function ageInHours(date: Date, referenceTime: Date) {
  const diffMs = referenceTime.getTime() - new Date(date).getTime();
  return Math.max(48, Math.floor(diffMs / (1000 * 60 * 60)));
}
