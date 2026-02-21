'use client';

import { useMemo, useState } from "react";

export interface AgentFolderEntry {
  title: string;
  content: string;
  meta?: string;
}

export interface AgentFolder {
  id: string;
  title: string;
  summary: string;
  copyText: string;
  entries?: AgentFolderEntry[];
}

interface AgentFolderViewerProps {
  agentName: string;
  folders: AgentFolder[];
}

export function AgentFolderViewer({ agentName, folders }: AgentFolderViewerProps) {
  const [search, setSearch] = useState("");
  const [officeMode, setOfficeMode] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredFolders = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return folders;
    return folders.filter((folder) => {
      if (folder.title.toLowerCase().includes(normalized)) return true;
      if (folder.summary.toLowerCase().includes(normalized)) return true;
      if (!folder.entries?.length) return false;
      return folder.entries.some((entry) =>
        `${entry.title} ${entry.content} ${entry.meta ?? ""}`.toLowerCase().includes(normalized)
      );
    });
  }, [folders, search]);

  const handleCopy = async (folder: AgentFolder) => {
    try {
      await navigator.clipboard.writeText(folder.copyText);
      setCopiedId(folder.id);
      setTimeout(() => setCopiedId((current) => (current === folder.id ? null : current)), 2000);
    } catch (error) {
      console.error("Failed to copy folder", error);
    }
  };

  return (
    <section
      className={`space-y-5 rounded-3xl border border-white/10 p-6 shadow-inner shadow-black/30 transition ${
        officeMode ? "bg-[#1f1710]" : "bg-white/5"
      }`}
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-indigo-200">Files Viewer</p>
          <h2 className="mt-1 text-2xl font-semibold text-white">{agentName}&rsquo;s folders</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="relative flex items-center">
            <span className="sr-only">Search files</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search folders or contents"
              className="w-56 rounded-full border border-white/20 bg-black/30 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-indigo-300 focus:outline-none"
            />
          </label>
          <button
            type="button"
            className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
              officeMode ? "border-amber-400 text-amber-200" : "border-white/20 text-white"
            }`}
            onClick={() => setOfficeMode((prev) => !prev)}
          >
            {officeMode ? "Disable Office Space" : "Office Space mode"}
          </button>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {filteredFolders.map((folder) => (
          <article
            key={folder.id}
            className={`flex h-full flex-col gap-3 rounded-2xl border border-white/10 p-5 transition ${
              officeMode ? "bg-[#2b2018]/80" : "bg-black/30"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold text-white">{folder.title}</h3>
                <p className="text-sm text-white/60">{folder.summary || "No summary"}</p>
              </div>
              <button
                type="button"
                className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition ${
                  copiedId === folder.id
                    ? "border-emerald-300 bg-emerald-400/20 text-emerald-50"
                    : "border-white/20 text-white/80 hover:border-indigo-300"
                }`}
                onClick={() => handleCopy(folder)}
              >
                {copiedId === folder.id ? "Copied" : "Copy"}
              </button>
            </div>
            {folder.entries?.length ? (
              <ul className="space-y-2 text-sm text-white/80">
                {folder.entries.map((entry, index) => (
                  <li key={`${folder.id}-${index}`} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-white">{entry.title}</p>
                      {entry.meta ? <span className="text-[11px] uppercase tracking-wide text-white/40">{entry.meta}</span> : null}
                    </div>
                    <p className="mt-1 text-white/70">{entry.content}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-white/60">Nothing stored in this folder yet.</p>
            )}
          </article>
        ))}
        {filteredFolders.length === 0 ? (
          <div className="rounded-2xl border border-amber-300/30 bg-amber-300/10 p-4 text-sm text-amber-100">
            No folders matched that search.
          </div>
        ) : null}
      </div>
    </section>
  );
}
