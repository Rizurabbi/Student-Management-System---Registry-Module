import { redirect } from "next/navigation";
import { getSession } from "@/server/session";
import { AppShell } from "@/components/layout/app-shell";
import type { NavItem } from "@/components/layout/sidebar";

export const dynamic = "force-dynamic";

const NAV: NavItem[] = [
  { href: "/staff", label: "Dashboard", icon: "dashboard", exact: true },
  { href: "/staff/students", label: "Students", icon: "students" },
  { href: "/staff/fees", label: "Fees & payments", icon: "fees" },
  { href: "/staff/assessments", label: "Assessments", icon: "assessments" },
];

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (session?.role !== "staff") redirect("/");
  return (
    <AppShell items={NAV} roleLabel="Registry staff" userLabel="Registry team">
      {children}
    </AppShell>
  );
}
