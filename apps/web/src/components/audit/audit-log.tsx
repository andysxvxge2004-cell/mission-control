import type { AuditLog, Task } from "@mission-control/db";
import { formatDateTime } from "@/lib/formatters";

export type AuditLogEntry = AuditLog & { task?: Pick<Task, "id" | "title"> | null };

function parseMetadata(metadata?: string | null) {
  if (!metadata) return null;
  try {
    return JSON.parse(metadata);
  } catch (error) {
    console.error("Failed to parse metadata", error);
    return null;
  }
}

export function AuditLogList({ logs }: { logs: AuditLogEntry[] }) {
  if (!logs.length) {
    return <p className="text-sm text-white/60">No activity logged yet.</p>;
  }

  return (
    <ol className="space-y-3 text-sm">
      {logs.map((log) => {
        const metadata = parseMetadata(log.metadata);
        return (
          <li key={log.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-white/60">
              <span>{log.action}</span>
              <span>{formatDateTime(log.createdAt)}</span>
            </div>
            {log.task ? (
              <p className="mt-1 text-white/80">Task: {log.task.title}</p>
            ) : null}
            {metadata ? (
              <pre className="mt-2 rounded-md bg-black/40 p-2 text-[11px] text-indigo-200">
                {JSON.stringify(metadata, null, 2)}
              </pre>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
