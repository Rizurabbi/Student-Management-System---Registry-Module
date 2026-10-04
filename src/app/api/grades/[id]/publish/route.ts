import { handler, readJson } from "@/server/api";
import { requireStaff } from "@/server/session";
import { setPublished } from "@/server/services/grades";
import { publishSchema } from "@/lib/validators/grade";

export const POST = handler<{ id: string }>(async (req, { params }) => {
  await requireStaff();
  const { published } = publishSchema.parse(await readJson(req));
  const g = await setPublished(params.id, published);
  return { id: g.id, published: g.published };
});
