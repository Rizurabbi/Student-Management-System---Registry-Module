import { describe, expect, it } from "vitest";
import { formatMoney, toMajorString, toMinor } from "@/lib/money";

describe("money", () => {
  it("formats minor units", () => {
    expect(formatMoney(450000)).toBe("$4,500.00");
    expect(formatMoney(5)).toBe("$0.05");
  });
  it("parses user input into integer cents without float drift", () => {
    expect(toMinor("12.5")).toBe(1250);
    expect(toMinor("1,250.50")).toBe(125050);
    expect(toMinor("0.1")).toBe(10);
    expect(toMinor(10)).toBe(1000);
    expect(toMinor("19.99")).toBe(1999);
  });
  it("rejects bad input", () => {
    expect(toMinor("abc")).toBeNull();
    expect(toMinor("-5")).toBeNull();
    expect(toMinor("1.234")).toBeNull();
    expect(toMinor("")).toBeNull();
  });
  it("round-trips to an editable string", () => {
    expect(toMajorString(125050)).toBe("1250.50");
  });
});
