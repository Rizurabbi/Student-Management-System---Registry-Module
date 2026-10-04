import { handler } from "@/server/api";
import { requireStaff } from "@/server/session";
import { getDashboard } from "@/server/services/dashboard";

export const GET = handler(async () => {
  await requireStaff();
  return getDashboard();
});
