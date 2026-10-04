import { redirect } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { db } from "@/server/db";
import { getSession } from "@/server/session";
import { getStudentBasic } from "@/server/services/students";
import { RolePicker } from "@/components/layout/role-picker";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getSession();
  if (session?.role === "staff") redirect("/staff");
  // Only auto-redirect a student if that student still exists (avoids a redirect loop with a stale cookie).
  if (session?.role === "student" && (await getStudentBasic(session.studentId))) redirect("/student");

  const students = await db.student.findMany({
    orderBy: { fullName: "asc" },
    take: 100,
    select: { id: true, fullName: true, studentNumber: true, status: true, programme: { select: { code: true } } },
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4 py-12">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 inline-flex rounded-xl bg-brand-600 p-3 text-white shadow-sm">
          <GraduationCap className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Student Management System</h1>
        <p className="mt-1 text-sm text-slate-500">Registry module. Choose a role to continue.</p>
      </div>
      <RolePicker students={students.map((s) => ({ ...s, programme: s.programme.code }))} />
      <p className="mt-6 text-center text-xs text-slate-400">
        Demo role toggle, no password. Permissions are still enforced on the server for every request.
      </p>
    </main>
  );
}
