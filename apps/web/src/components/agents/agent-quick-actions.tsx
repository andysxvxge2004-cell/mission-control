'use client';

import { useState, useTransition, FormEvent } from "react";
import { addMemory, createTask } from "@/app/actions";

interface AgentQuickActionsProps {
  agentId: string;
  agentName: string;
}

interface ActionStatus {
  type: "success" | "error";
  message: string;
}

export function AgentQuickActions({ agentId, agentName }: AgentQuickActionsProps) {
  const [activeTab, setActiveTab] = useState<"memory" | "task" | null>(null);
  const [memoryStatus, setMemoryStatus] = useState<ActionStatus | null>(null);
  const [taskStatus, setTaskStatus] = useState<ActionStatus | null>(null);
  const [isMemoryPending, startMemoryTransition] = useTransition();
  const [isTaskPending, startTaskTransition] = useTransition();

  const handleMemorySubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("agentId", agentId);
    setMemoryStatus(null);

    startMemoryTransition(async () => {
      const result = await addMemory(null, formData);
      if (result?.error) {
        setMemoryStatus({ type: "error", message: result.error });
        return;
      }
      form.reset();
      setMemoryStatus({ type: "success", message: "Memory captured." });
    });
  };

  const handleTaskSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("agentId", agentId);
    formData.set("status", "TODO");
    setTaskStatus(null);

    startTaskTransition(async () => {
      const result = await createTask(null, formData);
      if (result?.error) {
        setTaskStatus({ type: "error", message: result.error });
        return;
      }
      form.reset();
      setTaskStatus({ type: "success", message: "Task logged." });
    });
  };

  return (
    <div className="mt-4 rounded-xl border border-white/10 bg-black/40 p-4 text-sm text-white/80">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Quick actions</p>
        <div className="flex gap-2 text-xs">
          <button
            type="button"
            className={`rounded-full border px-3 py-1 font-semibold uppercase tracking-wide transition ${
              activeTab === "memory"
                ? "border-indigo-300 bg-indigo-400/20 text-white"
                : "border-white/15 text-white/70 hover:border-white/40"
            }`}
            onClick={() => setActiveTab((tab) => (tab === "memory" ? null : "memory"))}
          >
            Append memory
          </button>
          <button
            type="button"
            className={`rounded-full border px-3 py-1 font-semibold uppercase tracking-wide transition ${
              activeTab === "task"
                ? "border-indigo-300 bg-indigo-400/20 text-white"
                : "border-white/15 text-white/70 hover:border-white/40"
            }`}
            onClick={() => setActiveTab((tab) => (tab === "task" ? null : "task"))}
          >
            Assign task
          </button>
        </div>
      </div>

      {activeTab === null ? (
        <p className="mt-2 text-xs text-white/60">Select an action to log work for {agentName}.</p>
      ) : null}

      {activeTab === "memory" ? (
        <form className="mt-3 space-y-2" onSubmit={handleMemorySubmit}>
          <textarea
            name="content"
            className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm text-white focus:border-indigo-300 focus:outline-none"
            placeholder={`Add context for ${agentName}`}
            required
          />
          {memoryStatus ? (
            <p className={`text-xs ${memoryStatus.type === "error" ? "text-rose-200" : "text-emerald-200"}`}>
              {memoryStatus.message}
            </p>
          ) : null}
          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-full bg-indigo-500/80 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-indigo-400/80"
              disabled={isMemoryPending}
            >
              {isMemoryPending ? "Saving…" : "Save memory"}
            </button>
          </div>
        </form>
      ) : null}

      {activeTab === "task" ? (
        <form className="mt-3 space-y-2" onSubmit={handleTaskSubmit}>
          <input
            name="title"
            className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm text-white focus:border-indigo-300 focus:outline-none"
            placeholder={`Task for ${agentName}`}
            required
          />
          <textarea
            name="description"
            className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm text-white focus:border-indigo-300 focus:outline-none"
            placeholder="Optional details"
          />
          {taskStatus ? (
            <p className={`text-xs ${taskStatus.type === "error" ? "text-rose-200" : "text-emerald-200"}`}>
              {taskStatus.message}
            </p>
          ) : null}
          <div className="flex justify-end gap-2 text-xs text-white/60">
            <label className="flex items-center gap-1">
              Priority
              <select
                name="priority"
                defaultValue="MEDIUM"
                className="rounded-full border border-white/20 bg-black/30 px-2 py-1 text-xs text-white focus:border-indigo-300 focus:outline-none"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </label>
            <button
              type="submit"
              className="rounded-full bg-indigo-500/80 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-indigo-400/80"
              disabled={isTaskPending}
            >
              {isTaskPending ? "Assigning…" : "Assign task"}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
