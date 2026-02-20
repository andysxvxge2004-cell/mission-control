import { prisma } from "@mission-control/db";

const DEFAULT_PLAYBOOKS = [
  {
    title: "Trading venue outage",
    scenario: "Primary brokerage API rejects orders or latency spikes beyond 5s, blocking live trades.",
    impactLevel: "Critical",
    owner: "Andy / Command",
    communicationTemplate:
      "TradeWise is experiencing a brokerage outage impacting order routing. We're in escalation with the venue and will update every 15 minutes.",
    steps: [
      "Confirm outage scope via health dashboard + redundant ping test.",
      "Flip Mission Control task statuses for affected engagements to 'Blocked'.",
      "Notify Andy + ops channel with latest telemetry and mitigation ETA.",
      "Engage backup brokerage runbook if downtime exceeds 20 minutes.",
      "Publish status template to customer communications channel once confirmed."
    ]
  },
  {
    title: "Mission Control UI degradation",
    scenario: "Operators cannot update tasks or latencies exceed 3s for mutations.",
    impactLevel: "High",
    owner: "Atlasbot",
    communicationTemplate:
      "Heads up: Mission Control updates are delayed due to elevated database latency. Working the issue now; expect fresh ETA in 10 minutes.",
    steps: [
      "Capture screenshot/recording of the issue and attach to current incident task.",
      "Check Prisma logs for slow queries; tail `pnpm dev` output for errors.",
      "Scale down noisy automation loops or pause batch jobs contributing load.",
      "Update ops Slack with impact description + mitigation plan.",
      "Log resolution steps and lessons learned back into the playbook task."
    ]
  },
  {
    title: "VIP account escalation",
    scenario: "High-value partner reports blocked onboarding or missing data feed.",
    impactLevel: "Medium",
    owner: "Customer Ops",
    communicationTemplate:
      "We received your escalation and are unblocking the data feed now. Expect the fix within 30 minutes; we'll confirm once validated.",
    steps: [
      "Tag the VIP task with HIGH priority and assign a dedicated operator.",
      "Audit recent deploys/files touched by the VIP workspace.",
      "Coordinate with data ingestion agent to replay the missing feed.",
      "Send the templated reassurance note with concrete ETA.",
      "Schedule a follow-up check-in 1 hour after closure." 
    ]
  }
];

export async function ensureEscalationPlaybooks() {
  await Promise.all(
    DEFAULT_PLAYBOOKS.map(async (playbook) => {
      const existing = await prisma.escalationPlaybook.findFirst({ where: { title: playbook.title } });
      if (existing) return;

      await prisma.escalationPlaybook.create({
        data: {
          title: playbook.title,
          scenario: playbook.scenario,
          impactLevel: playbook.impactLevel,
          owner: playbook.owner,
          communicationTemplate: playbook.communicationTemplate,
          steps: {
            create: playbook.steps.map((instruction, index) => ({
              position: index + 1,
              instruction
            }))
          }
        }
      });
    })
  );
}
