import { handler, readJson } from "@/server/api";
import { requireStaff } from "@/server/session";
import { getMarksheet, upsertGrades } from "@/server/services/grades";
import { gradesPutSchema } from "@/lib/validators/grade";

export const GET = handler<{ id: string }>(async (_req, { params }) => {
  await requireStaff();
  return getMarksheet(params.id);
});

export const PUT = handler<{ id: string }>(async (req, { params }) => {
  await requireStaff();
  const { grades } = gradesPutSchema.parse(await readJson(req));
  return upsertGrades(params.id, grades, "Registry");
});
