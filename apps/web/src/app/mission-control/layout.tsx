import Link from "next/link";
import type { ReactNode } from "react";
import { MissionControlNav } from "@/components/mission-control/mission-nav";
import { MissionBreadcrumbs } from "@/components/mission-control/mission-breadcrumbs";
import { MissionKpiStrip } from "@/components/mission-control/mission-kpis";
import { MissionAlertsStrip } from "@/components/mission-control/mission-alerts";
import { ExecutiveSnapshotPanel } from "@/components/mission-control/executive-snapshot";
import { getMissionControlShellData } from "@/lib/mission-control/shell-data";

export const dynamic = "force-dynamic";

export default async function MissionControlLayout({ children }: { children: ReactNode }) {
  const referenceTime = new Date();
  const shellData = await getMissionControlShellData(referenceTime);

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 to-black p-6 shadow-2xl shadow-black/40">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-indigo-300">Mission Control</p>
              <h1 className="mt-2 text-3xl font-semibold">Internal AI office</h1>
              <p className="text-sm text-white/70">Staff, brief, and audit every specialist agent.</p>
            </div>
            <Link
              href="/"
              className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:border-indigo-300 hover:text-indigo-100"
            >
              TradeWise Dev Dashboard
            </Link>
          </div>
          <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_minmax(260px,320px)]">
            <div className="space-y-5">
              <MissionControlNav />
              <MissionBreadcrumbs />
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 shadow-inner shadow-black/20">
                <MissionKpiStrip counts={shellData.counts} />
              </div>
            </div>
            <ExecutiveSnapshotPanel snapshot={shellData.snapshot} />
          </div>
        </header>

        <main className="space-y-6">
          <MissionAlertsStrip alerts={shellData.alerts} referenceTime={referenceTime} />
          <div className="space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
