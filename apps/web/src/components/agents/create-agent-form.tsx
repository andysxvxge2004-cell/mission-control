import { createAgent } from "@/app/actions";
import { SubmitButton } from "../submit-button";

export function CreateAgentForm() {
  return (
    <form action={createAgent} className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-white/60">Name</label>
        <input
          name="name"
          className="mt-1 w-full rounded-md border border-white/20 bg-black/40 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none"
          placeholder="Call sign"
          required
        />
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-white/60">Role</label>
        <input
          name="role"
          className="mt-1 w-full rounded-md border border-white/20 bg-black/40 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none"
          placeholder="e.g. Systems Architect"
          required
        />
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-white/60">Soul</label>
        <textarea
          name="soul"
          className="mt-1 w-full rounded-md border border-white/20 bg-black/40 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none"
          rows={3}
          placeholder="Summarize this agent's ethos"
          required
        />
      </div>
      <SubmitButton label="Create agent" pendingLabel="Creating..." />
    </form>
  );
}
