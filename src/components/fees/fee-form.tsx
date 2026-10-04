"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { apiFetch } from "@/lib/client";
import { toMajorString, toMinor } from "@/lib/money";
import { toZonedInput, zonedInputToISO, addDays } from "@/lib/dates";

export function FeeForm({
  studentId,
  current,
  suggested,
}: {
  studentId: string;
  current: { amount: number; dueDate: string } | null;
  suggested: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const f = new FormData(e.currentTarget);
    const minor = toMinor(String(f.get("amount")));
    if (minor === null) return setError("Enter a valid amount, for example 4500.00");
    setBusy(true);
    try {
      await apiFetch(`/api/students/${studentId}/fee`, {
        method: "PUT",
        json: { amount: minor, dueDate: zonedInputToISO(`${f.get("dueDate")}T23:59`) },
      });
      toast.success("Fee saved");
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save fee");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        {current ? "Adjust fee" : "Assign fee"}
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title={current ? "Adjust fee" : "Assign fee"}>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Fee amount" htmlFor="fee-amount" hint="Use this for scholarships or discounts. It cannot go below what is already paid.">
            <Input id="fee-amount" name="amount" inputMode="decimal" required defaultValue={toMajorString(current?.amount ?? suggested)} />
          </Field>
          <Field label="Due date" htmlFor="fee-due">
            <Input
              id="fee-due"
              name="dueDate"
              type="date"
              required
              defaultValue={toZonedInput(current ? current.dueDate : addDays(new Date(), 30)).slice(0, 10)}
            />
          </Field>
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {error}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Saving..." : "Save fee"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
