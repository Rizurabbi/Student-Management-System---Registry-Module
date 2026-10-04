import { notFound } from "next/navigation";
import { getStudent, listProgrammes } from "@/server/services/students";
import { PageHeader } from "@/components/shared/page-header";
import { StudentForm } from "@/components/students/student-form";
import { ApiError } from "@/server/errors";

export default async function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const student = await getStudent(id).catch((e) => {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  });
  if (!student) notFound();
  const programmes = await listProgrammes();
  const locked = student.payments.length + student.submissions.length + student.grades.length > 0;
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={`Edit ${student.fullName}`} description={student.studentNumber} />
      <StudentForm
        programmes={programmes.map((p) => ({ id: p.id, code: p.code, name: p.name, defaultFee: p.defaultFee }))}
        initial={{
          id: student.id,
          fullName: student.fullName,
          email: student.email,
          dateOfBirth: student.dateOfBirth.toISOString().slice(0, 10),
          programmeId: student.programmeId,
          academicYear: student.academicYear,
          status: student.status,
          locked,
        }}
      />
    </div>
  );
}
