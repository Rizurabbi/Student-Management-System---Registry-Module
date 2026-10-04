"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { Card, CardBody } from "@/components/ui/card";
import { apiFetch } from "@/lib/client";
import { APP_TIMEZONE } from "@/lib/constants";
import { addDays, toZonedInput, zonedInputToISO } from "@/lib/dates";

type ProgrammeWithModules = { id: string; name: string; modules: { id: string; code: string; name: string }[] };

export function AssessmentForm({
  programmes,
  initial,
}: {
  programmes: ProgrammeWithModules[];
  initial?: { id: string; title: string; moduleId: string; deadline: string; moduleLocked: boolean };
}) {
  const router = useRouter();
  const editing = !!initial;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const f = new FormData(e.currentTarget);
    const body = {
      title: f.get("title"),
      moduleId: f.get("moduleId"),
      deadline: zonedInputToISO(String(f.get("deadline"))),
    };
    setBusy(true);
    try {
      const saved = await apiFetch<{ id: string }>(editing ? `/api/assessments/${initial!.id}` : "/api/assessments", {
        method: editing ? "PATCH" : "POST",
        json: body,
      });
      toast.success(editing ? "Assessment updated" : "Assessment created");
      router.push(`/staff/assessments/${saved.id}`);
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not save";
      setError(msg);
      toast.error(msg);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <Card>
        <CardBody className="grid gap-5 sm:grid-cols-2">
          <Field label="Title" htmlFor="title" className="sm:col-span-2">
            <Input id="title" name="title" required minLength={3} defaultValue={initial?.title} placeholder="e.g. Programming Assignment 2" />
          </Field>
          <Field label="Module" htmlFor="moduleId" hint={initial?.moduleLocked ? "Locked: students have already submitted work." : undefined}>
            <Select id="moduleId" name="moduleId" required defaultValue={initial?.moduleId ?? ""} disabled={initial?.moduleLocked}>
              <option value="" disabled>
                Choose a module
              </option>
              {programmes.map((p) => (
                <optgroup key={p.id} label={p.name}>
                  {p.modules.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.code} · {m.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </Select>
            {initial?.moduleLocked && <input type="hidden" name="moduleId" value={initial.moduleId} />}
          </Field>
          <Field
            label="Submission deadline"
            htmlFor="deadline"
            hint={
              editing
                ? `Times are in ${APP_TIMEZONE}. Changing the deadline re-checks the Late flag on existing submissions.`
                : `Times are in ${APP_TIMEZONE}.`
            }
          >
            <Input
              id="deadline"
              name="deadline"
              type="datetime-local"
              required
              defaultValue={toZonedInput(initial ? initial.deadline : addDays(new Date(), 14))}
            />
          </Field>
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
            {busy ? "Saving..." : editing ? "Save changes" : "Create assessment"}
          </Button>
        </div>
      </Card>
    </form>
  );
}
