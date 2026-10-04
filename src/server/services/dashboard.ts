import { db } from "@/server/db";
import { paidTotals, summarise } from "./fees";

export async function getDashboard() {
  const now = new Date();
  const [statusGroups, fees, paid, lateSubs, withheld, upcoming, recentPayments, ungradedRows] = await Promise.all([
    db.student.groupBy({ by: ["status"], _count: { _all: true } }),
    db.studentFee.findMany({ include: { student: { select: { id: true, fullName: true, studentNumber: true, status: true } } } }),
    paidTotals(),
    db.submission.count({ where: { isLate: true } }),
    db.grade.count({ where: { published: false } }),
    db.assessment.findMany({
      where: { deadline: { gte: now } },
      orderBy: { deadline: "asc" },
      take: 5,
      include: { module: { select: { code: true, name: true } } },
    }),
    db.payment.findMany({
      where: { voidedAt: null },
      orderBy: [{ paidAt: "desc" }, { createdAt: "desc" }],
      take: 5,
      include: { student: { select: { id: true, fullName: true, studentNumber: true } } },
    }),
    // Submissions that have no grade row yet for the same student + assessment.
    db.$queryRaw<{ count: number }[]>`
      SELECT COUNT(*)::int AS count FROM "Submission" s
      WHERE NOT EXISTS (
        SELECT 1 FROM "Grade" g WHERE g."studentId" = s."studentId" AND g."assessmentId" = s."assessmentId"
      )`,
  ]);

  const statusCounts = { ENROLLED: 0, DEFERRED: 0, WITHDRAWN: 0, COMPLETED: 0 } as Record<string, number>;
  for (const g of statusGroups) statusCounts[g.status] = g._count._all;

  let totalFee = 0;
  let totalPaid = 0;
  const overdue = [];
  for (const f of fees) {
    const s = summarise(f, paid.get(f.studentId) ?? 0)!;
    totalFee += s.fee;
    totalPaid += s.paid;
    if (s.status === "OVERDUE") overdue.push({ student: f.student, balance: s.balance, daysOverdue: s.daysOverdue, dueDate: f.dueDate });
  }
  overdue.sort((a, b) => b.daysOverdue - a.daysOverdue);

  return {
    totalStudents: statusGroups.reduce((n, g) => n + g._count._all, 0),
    statusCounts,
    money: {
      totalFee,
      totalPaid,
      outstanding: totalFee - totalPaid,
      collectionRate: totalFee ? Math.round((totalPaid / totalFee) * 100) : 0,
    },
    overdueCount: overdue.length,
    overdue: overdue.slice(0, 8),
    lateSubmissions: lateSubs,
    withheldResults: withheld,
    ungradedSubmissions: ungradedRows[0]?.count ?? 0,
    upcomingDeadlines: upcoming,
    recentPayments,
  };
}
