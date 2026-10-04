import { z } from "zod";

export const paymentSchema = z.object({
  // Amount arrives in minor units (cents). The UI converts from "12.50".
  amount: z.number().int("Amount must be a whole number of cents").positive("Amount must be greater than zero"),
  paidAt: z.coerce
    .date()
    .refine((d) => d.getTime() <= Date.now() + 60_000, "Payment date cannot be in the future"),
  reference: z
    .string()
    .trim()
    .min(3, "Reference must be at least 3 characters")
    .max(60)
    .transform((s) => s.toUpperCase()),
  note: z.string().trim().max(300).optional(),
});

export const voidPaymentSchema = z.object({
  reason: z.string().trim().min(3, "Give a short reason for voiding").max(300),
});

export const feeSchema = z.object({
  amount: z.number().int().min(0, "Fee cannot be negative"),
  dueDate: z.coerce.date(),
});
