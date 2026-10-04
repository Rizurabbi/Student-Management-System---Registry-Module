"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input, Select } from "@/components/ui/input";
import { STATUSES, STATUS_LABEL } from "@/lib/constants";

// All filter state lives in the URL, so any filtered view can be refreshed, bookmarked or shared.
export function StudentFilters({ programmes }: { programmes: { id: string; name: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const first = useRef(true);

  function push(next: Record<string, string>) {
    const params = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    params.delete("page");
    router.replace(`${pathname}?${params.toString()}`);
  }

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => push({ q: q.trim() }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="flex flex-wrap gap-3 p-4">
      <div className="relative min-w-[220px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          aria-label="Search students"
          className="pl-9"
          placeholder="Search by name, ID or email"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <Select aria-label="Programme" className="w-52" value={sp.get("programmeId") ?? ""} onChange={(e) => push({ programmeId: e.target.value })}>
        <option value="">All programmes</option>
        {programmes.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </Select>
      <Select aria-label="Status" className="w-44" value={sp.get("status") ?? ""} onChange={(e) => push({ status: e.target.value })}>
        <option value="">All statuses</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABEL[s]}
          </option>
        ))}
      </Select>
    </div>
  );
}
