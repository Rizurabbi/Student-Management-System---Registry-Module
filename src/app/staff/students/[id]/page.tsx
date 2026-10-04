import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, Pencil } from "lucide-react";
import { getStudent } from "@/server/services/students";
import { ApiError } from "@/server/errors";
import { classify } from "@/lib/classification";
import { formatDate, formatDateTime } from "@/lib/dates";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { Table, Td, Th } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { MoneyText } from "@/components/shared/money-text";
import { StatusSelect } from "@/components/students/status-select";
import { BalanceCard } from "@/components/fees/balance-card";
import { PaymentForm } from "@/components/fees/payment-form";
import { FeeForm } from "@/components/fees/fee-form";
import { VoidPaymentButton } from "@/components/fees/void-payment-button";
import { LateBadge } from "@/components/assessments/late-badge";
import { ClassificationBadge } from "@/components/marksheet/classification-badge";

export default async function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await getStudent(id).catch((e) => {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  });
  if (!s) notFound();

  const detail = (label: string, value: React.ReactNode) => (
    <div className="flex justify-between gap-4 py-2.5 text-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-800">{value}</dd>
    </div>
  );

  return (
    <>
      <Link href="/staff/students" className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> All students
      </Link>
      <PageHeader
        title={s.fullName}
        description={`${s.studentNumber} · ${s.programme.name} · ${s.academicYear}`}
        actions={
          <>
            <StatusSelect studentId={s.id} status={s.status} />
            <Link href={`/staff/students/${s.id}/edit`} className={buttonClass("secondary")}>
              <Pencil className="h-4 w-4" /> Edit
            </Link>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <BalanceCard
            summary={s.feeSummary}
            action={
              <FeeForm
                studentId={s.id}
                suggested={s.programme.defaultFee}
                current={s.fee ? { amount: s.fee.amount, dueDate: s.fee.dueDate.toISOString() } : null}
              />
            }
          />

          {s.fee && (
            <Card>
              <CardHeader title="Record a payment" />
              <CardBody>
                <PaymentForm studentId={s.id} balance={s.feeSummary?.balance ?? 0} />
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader title="Payment ledger" description="Payments are never deleted. Voided ones stay visible but do not count." />
            {s.payments.length === 0 ? (
              <EmptyState title="No payments yet" />
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Date</Th>
                    <Th>Reference</Th>
                    <Th className="text-right">Amount</Th>
                    <Th>Status</Th>
                    <Th />
                  </tr>
                </thead>
                <tbody>
                  {s.payments.map((p) => (
                    <tr key={p.id} className={p.voidedAt ? "bg-slate-50/60" : undefined}>
                      <Td>{formatDate(p.paidAt)}</Td>
                      <Td>
                        <span className="font-mono text-xs">{p.reference}</span>
                        {p.note && <p className="text-xs text-slate-500">{p.note}</p>}
                      </Td>
                      <Td className={`text-right ${p.voidedAt ? "text-slate-400 line-through" : ""}`}>
                        <MoneyText amount={p.amount} />
                      </Td>
                      <Td>
                        {p.voidedAt ? (
                          <div>
                            <Badge tone="neutral">Voided</Badge>
                            <p className="mt-1 text-xs text-slate-500">{p.voidReason}</p>
                          </div>
                        ) : (
                          <Badge tone="green">Counted</Badge>
                        )}
                      </Td>
                      <Td className="text-right">{!p.voidedAt && <VoidPaymentButton paymentId={p.id} reference={p.reference} />}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>

          <Card>
            <CardHeader title="Submissions" />
            {s.submissions.length === 0 ? (
              <EmptyState title="No submissions yet" />
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Assessment</Th>
                    <Th>Submitted</Th>
                    <Th />
                  </tr>
                </thead>
                <tbody>
                  {s.submissions.map((sub) => (
                    <tr key={sub.id}>
                      <Td>
                        <Link href={`/staff/assessments/${sub.assessmentId}`} className="font-medium text-slate-900 hover:text-brand-600">
                          {sub.assessment.title}
                        </Link>
                        <p className="text-xs text-slate-500">{sub.assessment.module.code}</p>
                      </Td>
                      <Td>
                        <div className="flex items-center gap-2">
                          <span>{formatDateTime(sub.submittedAt)}</span>
                          {sub.isLate && <LateBadge />}
                        </div>
                      </Td>
                      <Td className="text-right">
                        <a href={`/api/submissions/${sub.id}/file`} className={buttonClass("ghost", "sm")}>
                          <Download className="h-3.5 w-3.5" /> File
                        </a>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>

          <Card>
            <CardHeader title="Results" description="Staff see every grade. Students only see the published ones." />
            {s.grades.length === 0 ? (
              <EmptyState title="No grades yet" />
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Assessment</Th>
                    <Th>Score</Th>
                    <Th>Result</Th>
                    <Th>Visibility</Th>
                  </tr>
                </thead>
                <tbody>
                  {s.grades.map((g) => (
                    <tr key={g.id}>
                      <Td>
                        <p className="font-medium text-slate-900">{g.assessment.title}</p>
                        <p className="text-xs text-slate-500">{g.assessment.module.code}</p>
                      </Td>
                      <Td className="tabular-nums">{Number(g.score)}</Td>
                      <Td>
                        <ClassificationBadge value={classify(Number(g.score))} />
                      </Td>
                      <Td>
                        <Badge tone={g.published ? "green" : "amber"}>{g.published ? "Published" : "Withheld"}</Badge>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader title="Details" />
            <CardBody className="py-2">
              <dl className="divide-y divide-slate-100">
                {detail("Student ID", <span className="font-mono">{s.studentNumber}</span>)}
                {detail("Email", s.email)}
                {detail("Date of birth", s.dateOfBirth.toISOString().slice(0, 10))}
                {detail("Programme", s.programme.code)}
                {detail("Academic year", s.academicYear)}
                {detail("Created", formatDate(s.createdAt))}
              </dl>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
