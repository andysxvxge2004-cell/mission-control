'use client';

import { useState, useTransition } from "react";
import { updateEscalationPlaybook } from "@/app/actions";
import { ESCALATION_IMPACT_LEVELS } from "@/lib/escalation-playbooks";
import type { EscalationPlaybookView } from "./escalation-playbook-library";

interface EscalationPlaybookEditorProps {
  playbook: EscalationPlaybookView;
  onClose?: () => void;
}

export function EscalationPlaybookEditor({ playbook, onClose }: EscalationPlaybookEditorProps) {
  const [title, setTitle] = useState(playbook.title);
  const [scenario, setScenario] = useState(playbook.scenario);
  const [impactLevel, setImpactLevel] = useState(playbook.impactLevel);
  const [owner, setOwner] = useState(playbook.owner);
  const [steps, setSteps] = useState(playbook.steps.join("\n"));
  const [communicationTemplate, setCommunicationTemplate] = useState(playbook.communicationTemplate ?? "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await updateEscalationPlaybook(null, formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setSuccess(true);
      onClose?.();
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-white/10 bg-black/40 p-4">
      <input type="hidden" name="playbookId" value={playbook.id} />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-xs uppercase tracking-wide text-white/60">
          <span>Title</span>
          <input
            name="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-indigo-300 focus:outline-none"
            required
          />
        </label>
        <label className="space-y-1 text-xs uppercase tracking-wide text-white/60">
          <span>Owner</span>
          <input
            name="owner"
            value={owner}
            onChange={(event) => setOwner(event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-indigo-300 focus:outline-none"
            required
          />
        </label>
      </div>

      <label className="space-y-1 text-xs uppercase tracking-wide text-white/60">
        <span>Scenario</span>
        <textarea
          name="scenario"
          value={scenario}
          onChange={(event) => setScenario(event.target.value)}
          className="min-h-[70px] w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-indigo-300 focus:outline-none"
          required
        />
      </label>

      <label className="space-y-1 text-xs uppercase tracking-wide text-white/60">
        <span>Impact level</span>
        <select
          name="impactLevel"
          value={impactLevel}
          onChange={(event) => setImpactLevel(event.target.value as typeof impactLevel)}
          className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-indigo-300 focus:outline-none"
          required
        >
          {ESCALATION_IMPACT_LEVELS.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-1 text-xs uppercase tracking-wide text-white/60">
        <span>Steps (one per line)</span>
        <textarea
          name="steps"
          value={steps}
          onChange={(event) => setSteps(event.target.value)}
          className="min-h-[120px] w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-indigo-300 focus:outline-none"
          required
        />
      </label>

      <label className="space-y-1 text-xs uppercase tracking-wide text-white/60">
        <span>Communication template</span>
        <textarea
          name="communicationTemplate"
          value={communicationTemplate}
          onChange={(event) => setCommunicationTemplate(event.target.value)}
          className="min-h-[70px] w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-indigo-300 focus:outline-none"
        />
      </label>

      {error ? <p className="text-sm text-rose-200">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-200">Playbook updated.</p> : null}

      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-full bg-indigo-500/80 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400"
          disabled={isPending}
        >
          {isPending ? "Saving…" : "Save changes"}
        </button>
        {onClose ? (
          <button
            type="button"
            className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white/80 hover:text-white"
            onClick={onClose}
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
