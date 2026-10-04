import { Prisma } from "@prisma/client";
import { db } from "@/server/db";
import { conflict, notFound } from "@/server/errors";
import { computeFeeState, type FeeState } from "@/lib/fees";
import { formatMoney } from "@/lib/money";

export type FeeSummary = FeeState & { dueDate: Date };

/** Sum of non-voided payments per student. Voided payments never count. */
export async function paidTotals(studentIds?: string[]): Promise<Map<string, number>> {
  const rows = await db.payment.groupBy({
    by: ["studentId"],
    where: { voidedAt: null, ...(studentIds ? { studentId: { in: studentIds } } : {}) },
    _sum: { amount: true },
  });
  return new Map(rows.map((r) => [r.studentId, r._sum.amount ?? 0]));
}

export function summarise(fee: { amount: number; dueDate: Date } | null, paid: number): FeeSummary | null {
  if (!fee) return null;
  return { ...computeFeeState({ feeAmount: fee.amount, dueDate: fee.dueDate, paidTotal: paid }), dueDate: fee.dueDate };
}

export async function getFeeSummary(studentId: string): Promise<FeeSummary | null> {
  const [fee, paid] = await Promise.all([
    db.studentFee.findUnique({ where: { studentId } }),
    paidTotals([studentId]),
  ]);
  return summarise(fee, paid.get(studentId) ?? 0);
}

export async function listPayments(studentId: string) {
  return db.payment.findMany({ where: { studentId }, orderBy: [{ paidAt: "desc" }, { createdAt: "desc" }] });
}

export async function setFee(studentId: string, input: { amount: number; dueDate: Date }) {
  const student = await db.student.findUnique({ where: { id: studentId }, select: { id: true } });
  if (!student) throw notFound("Student not found");
  const paid = (await paidTotals([studentId])).get(studentId) ?? 0;
  if (input.amount < paid) {
    throw conflict(`The fee cannot be lower than the ${formatMoney(paid)} already paid. Void a payment first if it was a mistake.`);
  }
  return db.studentFee.upsert({
    where: { studentId },
    create: { studentId, amount: input.amount, dueDate: input.dueDate },
    update: { amount: input.amount, dueDate: input.dueDate },
  });
}

export async function recordPayment(
  studentId: string,
  input: { amount: number; paidAt: Date; reference: string; note?: string },
  recordedBy: string,
) {
  try {
    // Serializable so two payments recorded at the same instant cannot both squeeze past the balance check.
    return await db.$transaction(
      async (tx) => {
        const student = await tx.student.findUnique({ where: { id: studentId }, select: { id: true } });
        if (!student) throw notFound("Student not found");
        const fee = await tx.studentFee.findUnique({ where: { studentId } });
        if (!fee) throw conflict("This student has no fee assigned yet. Assign a fee before recording payments.");
        const agg = await tx.payment.aggregate({ where: { studentId, voidedAt: null }, _sum: { amount: true } });
        const balance = fee.amount - (agg._sum.amount ?? 0);
        if (balance <= 0) throw conflict("This student has no outstanding balance.");
        if (input.amount > balance) {
          // Decision: overpayments are blocked, not stored as credit. Registry sees the exact
          // remaining balance and can correct the amount.
          throw conflict(`This payment is more than the outstanding balance of ${formatMoney(balance)}.`);
        }
        return tx.payment.create({
          data: { studentId, amount: input.amount, paidAt: input.paidAt, reference: input.reference, note: input.note || null, recordedBy },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2002") throw conflict(`Reference ${input.reference} has already been recorded.`);
      if (e.code === "P2034") throw conflict("Another payment was saved at the same moment. Please try again.");
    }
    throw e;
  }
}

/** Payments are never deleted. Voiding keeps the ledger honest and auditable. */
export async function voidPayment(paymentId: string, reason: string) {
  const p = await db.payment.findUnique({ where: { id: paymentId } });
  if (!p) throw notFound("Payment not found");
  if (p.voidedAt) throw conflict("This payment is already voided.");
  return db.payment.update({ where: { id: paymentId }, data: { voidedAt: new Date(), voidReason: reason } });
}

export type FeeFilter = "all" | "overdue" | "outstanding" | "paid" | "nofee";

export async function listFeeRows(opts: { filter?: FeeFilter; q?: string }) {
  const q = opts.q?.trim();
  const students = await db.student.findMany({
    where: q
      ? {
          OR: [
            { fullName: { contains: q, mode: "insensitive" } },
            { studentNumber: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: { fee: true, programme: { select: { code: true, name: true } } },
    orderBy: { fullName: "asc" },
  });
  const paid = await paidTotals(students.map((s) => s.id));
  const rows = students.map((s) => ({
    id: s.id,
    studentNumber: s.studentNumber,
    fullName: s.fullName,
    status: s.status,
    programme: s.programme,
    summary: summarise(s.fee, paid.get(s.id) ?? 0),
  }));
  const filter = opts.filter ?? "all";
  const filtered = rows.filter((r) => {
    if (filter === "all") return true;
    if (filter === "nofee") return !r.summary;
    if (!r.summary) return false;
    if (filter === "overdue") return r.summary.status === "OVERDUE";
    if (filter === "outstanding") return r.summary.balance > 0;
    return r.summary.status === "PAID";
  });
  // Overdue first (longest overdue on top), then the rest alphabetically.
  filtered.sort((a, b) => (b.summary?.daysOverdue ?? 0) - (a.summary?.daysOverdue ?? 0));
  return filtered;
}
