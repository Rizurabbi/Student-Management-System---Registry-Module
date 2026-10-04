import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { getSession } from "@/server/session";
import { getStudentBasic } from "@/server/services/students";
import { getFeeSummary } from "@/server/services/fees";
import { listAssessmentsForStudent } from "@/server/services/assessments";
import { getPublishedResultsForStudent } from "@/server/services/grades";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/students/status-badge";
import { ClassificationBadge } from "@/components/marksheet/classification-badge";
import { formatDate, timeLeft } from "@/lib/dates";
import { formatMoney } from "@/lib/money";

export default async function StudentHome() {
  const session = await getSession();
  if (session?.role !== "student") redirect("/");
  const [student, fee, assessments, published] = await Promise.all([
    getStudentBasic(session.studentId),
    getFeeSummary(session.studentId),
    listAssessmentsForStudent(session.studentId),
    getPublishedResultsForStudent(session.studentId),
  ]);
  if (!student) redirect("/");
  const open = assessments.filter((a) => a.isOpen);

  return (
    <>
      <PageHeader
        title={`Hello, ${student.fullName.split(" ")[0]}`}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {student.programme.name} <StatusBadge status={student.status} />
          </span>
        }
      />

      {fee?.overdue && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            You have an overdue balance of <strong>{formatMoney(fee.balance)}</strong>. It was due on {formatDate(fee.dueDate)}. Please contact the Registry.
          </p>
        </div>
      )}
      {student.status !== "ENROLLED" && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Your status is not Enrolled, so you cannot submit new work. Contact the Registry if this is a mistake.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Outstanding balance"
          value={fee ? formatMoney(fee.balance) : "n/a"}
          sub={fee ? `Due ${formatDate(fee.dueDate)}` : "No fee assigned yet"}
          href="/student/fees"
          tone={fee?.overdue ? "danger" : "default"}
        />
        <StatCard label="Open assessments" value={open.length} sub="Accepting submissions now" href="/student/assessments" />
        <StatCard
          label="Published results"
          value={published.results.length}
          sub={published.average !== null ? `Average ${published.average.toFixed(1)}` : "Nothing published yet"}
          href="/student/results"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Open assessments" />
          {open.length === 0 ? (
            <EmptyState title="Nothing due right now" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {open.map((a) => (
                <li key={a.id}>
                  <Link href={`/student/assessments/${a.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
                    <span className="flex-1">
                      <span className="block text-sm font-medium text-slate-800">{a.title}</span>
                      <span className="block text-xs text-slate-500">
                        {a.module.code} · {timeLeft(a.deadline)}
                      </span>
                    </span>
                    {a.submission ? <Badge tone="green">Submitted</Badge> : <Badge tone="amber">Not submitted</Badge>}
                    <ChevronRight className="h-4 w-4 text-slate-300" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <CardHeader title="Latest results" />
          {published.results.length === 0 ? (
            <EmptyState title="No results published yet" description="Results appear here once the Registry publishes them." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {published.results.slice(0, 4).map((r) => (
                <li key={r.assessment.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="flex-1">
                    <span className="block text-sm font-medium text-slate-800">{r.assessment.title}</span>
                    <span className="block text-xs text-slate-500">{r.assessment.module.code}</span>
                  </span>
                  <span className="text-sm font-semibold tabular-nums">{r.score}</span>
                  <ClassificationBadge value={r.classification} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
