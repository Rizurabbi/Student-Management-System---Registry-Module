"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenCheck, ClipboardList, GraduationCap, LayoutDashboard, Users, Wallet, Award, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Icons are passed by name from the server layout (functions cannot cross the server/client boundary).
const ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  students: Users,
  fees: Wallet,
  assessments: ClipboardList,
  results: Award,
  overview: LayoutDashboard,
};

export type NavItem = { href: string; label: string; icon: keyof typeof ICONS; exact?: boolean };

export function Sidebar({ items, roleLabel, userLabel }: { items: NavItem[]; roleLabel: string; userLabel: string }) {
  const pathname = usePathname();
  const active = (i: NavItem) => (i.exact ? pathname === i.href : pathname === i.href || pathname.startsWith(i.href + "/"));

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-slate-100 px-5">
          <div className="rounded-lg bg-brand-600 p-1.5 text-white">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold">SMS Registry</p>
            <p className="text-xs text-slate-500">{roleLabel}</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {items.map((i) => {
            const Icon = ICONS[i.icon] ?? BookOpenCheck;
            return (
              <Link
                key={i.href}
                href={i.href}
                aria-current={active(i) ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active(i) ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                )}
              >
                <Icon className="h-4 w-4" />
                {i.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-100 p-4">
          <p className="truncate text-sm font-medium text-slate-800">{userLabel}</p>
          <p className="text-xs text-slate-500">{roleLabel}</p>
        </div>
      </aside>

      {/* Mobile: compact top nav */}
      <div className="sticky top-0 z-30 border-b border-slate-200 bg-white md:hidden">
        <div className="flex items-center gap-2 px-4 py-3">
          <div className="rounded-md bg-brand-600 p-1 text-white">
            <GraduationCap className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold">SMS Registry</span>
          <span className="ml-auto text-xs text-slate-500">{roleLabel}</span>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-2">
          {items.map((i) => (
            <Link
              key={i.href}
              href={i.href}
              className={cn(
                "whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium",
                active(i) ? "bg-brand-50 text-brand-700" : "text-slate-600",
              )}
            >
              {i.label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
