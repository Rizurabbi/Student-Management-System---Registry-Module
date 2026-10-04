import Link from "next/link";
import { getDashboard } from "@/server/services/dashboard";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { OverdueList } from "@/components/dashboard/overdue-list";
import { AttentionPanel } from "@/components/dashboard/attention-panel";
import { Card, CardHeader } from "@/components/ui/card";
import { Table, Td, Th } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { MoneyText } from "@/components/shared/money-text";
import { buttonClass } from "@/components/ui/button";
import { STATUSES, STATUS_LABEL } from "@/lib/constants";
import { formatDate, formatDateTime, timeLeft } from "@/lib/dates";
import { formatMoney } from "@/lib/money";

export default async function DashboardPage() {
  const d = await getDashboard();
  const max = Math.max(1, ...Object.values(d.statusCounts));

  return (
    <>
      <PageHeader
        title="Registry dashboard"
        description="A live view of students, fees and assessments. Every card links to the list behind it."
        actions={
          <Link href="/staff/students/new" className={buttonClass("primary")}>
            New student
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Students" value={d.totalStudents} sub={`${d.statusCounts.ENROLLED} currently enrolled`} href="/staff/students" />
        <StatCard
          label="Outstanding fees"
          value={formatMoney(d.money.outstanding)}
          sub={`${d.money.collectionRate}% of ${formatMoney(d.money.totalFee)} collected`}
          href="/staff/fees?filter=outstanding"
        />
        <StatCard
          label="Overdue students"
          value={d.overdueCount}
          sub={d.overdueCount ? "Balance owed past the due date" : "Nobody is overdue"}
          href="/staff/fees?filter=overdue"
          tone={d.overdueCount ? "danger" : "default"}
        />
        <StatCard
          label="Waiting for grades"
          value={d.ungradedSubmissions}
          sub="Submissions with no grade yet"
          href="/staff/assessments"
          tone={d.ungradedSubmissions ? "warning" : "default"}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Overdue balances"
            description="Longest overdue first. Withdrawn students are included on purpose, because the money is still owed."
            action={
              <Link href="/staff/fees?filter=overdue" className="text-sm font-medium text-brand-600 hover:underline">
                View all
              </Link>
            }
          />
          <OverdueList rows={d.overdue} />
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Needs attention" />
            <AttentionPanel
              items={[
                { label: "Late submissions", count: d.lateSubmissions, href: "/staff/assessments", hint: "Flagged Late when submitted" },
                { label: "Results withheld", count: d.withheldResults, href: "/staff/assessments", hint: "Graded but not visible to students" },
                { label: "Ungraded submissions", count: d.ungradedSubmissions, href: "/staff/assessments", hint: "Work waiting for a score" },
              ]}
            />
          </Card>
          <Card>
            <CardHeader title="Students by status" />
            <ul className="space-y-3 p-5">
              {STATUSES.map((s) => (
                <li key={s}>
                  <Link href={`/staff/students?status=${s}`} className="group block">
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-slate-700 group-hover:text-brand-600">{STATUS_LABEL[s]}</span>
                      <span className="font-medium tabular-nums">{d.statusCounts[s]}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-brand-500" style={{ width: `${(d.statusCounts[s] / max) * 100}%` }} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Upcoming deadlines" />
          {d.upcomingDeadlines.length === 0 ? (
            <EmptyState title="No upcoming deadlines" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {d.upcomingDeadlines.map((a) => (
                <li key={a.id}>
                  <Link href={`/staff/assessments/${a.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50">
                    <span>
                      <span className="block text-sm font-medium text-slate-800">{a.title}</span>
                      <span className="block text-xs text-slate-500">
                        {a.module.code} · {formatDateTime(a.deadline)}
                      </span>
                    </span>
                    <span className="text-xs font-medium text-slate-500">{timeLeft(a.deadline)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <CardHeader title="Recent payments" />
          {d.recentPayments.length === 0 ? (
            <EmptyState title="No payments recorded yet" />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Student</Th>
                  <Th>Date</Th>
                  <Th className="text-right">Amount</Th>
                </tr>
              </thead>
              <tbody>
                {d.recentPayments.map((p) => (
                  <tr key={p.id}>
                    <Td>
                      <Link href={`/staff/students/${p.student.id}`} className="font-medium text-slate-900 hover:text-brand-600">
                        {p.student.fullName}
                      </Link>
                      <p className="font-mono text-xs text-slate-500">{p.reference}</p>
                    </Td>
                    <Td>{formatDate(p.paidAt)}</Td>
                    <Td className="text-right">
                      <MoneyText amount={p.amount} />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      </div>
    </>
  );
}
