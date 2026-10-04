import { afterAll, describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { formatStudentNumber, intakeYear, nextStudentNumber } from "@/server/services/student-id";

describe("student id format", () => {
  it("pads the sequence to four digits", () => {
    expect(formatStudentNumber(2025, 1)).toBe("SMS-2025-0001");
    expect(formatStudentNumber(2025, 123)).toBe("SMS-2025-0123");
  });
  it("uses the intake year of the academic year", () => {
    expect(intakeYear("2025/26")).toBe(2025);
  });
});

describe("student id generation (database)", () => {
  afterAll(async () => {
    await db.studentIdCounter.deleteMany({ where: { year: 2097 } });
  });

  it("never hands out the same number twice, even under concurrent creates", async () => {
    await db.studentIdCounter.deleteMany({ where: { year: 2097 } });
    const ids = await Promise.all(
      Array.from({ length: 12 }, () => db.$transaction((tx) => nextStudentNumber(tx, 2097))),
    );
    expect(new Set(ids).size).toBe(12);
    expect(ids.map((i) => Number(i.slice(-4))).sort((a, b) => a - b)).toEqual(Array.from({ length: 12 }, (_, i) => i + 1));
  });

  it("rolls the counter back when the surrounding transaction fails", async () => {
    await db.studentIdCounter.deleteMany({ where: { year: 2097 } });
    await db
      .$transaction(async (tx) => {
        await nextStudentNumber(tx, 2097);
        throw new Error("boom");
      })
      .catch(() => undefined);
    const next = await db.$transaction((tx) => nextStudentNumber(tx, 2097));
    expect(next).toBe("SMS-2097-0001");
  });
});
