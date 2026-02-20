import { prisma } from "@mission-control/db";
import { AgentPerformanceRollup } from "@/components/agents/agent-performance-rollup";
import { EscalationPlaybookLibrary, type EscalationPlaybookView } from "@/components/escalation/escalation-playbook-library";
import { EscalationPlaybookForm } from "@/components/escalation/escalation-playbook-form";
import { TaskAgingAlerts } from "@/components/tasks/task-aging-alerts";
import { ensureEscalationPlaybooks } from "@/lib/escalation-playbooks";
import { getStaleCutoffDate } from "@/lib/task-metrics";

export const dynamic = "force-dynamic";

const IMPACT_ORDER: Record<string, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3
};

export default async function MissionControlIntelligencePage() {
  const now = new Date();
  const agingThreshold = getStaleCutoffDate(now.getTime());

  await ensureEscalationPlaybooks();

  const [agents, agingTasks, playbooks] = await Promise.all([
    prisma.agent.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        tasks: true,
        memories: { orderBy: { createdAt: "desc" }, take: 1 }
      }
    }),
    prisma.task.findMany({
      where: { status: "DOING", updatedAt: { lt: agingThreshold } },
      orderBy: { updatedAt: "asc" },
      include: { agent: { select: { id: true, name: true } } }
    }),
    prisma.escalationPlaybook.findMany({
      include: { steps: { orderBy: { position: "asc" } } }
    })
  ]);

  const playbookViews: EscalationPlaybookView[] = playbooks
    .map((playbook) => ({
      id: playbook.id,
      title: playbook.title,
      scenario: playbook.scenario,
      impactLevel: playbook.impactLevel,
      owner: playbook.owner,
      updatedAt: playbook.updatedAt.toISOString(),
      steps: playbook.steps.map((step) => step.instruction),
      communicationTemplate: playbook.communicationTemplate
    }))
    .sort((a, b) => {
      const impactDiff = (IMPACT_ORDER[a.impactLevel] ?? 99) - (IMPACT_ORDER[b.impactLevel] ?? 99);
      if (impactDiff !== 0) return impactDiff;
      return a.title.localeCompare(b.title);
    });

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-indigo-300">Mission Control</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Intelligence</h1>
        <p className="text-white/70">High-level signals about throughput, bottlenecks, operator load, and escalation paths.</p>
      </header>

      <AgentPerformanceRollup agents={agents} />

      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Stuck work summary</h2>
          <span className="text-xs uppercase tracking-wide text-white/50">48h+ in Doing</span>
        </div>
        <TaskAgingAlerts tasks={agingTasks} referenceTime={now} />
      </div>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <EscalationPlaybookLibrary playbooks={playbookViews} />
        <EscalationPlaybookForm />
      </section>
    </div>
  );
}
