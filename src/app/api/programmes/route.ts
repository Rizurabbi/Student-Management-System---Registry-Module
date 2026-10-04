import { handler } from "@/server/api";
import { requireAny } from "@/server/session";
import { listProgrammes } from "@/server/services/students";

export const GET = handler(async () => {
  await requireAny();
  return listProgrammes();
});
