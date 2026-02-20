import { createTask } from "@/app/actions";
import type { Agent } from "@mission-control/db";
import { TASK_PRIORITIES, TASK_STATUSES } from "@/lib/constants";
import { SubmitButton } from "../submit-button";

export function TaskForm({ agents }: { agents: Pick<Agent, "id" | "name">[] }) {
  return (
    <form action={createTask} className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-white/60">Title</label>
        <input
          name="title"
          className="mt-1 w-full rounded-md border border-white/20 bg-black/40 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none"
          placeholder="Ship the agent dashboard"
          required
        />
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-white/60">Description</label>
        <textarea
          name="description"
          className="mt-1 w-full rounded-md border border-white/20 bg-black/40 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none"
          rows={3}
          placeholder="Context, constraints, done definition"
        />
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="md:col-span-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-white/60">Assign agent</label>
          <select
            name="agentId"
            className="mt-1 w-full rounded-md border border-white/20 bg-black/40 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none"
            defaultValue=""
          >
            <option value="">Unassigned</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-white/60">Status</label>
          <select
            name="status"
            className="mt-1 w-full rounded-md border border-white/20 bg-black/40 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none"
            defaultValue="TODO"
          >
            {TASK_STATUSES.map((status) => (
              <option key={status.id} value={status.id}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-white/60">Priority</label>
          <select
            name="priority"
            className="mt-1 w-full rounded-md border border-white/20 bg-black/40 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none"
            defaultValue="MEDIUM"
          >
            {TASK_PRIORITIES.map((priority) => (
              <option key={priority.id} value={priority.id}>
                {priority.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <SubmitButton label="Create task" pendingLabel="Creating..." />
    </form>
  );
}
