import type { Prisma } from "@prisma/client";

// Student ID format: SMS-<intake year>-<4 digit sequence>, e.g. SMS-2025-0001.
// The sequence comes from a per-year counter row that is incremented INSIDE the same
// transaction that creates the student. Postgres locks that row until commit, so two
// admins creating students at the same moment can never receive the same number,
// and a failed create rolls the counter back (no gaps from errors).

export function formatStudentNumber(year: number, seq: number): string {
  return `SMS-${year}-${String(seq).padStart(4, "0")}`;
}

/** "2025/26" -> 2025 */
export function intakeYear(academicYear: string): number {
  return parseInt(academicYear.slice(0, 4), 10);
}

export async function nextStudentNumber(tx: Prisma.TransactionClient, year: number): Promise<string> {
  const counter = await tx.studentIdCounter.upsert({
    where: { year },
    create: { year, lastSeq: 1 },
    update: { lastSeq: { increment: 1 } },
  });
  return formatStudentNumber(year, counter.lastSeq);
}
