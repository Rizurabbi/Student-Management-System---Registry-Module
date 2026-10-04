import { NextResponse } from "next/server";
import { handler, readJson } from "@/server/api";
import { requireAny, requireStaff } from "@/server/session";
import { createAssessment, listAssessments, listAssessmentsForStudent } from "@/server/services/assessments";
import { assessmentSchema } from "@/lib/validators/assessment";

export const GET = handler(async () => {
  const session = await requireAny();
  return session.role === "staff" ? listAssessments() : listAssessmentsForStudent(session.studentId);
});

export const POST = handler(async (req) => {
  await requireStaff();
  const input = assessmentSchema.parse(await readJson(req));
  const a = await createAssessment(input, "Registry");
  return NextResponse.json(a, { status: 201 });
});
