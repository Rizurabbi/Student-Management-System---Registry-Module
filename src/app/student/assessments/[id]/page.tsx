import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import { getSession } from "@/server/session";
import { getStudentBasic } from "@/server/services/students";
import { listAssessmentsForStudent } from "@/server/services/assessments";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { LateBadge, OpenBadge } from "@/components/assessments/late-badge";
import { UploadForm } from "@/components/assessments/upload-form";
import { formatDateTime, timeLeft } from "@/lib/dates";

export default async function StudentAssessmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (session?.role !== "student") redirect("/");
  const [student, list] = await Promise.all([getStudentBasic(session.studentId), listAssessmentsForStudent(session.studentId)]);
  // Only assessments from the student's own programme are in this list, so anything else is a 404.
  const a = list.find((x) => x.id === id);
  if (!student || !a) notFound();

  const canSubmit = student.status === "ENROLLED";
  const resubmitBlocked = !!a.submission && !a.isOpen;

  return (
    <>
      <Link href="/student/assessments" className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> All assessments
      </Link>
      <PageHeader
        title={a.title}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {a.module.code} · {a.module.name} <OpenBadge isOpen={a.isOpen} />
          </span>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title={a.submission ? (a.isOpen ? "Replace your submission" : "Submission") : "Submit your work"}
            description={a.isOpen ? "You can replace your file as many times as you like until the deadline." : "The deadline has passed."}
          />
          <CardBody>
            {!canSubmit ? (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                Only enrolled students can submit work. Contact the Registry about your status.
              </p>
            ) : resubmitBlocked ? (
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                Your submission is locked now that the deadline has passed.
              </p>
            ) : (
              <UploadForm assessmentId={a.id} hasSubmission={!!a.submission} isOpen={a.isOpen} />
            )}
          </CardBody>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader title="Deadline" />
            <CardBody>
              <p className="text-sm font-medium">{formatDateTime(a.deadline)}</p>
              <p className="mt-1 text-sm text-slate-500">{timeLeft(a.deadline)}</p>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Your submission" />
            <CardBody className="space-y-3">
              {a.submission ? (
                <>
                  <div className="flex items-center gap-2">
                    <Badge tone="green">Submitted</Badge>
                    {a.submission.isLate && <LateBadge />}
                  </div>
                  <p className="break-all text-sm text-slate-700">{a.submission.originalName}</p>
                  <p className="text-xs text-slate-500">{formatDateTime(a.submission.submittedAt)}</p>
                  <a href={`/api/submissions/${a.submission.id}/file`} className={buttonClass("secondary", "sm")}>
                    <Download className="h-3.5 w-3.5" /> Download
                  </a>
                </>
              ) : (
                <Badge tone={a.isOpen ? "amber" : "red"}>{a.isOpen ? "Not submitted yet" : "Missed"}</Badge>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
