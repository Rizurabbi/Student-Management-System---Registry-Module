import { cn } from "@/lib/utils";

// Horizontal scroll lives inside the wrapper, so the page body never scrolls sideways.
export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto">
      <table className={cn("w-full text-left text-sm", className)} {...props} />
    </div>
  );
}

export function Th({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn("whitespace-nowrap border-b border-slate-100 bg-slate-50/60 px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-slate-500", className)}
      {...props}
    />
  );
}

export function Td({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("border-b border-slate-100 px-4 py-3 align-middle text-slate-700", className)} {...props} />;
}
