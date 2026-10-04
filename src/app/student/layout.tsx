import { redirect } from "next/navigation";
import { getSession } from "@/server/session";
import { getStudentBasic } from "@/server/services/students";
import { AppShell } from "@/components/layout/app-shell";
import type { NavItem } from "@/components/layout/sidebar";

export const dynamic = "force-dynamic";

const NAV: NavItem[] = [
  { href: "/student", label: "Overview", icon: "overview", exact: true },
  { href: "/student/assessments", label: "Assessments", icon: "assessments" },
  { href: "/student/fees", label: "Fees", icon: "fees" },
  { href: "/student/results", label: "Results", icon: "results" },
];

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (session?.role !== "student") redirect("/");
  const student = await getStudentBasic(session.studentId);
  if (!student) redirect("/");
  return (
    <AppShell items={NAV} roleLabel="Student" userLabel={`${student.fullName} (${student.studentNumber})`}>
      {children}
    </AppShell>
  );
}
