import { z } from "zod";

export const assessmentSchema = z.object({
  title: z.string().trim().min(3, "Title is required").max(150),
  moduleId: z.string().min(1, "Choose a module"),
  deadline: z.coerce.date({ invalid_type_error: "Enter a valid deadline" }),
});

export const assessmentUpdateSchema = assessmentSchema.partial();
