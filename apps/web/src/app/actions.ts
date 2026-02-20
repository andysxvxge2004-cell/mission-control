"use server";

import { prisma } from "@mission-control/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  agentId: z.string().trim().min(1).optional(),
  status: z.enum(["TODO", "DOING", "DONE"]).default("TODO")
});

const updateTaskSchema = z.object({
  taskId: z.string().min(1),
  status: z.enum(["TODO", "DOING", "DONE"])
});

const agentSchema = z.object({
  name: z.string().min(1, "Name required"),
  role: z.string().min(1, "Role required"),
  soul: z.string().min(1, "Soul required")
});

const memorySchema = z.object({
  agentId: z.string().min(1),
  content: z.string().min(1, "Content required")
});

async function writeAuditLog(action: string, metadata: Record<string, unknown>) {
  await prisma.auditLog.create({
    data: {
      action,
      metadata: JSON.stringify(metadata)
    }
  });
}

function revalidateDash(agentId?: string | null) {
  ["/", "/mission-control"].forEach((path) => revalidatePath(path));
  if (agentId) {
    [
      `/mission-control/agents/${agentId}`,
      `/mission-control/agents/${agentId}/files`
    ].forEach((path) => revalidatePath(path));
  }
}

export async function createTask(_: unknown, formData: FormData) {
  const result = taskSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? undefined,
    agentId: formData.get("agentId") ?? undefined,
    status: formData.get("status") ?? "TODO"
  });

  if (!result.success) {
    return { error: result.error.errors[0]?.message ?? "Invalid input" };
  }

  const { title, description, agentId, status } = result.data;

  const task = await prisma.task.create({
    data: {
      title,
      description,
      status,
      agentId: agentId || undefined
    }
  });

  await writeAuditLog("task.created", { taskId: task.id, status });

  revalidateDash(agentId ?? null);

  return { success: true };
}

export async function updateTaskStatus(_: unknown, formData: FormData) {
  const result = updateTaskSchema.safeParse({
    taskId: formData.get("taskId"),
    status: formData.get("status")
  });

  if (!result.success) {
    return { error: result.error.errors[0]?.message ?? "Invalid input" };
  }

  const { taskId, status } = result.data;

  const task = await prisma.task.update({
    where: { id: taskId },
    data: { status }
  });

  await writeAuditLog("task.status_updated", { taskId, status });

  revalidateDash(task.agentId);

  return { success: true };
}

export async function createAgent(_: unknown, formData: FormData) {
  const result = agentSchema.safeParse({
    name: formData.get("name"),
    role: formData.get("role"),
    soul: formData.get("soul")
  });

  if (!result.success) {
    return { error: result.error.errors[0]?.message ?? "Invalid input" };
  }

  const agent = await prisma.agent.create({ data: result.data });

  await writeAuditLog("agent.created", { agentId: agent.id });

  revalidateDash(agent.id);

  return { success: true };
}

export async function addMemory(_: unknown, formData: FormData) {
  const result = memorySchema.safeParse({
    agentId: formData.get("agentId"),
    content: formData.get("content")
  });

  if (!result.success) {
    return { error: result.error.errors[0]?.message ?? "Invalid input" };
  }

  const memory = await prisma.recentMemory.create({ data: result.data });

  await writeAuditLog("memory.created", { agentId: memory.agentId, memoryId: memory.id });

  revalidateDash(memory.agentId);

  return { success: true };
}
