import { randomUUID } from "node:crypto";
import { db } from "@/server/db";
import { createStudent } from "@/server/services/students";

// Integration-test fixture: a throwaway programme, module, student and assessment.
// Everything is deleted afterwards, so the demo data in your dev database is never touched.

export async function makeFixture() {
  const tag = randomUUID().slice(0, 8);
  const programme = await db.programme.create({ data: { code: `T-${tag}`, name: `Test ${tag}`, defaultFee: 100000 } });
  const module = await db.module.create({ data: { code: `TM-${tag}`, name: "Test module", programmeId: programme.id } });
  const student = await createStudent({
    fullName: "Test Student",
    email: `test-${tag}@example.com`,
    dateOfBirth: new Date("2002-01-01"),
    programmeId: programme.id,
    academicYear: "2098/99", // far-future intake year so test IDs never collide with real ones
    status: "ENROLLED",
  });
  const assessment = await db.assessment.create({
    data: { title: "Test assessment", moduleId: module.id, deadline: new Date(Date.now() + 86_400_000) },
  });
  async function cleanup() {
    await db.grade.deleteMany({ where: { studentId: student.id } });
    await db.submission.deleteMany({ where: { studentId: student.id } });
    await db.payment.deleteMany({ where: { studentId: student.id } });
    await db.student.delete({ where: { id: student.id } });
    await db.assessment.deleteMany({ where: { moduleId: module.id } });
    await db.module.delete({ where: { id: module.id } });
    await db.programme.delete({ where: { id: programme.id } });
  }
  return { tag, programme, module, student, assessment, cleanup };
}
