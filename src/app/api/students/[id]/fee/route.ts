import { handler, readJson } from "@/server/api";
import { requireStaff } from "@/server/session";
import { setFee } from "@/server/services/fees";
import { feeSchema } from "@/lib/validators/payment";

export const PUT = handler<{ id: string }>(async (req, { params }) => {
  await requireStaff();
  const input = feeSchema.parse(await readJson(req));
  return setFee(params.id, input);
});
