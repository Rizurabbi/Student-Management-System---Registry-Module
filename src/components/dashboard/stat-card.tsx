import Link from "next/link";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  sub,
  href,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  href?: string;
  tone?: "default" | "danger" | "warning";
}) {
  const body = (
    <div
      className={cn(
        "h-full rounded-xl border bg-white p-5 shadow-sm transition",
        href && "hover:border-brand-500 hover:shadow-md",
        tone === "danger" ? "border-red-200" : tone === "warning" ? "border-amber-200" : "border-slate-200",
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={cn("mt-2 text-3xl font-semibold tracking-tight tabular-nums", tone === "danger" && "text-red-600")}>{value}</p>
      {sub && <p className="mt-1 text-sm text-slate-500">{sub}</p>}
    </div>
  );
  return href ? <Link href={href} className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-xl">{body}</Link> : body;
}
