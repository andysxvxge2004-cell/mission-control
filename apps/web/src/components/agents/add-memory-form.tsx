import { addMemory } from "@/app/actions";
import { SubmitButton } from "../submit-button";

export function AddMemoryForm({ agentId }: { agentId: string }) {
  return (
    <form action={addMemory} className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
      <input type="hidden" name="agentId" value={agentId} />
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-white/60">New memory</label>
        <textarea
          name="content"
          rows={4}
          className="mt-1 w-full rounded-md border border-white/20 bg-black/40 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none"
          placeholder="What did this agent just learn, ship, or observe?"
          required
        />
      </div>
      <SubmitButton label="Append memory" pendingLabel="Saving..." />
    </form>
  );
}
