import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Item = { label: string; count: number; href: string; hint: string };

// "Needs attention": each row links straight to where the work can be done.
export function AttentionPanel({ items }: { items: Item[] }) {
  return (
    <ul className="divide-y divide-slate-100">
      {items.map((i) => (
        <li key={i.label}>
          <Link href={i.href} className="flex items-center gap-3 px-5 py-3 transition hover:bg-slate-50">
            <span
              className={cn(
                "flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-semibold tabular-nums",
                i.count > 0 ? "bg-amber-50 text-amber-800" : "bg-slate-100 text-slate-400",
              )}
            >
              {i.count}
            </span>
            <span className="flex-1">
              <span className="block text-sm font-medium text-slate-800">{i.label}</span>
              <span className="block text-xs text-slate-500">{i.hint}</span>
            </span>
            <ChevronRight className="h-4 w-4 text-slate-300" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
