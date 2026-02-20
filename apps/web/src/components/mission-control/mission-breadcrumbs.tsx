"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LABEL_MAP: Record<string, string> = {
  "mission-control": "Mission Control",
  agents: "Agents",
  tasks: "Tasks",
  intelligence: "Intelligence"
};

export function MissionBreadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  const breadcrumbs = segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join("/")}`;
    const label = LABEL_MAP[segment] ?? segment;
    const isLast = index === segments.length - 1;
    return { href, label, isLast };
  });

  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-white/50">
      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.href} className="flex items-center gap-2">
          {crumb.isLast ? (
            <span className="text-white">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="text-white/70 transition hover:text-white">
              {crumb.label}
            </Link>
          )}
          {index < breadcrumbs.length - 1 ? <span className="text-white/30">/</span> : null}
        </div>
      ))}
    </div>
  );
}
