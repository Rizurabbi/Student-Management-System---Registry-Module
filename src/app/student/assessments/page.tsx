import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/server/session";
import { listAssessmentsForStudent } from "@/server/services/assessments";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, Td, Th } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { LateBadge, OpenBadge } from "@/components/assessments/late-badge";
import { formatDateTime, timeLeft } from "@/lib/dates";

export default async function StudentAssessments() {
  const session = await getSession();
  if (session?.role !== "student") redirect("/");
  const rows = await listAssessmentsForStudent(session.studentId);
  return (
    <>
      <PageHeader title="Assessments" description="Open work first. Submit a PDF or DOCX before the deadline." />
      <Card>
        {rows.length === 0 ? (
          <EmptyState title="No assessments yet" description="Assessments for your programme will appear here." />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Assessment</Th>
                <Th>Deadline</Th>
                <Th>State</Th>
                <Th>Your submission</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <Td>
                    <Link href={`/student/assessments/${a.id}`} className="font-medium text-slate-900 hover:text-brand-600">
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
                  <Td>
                    {a.submission ? (
                      <div className="flex items-center gap-2">
                        <Badge tone="green">Submitted</Badge>
                        {a.submission.isLate && <LateBadge />}
                      </div>
                    ) : (
                      <Badge tone={a.isOpen ? "amber" : "red"}>{a.isOpen ? "Not submitted" : "Missed"}</Badge>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
