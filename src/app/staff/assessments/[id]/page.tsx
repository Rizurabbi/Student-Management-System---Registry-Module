import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ClipboardCheck, Download, Pencil } from "lucide-react";
import { getAssessment } from "@/server/services/assessments";
import { listForAssessment } from "@/server/services/submissions";
import { ApiError } from "@/server/errors";
import { formatDateTime, timeLeft } from "@/lib/dates";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, Td, Th } from "@/components/ui/table";
import { buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { LateBadge, OpenBadge } from "@/components/assessments/late-badge";

export default async function AssessmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await getAssessment(id).catch((e) => {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  });
  if (!a) notFound();
  const { submissions, notSubmitted } = await listForAssessment(id);
  const isOpen = a.deadline.getTime() > Date.now();
  const lateCount = submissions.filter((s) => s.isLate).length;

  const gradeTone = { NOT_GRADED: "neutral", WITHHELD: "amber", PUBLISHED: "green" } as const;
  const gradeLabel = { NOT_GRADED: "Not graded", WITHHELD: "Withheld", PUBLISHED: "Published" } as const;

  return (
    <>
      <Link href="/staff/assessments" className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> All assessments
      </Link>
      <PageHeader
        title={a.title}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {a.module.code} · {a.module.name} · Deadline {formatDateTime(a.deadline)} ({timeLeft(a.deadline)}) <OpenBadge isOpen={isOpen} />
          </span>
        }
        actions={
          <>
            <Link href={`/staff/assessments/${a.id}/edit`} className={buttonClass("secondary")}>
              <Pencil className="h-4 w-4" /> Edit
            </Link>
            <Link href={`/staff/assessments/${a.id}/marksheet`} className={buttonClass("primary")}>
              <ClipboardCheck className="h-4 w-4" /> Open marksheet
            </Link>
          </>
        }
      />

      <Card>
        <CardHeader
          title={`Submissions (${submissions.length})`}
          description={lateCount ? `${lateCount} submitted after the deadline.` : "Everything so far was submitted on time."}
        />
        {submissions.length === 0 ? (
          <EmptyState title="No submissions yet" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Student</Th>
                <Th>Submitted</Th>
                <Th>Grade</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {submissions.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <Td>
                    <Link href={`/staff/students/${s.student.id}`} className="font-medium text-slate-900 hover:text-brand-600">
                      {s.student.fullName}
                    </Link>
                    <p className="font-mono text-xs text-slate-500">{s.student.studentNumber}</p>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <span>{formatDateTime(s.submittedAt)}</span>
                      {s.isLate && <LateBadge />}
                    </div>
                    <p className="text-xs text-slate-500">{s.originalName}</p>
                  </Td>
                  <Td>
                    <Badge tone={gradeTone[s.gradeState]}>{gradeLabel[s.gradeState]}</Badge>
                  </Td>
                  <Td className="text-right">
                    <a href={`/api/submissions/${s.id}/file`} className={buttonClass("ghost", "sm")}>
                      <Download className="h-3.5 w-3.5" /> Download
                    </a>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Card className="mt-6">
        <CardHeader
          title={`Not submitted yet (${notSubmitted.length})`}
          description={isOpen ? "Enrolled students who have not uploaded yet." : "The deadline has passed. These students can still submit once, flagged Late."}
        />
        {notSubmitted.length === 0 ? (
          <EmptyState title="Everyone has submitted" />
        ) : (
          <ul className="divide-y divide-slate-100">
            {notSubmitted.map((s) => (
              <li key={s.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <Link href={`/staff/students/${s.id}`} className="font-medium text-slate-800 hover:text-brand-600">
                  {s.fullName}
                </Link>
                <span className="font-mono text-xs text-slate-500">{s.studentNumber}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
