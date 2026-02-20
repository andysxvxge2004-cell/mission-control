"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/mission-control" },
  { label: "Agents", href: "/mission-control/agents" },
  { label: "Tasks", href: "/mission-control/tasks" },
  { label: "Intelligence", href: "/mission-control/intelligence" },
  { label: "Files", href: "/mission-control/files" }
];

export function MissionControlNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-3 border-b border-white/10 pb-4 text-sm text-white/70">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-full px-4 py-1.5 transition ${
              active ? "bg-white/15 text-white" : "hover:bg-white/5 hover:text-white"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
