"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, Td, Th } from "@/components/ui/table";
import { ClassificationBadge } from "./classification-badge";
import { LateBadge } from "@/components/assessments/late-badge";
import { StatusBadge } from "@/components/students/status-badge";
import { apiFetch } from "@/lib/client";
import { classify } from "@/lib/classification";
import { formatDateTime } from "@/lib/dates";
import type { STATUS_LABEL } from "@/lib/constants";

type Row = {
  student: { id: string; fullName: string; studentNumber: string; status: keyof typeof STATUS_LABEL };
  submission: { isLate: boolean; submittedAt: string } | null;
  grade: { id: string; score: number; published: boolean; feedback: string | null } | null;
};

export function GradeGrid({ assessmentId, rows }: { assessmentId: string; rows: Row[] }) {
  const router = useRouter();
  const [scores, setScores] = useState<Record<string, string>>(() =>
    Object.fromEntries(rows.map((r) => [r.student.id, r.grade ? String(r.grade.score) : ""])),
  );
  const [feedback, setFeedback] = useState<Record<string, string>>(() =>
    Object.fromEntries(rows.map((r) => [r.student.id, r.grade?.feedback ?? ""])),
  );
  const [busy, setBusy] = useState<string | null>(null);

  const parsed = (id: string) => {
    const v = scores[id]?.trim();
    if (!v) return { empty: true as const };
    const n = Number(v);
    return { empty: false as const, n, valid: Number.isFinite(n) && n >= 0 && n <= 100 };
  };

  const dirty = useMemo(
    () =>
      rows.filter((r) => {
        const p = parsed(r.student.id);
        if (p.empty) return false;
        const fb = feedback[r.student.id] ?? "";
        return !r.grade || r.grade.score !== p.n || (r.grade.feedback ?? "") !== fb;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows, scores, feedback],
  );
  const invalid = rows.some((r) => {
    const p = parsed(r.student.id);
    return !p.empty && !p.valid;
  });
  const dirtyIds = new Set(dirty.map((r) => r.student.id));
  const savedCount = rows.filter((r) => r.grade).length;
  const publishedCount = rows.filter((r) => r.grade?.published).length;

  async function save() {
    setBusy("save");
    try {
      const grades = dirty.map((r) => {
        const p = parsed(r.student.id);
        return { studentId: r.student.id, score: p.empty ? 0 : p.n, feedback: feedback[r.student.id]?.trim() || null };
      });
      const res = await apiFetch<{ saved: number; unpublished: number }>(`/api/assessments/${assessmentId}/grades`, {
        method: "PUT",
        json: { grades },
      });
      toast.success(`Saved ${res.saved} grade${res.saved === 1 ? "" : "s"}`);
      if (res.unpublished > 0) {
        toast.warning(`${res.unpublished} published grade${res.unpublished === 1 ? " was" : "s were"} changed, so now withheld. Publish again after review.`);
      }
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save grades");
    } finally {
      setBusy(null);
    }
  }

  async function toggle(gradeId: string, published: boolean) {
    setBusy(gradeId);
    try {
      await apiFetch(`/api/grades/${gradeId}/publish`, { method: "POST", json: { published } });
      toast.success(published ? "Result published" : "Result withheld");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update");
    } finally {
      setBusy(null);
    }
  }

  async function bulk(published: boolean) {
    setBusy("bulk");
    try {
      const res = await apiFetch<{ changed: number }>(`/api/assessments/${assessmentId}/publish`, { method: "POST", json: { published } });
      toast.success(`${res.changed} result${res.changed === 1 ? "" : "s"} ${published ? "published" : "withheld"}`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
        <p className="text-sm text-slate-500">
          {savedCount} of {rows.length} graded · {publishedCount} published
          {dirty.length > 0 && <span className="ml-2 font-medium text-amber-700">{dirty.length} unsaved</span>}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => bulk(false)} disabled={busy !== null || publishedCount === 0}>
            <EyeOff className="h-3.5 w-3.5" /> Withhold all
          </Button>
          <Button variant="secondary" size="sm" onClick={() => bulk(true)} disabled={busy !== null || dirty.length > 0 || savedCount === publishedCount}>
            <Eye className="h-3.5 w-3.5" /> Publish all graded
          </Button>
          <Button size="sm" onClick={save} disabled={busy !== null || dirty.length === 0 || invalid}>
            <Save className="h-3.5 w-3.5" /> {busy === "save" ? "Saving..." : "Save grades"}
          </Button>
        </div>
      </div>
      <Table>
        <thead>
          <tr>
            <Th>Student</Th>
            <Th>Submission</Th>
            <Th className="w-28">Score (0-100)</Th>
            <Th>Result</Th>
            <Th>Feedback</Th>
            <Th>Visibility</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const id = r.student.id;
            const p = parsed(id);
            const isDirty = dirtyIds.has(id);
            return (
              <tr key={id} className={isDirty ? "bg-amber-50/40" : undefined}>
                <Td>
                  <p className="font-medium text-slate-900">{r.student.fullName}</p>
                  <p className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono">{r.student.studentNumber}</span>
                    {r.student.status !== "ENROLLED" && <StatusBadge status={r.student.status} />}
                  </p>
                </Td>
                <Td>
                  {r.submission ? (
                    <div className="space-y-1">
                      <p className="text-xs text-slate-500">{formatDateTime(r.submission.submittedAt)}</p>
                      {r.submission.isLate && <LateBadge />}
                    </div>
                  ) : (
                    <Badge>No submission</Badge>
                  )}
                </Td>
                <Td>
                  <Input
                    aria-label={`Score for ${r.student.fullName}`}
                    inputMode="decimal"
                    className={`h-9 w-24 ${!p.empty && !p.valid ? "border-red-400 ring-2 ring-red-200" : ""}`}
                    value={scores[id] ?? ""}
                    onChange={(e) => setScores((s) => ({ ...s, [id]: e.target.value }))}
                    placeholder="-"
                  />
                </Td>
                <Td>{!p.empty && p.valid ? <ClassificationBadge value={classify(p.n)} /> : <span className="text-slate-300">-</span>}</Td>
                <Td>
                  <Input
                    aria-label={`Feedback for ${r.student.fullName}`}
                    className="h-9 min-w-[180px]"
                    value={feedback[id] ?? ""}
                    onChange={(e) => setFeedback((s) => ({ ...s, [id]: e.target.value }))}
                    placeholder="Optional"
                    maxLength={500}
                  />
                </Td>
                <Td>
                  {!r.grade ? (
                    <Badge>Not graded</Badge>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Badge tone={r.grade.published ? "green" : "amber"}>{r.grade.published ? "Published" : "Withheld"}</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={busy !== null || isDirty}
                        onClick={() => toggle(r.grade!.id, !r.grade!.published)}
                        title={isDirty ? "Save changes first" : undefined}
                      >
                        {r.grade.published ? "Withhold" : "Publish"}
                      </Button>
                    </div>
                  )}
                </Td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
}
