import { NextResponse } from "next/server";
import { handler, readJson } from "@/server/api";
import { requireAny, requireStaff } from "@/server/session";
import { forbidden } from "@/server/errors";
import { listPayments, recordPayment } from "@/server/services/fees";
import { paymentSchema } from "@/lib/validators/payment";

export const GET = handler<{ id: string }>(async (_req, { params }) => {
  const session = await requireAny();
  // A student may only read their own ledger.
  if (session.role === "student" && session.studentId !== params.id) throw forbidden();
  return listPayments(params.id);
});

export const POST = handler<{ id: string }>(async (req, { params }) => {
  await requireStaff();
  const input = paymentSchema.parse(await readJson(req));
  const payment = await recordPayment(params.id, input, "Registry");
  return NextResponse.json(payment, { status: 201 });
});
