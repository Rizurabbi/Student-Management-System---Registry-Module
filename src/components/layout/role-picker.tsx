"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ShieldCheck, UserRound, ArrowRight } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/client";
import { STATUS_LABEL } from "@/lib/constants";

type PickerStudent = { id: string; fullName: string; studentNumber: string; status: keyof typeof STATUS_LABEL; programme: string };

const tone = { ENROLLED: "green", DEFERRED: "amber", WITHDRAWN: "red", COMPLETED: "blue" } as const;

export function RolePicker({ students }: { students: PickerStudent[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function enter(body: { role: "staff" } | { role: "student"; studentId: string }, key: string) {
    setBusy(key);
    try {
      await apiFetch("/api/session", { method: "POST", json: body });
      router.push(body.role === "staff" ? "/staff" : "/student");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not switch role");
      setBusy(null);
    }
  }

  return (
    <div className="space-y-5">
      <button
        onClick={() => enter({ role: "staff" }, "staff")}
        disabled={busy !== null}
        className="group flex w-full items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-brand-500 hover:shadow-md disabled:opacity-60"
      >
        <div className="rounded-lg bg-brand-50 p-3 text-brand-600">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <p className="font-semibold">Registry staff</p>
          <p className="text-sm text-slate-500">Dashboard, students, fees, assessments and marksheets</p>
        </div>
        <ArrowRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600" />
      </button>

      <Card>
        <CardHeader title="Or view as a student" description="Pick a student to see exactly what they see." />
        <CardBody className="p-0">
          <ul className="divide-y divide-slate-100">
            {students.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => enter({ role: "student", studentId: s.id }, s.id)}
                  disabled={busy !== null}
                  className="flex w-full items-center gap-3 px-5 py-3 text-left transition hover:bg-slate-50 disabled:opacity-60"
                >
                  <UserRound className="h-4 w-4 text-slate-400" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{s.fullName}</p>
                    <p className="text-xs text-slate-500">
                      {s.studentNumber} · {s.programme}
                    </p>
                  </div>
                  <Badge tone={tone[s.status]}>{STATUS_LABEL[s.status]}</Badge>
                </button>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
