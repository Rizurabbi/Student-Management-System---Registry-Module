import { redirect } from "next/navigation";
import { getSession } from "@/server/session";
import { getPublishedResultsForStudent } from "@/server/services/grades";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Table, Td, Th } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { ClassificationBadge } from "@/components/marksheet/classification-badge";
import { formatDate } from "@/lib/dates";

export default async function StudentResults() {
  const session = await getSession();
  if (session?.role !== "student") redirect("/");
  // This is the ONLY way the student portal reads grades, and it filters on published = true in the query.
  const { results, average } = await getPublishedResultsForStudent(session.studentId);
  return (
    <>
      <PageHeader
        title="Results"
        description={average !== null ? `Your marksheet. Average across published results: ${average.toFixed(1)}` : "Your marksheet appears here once results are published."}
      />
      <Card>
        {results.length === 0 ? (
          <EmptyState title="No results published yet" description="When the Registry publishes a result, it will show up here." />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Assessment</Th>
                <Th>Score</Th>
                <Th>Result</Th>
                <Th>Feedback</Th>
                <Th>Published</Th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.assessment.id}>
                  <Td>
                    <p className="font-medium text-slate-900">{r.assessment.title}</p>
                    <p className="text-xs text-slate-500">
                      {r.assessment.module.code} · {r.assessment.module.name}
                    </p>
                  </Td>
                  <Td className="font-semibold tabular-nums">{r.score}</Td>
                  <Td>
                    <ClassificationBadge value={r.classification} />
                  </Td>
                  <Td className="max-w-xs text-slate-600">{r.feedback || <span className="text-slate-300">-</span>}</Td>
                  <Td>{r.publishedAt ? formatDate(r.publishedAt) : "-"}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
