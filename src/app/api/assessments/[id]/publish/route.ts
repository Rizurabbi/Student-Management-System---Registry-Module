import { handler, readJson } from "@/server/api";
import { requireStaff } from "@/server/session";
import { bulkSetPublished } from "@/server/services/grades";
import { publishSchema } from "@/lib/validators/grade";

// Publish (or withhold) every saved grade for one assessment in a single step.
export const POST = handler<{ id: string }>(async (req, { params }) => {
  await requireStaff();
  const { published } = publishSchema.parse(await readJson(req));
  return bulkSetPublished(params.id, published);
});
