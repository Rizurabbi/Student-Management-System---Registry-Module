import Link from "next/link";
import { Plus } from "lucide-react";
import { listAssessments } from "@/server/services/assessments";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Table, Td, Th } from "@/components/ui/table";
import { buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { OpenBadge } from "@/components/assessments/late-badge";
import { formatDateTime, timeLeft } from "@/lib/dates";

export default async function AssessmentsPage() {
  const rows = await listAssessments();
  return (
    <>
      <PageHeader
        title="Assessments"
        description="Create assessments, collect submissions and enter grades."
        actions={
          <Link href="/staff/assessments/new" className={buttonClass("primary")}>
            <Plus className="h-4 w-4" /> New assessment
          </Link>
        }
      />
      <Card>
        {rows.length === 0 ? (
          <EmptyState
            title="No assessments yet"
            description="Create one so students can start submitting work."
            action={
              <Link href="/staff/assessments/new" className={buttonClass("primary", "sm")}>
                New assessment
              </Link>
            }
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Assessment</Th>
                <Th>Deadline</Th>
                <Th>State</Th>
                <Th>Submitted</Th>
                <Th>Graded</Th>
                <Th>Published</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <Td>
                    <Link href={`/staff/assessments/${a.id}`} className="font-medium text-slate-900 hover:text-brand-600">
                      {a.title}
                    </Link>
                    <p className="text-xs text-slate-500">
                      {a.module.code} · {a.module.name}
                    </p>
                  </Td>
                  <Td>
                    {formatDateTime(a.deadline)}
                    <p className="text-xs text-slate-500">{timeLeft(a.deadline)}</p>
                  </Td>
                  <Td>
                    <OpenBadge isOpen={a.isOpen} />
                  </Td>
                  <Td className="tabular-nums">
                    {a.submissions} <span className="text-slate-400">/ {a.eligible}</span>
                  </Td>
                  <Td className="tabular-nums">{a.graded}</Td>
                  <Td className="tabular-nums">{a.published}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
