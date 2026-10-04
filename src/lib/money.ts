import { CURRENCY } from "./constants";

// Money is always an integer in minor units (cents). Floats never touch storage.

const fmt = new Intl.NumberFormat("en-US", { style: "currency", currency: CURRENCY });

export function formatMoney(minor: number): string {
  return fmt.format(minor / 100);
}

/** Parse user input like "1,250.50" into minor units. Returns null if invalid. */
export function toMinor(input: string | number): number | null {
  const raw = typeof input === "number" ? String(input) : input.replace(/,/g, "").trim();
  if (!/^\d+(\.\d{1,2})?$/.test(raw)) return null;
  const [whole, frac = ""] = raw.split(".");
  return Number(whole) * 100 + Number(frac.padEnd(2, "0"));
}

/** Minor units to an editable "1250.50" string. */
export function toMajorString(minor: number): string {
  return (minor / 100).toFixed(2);
}
