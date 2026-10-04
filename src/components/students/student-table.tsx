import Link from "next/link";
import { Table, Td, Th } from "@/components/ui/table";
import { StatusBadge } from "./status-badge";
import { FeeBadge } from "@/components/fees/overdue-badge";
import { MoneyText } from "@/components/shared/money-text";
import type { listStudents } from "@/server/services/students";

type Rows = Awaited<ReturnType<typeof listStudents>>["items"];

export function StudentTable({ rows }: { rows: Rows }) {
  return (
    <Table>
      <thead>
        <tr>
          <Th>Student</Th>
          <Th>ID</Th>
          <Th>Programme</Th>
          <Th>Year</Th>
          <Th>Status</Th>
          <Th className="text-right">Balance</Th>
          <Th>Fees</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((s) => (
          <tr key={s.id} className="transition-colors hover:bg-slate-50">
            <Td>
              <Link href={`/staff/students/${s.id}`} className="font-medium text-slate-900 hover:text-brand-600">
                {s.fullName}
              </Link>
              <p className="text-xs text-slate-500">{s.email}</p>
            </Td>
            <Td className="font-mono text-xs">{s.studentNumber}</Td>
            <Td>{s.programme.code}</Td>
            <Td>{s.academicYear}</Td>
            <Td>
              <StatusBadge status={s.status} />
            </Td>
            <Td className="text-right">{s.feeSummary ? <MoneyText amount={s.feeSummary.balance} /> : <span className="text-slate-400">n/a</span>}</Td>
            <Td>
              <FeeBadge summary={s.feeSummary} />
            </Td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
