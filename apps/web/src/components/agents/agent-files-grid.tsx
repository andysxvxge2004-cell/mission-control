'use client';

import Link from "next/link";
import { useMemo, useState } from "react";

export interface AgentFilesGridProps {
  agents: Array<{
    id: string;
    name: string;
    role: string;
    lastMemory: { content: string | null; createdAt: string } | null;
  }>;
}

export function AgentFilesGrid({ agents }: AgentFilesGridProps) {
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"recent" | "name">("recent");

  const roleCounts = useMemo(() => {
    return agents.reduce<Record<string, number>>((acc, agent) => {
      acc[agent.role] = (acc[agent.role] ?? 0) + 1;
      return acc;
    }, {});
  }, [agents]);

  const filteredAgents = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return agents
      .filter((agent) => {
        const matchesRole = roleFilter === "ALL" || agent.role === roleFilter;
        if (!matchesRole) return false;
        if (!normalizedQuery) return true;
        const haystack = `${agent.name} ${agent.role} ${agent.lastMemory?.content ?? ""}`.toLowerCase();
        return haystack.includes(normalizedQuery);
      })
      .sort((a, b) => {
        if (sortOrder === "name") {
          return a.name.localeCompare(b.name);
        }
        const aTime = a.lastMemory ? new Date(a.lastMemory.createdAt).getTime() : 0;
        const bTime = b.lastMemory ? new Date(b.lastMemory.createdAt).getTime() : 0;
        if (aTime === bTime) {
          return a.name.localeCompare(b.name);
        }
        return bTime - aTime;
      });
  }, [agents, roleFilter, searchQuery, sortOrder]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-white/50">Dossiers</p>
          <p className="text-sm text-white/60">Showing {filteredAgents.length} of {agents.length}</p>
        </div>
        {roleFilter !== "ALL" || searchQuery ? (
          <button
            type="button"
            className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/70 hover:text-white"
            onClick={() => {
              setRoleFilter("ALL");
              setSearchQuery("");
            }}
          >
            Reset
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3 rounded-3xl border border-white/10 bg-black/30 p-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
              roleFilter === "ALL" ? "border-indigo-300 bg-indigo-400/20 text-white" : "border-white/15 text-white/70 hover:text-white"
            }`}
            onClick={() => setRoleFilter("ALL")}
          >
            All ({agents.length})
          </button>
          {Object.entries(roleCounts)
            .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
            .map(([role, count]) => (
              <button
                key={role}
                type="button"
                className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                  roleFilter === role ? "border-indigo-300 bg-indigo-400/20 text-white" : "border-white/15 text-white/70 hover:text-white"
                }`}
                onClick={() => setRoleFilter(roleFilter === role ? "ALL" : role)}
              >
                {role} ({count})
              </button>
            ))}
        </div>
        <label className="flex-1 min-w-[220px]">
          <span className="sr-only">Search dossiers</span>
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by agent or memory notes…"
            className="w-full rounded-full border border-white/15 bg-black/40 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-indigo-300 focus:outline-none"
          />
        </label>
        <label className="flex items-center gap-2 text-xs uppercase tracking-wide text-white/60">
          Sort
          <select
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value as "recent" | "name")}
            className="rounded-full border border-white/15 bg-black/40 px-3 py-1 text-sm text-white focus:border-indigo-300 focus:outline-none"
          >
            <option value="recent">Recent activity</option>
            <option value="name">Alphabetical</option>
          </select>
        </label>
      </div>

      {filteredAgents.length === 0 ? (
        <div className="rounded-2xl border border-amber-300/40 bg-amber-300/10 p-4 text-sm text-amber-100">
          No dossiers match those filters yet.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredAgents.map((agent) => (
            <Link
              key={agent.id}
              href={`/mission-control/agents/${agent.id}/files`}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-indigo-300/70 hover:bg-white/10"
            >
              <p className="text-xs uppercase tracking-wide text-indigo-300">{agent.role}</p>
              <h2 className="text-xl font-semibold text-white">{agent.name}</h2>
              {agent.lastMemory ? (
                <p className="mt-2 line-clamp-2 text-sm text-white/70">“{agent.lastMemory.content ?? ""}”</p>
              ) : (
                <p className="mt-2 text-sm text-white/60">No memories yet.</p>
              )}
              <p className="mt-3 text-xs text-white/50">
                {agent.lastMemory ? `Updated ${new Date(agent.lastMemory.createdAt).toLocaleDateString()}` : "Open dossier ↗"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
