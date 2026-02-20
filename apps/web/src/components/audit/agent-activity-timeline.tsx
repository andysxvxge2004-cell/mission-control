import type { AuditLogEntry } from "./audit-log";
import { formatDateTime } from "@/lib/formatters";

interface AgentActivityTimelineProps {
  logs: AuditLogEntry[];
}

export function AgentActivityTimeline({ logs }: AgentActivityTimelineProps) {
  if (!logs.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
        No audit events recorded for this agent yet.
      </div>
    );
  }

  return (
    <ol className="space-y-4">
      {logs.map((log, index) => (
        <li key={log.id} className="flex gap-4">
          <div className="flex flex-col items-center">
            <span
              className={`h-3 w-3 rounded-full ${index === 0 ? "bg-indigo-400" : "bg-white/40"}`}
            />
            {index === logs.length - 1 ? null : <span className="mt-1 h-full w-px bg-white/20" />}
          </div>
          <article className="flex-1 rounded-2xl border border-white/10 bg-black/30 p-4 text-white">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-white/60">{log.action}</p>
                {log.task ? (
                  <p className="text-base font-semibold text-white">{log.task.title}</p>
                ) : (
                  <p className="text-base font-semibold text-white">System event</p>
                )}
              </div>
              <span className="text-[11px] uppercase tracking-wide text-white/50">
                {formatDateTime(log.createdAt)}
              </span>
            </div>
            {(() => {
              const parsed = safeParseMetadata(log.metadata);
              if (!parsed) return null;
              return (
                <pre className="mt-3 rounded-md bg-black/50 p-3 text-[11px] text-indigo-200">
                  {JSON.stringify(parsed, null, 2)}
                </pre>
              );
            })()}
          </article>
        </li>
      ))}
    </ol>
  );
}

function safeParseMetadata(metadata?: string | null) {
  if (!metadata) return null;
  try {
    return JSON.parse(metadata);
  } catch {
    return null;
  }
}
