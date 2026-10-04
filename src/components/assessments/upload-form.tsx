"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/client";
import { MAX_UPLOAD_BYTES } from "@/lib/constants";

export function UploadForm({ assessmentId, hasSubmission, isOpen }: { assessmentId: string; hasSubmission: boolean; isOpen: boolean }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function pick(f: File | null) {
    setError(null);
    if (f && f.size > MAX_UPLOAD_BYTES) {
      setError(`That file is larger than ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.`);
      return setFile(null);
    }
    if (f && !/\.(pdf|docx)$/i.test(f.name)) {
      setError("Only PDF or DOCX files are accepted.");
      return setFile(null);
    }
    setFile(f);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      body.set("file", file);
      const res = await apiFetch<{ isLate: boolean }>(`/api/assessments/${assessmentId}/submissions`, { method: "POST", body });
      toast.success(res.isLate ? "Submitted, and marked as late" : hasSubmission ? "Submission replaced" : "Submitted");
      setFile(null);
      if (input.current) input.current.value = "";
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-8 text-center transition hover:border-brand-500 hover:bg-brand-50/40">
        <FileUp className="h-6 w-6 text-slate-400" />
        <span className="text-sm font-medium text-slate-700">{file ? file.name : "Choose a PDF or DOCX file"}</span>
        <span className="text-xs text-slate-500">Up to {MAX_UPLOAD_BYTES / 1024 / 1024} MB</span>
        <input
          ref={input}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="sr-only"
          onChange={(e) => pick(e.target.files?.[0] ?? null)}
        />
      </label>
      {!isOpen && !hasSubmission && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          The deadline has passed. You can still submit once, but it will be marked as late and cannot be replaced.
        </p>
      )}
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" disabled={!file || busy}>
        {busy ? "Uploading..." : hasSubmission ? "Replace submission" : "Submit work"}
      </Button>
    </form>
  );
}
