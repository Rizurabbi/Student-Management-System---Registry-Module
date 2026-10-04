import { listProgrammes } from "@/server/services/students";
import { PageHeader } from "@/components/shared/page-header";
import { AssessmentForm } from "@/components/assessments/assessment-form";

export default async function NewAssessmentPage() {
  const programmes = await listProgrammes();
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="New assessment" description="Students in the module's programme will see it straight away." />
      <AssessmentForm programmes={programmes.map((p) => ({ id: p.id, name: p.name, modules: p.modules.map((m) => ({ id: m.id, code: m.code, name: m.name })) }))} />
    </div>
  );
}
