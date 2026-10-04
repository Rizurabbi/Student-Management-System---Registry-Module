import { Badge, type Tone } from "@/components/ui/badge";
import { CLASSIFICATION_LABEL, type Classification } from "@/lib/classification";

const tone: Record<Classification, Tone> = { FAIL: "red", PASS: "blue", MERIT: "violet", DISTINCTION: "green" };

export function ClassificationBadge({ value }: { value: Classification }) {
  return <Badge tone={tone[value]}>{CLASSIFICATION_LABEL[value]}</Badge>;
}
