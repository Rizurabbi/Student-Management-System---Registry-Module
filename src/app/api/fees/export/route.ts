import { handler } from "@/server/api";
import { requireStaff } from "@/server/session";
import { listFeeRows } from "@/server/services/fees";

const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;

// CSV of every student's fee position. Amounts are written in major units (e.g. 4500.00).
export const GET = handler(async () => {
  await requireStaff();
  const rows = await listFeeRows({ filter: "all" });
  const lines = [["Student ID", "Name", "Programme", "Status", "Fee", "Paid", "Balance", "Due date", "Fee status"].map(esc).join(",")];
  for (const r of rows) {
    const s = r.summary;
    lines.push(
      [
        r.studentNumber,
        r.fullName,
        r.programme.code,
        r.status,
        s ? (s.fee / 100).toFixed(2) : "",
        s ? (s.paid / 100).toFixed(2) : "",
        s ? (s.balance / 100).toFixed(2) : "",
        s ? s.dueDate.toISOString().slice(0, 10) : "",
        s ? s.status : "NO_FEE",
      ]
        .map(esc)
        .join(","),
    );
  }
  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="fees.csv"' },
  });
});
