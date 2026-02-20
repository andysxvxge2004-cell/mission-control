import { TASK_PRIORITY_SLA_HOURS, type TaskPriority } from "@/lib/constants";

export const STALE_THRESHOLD_MS = 1000 * 60 * 60 * 48; // 48 hours

export function getStaleCutoffDate(reference: number = Date.now()): Date {
  return new Date(reference - STALE_THRESHOLD_MS);
}

export type SlaState = "OK" | "WARNING" | "BREACH";

export interface TaskSlaMeta {
  state: SlaState;
  hoursOverdue: number;
  hoursRemaining: number;
  thresholdHours: number;
}

export function evaluateTaskSla(
  priority: TaskPriority | string | null | undefined,
  status: string,
  createdAt: Date | string,
  reference: Date = new Date()
): TaskSlaMeta {
  const normalizedPriority = normalizePriority(priority);
  const thresholdHours = TASK_PRIORITY_SLA_HOURS[normalizedPriority];
  if (status === "DONE") {
    return { state: "OK", hoursOverdue: 0, hoursRemaining: 0, thresholdHours };
  }

  const created = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  const elapsedHours = (reference.getTime() - created.getTime()) / (1000 * 60 * 60);
  const remaining = Math.max(0, thresholdHours - elapsedHours);
  if (elapsedHours >= thresholdHours) {
    return { state: "BREACH", hoursOverdue: elapsedHours - thresholdHours, hoursRemaining: 0, thresholdHours };
  }
  if (elapsedHours >= thresholdHours * 0.75) {
    return { state: "WARNING", hoursOverdue: 0, hoursRemaining: remaining, thresholdHours };
  }
  return { state: "OK", hoursOverdue: 0, hoursRemaining: remaining, thresholdHours };
}

function normalizePriority(priority: TaskPriority | string | null | undefined): TaskPriority {
  if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
    return priority;
  }
  return "MEDIUM";
}
