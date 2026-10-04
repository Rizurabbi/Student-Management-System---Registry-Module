import { cookies } from "next/headers";
import { handler, readJson } from "@/server/api";
import { db } from "@/server/db";
import { notFound } from "@/server/errors";
import { ROLE_COOKIE, STUDENT_COOKIE } from "@/server/session";
import { sessionSchema } from "@/lib/validators/session";

const cookieOpts = { httpOnly: true, sameSite: "lax" as const, path: "/", maxAge: 60 * 60 * 12 };

// Role toggle (auth is optional in the brief). Sets httpOnly cookies that the server checks on every request.
export const POST = handler(async (req) => {
  const body = sessionSchema.parse(await readJson(req));
  const jar = await cookies();
  if (body.role === "staff") {
    jar.set(ROLE_COOKIE, "staff", cookieOpts);
    jar.delete(STUDENT_COOKIE);
  } else {
    const exists = await db.student.findUnique({ where: { id: body.studentId }, select: { id: true } });
    if (!exists) throw notFound("Student not found");
    jar.set(ROLE_COOKIE, "student", cookieOpts);
    jar.set(STUDENT_COOKIE, body.studentId, cookieOpts);
  }
  return { ok: true, role: body.role };
});

export const DELETE = handler(async () => {
  const jar = await cookies();
  jar.delete(ROLE_COOKIE);
  jar.delete(STUDENT_COOKIE);
  return { ok: true };
});
