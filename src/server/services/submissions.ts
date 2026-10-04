import path from "node:path";
import { Prisma } from "@prisma/client";
import { db } from "@/server/db";
import { badRequest, conflict, forbidden, notFound } from "@/server/errors";
import type { Session } from "@/server/session";
import { readFile, removeFile, saveFile } from "@/server/storage";
import { decideSubmission, validateUpload } from "@/lib/submission-rules";
import { STATUS_LABEL } from "@/lib/constants";

function cleanName(name: string) {
  // eslint-disable-next-line no-control-regex
  return path.basename(name).replace(/[\u0000-\u001f]/g, "").slice(0, 120) || "submission";
}

export async function submitWork(input: { assessmentId: string; studentId: string; file: File }) {
  const student = await db.student.findUnique({ where: { id: input.studentId } });
  if (!student) throw notFound("Student not found");
  if (student.status !== "ENROLLED") {
    throw forbidden(`Students with status "${STATUS_LABEL[student.status]}" cannot submit work.`);
  }
  const assessment = await db.assessment.findUnique({ where: { id: input.assessmentId }, include: { module: true } });
  if (!assessment) throw notFound("Assessment not found");
  if (assessment.module.programmeId !== student.programmeId) {
    throw forbidden("This assessment is not part of your programme.");
  }

  const bytes = new Uint8Array(await input.file.arrayBuffer());
  const check = validateUpload({ name: input.file.name, size: input.file.size, bytes });
  if (!check.ok) throw badRequest(check.reason);

  const key = { studentId_assessmentId: { studentId: input.studentId, assessmentId: input.assessmentId } };
  const existing = await db.submission.findUnique({ where: key });
  const now = new Date(); // server clock decides lateness, never the browser
  const decision = decideSubmission({ now, deadline: assessment.deadline, hasExisting: !!existing });
  if (!decision.ok) throw conflict(decision.reason);

  const storedKey = await saveFile(bytes, check.ext);
  const data = {
    filePath: storedKey,
    originalName: cleanName(input.file.name),
    mimeType: check.mime,
    sizeBytes: input.file.size,
    submittedAt: now,
    isLate: decision.isLate,
  };
  try {
    const row = existing
      ? await db.submission.update({ where: { id: existing.id }, data })
      : await db.submission.create({ data: { ...data, studentId: input.studentId, assessmentId: input.assessmentId } });
    if (existing) await removeFile(existing.filePath);
    return row;
  } catch (e) {
    await removeFile(storedKey); // never leave orphan files behind
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw conflict("You already have a submission for this assessment. Refresh and try again.");
    }
    throw e;
  }
}

export async function listForAssessment(assessmentId: string) {
  const assessment = await db.assessment.findUnique({ where: { id: assessmentId }, include: { module: true } });
  if (!assessment) throw notFound("Assessment not found");
  const [submissions, eligible, grades] = await Promise.all([
    db.submission.findMany({
      where: { assessmentId },
      include: { student: { select: { id: true, fullName: true, studentNumber: true } } },
      orderBy: { submittedAt: "asc" },
    }),
    db.student.findMany({
      where: { programmeId: assessment.module.programmeId, status: "ENROLLED" },
      select: { id: true, fullName: true, studentNumber: true },
      orderBy: { fullName: "asc" },
    }),
    db.grade.findMany({ where: { assessmentId }, select: { studentId: true, published: true } }),
  ]);
  const gradeMap = new Map(grades.map((g) => [g.studentId, g.published]));
  const submitted = new Set(submissions.map((s) => s.studentId));
  return {
    submissions: submissions.map((s) => ({
      ...s,
      gradeState: gradeMap.has(s.studentId) ? (gradeMap.get(s.studentId) ? ("PUBLISHED" as const) : ("WITHHELD" as const)) : ("NOT_GRADED" as const),
    })),
    notSubmitted: eligible.filter((s) => !submitted.has(s.id)),
  };
}

/** Staff can download anything. A student can only download their own file. */
export async function getDownload(submissionId: string, session: NonNullable<Session>) {
  const sub = await db.submission.findUnique({ where: { id: submissionId } });
  if (!sub) throw notFound("Submission not found");
  if (session.role === "student" && sub.studentId !== session.studentId) throw forbidden();
  const bytes = await readFile(sub.filePath).catch(() => {
    throw notFound("The file is missing from storage");
  });
  return { bytes, name: sub.originalName, mime: sub.mimeType };
}
