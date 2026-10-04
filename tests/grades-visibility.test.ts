import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { getPublishedResultsForStudent, setPublished, upsertGrades, bulkSetPublished } from "@/server/services/grades";
import { gradesPutSchema } from "@/lib/validators/grade";
import { makeFixture } from "./helpers";

describe("results visibility (database)", () => {
  let fx: Awaited<ReturnType<typeof makeFixture>>;
  beforeAll(async () => {
    fx = await makeFixture();
  });
  afterAll(async () => {
    await fx.cleanup();
  });

  it("never returns an unpublished grade to a student", async () => {
    await upsertGrades(fx.assessment.id, [{ studentId: fx.student.id, score: 64 }], "test");
    const { results } = await getPublishedResultsForStudent(fx.student.id);
    expect(results).toHaveLength(0);
  });

  it("returns the grade, with its classification, once published", async () => {
    const g = await db.grade.findFirstOrThrow({ where: { studentId: fx.student.id } });
    await setPublished(g.id, true);
    const { results, average } = await getPublishedResultsForStudent(fx.student.id);
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ score: 64, classification: "MERIT" });
    expect(average).toBe(64);
  });

  it("does not leak internal fields such as gradedBy", async () => {
    const { results } = await getPublishedResultsForStudent(fx.student.id);
    expect(Object.keys(results[0])).not.toContain("gradedBy");
  });

  it("pulls a published grade back to withheld when staff change the score", async () => {
    const res = await upsertGrades(fx.assessment.id, [{ studentId: fx.student.id, score: 72 }], "test");
    expect(res.unpublished).toBe(1);
    expect((await getPublishedResultsForStudent(fx.student.id)).results).toHaveLength(0);
  });

  it("keeps a grade published when only the feedback changes", async () => {
    await bulkSetPublished(fx.assessment.id, true);
    const res = await upsertGrades(fx.assessment.id, [{ studentId: fx.student.id, score: 72, feedback: "Nice work" }], "test");
    expect(res.unpublished).toBe(0);
    expect((await getPublishedResultsForStudent(fx.student.id)).results).toHaveLength(1);
  });

  it("can withhold everything for an assessment again", async () => {
    await bulkSetPublished(fx.assessment.id, false);
    expect((await getPublishedResultsForStudent(fx.student.id)).results).toHaveLength(0);
  });
});

describe("grade validation", () => {
  const entry = (score: number) => gradesPutSchema.safeParse({ grades: [{ studentId: "x", score }] }).success;
  it("accepts 0 to 100 and rejects everything else", () => {
    expect(entry(0)).toBe(true);
    expect(entry(100)).toBe(true);
    expect(entry(72.5)).toBe(true);
    expect(entry(-1)).toBe(false);
    expect(entry(100.01)).toBe(false);
    expect(entry(55.555)).toBe(false);
  });
  it("the database rejects an out of range score too (CHECK constraint)", async () => {
    const fx = await makeFixture();
    try {
      await expect(
        db.grade.create({ data: { studentId: fx.student.id, assessmentId: fx.assessment.id, score: 101 } }),
      ).rejects.toThrow();
    } finally {
      await fx.cleanup();
    }
  });
});
