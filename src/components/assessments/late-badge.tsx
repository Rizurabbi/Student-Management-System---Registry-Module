import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function LateBadge() {
  return (
    <Badge tone="red">
      <Clock className="h-3 w-3" /> Late
    </Badge>
  );
}

export function OpenBadge({ isOpen }: { isOpen: boolean }) {
  return <Badge tone={isOpen ? "green" : "neutral"}>{isOpen ? "Open" : "Closed"}</Badge>;
}
