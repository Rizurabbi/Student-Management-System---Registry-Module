import { DISTINCTION_MARK, MERIT_MARK, PASS_MARK } from "./constants";

export type Classification = "FAIL" | "PASS" | "MERIT" | "DISTINCTION";

// Boundaries are inclusive: 40 is a Pass, 60 is a Merit, 70 is a Distinction.
// Anything below 40 is a Fail. The brief does not name it, but it is needed.
export function classify(score: number): Classification {
  if (score >= DISTINCTION_MARK) return "DISTINCTION";
  if (score >= MERIT_MARK) return "MERIT";
  if (score >= PASS_MARK) return "PASS";
  return "FAIL";
}

export const CLASSIFICATION_LABEL: Record<Classification, string> = {
  FAIL: "Fail",
  PASS: "Pass",
  MERIT: "Merit",
  DISTINCTION: "Distinction",
};
