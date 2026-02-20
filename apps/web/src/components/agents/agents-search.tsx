import Link from "next/link";

interface AgentsSearchProps {
  basePath: string;
  query?: string;
  matches: { id: string; name: string; role: string }[];
  quickLinkPrefix: string;
  hiddenParams?: Record<string, string | undefined>;
}

export function AgentsSearch({ basePath, query = "", matches, quickLinkPrefix, hiddenParams = {} }: AgentsSearchProps) {
  const trimmedQuery = query.trim();
  const hasQuery = trimmedQuery.length > 0;
  const hiddenEntries = Object.entries(hiddenParams).filter(([, value]) => Boolean(value));
  const quickMatches = hasQuery ? matches.slice(0, 5) : [];

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <form method="get" action={basePath} className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="flex-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-white/60">Search agents</label>
          <input
            name="search"
            defaultValue={trimmedQuery}
            placeholder="e.g. Sentry or Architect"
            className="mt-1 w-full rounded-md border border-white/20 bg-black/40 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none"
          />
        </div>
        {hiddenEntries.map(([key, value]) => (
          <input key={key} type="hidden" name={key} value={value} />
        ))}
        <button
          type="submit"
          className="rounded-md bg-indigo-500/80 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
        >
          {hasQuery ? "Update" : "Search"}
        </button>
      </form>

      {hasQuery ? (
        <div className="mt-3 rounded-2xl border border-white/10 bg-black/30 p-3">
          <p className="text-xs uppercase tracking-wide text-white/60">
            Quick jump{quickMatches.length ? ` (${quickMatches.length})` : ""}
          </p>
          {quickMatches.length ? (
            <ul className="mt-2 space-y-2 text-sm">
              {quickMatches.map((agent) => (
                <li key={agent.id} className="flex items-center justify-between gap-3 rounded-lg bg-white/5 px-3 py-2">
                  <div>
                    <p className="font-semibold text-white">{agent.name}</p>
                    <p className="text-xs uppercase tracking-wide text-white/60">{agent.role}</p>
                  </div>
                  <Link
                    href={`${quickLinkPrefix.replace(/\/$/, "")}/${agent.id}`}
                    className="text-xs font-semibold uppercase tracking-wide text-indigo-200 hover:text-white"
                  >
                    Open ↗
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-white/60">No agents match “{trimmedQuery}”.</p>
          )}
        </div>
      ) : (
        <p className="mt-3 text-xs uppercase tracking-wide text-white/50">Type a name or role to filter the roster.</p>
      )}
    </div>
  );
}
