import { handler, readJson } from "@/server/api";
import { requireStaff } from "@/server/session";
import { getAssessment, updateAssessment } from "@/server/services/assessments";
import { assessmentUpdateSchema } from "@/lib/validators/assessment";

export const GET = handler<{ id: string }>(async (_req, { params }) => {
  await requireStaff();
  return getAssessment(params.id);
});

export const PATCH = handler<{ id: string }>(async (req, { params }) => {
  await requireStaff();
  const input = assessmentUpdateSchema.parse(await readJson(req));
  return updateAssessment(params.id, input);
});
