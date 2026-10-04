import { db } from "@/server/db";
import { badRequest, notFound } from "@/server/errors";

const moduleInclude = {
  module: { select: { id: true, code: true, name: true, programmeId: true, programme: { select: { code: true, name: true } } } },
} as const;

export async function listAssessments() {
  const now = new Date();
  const [rows, eligible, published] = await Promise.all([
    db.assessment.findMany({
      include: { ...moduleInclude, _count: { select: { submissions: true, grades: true } } },
      orderBy: { deadline: "desc" },
    }),
    db.student.groupBy({ by: ["programmeId"], where: { status: "ENROLLED" }, _count: { _all: true } }),
    db.grade.groupBy({ by: ["assessmentId"], where: { published: true }, _count: { _all: true } }),
  ]);
  const eligibleMap = new Map(eligible.map((e) => [e.programmeId, e._count._all]));
  const publishedMap = new Map(published.map((p) => [p.assessmentId, p._count._all]));
  return rows.map((a) => ({
    id: a.id,
    title: a.title,
    deadline: a.deadline,
    module: a.module,
    isOpen: a.deadline.getTime() > now.getTime(),
    submissions: a._count.submissions,
    eligible: eligibleMap.get(a.module.programmeId) ?? 0,
    graded: a._count.grades,
    published: publishedMap.get(a.id) ?? 0,
  }));
}

export async function getAssessment(id: string) {
  const a = await db.assessment.findUnique({ where: { id }, include: moduleInclude });
  if (!a) throw notFound("Assessment not found");
  return a;
}

export async function createAssessment(input: { title: string; moduleId: string; deadline: Date }, createdBy: string) {
  const mod = await db.module.findUnique({ where: { id: input.moduleId } });
  if (!mod) throw badRequest("That module does not exist");
  return db.assessment.create({ data: { ...input, createdBy } });
}

export async function updateAssessment(id: string, input: { title?: string; moduleId?: string; deadline?: Date }) {
  const existing = await db.assessment.findUnique({ where: { id }, include: { _count: { select: { submissions: true } } } });
  if (!existing) throw notFound("Assessment not found");
  if (input.moduleId && input.moduleId !== existing.moduleId && existing._count.submissions > 0) {
    throw badRequest("The module cannot be changed after students have submitted work.");
  }
  const updated = await db.assessment.update({ where: { id }, data: input });
  // If staff move the deadline, the Late flag is re-evaluated against the new deadline so the
  // flag never disagrees with what the page shows.
  if (input.deadline) {
    await db.$transaction([
      db.submission.updateMany({ where: { assessmentId: id, submittedAt: { gt: input.deadline } }, data: { isLate: true } }),
      db.submission.updateMany({ where: { assessmentId: id, submittedAt: { lte: input.deadline } }, data: { isLate: false } }),
    ]);
  }
  return updated;
}

/** Everything a student sees on their assessments list. No grade data here on purpose. */
export async function listAssessmentsForStudent(studentId: string) {
  const student = await db.student.findUnique({ where: { id: studentId }, select: { programmeId: true } });
  if (!student) throw notFound("Student not found");
  const now = Date.now();
  const rows = await db.assessment.findMany({
    where: { module: { programmeId: student.programmeId } },
    include: {
      module: { select: { code: true, name: true } },
      submissions: { where: { studentId }, select: { id: true, isLate: true, submittedAt: true, originalName: true } },
    },
  });
  const mapped = rows.map((a) => ({
    id: a.id,
    title: a.title,
    deadline: a.deadline,
    module: a.module,
    isOpen: a.deadline.getTime() > now,
    submission: a.submissions[0] ?? null,
  }));
  // Open work first (soonest deadline on top), then closed work (most recent first).
  return mapped.sort((a, b) => {
    if (a.isOpen !== b.isOpen) return a.isOpen ? -1 : 1;
    return a.isOpen ? a.deadline.getTime() - b.deadline.getTime() : b.deadline.getTime() - a.deadline.getTime();
  });
}
