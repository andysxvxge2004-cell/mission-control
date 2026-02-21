'use client';

import { useMemo, useState } from "react";
import type { TaskStatus } from "@mission-control/db";
import { formatDateTime, formatRelativeTime } from "@/lib/formatters";

interface MemoryEntry {
  content: string;
  createdAt: string;
}

interface TaskEntry {
  title: string;
  status: TaskStatus;
  updatedAt: string;
}

interface AuditEntry {
  action: string;
  taskTitle: string | null;
  createdAt: string;
}

export interface AgentFilesGridProps {
  agents: Array<{
    id: string;
    name: string;
    role: string;
    soul: string;
    memories: MemoryEntry[];
    tasks: TaskEntry[];
    audits: AuditEntry[];
  }>;
}

interface FolderCard {
  id: string;
  title: string;
  summary: string;
  copyText: string;
  entries: Array<{ label: string; value: string }>;
}

export function AgentFilesGrid({ agents }: AgentFilesGridProps) {
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"recent" | "name">("recent");
  const [officeMode, setOfficeMode] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const roleCounts = useMemo(() => {
    return agents.reduce<Record<string, number>>((acc, agent) => {
      acc[agent.role] = (acc[agent.role] ?? 0) + 1;
      return acc;
    }, {});
  }, [agents]);

  const filteredAgents = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();

    const ranked = agents
      .filter((agent) => {
        const matchesRole = roleFilter === "ALL" || agent.role === roleFilter;
        if (!matchesRole) return false;
        if (!normalized) return true;
        const haystack = [
          agent.name,
          agent.role,
          agent.soul,
          ...agent.memories.map((memory) => memory.content),
          ...agent.tasks.map((task) => `${task.title} ${task.status}`),
          ...agent.audits.map((audit) => `${audit.action} ${audit.taskTitle ?? ""}`)
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(normalized);
      })
      .sort((a, b) => {
        if (sortOrder === "name") {
          return a.name.localeCompare(b.name);
        }
        const aLatest = getLatestTimestamp(a);
        const bLatest = getLatestTimestamp(b);
        if (aLatest === bLatest) {
          return a.name.localeCompare(b.name);
        }
        return bLatest - aLatest;
      });

    return ranked;
  }, [agents, roleFilter, searchQuery, sortOrder]);

  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => {
        setCopiedKey((current) => (current === key ? null : current));
      }, 1800);
    } catch (error) {
      console.error("Failed to copy folder", error);
    }
  };

  const panelTone = officeMode ? "bg-[#1f1710]/80 border-amber-400/30" : "bg-white/5 border-white/10";

  return (
    <div className="space-y-6">
      <div className={`rounded-3xl border ${panelTone} p-4 shadow-inner shadow-black/30 transition`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-white/50">Dossiers</p>
            <p className="text-sm text-white/60">
              Showing {filteredAgents.length} of {agents.length}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs uppercase tracking-wide text-white/60">
            <label className="flex items-center gap-2">
              Sort
              <select
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value as "recent" | "name")}
                className="rounded-full border border-white/20 bg-black/30 px-3 py-1 text-sm text-white focus:border-indigo-300 focus:outline-none"
              >
                <option value="recent">Recent activity</option>
                <option value="name">Alphabetical</option>
              </select>
            </label>
            <button
              type="button"
              className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition ${
                officeMode ? "border-amber-300 text-amber-200" : "border-white/20 text-white/80"
              }`}
              onClick={() => setOfficeMode((prev) => !prev)}
            >
              {officeMode ? "Disable Office Space" : "Office Space mode"}
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                roleFilter === "ALL"
                  ? "border-indigo-300 bg-indigo-400/20 text-white"
                  : "border-white/15 text-white/70 hover:text-white"
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
                    roleFilter === role
                      ? "border-indigo-300 bg-indigo-400/20 text-white"
                      : "border-white/15 text-white/70 hover:text-white"
                  }`}
                  onClick={() => setRoleFilter((current) => (current === role ? "ALL" : role))}
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
              placeholder="Search name, soul, memories…"
              className="w-full rounded-full border border-white/15 bg-black/40 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-indigo-300 focus:outline-none"
            />
          </label>
        </div>
      </div>

      {filteredAgents.length === 0 ? (
        <div className="rounded-2xl border border-amber-300/40 bg-amber-300/10 p-4 text-sm text-amber-100">
          No dossiers matched those filters yet.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAgents.map((agent) => {
            const folders = buildFolders(agent);
            const latestTimestamp = getLatestTimestamp(agent);

            return (
              <article
                key={agent.id}
                className={`rounded-3xl border ${panelTone} p-5 text-white shadow-lg shadow-black/20 transition`}
              >
                <header className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-indigo-200">Dossier</p>
                    <h2 className="text-2xl font-semibold">{agent.name}</h2>
                    <p className="text-white/70">{agent.role}</p>
                  </div>
                  <div className="text-right text-xs uppercase tracking-wide text-white/50">
                    <p>Folders: {folders.length}</p>
                    <p>Last touch {latestTimestamp ? formatRelativeTime(new Date(latestTimestamp)) : "unknown"}</p>
                  </div>
                </header>

                <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {folders.map((folder) => (
                    <section
                      key={`${agent.id}-${folder.id}`}
                      className={`flex h-full flex-col rounded-2xl border border-white/10 ${
                        officeMode ? "bg-[#2b2018]/80" : "bg-black/40"
                      } p-4`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">Folder</p>
                          <h3 className="text-lg font-semibold text-white">{folder.title}</h3>
                          <p className="text-sm text-white/70">{folder.summary}</p>
                        </div>
                        <button
                          type="button"
                          className="rounded-full border border-white/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white/80 hover:border-indigo-300"
                          onClick={() => handleCopy(folder.copyText, `${agent.id}-${folder.id}`)}
                        >
                          {copiedKey === `${agent.id}-${folder.id}` ? "Copied" : "Copy"}
                        </button>
                      </div>
                      <ul className="mt-3 space-y-2 text-sm text-white/80">
                        {folder.entries.length === 0 ? (
                          <li className="rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-white/60">No entries yet.</li>
                        ) : (
                          folder.entries.map((entry, index) => (
                            <li key={`${folder.id}-${index}`} className="rounded-xl border border-white/5 bg-white/5 px-3 py-2">
                              <p className="text-xs uppercase tracking-wide text-white/50">{entry.label}</p>
                              <p className="text-white/80">{entry.value}</p>
                            </li>
                          ))
                        )}
                      </ul>
                    </section>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function getLatestTimestamp(agent: AgentFilesGridProps["agents"][number]): number {
  const times: number[] = [];
  const pushTime = (value: string | undefined) => {
    if (!value) return;
    const ms = new Date(value).getTime();
    if (!Number.isNaN(ms)) {
      times.push(ms);
    }
  };
  agent.memories.forEach((memory) => pushTime(memory.createdAt));
  agent.tasks.forEach((task) => pushTime(task.updatedAt));
  agent.audits.forEach((audit) => pushTime(audit.createdAt));
  return times.length ? Math.max(...times) : 0;
}

function buildFolders(agent: AgentFilesGridProps["agents"][number]): FolderCard[] {
  const roleFolder: FolderCard = {
    id: "role",
    title: "Role Brief",
    summary: agent.role,
    copyText: agent.role,
    entries: [{ label: "Role", value: agent.role }]
  };

  const soulFolder: FolderCard = {
    id: "soul",
    title: "Soul File",
    summary: agent.soul.slice(0, 80) || "No soul defined",
    copyText: agent.soul,
    entries: [{ label: "Soul", value: agent.soul || "No soul recorded" }]
  };

  const memoryEntries = agent.memories.slice(0, 3).map((memory) => ({
    label: formatDateTime(memory.createdAt),
    value: memory.content || "No content"
  }));

  const memoryFolder: FolderCard = {
    id: "memories",
    title: "Recent Memories",
    summary: agent.memories.length ? `${agent.memories.length} captured` : "No memories yet",
    copyText: agent.memories
      .map((memory) => `${formatDateTime(memory.createdAt)} — ${memory.content ?? "No content"}`)
      .join("\n") || "",
    entries: memoryEntries
  };

  const taskEntries = agent.tasks.slice(0, 3).map((task) => ({
    label: task.title,
    value: `${task.status} • ${formatDateTime(task.updatedAt)}`
  }));

  const taskFolder: FolderCard = {
    id: "tasks",
    title: "Task Queue",
    summary: agent.tasks.length ? `${agent.tasks.length} tracked` : "No tasks yet",
    copyText: agent.tasks.map((task) => `[${task.status}] ${task.title}`).join("\n") || "",
    entries: taskEntries
  };

  const auditEntries = agent.audits.slice(0, 3).map((audit) => ({
    label: audit.action,
    value: `${audit.taskTitle ?? "General"} • ${formatDateTime(audit.createdAt)}`
  }));

  const auditFolder: FolderCard = {
    id: "audits",
    title: "Audit Log",
    summary: agent.audits.length ? `${agent.audits.length} events` : "No activity",
    copyText:
      agent.audits
        .map((audit) => `${formatDateTime(audit.createdAt)} — ${audit.action} (${audit.taskTitle ?? "General"})`)
        .join("\n") || "",
    entries: auditEntries
  };

  return [roleFolder, soulFolder, memoryFolder, taskFolder, auditFolder];
}
