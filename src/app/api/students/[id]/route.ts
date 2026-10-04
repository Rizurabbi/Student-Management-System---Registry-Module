import { handler, readJson } from "@/server/api";
import { requireStaff } from "@/server/session";
import { getStudent, updateStudent } from "@/server/services/students";
import { updateStudentSchema } from "@/lib/validators/student";

export const GET = handler<{ id: string }>(async (_req, { params }) => {
  await requireStaff();
  return getStudent(params.id);
});

export const PATCH = handler<{ id: string }>(async (req, { params }) => {
  await requireStaff();
  const input = updateStudentSchema.parse(await readJson(req));
  return updateStudent(params.id, input);
});
