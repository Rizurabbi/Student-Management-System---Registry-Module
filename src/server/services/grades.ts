import { db } from "@/server/db";
import { badRequest, notFound } from "@/server/errors";
import { classify } from "@/lib/classification";
import { getAssessment } from "./assessments";

export async function getMarksheet(assessmentId: string) {
  const assessment = await getAssessment(assessmentId);
  const students = await db.student.findMany({
    where: {
      programmeId: assessment.module.programmeId,
      OR: [
        { status: { in: ["ENROLLED", "COMPLETED"] } },
        { submissions: { some: { assessmentId } } },
        { grades: { some: { assessmentId } } },
      ],
    },
    orderBy: { fullName: "asc" },
    select: {
      id: true,
      fullName: true,
      studentNumber: true,
      status: true,
      submissions: { where: { assessmentId }, select: { id: true, isLate: true, submittedAt: true } },
      grades: { where: { assessmentId } },
    },
  });
  const rows = students.map((s) => {
    const g = s.grades[0];
    return {
      student: { id: s.id, fullName: s.fullName, studentNumber: s.studentNumber, status: s.status },
      submission: s.submissions[0] ?? null,
      grade: g
        ? { id: g.id, score: Number(g.score), published: g.published, feedback: g.feedback, updatedAt: g.updatedAt.toISOString() }
        : null,
    };
  });
  return { assessment, rows };
}

export async function upsertGrades(
  assessmentId: string,
  entries: { studentId: string; score: number; feedback?: string | null }[],
  gradedBy: string,
) {
  const assessment = await getAssessment(assessmentId);
  const ids = [...new Set(entries.map((e) => e.studentId))];
  const valid = await db.student.count({ where: { id: { in: ids }, programmeId: assessment.module.programmeId } });
  if (valid !== ids.length) throw badRequest("Some students are not part of this assessment's programme.");

  const existing = await db.grade.findMany({ where: { assessmentId, studentId: { in: ids } } });
  const existingMap = new Map(existing.map((g) => [g.studentId, g]));
  let unpublished = 0;

  const ops = entries.map((e) => {
    const ex = existingMap.get(e.studentId);
    // Decision: changing the score of an already-published grade pulls it back to "withheld",
    // so a student can never see a number that staff changed without re-reviewing it.
    const pullBack = !!ex && ex.published && Number(ex.score) !== e.score;
    if (pullBack) unpublished++;
    return db.grade.upsert({
      where: { studentId_assessmentId: { studentId: e.studentId, assessmentId } },
      create: { studentId: e.studentId, assessmentId, score: e.score, feedback: e.feedback ?? null, gradedBy },
      update: {
        score: e.score,
        feedback: e.feedback ?? null,
        gradedBy,
        ...(pullBack ? { published: false, publishedAt: null } : {}),
      },
    });
  });
  await db.$transaction(ops);
  return { saved: entries.length, unpublished };
}

export async function setPublished(gradeId: string, published: boolean) {
  const g = await db.grade.findUnique({ where: { id: gradeId } });
  if (!g) throw notFound("Grade not found");
  return db.grade.update({ where: { id: gradeId }, data: { published, publishedAt: published ? new Date() : null } });
}

export async function bulkSetPublished(assessmentId: string, published: boolean) {
  await getAssessment(assessmentId);
  const res = await db.grade.updateMany({
    where: { assessmentId, published: !published },
    data: { published, publishedAt: published ? new Date() : null },
  });
  return { changed: res.count };
}

/**
 * THE ONLY place a student's grades are read.
 * `published: true` is part of the database query itself, and `select` leaves out internal
 * fields like gradedBy. An unpublished grade never leaves the database for a student,
 * even if a page or route is later written carelessly.
 */
export async function getPublishedResultsForStudent(studentId: string) {
  const rows = await db.grade.findMany({
    where: { studentId, published: true },
    select: {
      score: true,
      feedback: true,
      publishedAt: true,
      assessment: { select: { id: true, title: true, module: { select: { code: true, name: true } } } },
    },
    orderBy: { publishedAt: "desc" },
  });
  const results = rows.map((r) => {
    const score = Number(r.score);
    return { ...r, score, classification: classify(score) };
  });
  const average = results.length ? results.reduce((s, r) => s + r.score, 0) / results.length : null;
  return { results, average };
}
