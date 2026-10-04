import { z } from "zod";
import { MAX_STUDENT_AGE, MIN_STUDENT_AGE } from "../constants";

export const statusEnum = z.enum(["ENROLLED", "DEFERRED", "WITHDRAWN", "COMPLETED"]);

const dobSchema = z.coerce
  .date({ invalid_type_error: "Enter a valid date of birth" })
  .refine((d) => d.getTime() <= Date.now(), "Date of birth cannot be in the future")
  .refine((d) => {
    const age = (Date.now() - d.getTime()) / (365.25 * 86_400_000);
    return age >= MIN_STUDENT_AGE && age <= MAX_STUDENT_AGE;
  }, `Student must be between ${MIN_STUDENT_AGE} and ${MAX_STUDENT_AGE} years old`);

export const studentBase = z.object({
  fullName: z.string().trim().min(2, "Full name is required").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  dateOfBirth: dobSchema,
  programmeId: z.string().min(1, "Choose a programme"),
  academicYear: z.string().trim().regex(/^\d{4}\/\d{2}$/, "Use the format 2025/26"),
  status: statusEnum.default("ENROLLED"),
});

export const createStudentSchema = studentBase.extend({
  // Optional: when the assigned programme fee falls due. Defaults to 30 days from now.
  feeDueDate: z.coerce.date().optional(),
});

export const updateStudentSchema = studentBase.partial();

export const studentQuerySchema = z.object({
  q: z.string().trim().optional(),
  programmeId: z.string().optional(),
  status: statusEnum.optional(),
  page: z.coerce.number().int().min(1).default(1),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
