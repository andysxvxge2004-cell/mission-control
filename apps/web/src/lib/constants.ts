export const TASK_STATUSES = [
  { id: "TODO", label: "To Do" },
  { id: "DOING", label: "In Progress" },
  { id: "DONE", label: "Done" }
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number]["id"];
