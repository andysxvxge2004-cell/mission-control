import { prisma } from "@mission-control/db";

const CORE_AGENTS = [
  {
    name: "Sentry",
    role: "Open Web Scout",
    soul:
      "Hyper-vigilant reconnaissance agent tasked with scanning public web channels, news feeds, and technical releases for anything that affects TradeWise or Mission Control."
  }
];

export async function ensureCoreAgents() {
  await Promise.all(
    CORE_AGENTS.map(async (agent) => {
      const existing = await prisma.agent.findFirst({ where: { name: agent.name } });
      if (!existing) {
        await prisma.agent.create({ data: agent });
      }
    })
  );
}
