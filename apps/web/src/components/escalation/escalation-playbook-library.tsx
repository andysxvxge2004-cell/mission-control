'use client';

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { deleteEscalationPlaybook } from "@/app/actions";
import { EscalationPlaybookEditor } from "./escalation-playbook-editor";
import { ESCALATION_IMPACT_LEVELS, type EscalationImpactLevel } from "@/lib/escalation-playbooks";

export type EscalationPlaybookView = {
  id: string;
  title: string;
  scenario: string;
  impactLevel: EscalationImpactLevel;
  owner: string;
  steps: string[];
  communicationTemplate?: string | null;
};

interface DeletePlaybookFormProps {
  playbookId: string;
  title: string;
}

function DeletePlaybookForm({ playbookId, title }: DeletePlaybookFormProps) {
  const { pending } = useFormStatus();

  return (
    <form
      action={deleteEscalationPlaybook}
      className="ml-auto"
      onSubmit={(event) => {
        if (!window.confirm(`Delete playbook "${title}"?`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="playbookId" value={playbookId} />
      <button
        type="submit"
        className="rounded-full border border-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/70 transition hover:border-rose-300 hover:text-rose-200 disabled:opacity-60"
        disabled={pending}
      >
        {pending ? "Deleting…" : "Delete"}
      </button>
    </form>
  );
}

const IMPACT_BADGES: Record<string, string> = {
  Critical: "bg-rose-500/20 text-rose-100 border border-rose-300/30",
  High: "bg-amber-500/20 text-amber-100 border border-amber-300/30",
  Medium: "bg-sky-500/20 text-sky-100 border border-sky-300/30",
  Low: "bg-emerald-500/20 text-emerald-100 border border-emerald-300/30"
};

export function EscalationPlaybookLibrary({ playbooks }: { playbooks: EscalationPlaybookView[] }) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [impactFilter, setImpactFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleCopy = async (id: string, template?: string | null) => {
    if (!template) return;
    try {
      await navigator.clipboard.writeText(template);
      setCopiedId(id);
      setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 2200);
    } catch (error) {
      console.error("Failed to copy playbook template", error);
    }
  };

  const impactCounts = useMemo(() => {
    return playbooks.reduce<Record<string, number>>((acc, playbook) => {
      acc[playbook.impactLevel] = (acc[playbook.impactLevel] ?? 0) + 1;
      return acc;
    }, {});
  }, [playbooks]);

  const filteredPlaybooks = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return playbooks.filter((playbook) => {
      const matchesImpact = impactFilter === "ALL" || playbook.impactLevel === impactFilter;
      if (!matchesImpact) return false;
      if (!normalizedQuery) return true;
      const haystack = `${playbook.title} ${playbook.scenario} ${playbook.owner}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [impactFilter, playbooks, searchQuery]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-indigo-200">Escalation library</p>
          <h2 className="text-2xl font-semibold text-white">Playbooks</h2>
          <p className="text-sm text-white/70">Documented response steps with ready-to-send comms templates.</p>
        </div>
        <span className="text-xs uppercase tracking-wide text-white/50">
          Showing {filteredPlaybooks.length} of {playbooks.length}
        </span>
      </div>

      <div className="flex flex-wrap gap-3 rounded-3xl border border-white/10 bg-black/30 p-4">
        <div className="flex flex-wrap gap-2">
          {["ALL", ...ESCALATION_IMPACT_LEVELS].map((level) => {
            const isActive = impactFilter === level;
            const label = level === "ALL" ? "All" : level;
            const count = level === "ALL" ? playbooks.length : impactCounts[level] ?? 0;
            return (
              <button
                key={level}
                type="button"
                className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition ${
                  isActive ? "border-indigo-300 bg-indigo-400/20 text-white" : "border-white/15 text-white/70 hover:text-white"
                }`}
                onClick={() => setImpactFilter(level)}
              >
                <span>{label}</span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white">{count}</span>
              </button>
            );
          })}
        </div>
        <label className="flex-1 min-w-[220px]">
          <span className="sr-only">Search playbooks</span>
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search title, scenario, owner…"
            className="w-full rounded-full border border-white/15 bg-black/40 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-indigo-300 focus:outline-none"
          />
        </label>
      </div>

      {filteredPlaybooks.length === 0 ? (
        <div className="rounded-3xl border border-amber-300/30 bg-amber-300/10 p-4 text-sm text-amber-100">
          {playbooks.length === 0 ? "No playbooks yet. Add one using the form on the right." : "No playbooks match those filters. Try another impact level or clear the search."}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {filteredPlaybooks.map((playbook) => (
          <article key={playbook.id} className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-inner shadow-black/20">
            <header className="flex flex-wrap items-center gap-2">
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wide text-white/50">{playbook.owner}</p>
                <h3 className="text-xl font-semibold text-white">{playbook.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                    IMPACT_BADGES[playbook.impactLevel] ?? "bg-white/10 text-white"
                  }`}
                >
                  {playbook.impactLevel}
                </span>
                <button
                  type="button"
                  className="rounded-full border border-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/70 transition hover:border-indigo-300 hover:text-white"
                  onClick={() => setEditingId((current) => (current === playbook.id ? null : playbook.id))}
                >
                  {editingId === playbook.id ? "Close editor" : "Edit"}
                </button>
                <DeletePlaybookForm playbookId={playbook.id} title={playbook.title} />
              </div>
            </header>

            <p className="mt-3 text-sm text-white/70">{playbook.scenario}</p>

            <div className="mt-4 space-y-2">
              <p className="text-xs uppercase tracking-wide text-white/40">Response steps</p>
              <ol className="space-y-2 text-sm text-white/80">
                {playbook.steps.map((step, index) => (
                  <li key={`${playbook.id}-step-${index}`} className="flex gap-3">
                    <span className="mt-0.5 h-5 w-5 flex-shrink-0 rounded-full bg-white/10 text-center text-[11px] font-semibold text-white/80">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {editingId === playbook.id ? (
              <div className="mt-4">
                <EscalationPlaybookEditor playbook={playbook} onClose={() => setEditingId(null)} />
              </div>
            ) : playbook.communicationTemplate ? (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-wide text-white/40">Comms template</p>
                  <button
                    type="button"
                    className="text-xs font-semibold uppercase tracking-wide text-indigo-200 hover:text-indigo-50"
                    onClick={() => handleCopy(playbook.id, playbook.communicationTemplate)}
                  >
                    {copiedId === playbook.id ? "Copied" : "Copy text"}
                  </button>
                </div>
                <p className="rounded-2xl border border-white/10 bg-black/30 p-3 text-sm text-white/80">{playbook.communicationTemplate}</p>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
