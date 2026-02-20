'use client';

import { useState } from "react";

export type EscalationPlaybookView = {
  id: string;
  title: string;
  scenario: string;
  impactLevel: string;
  owner: string;
  steps: string[];
  communicationTemplate?: string | null;
};

const IMPACT_BADGES: Record<string, string> = {
  Critical: "bg-rose-500/20 text-rose-100 border border-rose-300/30",
  High: "bg-amber-500/20 text-amber-100 border border-amber-300/30",
  Medium: "bg-sky-500/20 text-sky-100 border border-sky-300/30",
  Low: "bg-emerald-500/20 text-emerald-100 border border-emerald-300/30"
};

export function EscalationPlaybookLibrary({ playbooks }: { playbooks: EscalationPlaybookView[] }) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-indigo-200">Escalation library</p>
          <h2 className="text-2xl font-semibold text-white">Playbooks</h2>
          <p className="text-sm text-white/70">Documented response steps with ready-to-send comms templates.</p>
        </div>
        <span className="text-xs uppercase tracking-wide text-white/50">{playbooks.length} playbook{playbooks.length === 1 ? "" : "s"}</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {playbooks.map((playbook) => (
          <article key={playbook.id} className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-inner shadow-black/20">
            <header className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-white/50">{playbook.owner}</p>
                <h3 className="text-xl font-semibold text-white">{playbook.title}</h3>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                  IMPACT_BADGES[playbook.impactLevel] ?? "bg-white/10 text-white"
                }`}
              >
                {playbook.impactLevel}
              </span>
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

            {playbook.communicationTemplate ? (
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
