import { handler } from "@/server/api";
import { requireAny } from "@/server/session";
import { getDownload } from "@/server/services/submissions";

export const GET = handler<{ id: string }>(async (_req, { params }) => {
  const session = await requireAny();
  const { bytes, name, mime } = await getDownload(params.id, session);
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": mime,
      "Content-Disposition": `attachment; filename="${name.replace(/"/g, "")}"`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
});
