export const TASK_STATUSES = [
  { id: "TODO", label: "To Do" },
  { id: "DOING", label: "In Progress" },
  { id: "DONE", label: "Done" }
] as const;

export const TASK_PRIORITIES = [
  { id: "LOW", label: "Low" },
  { id: "MEDIUM", label: "Medium" },
  { id: "HIGH", label: "High" }
] as const;

export const TASK_PRIORITY_SLA_HOURS: Record<(typeof TASK_PRIORITIES)[number]["id"], number> = {
  HIGH: 12,
  MEDIUM: 48,
  LOW: 120
};

export type TaskStatus = (typeof TASK_STATUSES)[number]["id"];
export type TaskPriority = (typeof TASK_PRIORITIES)[number]["id"];
