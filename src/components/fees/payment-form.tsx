"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/client";
import { formatMoney, toMajorString, toMinor } from "@/lib/money";
import { toZonedInput, zonedInputToISO } from "@/lib/dates";

export function PaymentForm({ studentId, balance }: { studentId: string; balance: number }) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const today = toZonedInput(new Date()).slice(0, 10);

  if (balance <= 0) {
    return <p className="text-sm text-slate-500">Nothing left to pay. Void a payment if one was recorded by mistake.</p>;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const f = new FormData(form);
    const minor = toMinor(amount);
    if (minor === null || minor <= 0) {
      setError("Enter a valid amount, for example 250.00");
      return;
    }
    const day = String(f.get("paidAt"));
    // Today: use the real current time. Other days: noon in the app timezone.
    const paidAt = day === today ? new Date().toISOString() : zonedInputToISO(`${day}T12:00`);
    setBusy(true);
    try {
      await apiFetch(`/api/students/${studentId}/payments`, {
        method: "POST",
        json: { amount: minor, paidAt, reference: f.get("reference"), note: f.get("note") || undefined },
      });
      toast.success(`Payment of ${formatMoney(minor)} recorded`);
      setAmount("");
      form.reset();
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not record payment";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      <Field label="Amount" htmlFor="amount" hint={`Outstanding: ${formatMoney(balance)}`}>
        <div className="flex gap-2">
          <Input id="amount" inputMode="decimal" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          <Button variant="secondary" onClick={() => setAmount(toMajorString(balance))}>
            Full
          </Button>
        </div>
      </Field>
      <Field label="Payment date" htmlFor="paidAt">
        <Input id="paidAt" name="paidAt" type="date" max={today} defaultValue={today} required />
      </Field>
      <Field label="Reference number" htmlFor="reference" hint="Bank or receipt reference. Must be unique.">
        <Input id="reference" name="reference" placeholder="e.g. BANK-2041" required minLength={3} />
      </Field>
      <Field label="Note (optional)" htmlFor="note">
        <Input id="note" name="note" placeholder="e.g. First instalment" />
      </Field>
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2" role="alert">
          {error}
        </div>
      )}
      <div className="sm:col-span-2">
        <Button type="submit" disabled={busy}>
          {busy ? "Recording..." : "Record payment"}
        </Button>
      </div>
    </form>
  );
}
