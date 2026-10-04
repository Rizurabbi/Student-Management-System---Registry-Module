"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Select } from "@/components/ui/input";
import { apiFetch } from "@/lib/client";
import { STATUSES, STATUS_LABEL } from "@/lib/constants";

// Quick inline status change from the student profile (Enrolled / Deferred / Withdrawn / Completed).
export function StatusSelect({ studentId, status }: { studentId: string; status: keyof typeof STATUS_LABEL }) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [busy, setBusy] = useState(false);

  async function change(next: string) {
    const prev = value;
    setValue(next as typeof status);
    setBusy(true);
    try {
      await apiFetch(`/api/students/${studentId}`, { method: "PATCH", json: { status: next } });
      toast.success(`Status changed to ${STATUS_LABEL[next as typeof status]}`);
      router.refresh();
    } catch (e) {
      setValue(prev);
      toast.error(e instanceof Error ? e.message : "Could not change status");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Select aria-label="Enrolment status" className="h-9 w-40" value={value} disabled={busy} onChange={(e) => change(e.target.value)}>
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {STATUS_LABEL[s]}
        </option>
      ))}
    </Select>
  );
}
