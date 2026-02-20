export function formatDateTime(date: Date | string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  });

  return formatter.format(typeof date === "string" ? new Date(date) : date);
}
