import { z } from "zod";

export const scoreSchema = z
  .number({ invalid_type_error: "Score must be a number" })
  .min(0, "Score cannot be below 0")
  .max(100, "Score cannot be above 100")
  .refine((n) => Math.abs(n * 100 - Math.round(n * 100)) < 1e-6, "Use at most 2 decimal places");

export const gradeEntrySchema = z.object({
  studentId: z.string().min(1),
  score: scoreSchema,
  feedback: z.string().trim().max(500).optional().nullable(),
});

export const gradesPutSchema = z.object({
  grades: z.array(gradeEntrySchema).min(1, "Nothing to save").max(500),
});

export const publishSchema = z.object({ published: z.boolean() });
