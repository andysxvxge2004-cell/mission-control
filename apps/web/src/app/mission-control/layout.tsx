import Link from "next/link";
import type { ReactNode } from "react";
import { MissionControlNav } from "@/components/mission-control/mission-nav";
import { MissionBreadcrumbs } from "@/components/mission-control/mission-breadcrumbs";
import { MissionKpiStrip } from "@/components/mission-control/mission-kpis";
import { MissionAlertsStrip } from "@/components/mission-control/mission-alerts";
import { getMissionControlShellData } from "@/lib/mission-control/shell-data";

export const dynamic = "force-dynamic";

export default async function MissionControlLayout({ children }: { children: ReactNode }) {
  const referenceTime = new Date();
  const shellData = await getMissionControlShellData(referenceTime);

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 to-black p-6 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-indigo-300">Mission Control</p>
              <h1 className="mt-2 text-3xl font-semibold">Internal AI office</h1>
              <p className="text-sm text-white/70">Staff, brief, and audit every specialist agent.</p>
            </div>
            <Link
              href="/"
              className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:border-indigo-300"
            >
              TradeWise Dev Dashboard
            </Link>
          </div>
          <div className="mt-4 space-y-4">
            <MissionControlNav />
            <MissionBreadcrumbs />
            <MissionKpiStrip counts={shellData.counts} />
          </div>
        </header>

        <MissionAlertsStrip alerts={shellData.alerts} referenceTime={referenceTime} />

        <main>{children}</main>
      </div>
    </div>
  );
}
