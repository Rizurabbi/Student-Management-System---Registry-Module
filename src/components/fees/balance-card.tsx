import { Card, CardBody } from "@/components/ui/card";
import { MoneyText } from "@/components/shared/money-text";
import { FeeBadge } from "./overdue-badge";
import { formatDate } from "@/lib/dates";
import type { FeeSummary } from "@/server/services/fees";

export function BalanceCard({ summary, action }: { summary: FeeSummary | null; action?: React.ReactNode }) {
  if (!summary) {
    return (
      <Card>
        <CardBody className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-700">No fee assigned yet</p>
            <p className="text-sm text-slate-500">A fee must be assigned before payments can be recorded.</p>
          </div>
          {action}
        </CardBody>
      </Card>
    );
  }
  const pct = summary.fee ? Math.min(100, Math.round((summary.paid / summary.fee) * 100)) : 100;
  return (
    <Card className={summary.overdue ? "border-red-200" : undefined}>
      <CardBody className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Outstanding balance</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight">
              <MoneyText amount={summary.balance} />
            </p>
          </div>
          <div className="flex items-center gap-2">
            <FeeBadge summary={summary} />
            {action}
          </div>
        </div>
        <div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className={summary.overdue ? "h-full bg-red-500" : "h-full bg-brand-500"} style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-slate-500">
            <span>
              Paid <MoneyText amount={summary.paid} /> of <MoneyText amount={summary.fee} />
            </span>
            <span>Due {formatDate(summary.dueDate)}</span>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
