export function formatDateTime(date: Date | string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  });

  return formatter.format(typeof date === "string" ? new Date(date) : date);
}

const MINUTE_MS = 1000 * 60;
const HOUR_MS = MINUTE_MS * 60;
const DAY_MS = HOUR_MS * 24;

export function formatRelativeTime(date: Date | string, reference: Date = new Date()) {
  const target = typeof date === 'string' ? new Date(date) : date;
  const diffMs = reference.getTime() - target.getTime();
  if (diffMs <= 0) {
    return 'just now';
  }

  if (diffMs >= DAY_MS) {
    const days = Math.floor(diffMs / DAY_MS);
    const hours = Math.floor((diffMs % DAY_MS) / HOUR_MS);
    return hours > 0 ? `${days}d ${hours}h ago` : `${days}d ago`;
  }

  if (diffMs >= HOUR_MS) {
    const hours = Math.floor(diffMs / HOUR_MS);
    return `${hours}h ago`;
  }

  const minutes = Math.max(1, Math.floor(diffMs / MINUTE_MS));
  return `${minutes}m ago`;
}

