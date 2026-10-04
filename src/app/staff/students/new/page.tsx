import { listProgrammes } from "@/server/services/students";
import { PageHeader } from "@/components/shared/page-header";
import { StudentForm } from "@/components/students/student-form";
import { EmptyState } from "@/components/shared/empty-state";

export default async function NewStudentPage() {
  const programmes = await listProgrammes();
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="New student" description="A unique Student ID and the programme fee are assigned automatically." />
      {programmes.length === 0 ? (
        <EmptyState title="No programmes exist yet" description="Run the seed script or add a programme first." />
      ) : (
        <StudentForm programmes={programmes.map((p) => ({ id: p.id, code: p.code, name: p.name, defaultFee: p.defaultFee }))} />
      )}
    </div>
  );
}
