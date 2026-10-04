import { NextResponse } from "next/server";
import { handler, readJson } from "@/server/api";
import { requireStaff } from "@/server/session";
import { createStudent, listStudents } from "@/server/services/students";
import { createStudentSchema, studentQuerySchema } from "@/lib/validators/student";

export const GET = handler(async (req) => {
  await requireStaff();
  const query = studentQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams));
  return listStudents(query);
});

export const POST = handler(async (req) => {
  await requireStaff();
  const input = createStudentSchema.parse(await readJson(req));
  const student = await createStudent(input);
  return NextResponse.json(student, { status: 201 });
});
