'use client';

import { useFormStatus } from "react-dom";
import { createEscalationPlaybook } from "@/app/actions";
import { ESCALATION_IMPACT_LEVELS } from "@/lib/escalation-playbooks";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-indigo-900 transition hover:bg-white"
      disabled={pending}
    >
      {pending ? "Saving…" : "Save playbook"}
    </button>
  );
}

export function EscalationPlaybookForm() {
  return (
    <form action={createEscalationPlaybook} className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.3em] text-indigo-200">Add playbook</p>
        <h2 className="text-lg font-semibold text-white">Custom escalation</h2>
        <p className="text-sm text-white/70">Document new incidents so the playbook library stays current.</p>
      </header>

      <div className="space-y-1">
        <label className="text-xs uppercase tracking-wide text-white/60" htmlFor="title">
          Title
        </label>
        <input
          id="title"
          name="title"
          className="w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-indigo-300 focus:outline-none"
          placeholder="API outage / onboarding blocker…"
          required
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs uppercase tracking-wide text-white/60" htmlFor="scenario">
          Scenario overview
        </label>
        <textarea
          id="scenario"
          name="scenario"
          className="min-h-[80px] w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-indigo-300 focus:outline-none"
          placeholder="Describe when this playbook should fire."
          required
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs uppercase tracking-wide text-white/60" htmlFor="impactLevel">
            Impact level
          </label>
          <select
            id="impactLevel"
            name="impactLevel"
            className="w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-indigo-300 focus:outline-none"
            defaultValue="High"
            required
          >
            {ESCALATION_IMPACT_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs uppercase tracking-wide text-white/60" htmlFor="owner">
            Owner / lead
          </label>
          <input
            id="owner"
            name="owner"
            className="w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-indigo-300 focus:outline-none"
            placeholder="Andy / Ops"
            required
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs uppercase tracking-wide text-white/60" htmlFor="steps">
          Response steps (one per line)
        </label>
        <textarea
          id="steps"
          name="steps"
          className="min-h-[120px] w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-indigo-300 focus:outline-none"
          placeholder={'Validate issue\nNotify stakeholders\nTrigger fallback path'}
          required
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs uppercase tracking-wide text-white/60" htmlFor="communicationTemplate">
          Communication template (optional)
        </label>
        <textarea
          id="communicationTemplate"
          name="communicationTemplate"
          className="min-h-[80px] w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-indigo-300 focus:outline-none"
          placeholder="Message snippet to send when this playbook fires."
        />
      </div>

      <SubmitButton />
    </form>
  );
}
