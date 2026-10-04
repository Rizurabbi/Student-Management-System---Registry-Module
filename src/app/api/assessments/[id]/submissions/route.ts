import { NextResponse } from "next/server";
import { handler } from "@/server/api";
import { badRequest } from "@/server/errors";
import { requireStaff, requireStudent } from "@/server/session";
import { listForAssessment, submitWork } from "@/server/services/submissions";

export const GET = handler<{ id: string }>(async (_req, { params }) => {
  await requireStaff();
  return listForAssessment(params.id);
});

// Student upload. Multipart form with a single "file" field. The student is taken from the
// server-side session, never from the request body, so nobody can submit as someone else.
export const POST = handler<{ id: string }>(async (req, { params }) => {
  const session = await requireStudent();
  const form = await req.formData().catch(() => {
    throw badRequest("Send the file as multipart form data");
  });
  const file = form.get("file");
  if (!(file instanceof File)) throw badRequest("Choose a file to upload");
  const row = await submitWork({ assessmentId: params.id, studentId: session.studentId, file });
  return NextResponse.json({ id: row.id, isLate: row.isLate, submittedAt: row.submittedAt }, { status: 201 });
});
