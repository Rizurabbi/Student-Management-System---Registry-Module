import { notFound } from "next/navigation";
import { getAssessment } from "@/server/services/assessments";
import { listProgrammes } from "@/server/services/students";
import { db } from "@/server/db";
import { ApiError } from "@/server/errors";
import { PageHeader } from "@/components/shared/page-header";
import { AssessmentForm } from "@/components/assessments/assessment-form";

export default async function EditAssessmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await getAssessment(id).catch((e) => {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  });
  if (!a) notFound();
  const [programmes, submissions] = await Promise.all([listProgrammes(), db.submission.count({ where: { assessmentId: id } })]);
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Edit assessment" description={a.title} />
      <AssessmentForm
        programmes={programmes.map((p) => ({ id: p.id, name: p.name, modules: p.modules.map((m) => ({ id: m.id, code: m.code, name: m.name })) }))}
        initial={{ id: a.id, title: a.title, moduleId: a.moduleId, deadline: a.deadline.toISOString(), moduleLocked: submissions > 0 }}
      />
    </div>
  );
}
