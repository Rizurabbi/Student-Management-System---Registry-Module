import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getMarksheet } from "@/server/services/grades";
import { ApiError } from "@/server/errors";
import { formatDateTime } from "@/lib/dates";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { GradeGrid } from "@/components/marksheet/grade-grid";

export default async function MarksheetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sheet = await getMarksheet(id).catch((e) => {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  });
  if (!sheet) notFound();

  const rows = sheet.rows.map((r) => ({
    student: r.student,
    submission: r.submission ? { isLate: r.submission.isLate, submittedAt: r.submission.submittedAt.toISOString() } : null,
    grade: r.grade ? { id: r.grade.id, score: r.grade.score, published: r.grade.published, feedback: r.grade.feedback } : null,
  }));
  // Changes whenever a grade changes on the server, so the grid remounts with fresh values after every save.
  const version = sheet.rows.map((r) => `${r.grade?.updatedAt ?? "-"}:${r.grade?.published ? 1 : 0}`).join("|");

  return (
    <>
      <Link href={`/staff/assessments/${id}`} className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Back to assessment
      </Link>
      <PageHeader
        title={`Marksheet: ${sheet.assessment.title}`}
        description={`${sheet.assessment.module.code} · Deadline ${formatDateTime(sheet.assessment.deadline)}. Grades stay hidden from students until you publish them.`}
      />
      <Card>
        {rows.length === 0 ? (
          <EmptyState title="No students in this programme yet" />
        ) : (
          <GradeGrid key={version} assessmentId={id} rows={rows} />
        )}
      </Card>
      <p className="mt-3 text-xs text-slate-500">
        Pass is 40 and above, Merit is 60 and above, Distinction is 70 and above. Changing the score of a published grade withholds it again until you republish.
      </p>
    </>
  );
}
