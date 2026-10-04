import { z } from "zod";

export const sessionSchema = z.discriminatedUnion("role", [
  z.object({ role: z.literal("staff") }),
  z.object({ role: z.literal("student"), studentId: z.string().min(1) }),
]);
