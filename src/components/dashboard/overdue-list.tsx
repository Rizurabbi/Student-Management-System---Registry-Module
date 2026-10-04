import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Table, Td, Th } from "@/components/ui/table";
import { MoneyText } from "@/components/shared/money-text";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/students/status-badge";
import { formatDate } from "@/lib/dates";
import type { getDashboard } from "@/server/services/dashboard";

type Rows = Awaited<ReturnType<typeof getDashboard>>["overdue"];

export function OverdueList({ rows }: { rows: Rows }) {
  if (rows.length === 0) return <EmptyState title="No overdue balances" description="Every student with a balance is still within their payment deadline." />;
  return (
    <Table>
      <thead>
        <tr>
          <Th>Student</Th>
          <Th>Status</Th>
          <Th>Due</Th>
          <Th>Overdue</Th>
          <Th className="text-right">Balance</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.student.id} className="hover:bg-slate-50">
            <Td>
              <Link href={`/staff/students/${r.student.id}`} className="font-medium text-slate-900 hover:text-brand-600">
                {r.student.fullName}
              </Link>
              <p className="font-mono text-xs text-slate-500">{r.student.studentNumber}</p>
            </Td>
            <Td>
              <StatusBadge status={r.student.status} />
            </Td>
            <Td>{formatDate(r.dueDate)}</Td>
            <Td>
              <Badge tone="red">{r.daysOverdue} days</Badge>
            </Td>
            <Td className="text-right font-medium">
              <MoneyText amount={r.balance} />
            </Td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
