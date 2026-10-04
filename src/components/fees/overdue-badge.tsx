import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/dates";
import type { FeeSummary } from "@/server/services/fees";

export function FeeBadge({ summary }: { summary: FeeSummary | null }) {
  if (!summary) return <Badge>No fee assigned</Badge>;
  if (summary.status === "PAID") return <Badge tone="green">Paid</Badge>;
  if (summary.status === "OVERDUE") {
    return (
      <Badge tone="red">
        <AlertTriangle className="h-3 w-3" /> Overdue {summary.daysOverdue}d
      </Badge>
    );
  }
  return <Badge tone="amber">Due {formatDate(summary.dueDate)}</Badge>;
}
