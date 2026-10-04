import { handler } from "@/server/api";
import { requireStudent } from "@/server/session";
import { getPublishedResultsForStudent } from "@/server/services/grades";

export const GET = handler(async () => {
  const session = await requireStudent();
  return getPublishedResultsForStudent(session.studentId);
});
