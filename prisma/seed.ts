/* Demo data. Run with: npm run db:seed  (safe to re-run, it wipes and reloads everything)
 *
 * Every student below exists to show ONE edge case.
 * See the "Demo guide" table in README.md. */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { intakeYear, nextStudentNumber } from "../src/server/services/student-id";

try {
  process.loadEnvFile(".env");
} catch {
  /* env already provided by the shell or by Prisma */
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const DAY = 86_400_000;
const now = Date.now();
const daysAgo = (n: number) => new Date(now - n * DAY);
const inDays = (n: number) => new Date(now + n * DAY);
const uploadDir = path.resolve(process.cwd(), process.env.UPLOAD_DIR || "./uploads");

function demoPdf(text: string): Uint8Array {
  const stream = `BT /F1 14 Tf 20 80 Td (${text.replace(/[()\\]/g, "")}) Tj ET`;
  const pdf = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 400 160]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj
4 0 obj<</Length ${stream.length}>>stream
${stream}
endstream endobj
5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
trailer<</Root 1 0 R>>
%%EOF`;
  return new TextEncoder().encode(pdf);
}

async function clearUploads() {
  await fs.mkdir(uploadDir, { recursive: true });
  for (const f of await fs.readdir(uploadDir)) {
    if (f !== ".gitkeep") await fs.unlink(path.join(uploadDir, f)).catch(() => undefined);
  }
}

async function main() {
  // ---- wipe (children first) ----
  await prisma.grade.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.studentFee.deleteMany();
  await prisma.student.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.module.deleteMany();
  await prisma.programme.deleteMany();
  await prisma.studentIdCounter.deleteMany();
  await clearUploads();

  // ---- programmes and modules (fees in cents) ----
  const cs = await prisma.programme.create({ data: { code: "BSC-CS", name: "BSc Computer Science", defaultFee: 450000 } });
  const bus = await prisma.programme.create({ data: { code: "BA-BUS", name: "BA Business Management", defaultFee: 380000 } });
  const cs101 = await prisma.module.create({ data: { code: "CS101", name: "Introduction to Programming", programmeId: cs.id } });
  const cs102 = await prisma.module.create({ data: { code: "CS102", name: "Database Systems", programmeId: cs.id } });
  const bus101 = await prisma.module.create({ data: { code: "BUS101", name: "Principles of Management", programmeId: bus.id } });
  const bus102 = await prisma.module.create({ data: { code: "BUS102", name: "Marketing Fundamentals", programmeId: bus.id } });

  // ---- students (IDs come from the same counter logic the app uses) ----
  type Status = "ENROLLED" | "DEFERRED" | "WITHDRAWN" | "COMPLETED";
  async function addStudent(s: { name: string; dob: string; programmeId: string; year: string; status: Status }) {
    return prisma.$transaction(async (tx) => {
      const studentNumber = await nextStudentNumber(tx, intakeYear(s.year));
      return tx.student.create({
        data: {
          studentNumber,
          fullName: s.name,
          email: s.name.toLowerCase().replace(/[^a-z]+/g, ".") + "@example.com",
          dateOfBirth: new Date(s.dob),
          programmeId: s.programmeId,
          academicYear: s.year,
          status: s.status,
        },
      });
    });
  }
  const amina = await addStudent({ name: "Amina Rahman", dob: "2003-04-12", programmeId: cs.id, year: "2025/26", status: "ENROLLED" });
  const tanvir = await addStudent({ name: "Tanvir Hossain", dob: "2002-11-03", programmeId: cs.id, year: "2025/26", status: "ENROLLED" });
  const nusrat = await addStudent({ name: "Nusrat Jahan", dob: "2003-07-21", programmeId: bus.id, year: "2025/26", status: "ENROLLED" });
  const farhan = await addStudent({ name: "Farhan Ahmed", dob: "2002-01-30", programmeId: cs.id, year: "2025/26", status: "ENROLLED" });
  const sadia = await addStudent({ name: "Sadia Islam", dob: "2003-09-15", programmeId: bus.id, year: "2025/26", status: "DEFERRED" });
  const rafiq = await addStudent({ name: "Rafiq Chowdhury", dob: "2001-06-08", programmeId: cs.id, year: "2025/26", status: "WITHDRAWN" });
  const zara = await addStudent({ name: "Zara Ali", dob: "2003-02-19", programmeId: cs.id, year: "2025/26", status: "ENROLLED" });
  const imran = await addStudent({ name: "Imran Sheikh", dob: "2002-12-25", programmeId: cs.id, year: "2025/26", status: "ENROLLED" });
  const maliha = await addStudent({ name: "Maliha Karim", dob: "2001-03-05", programmeId: bus.id, year: "2024/25", status: "COMPLETED" });

  // ---- fees: snapshot of programme price, each with its own due date ----
  const fee = (studentId: string, amount: number, dueDate: Date) => prisma.studentFee.create({ data: { studentId, amount, dueDate } });
  await fee(amina.id, 450000, daysAgo(10)); // fully paid
  await fee(tanvir.id, 450000, daysAgo(25)); // OVERDUE: partly paid, past due
  await fee(nusrat.id, 380000, daysAgo(5)); // fully paid
  await fee(farhan.id, 450000, inDays(15)); // balance owed, NOT overdue yet
  await fee(sadia.id, 380000, inDays(20)); // deferred, balance owed, not overdue
  await fee(rafiq.id, 450000, daysAgo(60)); // withdrawn but still owes: flagged overdue on purpose
  await fee(zara.id, 450000, inDays(5)); // nothing paid yet, due soon
  // imran: deliberately NO fee row, so the "no fee assigned" state is visible
  await fee(maliha.id, 380000, daysAgo(300)); // completed, fully paid

  // ---- payments (append-only ledger) ----
  const pay = (studentId: string, amount: number, paidAt: Date, reference: string, extra: { voided?: string } = {}) =>
    prisma.payment.create({
      data: {
        studentId,
        amount,
        paidAt,
        reference,
        recordedBy: "Registry",
        ...(extra.voided ? { voidedAt: daysAgo(35), voidReason: extra.voided } : {}),
      },
    });
  await pay(amina.id, 250000, daysAgo(45), "BANK-1001");
  await pay(amina.id, 200000, daysAgo(12), "BANK-1002");
  await pay(tanvir.id, 200000, daysAgo(40), "BANK-1003");
  await pay(tanvir.id, 100000, daysAgo(36), "BANK-1004", { voided: "Cheque bounced" }); // voided: not counted
  await pay(nusrat.id, 380000, daysAgo(20), "BANK-1005");
  await pay(farhan.id, 300000, daysAgo(18), "BANK-1006");
  await pay(sadia.id, 150000, daysAgo(50), "BANK-1007");
  await pay(rafiq.id, 100000, daysAgo(90), "BANK-1008");
  await pay(maliha.id, 380000, daysAgo(330), "BANK-0901");

  // ---- assessments ----
  const a1 = await prisma.assessment.create({ data: { title: "Programming Assignment 1", moduleId: cs101.id, deadline: daysAgo(20), createdBy: "Registry" } });
  const a2 = await prisma.assessment.create({ data: { title: "Database Design Report", moduleId: cs102.id, deadline: inDays(10), createdBy: "Registry" } });
  const a3 = await prisma.assessment.create({ data: { title: "Management Case Study", moduleId: bus101.id, deadline: daysAgo(15), createdBy: "Registry" } });
  const a4 = await prisma.assessment.create({ data: { title: "Marketing Plan", moduleId: bus102.id, deadline: daysAgo(40), createdBy: "Registry" } });

  // ---- submissions (real demo PDFs on disk so downloads work) ----
  async function submit(studentId: string, assessmentId: string, who: string, title: string, submittedAt: Date, deadline: Date) {
    const key = `${randomUUID()}.pdf`;
    const bytes = demoPdf(`${title} - ${who}`);
    await fs.writeFile(path.join(uploadDir, key), bytes);
    await prisma.submission.create({
      data: {
        studentId,
        assessmentId,
        filePath: key,
        originalName: `${who.toLowerCase().replace(/\s+/g, "-")}-${title.toLowerCase().replace(/\s+/g, "-")}.pdf`,
        mimeType: "application/pdf",
        sizeBytes: bytes.length,
        submittedAt,
        isLate: submittedAt.getTime() > deadline.getTime(),
      },
    });
  }
  await submit(amina.id, a1.id, "Amina Rahman", a1.title, daysAgo(22), a1.deadline); // on time
  await submit(tanvir.id, a1.id, "Tanvir Hossain", a1.title, daysAgo(21), a1.deadline); // on time, NOT graded yet
  await submit(farhan.id, a1.id, "Farhan Ahmed", a1.title, daysAgo(18), a1.deadline); // LATE
  await submit(zara.id, a1.id, "Zara Ali", a1.title, daysAgo(21), a1.deadline);
  await submit(amina.id, a2.id, "Amina Rahman", a2.title, daysAgo(1), a2.deadline); // open: can still resubmit
  await submit(nusrat.id, a3.id, "Nusrat Jahan", a3.title, daysAgo(16), a3.deadline);
  await submit(maliha.id, a3.id, "Maliha Karim", a3.title, daysAgo(16), a3.deadline);
  await submit(maliha.id, a4.id, "Maliha Karim", a4.title, daysAgo(41), a4.deadline);

  // ---- grades ----
  const grade = (studentId: string, assessmentId: string, score: number, published: boolean) =>
    prisma.grade.create({
      data: { studentId, assessmentId, score, published, publishedAt: published ? daysAgo(3) : null, gradedBy: "Registry" },
    });
  await grade(amina.id, a1.id, 78, true); // Distinction
  await grade(farhan.id, a1.id, 52, true); // Pass (late work still graded)
  await grade(zara.id, a1.id, 34, true); // Fail
  await grade(nusrat.id, a3.id, 64, false); // Merit, WITHHELD: student must not see it
  await grade(maliha.id, a3.id, 66, true); // Merit
  await grade(maliha.id, a4.id, 73, true); // Distinction

  console.log("Seeded: 2 programmes, 4 modules, 9 students, 4 assessments.");
  console.log("Edge cases: overdue (Tanvir, Rafiq), deferred (Sadia), withdrawn (Rafiq), late (Farhan),");
  console.log("withheld grade (Nusrat), ungraded work (Tanvir, Amina A2), no fee (Imran), completed (Maliha).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
