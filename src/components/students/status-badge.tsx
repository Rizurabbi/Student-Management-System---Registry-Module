import { Badge } from "@/components/ui/badge";
import { STATUS_LABEL } from "@/lib/constants";

const tone = { ENROLLED: "green", DEFERRED: "amber", WITHDRAWN: "red", COMPLETED: "blue" } as const;

export function StatusBadge({ status }: { status: keyof typeof STATUS_LABEL }) {
  return <Badge tone={tone[status]}>{STATUS_LABEL[status]}</Badge>;
}
