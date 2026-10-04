import { handler, readJson } from "@/server/api";
import { requireStaff } from "@/server/session";
import { voidPayment } from "@/server/services/fees";
import { voidPaymentSchema } from "@/lib/validators/payment";

export const POST = handler<{ id: string }>(async (req, { params }) => {
  await requireStaff();
  const { reason } = voidPaymentSchema.parse(await readJson(req));
  return voidPayment(params.id, reason);
});
