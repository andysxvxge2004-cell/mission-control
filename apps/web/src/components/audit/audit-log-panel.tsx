'use client';

import { useMemo, useState } from "react";
import type { AuditLogEntry } from "@/components/audit/audit-log";
import { AuditLogList } from "@/components/audit/audit-log";

interface AuditLogPanelProps {
  logs: AuditLogEntry[];
}

const COMMON_ACTION_LABELS: Record<string, string> = {
  "task.created": "Task created",
  "task.updated": "Task updated",
  "agent.created": "Agent created",
  "agent.needs_briefing": "Needs briefing",
  "memory.created": "Memory logged"
};

export function AuditLogPanel({ logs }: AuditLogPanelProps) {
  const [selectedAction, setSelectedAction] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const uniqueActions = useMemo(() => {
    const counts = logs.reduce<Record<string, number>>((acc, log) => {
      acc[log.action] = (acc[log.action] ?? 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([action, count]) => ({ action, count }));
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return logs.filter((log) => {
      if (selectedAction !== "ALL" && log.action !== selectedAction) {
        return false;
      }
      if (!normalizedQuery) return true;
      const haystack = `${log.action} ${log.task?.title ?? ""} ${log.metadata ?? ""}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [logs, searchQuery, selectedAction]);

  const hasFilters = selectedAction !== "ALL" || searchQuery.trim().length > 0;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-white">Audit log</h2>
          <p className="text-sm text-white/60">Filtering {filteredLogs.length} of {logs.length} events.</p>
        </div>
        {hasFilters ? (
          <button
            type="button"
            className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/70 hover:text-white"
            onClick={() => {
              setSelectedAction("ALL");
              setSearchQuery("");
            }}
          >
            Reset filters
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3 rounded-3xl border border-white/10 bg-white/5 p-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
              selectedAction === "ALL" ? "border-indigo-300 bg-indigo-400/20 text-white" : "border-white/15 text-white/70 hover:text-white"
            }`}
            onClick={() => setSelectedAction("ALL")}
          >
            All ({logs.length})
          </button>
          {uniqueActions.slice(0, 5).map(({ action, count }) => (
            <button
              key={action}
              type="button"
              className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                selectedAction === action ? "border-indigo-300 bg-indigo-400/20 text-white" : "border-white/15 text-white/70 hover:text-white"
              }`}
              onClick={() => setSelectedAction(selectedAction === action ? "ALL" : action)}
            >
              {COMMON_ACTION_LABELS[action] ?? action} ({count})
            </button>
          ))}
        </div>
        <label className="flex-1 min-w-[220px]">
          <span className="sr-only">Search audit log</span>
          <input
            className="w-full rounded-full border border-white/15 bg-black/40 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-indigo-300 focus:outline-none"
            placeholder="Search task title, metadata, action…"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </label>
      </div>

      {filteredLogs.length === 0 ? (
        <p className="rounded-2xl border border-amber-300/40 bg-amber-300/10 p-4 text-sm text-amber-100">
          No log entries match those filters.
        </p>
      ) : (
        <AuditLogList logs={filteredLogs} />
      )}
    </section>
  );
}
