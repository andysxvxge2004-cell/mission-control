"use server";

import { prisma } from "@mission-control/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ESCALATION_IMPACT_LEVELS } from "@/lib/escalation-playbooks";

const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  agentId: z.string().trim().min(1).optional(),
  status: z.enum(["TODO", "DOING", "DONE"]).default("TODO"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM")
});

const updateTaskSchema = z.object({
  taskId: z.string().min(1),
  status: z.enum(["TODO", "DOING", "DONE"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  agentId: z.preprocess(
    (value) => (typeof value === "string" && value.length === 0 ? undefined : value),
    z.string().trim().min(1).optional()
  )
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

const playbookSchema = z.object({
  title: z.string().min(1, "Title required"),
  scenario: z.string().min(1, "Scenario required"),
  impactLevel: z.enum(ESCALATION_IMPACT_LEVELS),
  owner: z.string().min(1, "Owner required"),
  steps: z.string().min(1, "Add at least one step"),
  communicationTemplate: z.string().optional()
});

const playbookIdSchema = z.object({
  playbookId: z.string().min(1)
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
    status: formData.get("status") ?? "TODO",
    priority: formData.get("priority") ?? "MEDIUM"
  });

  if (!result.success) {
    return { error: result.error.errors[0]?.message ?? "Invalid input" };
  }

  const { title, description, agentId, status, priority } = result.data;

  const task = await prisma.task.create({
    data: {
      title,
      description,
      status,
      priority,
      agentId: agentId || undefined
    }
  });

  await writeAuditLog("task.created", { taskId: task.id, status, priority });

  revalidateDash(agentId ?? null);

  return { success: true };
}

export async function updateTask(_: unknown, formData: FormData) {
  const result = updateTaskSchema.safeParse({
    taskId: formData.get("taskId"),
    status: formData.get("status"),
    priority: formData.get("priority"),
    agentId: formData.get("agentId") ?? undefined
  });

  if (!result.success) {
    return { error: result.error.errors[0]?.message ?? "Invalid input" };
  }

  const { taskId, status, priority, agentId } = result.data;

  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      status,
      priority,
      agentId: agentId ?? null
    }
  });

  await writeAuditLog("task.updated", { taskId, status, priority, agentId: agentId ?? null });

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
  await writeAuditLog("agent.needs_briefing", { agentId: agent.id, reason: "Agent created without memories" });

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

export async function createEscalationPlaybook(_: unknown, formData: FormData) {
  const result = playbookSchema.safeParse({
    title: formData.get("title"),
    scenario: formData.get("scenario"),
    impactLevel: formData.get("impactLevel"),
    owner: formData.get("owner"),
    steps: formData.get("steps"),
    communicationTemplate: formData.get("communicationTemplate") ?? undefined
  });

  if (!result.success) {
    return { error: result.error.errors[0]?.message ?? "Invalid input" };
  }

  const { title, scenario, impactLevel, owner, steps, communicationTemplate } = result.data;
  const parsedSteps = steps
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (!parsedSteps.length) {
    return { error: "Add at least one response step" };
  }

  const playbook = await prisma.escalationPlaybook.create({
    data: {
      title,
      scenario,
      impactLevel,
      owner,
      communicationTemplate: communicationTemplate?.trim() ? communicationTemplate.trim() : null,
      steps: {
        create: parsedSteps.map((instruction, index) => ({ position: index + 1, instruction }))
      }
    }
  });

  await writeAuditLog("playbook.created", { playbookId: playbook.id, impactLevel });
  revalidatePath("/mission-control/intelligence");

  return { success: true };
}

export async function deleteEscalationPlaybook(_: unknown, formData: FormData) {
  const result = playbookIdSchema.safeParse({ playbookId: formData.get("playbookId") });
  if (!result.success) {
    return { error: result.error.errors[0]?.message ?? "Invalid input" };
  }

  const { playbookId } = result.data;

  await prisma.escalationPlaybook.delete({ where: { id: playbookId } });
  await writeAuditLog("playbook.deleted", { playbookId });
  revalidatePath("/mission-control/intelligence");

  return { success: true };
}
