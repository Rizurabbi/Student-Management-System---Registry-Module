import Link from "next/link";
import { Download, Search } from "lucide-react";
import { listFeeRows, type FeeFilter } from "@/server/services/fees";
import { getDashboard } from "@/server/services/dashboard";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card } from "@/components/ui/card";
import { Table, Td, Th } from "@/components/ui/table";
import { buttonClass } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/empty-state";
import { MoneyText } from "@/components/shared/money-text";
import { StatusBadge } from "@/components/students/status-badge";
import { FeeBadge } from "@/components/fees/overdue-badge";
import { formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

type SP = Promise<Record<string, string | string[] | undefined>>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const FILTERS: { key: FeeFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "overdue", label: "Overdue" },
  { key: "outstanding", label: "Outstanding" },
  { key: "paid", label: "Paid" },
  { key: "nofee", label: "No fee" },
];

export default async function FeesPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const q = first(sp.q)?.trim() || undefined;
  const requested = first(sp.filter);
  const filter = (FILTERS.find((f) => f.key === requested)?.key ?? "all") as FeeFilter;
  const [rows, d] = await Promise.all([listFeeRows({ filter, q }), getDashboard()]);

  const href = (f: FeeFilter) => {
    const p = new URLSearchParams();
    if (f !== "all") p.set("filter", f);
    if (q) p.set("q", q);
    const s = p.toString();
    return `/staff/fees${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <PageHeader
        title="Fees & payments"
        description="What each student owes and has paid. Balances are calculated live from the payment ledger."
        actions={
          <a href="/api/fees/export" className={buttonClass("secondary")}>
            <Download className="h-4 w-4" /> Export CSV
          </a>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total billed" value={formatMoney(d.money.totalFee)} />
        <StatCard label="Collected" value={formatMoney(d.money.totalPaid)} sub={`${d.money.collectionRate}% collection rate`} />
        <StatCard
          label="Outstanding"
          value={formatMoney(d.money.outstanding)}
          sub={`${d.overdueCount} overdue student${d.overdueCount === 1 ? "" : "s"}`}
          tone={d.overdueCount ? "danger" : "default"}
        />
      </div>

      <Card className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <nav className="flex flex-wrap gap-1" aria-label="Fee filters">
            {FILTERS.map((f) => (
              <Link
                key={f.key}
                href={href(f.key)}
                aria-current={filter === f.key ? "page" : undefined}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  filter === f.key ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100",
                )}
              >
                {f.label}
              </Link>
            ))}
          </nav>
          <form className="relative w-full sm:w-72" action="/staff/fees">
            {filter !== "all" && <input type="hidden" name="filter" value={filter} />}
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input name="q" defaultValue={q} className="pl-9" placeholder="Search name or ID, press Enter" aria-label="Search fees" />
          </form>
        </div>
        {rows.length === 0 ? (
          <EmptyState title="Nothing to show" description="No students match this filter." />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Student</Th>
                <Th>Status</Th>
                <Th className="text-right">Fee</Th>
                <Th className="text-right">Paid</Th>
                <Th className="text-right">Balance</Th>
                <Th>Due</Th>
                <Th>Fee status</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <Td>
                    <Link href={`/staff/students/${r.id}`} className="font-medium text-slate-900 hover:text-brand-600">
                      {r.fullName}
                    </Link>
                    <p className="font-mono text-xs text-slate-500">
                      {r.studentNumber} · {r.programme.code}
                    </p>
                  </Td>
                  <Td>
                    <StatusBadge status={r.status} />
                  </Td>
                  <Td className="text-right">{r.summary ? <MoneyText amount={r.summary.fee} /> : "-"}</Td>
                  <Td className="text-right">{r.summary ? <MoneyText amount={r.summary.paid} /> : "-"}</Td>
                  <Td className="text-right font-medium">{r.summary ? <MoneyText amount={r.summary.balance} /> : "-"}</Td>
                  <Td>{r.summary ? formatDate(r.summary.dueDate) : "-"}</Td>
                  <Td>
                    <FeeBadge summary={r.summary} />
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
