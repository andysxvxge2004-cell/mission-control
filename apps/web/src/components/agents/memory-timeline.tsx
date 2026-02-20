import type { RecentMemory } from "@mission-control/db";
import { formatDateTime, formatRelativeTime } from "@/lib/formatters";

export function MemoryTimeline({ memories }: { memories: RecentMemory[] }) {
  if (!memories.length) {
    return <p className="text-sm text-white/60">No memories captured yet.</p>;
  }

  return (
    <ol className="space-y-3">
      {memories.map((memory) => (
        <li key={memory.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-sm text-white/80">{memory.content}</p>
          <p className="mt-2 text-[11px] uppercase tracking-wide text-white/50">
            {formatDateTime(memory.createdAt)}
            <span className="ml-2 text-[10px] uppercase tracking-wide text-white/40">
              ({formatRelativeTime(memory.createdAt)})
            </span>
          </p>
        </li>
      ))}
    </ol>
  );
}
