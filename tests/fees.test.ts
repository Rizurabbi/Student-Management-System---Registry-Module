import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { computeFeeState } from "@/lib/fees";
import { paymentSchema } from "@/lib/validators/payment";
import { getFeeSummary, recordPayment, setFee, voidPayment } from "@/server/services/fees";
import { makeFixture } from "./helpers";

const now = new Date("2026-06-15T12:00:00Z");
const day = 86_400_000;

describe("computeFeeState", () => {
  it("is PAID when nothing is left", () => {
    const s = computeFeeState({ feeAmount: 1000, dueDate: new Date(now.getTime() - 5 * day), paidTotal: 1000, now });
    expect(s).toMatchObject({ balance: 0, overdue: false, status: "PAID" });
  });
  it("is OUTSTANDING (not overdue) before the due date", () => {
    const s = computeFeeState({ feeAmount: 1000, dueDate: new Date(now.getTime() + 5 * day), paidTotal: 400, now });
    expect(s).toMatchObject({ balance: 600, overdue: false, status: "OUTSTANDING", daysOverdue: 0 });
  });
  it("is OVERDUE only when a balance remains AND the due date has passed", () => {
    const s = computeFeeState({ feeAmount: 1000, dueDate: new Date(now.getTime() - 10 * day), paidTotal: 400, now });
    expect(s).toMatchObject({ balance: 600, overdue: true, status: "OVERDUE", daysOverdue: 10 });
  });
  it("never reports a negative balance", () => {
    const s = computeFeeState({ feeAmount: 1000, dueDate: now, paidTotal: 1500, now });
    expect(s.balance).toBe(0);
  });
});

describe("payment validation", () => {
  const base = { paidAt: new Date(), reference: "ref-001" };
  it("rejects zero, negative and fractional-cent amounts", () => {
    expect(paymentSchema.safeParse({ ...base, amount: 0 }).success).toBe(false);
    expect(paymentSchema.safeParse({ ...base, amount: -500 }).success).toBe(false);
    expect(paymentSchema.safeParse({ ...base, amount: 10.5 }).success).toBe(false);
  });
  it("rejects a payment dated in the future", () => {
    expect(paymentSchema.safeParse({ ...base, amount: 100, paidAt: new Date(Date.now() + 5 * day) }).success).toBe(false);
  });
  it("normalises the reference to upper case", () => {
    const r = paymentSchema.parse({ ...base, amount: 100 });
    expect(r.reference).toBe("REF-001");
  });
});

describe("fees and payments (database)", () => {
  let fx: Awaited<ReturnType<typeof makeFixture>>;
  beforeAll(async () => {
    fx = await makeFixture();
  });
  afterAll(async () => {
    await fx.cleanup();
  });

  const pay = (amount: number, reference: string) =>
    recordPayment(fx.student.id, { amount, paidAt: new Date(), reference: `${reference}-${fx.tag}` }, "test");

  it("snapshots the programme fee when a student is created", async () => {
    const s = await getFeeSummary(fx.student.id);
    expect(s?.fee).toBe(100000);
    expect(s?.balance).toBe(100000);
  });

  it("updates the balance straight after a payment", async () => {
    await pay(30000, "P1");
    expect((await getFeeSummary(fx.student.id))?.balance).toBe(70000);
  });

  it("blocks a duplicate reference number", async () => {
    await expect(pay(1000, "P1")).rejects.toThrow(/already been recorded/);
  });

  it("blocks an overpayment and tells staff the remaining balance", async () => {
    await expect(pay(70001, "P2")).rejects.toThrow(/more than the outstanding balance/);
  });

  it("does not count voided payments, and refuses to void twice", async () => {
    const p = await pay(20000, "P3");
    expect((await getFeeSummary(fx.student.id))?.balance).toBe(50000);
    await voidPayment(p.id, "entered by mistake");
    expect((await getFeeSummary(fx.student.id))?.balance).toBe(70000);
    await expect(voidPayment(p.id, "again")).rejects.toThrow(/already voided/);
  });

  it("will not let the fee drop below what was already paid", async () => {
    await expect(setFee(fx.student.id, { amount: 10000, dueDate: new Date() })).rejects.toThrow(/cannot be lower/);
  });

  it("the database itself rejects a zero payment (CHECK constraint)", async () => {
    const { db } = await import("@/server/db");
    await expect(
      db.payment.create({ data: { studentId: fx.student.id, amount: 0, paidAt: new Date(), reference: `ZERO-${fx.tag}` } }),
    ).rejects.toThrow();
  });
});
