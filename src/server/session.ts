import { cookies } from "next/headers";
import { forbidden, unauthorized } from "./errors";

// Auth is optional in the brief, so the "session" is a simple role toggle stored
// in httpOnly cookies. The important part: every API route and service call checks it
// on the SERVER. Hiding a button in the UI is never treated as access control.

export const ROLE_COOKIE = "sms_role";
export const STUDENT_COOKIE = "sms_student";

export type Session = { role: "staff" } | { role: "student"; studentId: string } | null;

export async function getSession(): Promise<Session> {
  const jar = await cookies();
  const role = jar.get(ROLE_COOKIE)?.value;
  if (role === "staff") return { role: "staff" };
  const studentId = jar.get(STUDENT_COOKIE)?.value;
  if (role === "student" && studentId) return { role: "student", studentId };
  return null;
}

export async function requireStaff() {
  const s = await getSession();
  if (!s) throw unauthorized();
  if (s.role !== "staff") throw forbidden("Staff only");
  return s;
}

export async function requireStudent() {
  const s = await getSession();
  if (!s) throw unauthorized();
  if (s.role !== "student") throw forbidden("Students only");
  return s;
}

export async function requireAny() {
  const s = await getSession();
  if (!s) throw unauthorized();
  return s;
}
