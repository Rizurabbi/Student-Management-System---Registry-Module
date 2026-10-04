import { Prisma } from "@prisma/client";
import { db } from "@/server/db";
import { badRequest, conflict, notFound } from "@/server/errors";
import { addDays } from "@/lib/dates";
import { DEFAULT_FEE_DUE_DAYS, PAGE_SIZE } from "@/lib/constants";
import type { CreateStudentInput, UpdateStudentInput } from "@/lib/validators/student";
import { intakeYear, nextStudentNumber } from "./student-id";
import { paidTotals, summarise } from "./fees";

type ListQuery = { q?: string; programmeId?: string; status?: "ENROLLED" | "DEFERRED" | "WITHDRAWN" | "COMPLETED"; page?: number };

export async function listStudents(query: ListQuery) {
  const page = query.page ?? 1;
  const q = query.q?.trim();
  const where: Prisma.StudentWhereInput = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.programmeId ? { programmeId: query.programmeId } : {}),
    ...(q
      ? {
          OR: [
            { fullName: { contains: q, mode: "insensitive" } },
            { studentNumber: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const [total, students] = await Promise.all([
    db.student.count({ where }),
    db.student.findMany({
      where,
      include: { programme: { select: { id: true, code: true, name: true } }, fee: true },
      orderBy: [{ fullName: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);
  const paid = await paidTotals(students.map((s) => s.id));
  const items = students.map((s) => {
    const { fee, ...rest } = s;
    return { ...rest, feeSummary: summarise(fee, paid.get(s.id) ?? 0) };
  });
  return { items, total, page, pageSize: PAGE_SIZE, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function getStudent(id: string) {
  const student = await db.student.findUnique({
    where: { id },
    include: {
      programme: true,
      fee: true,
      payments: { orderBy: [{ paidAt: "desc" }, { createdAt: "desc" }] },
      submissions: {
        include: { assessment: { include: { module: { select: { code: true, name: true } } } } },
        orderBy: { submittedAt: "desc" },
      },
      grades: {
        include: { assessment: { include: { module: { select: { code: true, name: true } } } } },
        orderBy: { updatedAt: "desc" },
      },
    },
  });
  if (!student) throw notFound("Student not found");
  const paid = student.payments.filter((p) => !p.voidedAt).reduce((s, p) => s + p.amount, 0);
  return { ...student, feeSummary: summarise(student.fee, paid) };
}

export async function createStudent(input: CreateStudentInput) {
  const programme = await db.programme.findUnique({ where: { id: input.programmeId } });
  if (!programme) throw badRequest("That programme does not exist");
  const year = intakeYear(input.academicYear);
  try {
    return await db.$transaction(async (tx) => {
      const studentNumber = await nextStudentNumber(tx, year);
      return tx.student.create({
        data: {
          studentNumber,
          fullName: input.fullName,
          email: input.email,
          dateOfBirth: input.dateOfBirth,
          programmeId: input.programmeId,
          academicYear: input.academicYear,
          status: input.status,
          // Fee is snapshotted from the programme price at this moment.
          fee: {
            create: {
              amount: programme.defaultFee,
              dueDate: input.feeDueDate ?? addDays(new Date(), DEFAULT_FEE_DUE_DAYS),
            },
          },
        },
      });
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw conflict("A student with this email already exists.");
    }
    throw e;
  }
}

export async function updateStudent(id: string, input: UpdateStudentInput) {
  const existing = await db.student.findUnique({ where: { id }, include: { fee: true } });
  if (!existing) throw notFound("Student not found");

  let repriceTo: number | null = null;
  if (input.programmeId && input.programmeId !== existing.programmeId) {
    // Decision: changing programme is only allowed while the student has no money, work or
    // grades attached. After that it needs a manual adjustment, so history is never rewritten silently.
    const [payments, submissions, grades] = await Promise.all([
      db.payment.count({ where: { studentId: id } }),
      db.submission.count({ where: { studentId: id } }),
      db.grade.count({ where: { studentId: id } }),
    ]);
    if (payments + submissions + grades > 0) {
      throw conflict("The programme cannot be changed once a student has payments, submissions or grades.");
    }
    const programme = await db.programme.findUnique({ where: { id: input.programmeId } });
    if (!programme) throw badRequest("That programme does not exist");
    repriceTo = programme.defaultFee;
  }

  try {
    return await db.student.update({
      where: { id },
      data: {
        ...input,
        ...(repriceTo !== null && existing.fee ? { fee: { update: { amount: repriceTo } } } : {}),
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw conflict("Another student already uses this email.");
    }
    throw e;
  }
}

export async function listProgrammes() {
  return db.programme.findMany({
    orderBy: { name: "asc" },
    include: { modules: { orderBy: { code: "asc" } } },
  });
}

/** Minimal student info for the student portal. Deliberately loads NO grades. */
export async function getStudentBasic(id: string) {
  return db.student.findUnique({
    where: { id },
    select: { id: true, fullName: true, studentNumber: true, status: true, programme: { select: { code: true, name: true } } },
  });
}
