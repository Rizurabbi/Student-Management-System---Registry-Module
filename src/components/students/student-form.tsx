"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { Card, CardBody } from "@/components/ui/card";
import { apiFetch } from "@/lib/client";
import { formatMoney } from "@/lib/money";
import { STATUSES, STATUS_LABEL } from "@/lib/constants";
import { currentAcademicYear, toZonedInput, zonedInputToISO, addDays } from "@/lib/dates";

type Programme = { id: string; code: string; name: string; defaultFee: number };
type Initial = {
  id: string;
  fullName: string;
  email: string;
  dateOfBirth: string; // yyyy-mm-dd
  programmeId: string;
  academicYear: string;
  status: keyof typeof STATUS_LABEL;
  locked: boolean; // programme cannot change once money, work or grades exist
};

export function StudentForm({ programmes, initial }: { programmes: Programme[]; initial?: Initial }) {
  const router = useRouter();
  const editing = !!initial;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [programmeId, setProgrammeId] = useState(initial?.programmeId ?? programmes[0]?.id ?? "");
  const selected = programmes.find((p) => p.id === programmeId);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const f = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {
      fullName: f.get("fullName"),
      email: f.get("email"),
      dateOfBirth: f.get("dateOfBirth"),
      programmeId: f.get("programmeId"),
      academicYear: f.get("academicYear"),
      status: f.get("status"),
    };
    if (!editing) {
      const due = String(f.get("feeDueDate") || "");
      // Fee is due at the END of the chosen day, in the app timezone.
      if (due) body.feeDueDate = zonedInputToISO(`${due}T23:59`);
    }
    setBusy(true);
    try {
      const saved = await apiFetch<{ id: string; studentNumber: string }>(editing ? `/api/students/${initial!.id}` : "/api/students", {
        method: editing ? "PATCH" : "POST",
        json: body,
      });
      toast.success(editing ? "Student updated" : `Student created: ${saved.studentNumber}`);
      router.push(`/staff/students/${saved.id}`);
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not save";
      setError(msg);
      toast.error(msg);
      setBusy(false);
    }
  }

  const defaultDue = toZonedInput(addDays(new Date(), 30)).slice(0, 10);

  return (
    <form onSubmit={onSubmit}>
      <Card>
        <CardBody className="grid gap-5 sm:grid-cols-2">
          <Field label="Full name" htmlFor="fullName" className="sm:col-span-2">
            <Input id="fullName" name="fullName" required defaultValue={initial?.fullName} placeholder="e.g. Amina Rahman" />
          </Field>
          <Field label="Email" htmlFor="email">
            <Input id="email" name="email" type="email" required defaultValue={initial?.email} placeholder="name@example.com" />
          </Field>
          <Field label="Date of birth" htmlFor="dateOfBirth">
            <Input id="dateOfBirth" name="dateOfBirth" type="date" required defaultValue={initial?.dateOfBirth} />
          </Field>
          <Field
            label="Programme"
            htmlFor="programmeId"
            hint={
              initial?.locked
                ? "Locked: this student already has payments, submissions or grades."
                : selected
                  ? `Programme fee: ${formatMoney(selected.defaultFee)}`
                  : undefined
            }
          >
            <Select
              id="programmeId"
              name="programmeId"
              value={programmeId}
              onChange={(e) => setProgrammeId(e.target.value)}
              disabled={initial?.locked}
              required
            >
              {programmes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
            {initial?.locked && <input type="hidden" name="programmeId" value={programmeId} />}
          </Field>
          <Field label="Academic year" htmlFor="academicYear" hint="Intake year, e.g. 2025/26. It sets the year in the Student ID.">
            <Input id="academicYear" name="academicYear" required pattern="\d{4}/\d{2}" defaultValue={initial?.academicYear ?? currentAcademicYear()} />
          </Field>
          <Field label="Enrolment status" htmlFor="status">
            <Select id="status" name="status" defaultValue={initial?.status ?? "ENROLLED"}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </Select>
          </Field>
          {!editing && (
            <Field label="Fee due date" htmlFor="feeDueDate" hint="The programme fee is assigned automatically. Default: 30 days from today.">
              <Input id="feeDueDate" name="feeDueDate" type="date" defaultValue={defaultDue} />
            </Field>
          )}
        </CardBody>
        {error && (
          <div className="mx-5 mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </div>
        )}
        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
          <Button variant="secondary" onClick={() => router.back()} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? "Saving..." : editing ? "Save changes" : "Create student"}
          </Button>
        </div>
      </Card>
    </form>
  );
}
