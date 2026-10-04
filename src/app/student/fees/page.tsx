import { redirect } from "next/navigation";
import { getSession } from "@/server/session";
import { getFeeSummary, listPayments } from "@/server/services/fees";
import { PageHeader } from "@/components/shared/page-header";
import { BalanceCard } from "@/components/fees/balance-card";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, Td, Th } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { MoneyText } from "@/components/shared/money-text";
import { formatDate } from "@/lib/dates";

export default async function StudentFees() {
  const session = await getSession();
  if (session?.role !== "student") redirect("/");
  const [summary, payments] = await Promise.all([getFeeSummary(session.studentId), listPayments(session.studentId)]);
  return (
    <>
      <PageHeader title="Fees" description="Your balance updates as soon as the Registry records a payment." />
      <BalanceCard summary={summary} />
      <Card className="mt-6">
        <CardHeader title="Payment history" />
        {payments.length === 0 ? (
          <EmptyState title="No payments recorded yet" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Date</Th>
                <Th>Reference</Th>
                <Th className="text-right">Amount</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <Td>{formatDate(p.paidAt)}</Td>
                  <Td className="font-mono text-xs">{p.reference}</Td>
                  <Td className={`text-right ${p.voidedAt ? "text-slate-400 line-through" : ""}`}>
                    <MoneyText amount={p.amount} />
                  </Td>
                  <Td>{p.voidedAt ? <Badge>Voided</Badge> : <Badge tone="green">Received</Badge>}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
