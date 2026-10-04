import { describe, expect, it } from "vitest";
import { classify } from "@/lib/classification";

describe("classify", () => {
  it("treats boundaries as inclusive", () => {
    expect(classify(39.99)).toBe("FAIL");
    expect(classify(40)).toBe("PASS");
    expect(classify(59.99)).toBe("PASS");
    expect(classify(60)).toBe("MERIT");
    expect(classify(69.99)).toBe("MERIT");
    expect(classify(70)).toBe("DISTINCTION");
  });
  it("handles the extremes", () => {
    expect(classify(0)).toBe("FAIL");
    expect(classify(100)).toBe("DISTINCTION");
  });
});
