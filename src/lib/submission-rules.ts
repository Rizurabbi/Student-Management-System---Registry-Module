import { ALLOWED_EXTENSIONS, MAX_UPLOAD_BYTES } from "./constants";

// ---- Timing rules (all decided with the SERVER clock, never the browser) ----
//
// Before deadline: submit, or replace an earlier file (resubmission).
// After deadline:  the FIRST submission is accepted and flagged Late.
//                  Any further resubmission is refused.

export type SubmissionDecision =
  | { ok: true; mode: "create" | "replace"; isLate: boolean }
  | { ok: false; reason: string };

export function decideSubmission(input: {
  now: Date;
  deadline: Date;
  hasExisting: boolean;
}): SubmissionDecision {
  const afterDeadline = input.now.getTime() > input.deadline.getTime();
  if (input.hasExisting && afterDeadline) {
    return {
      ok: false,
      reason: "The deadline has passed, so your existing submission can no longer be replaced.",
    };
  }
  return {
    ok: true,
    mode: input.hasExisting ? "replace" : "create",
    isLate: afterDeadline,
  };
}

// ---- File validation ----
// We check extension AND the real file signature (magic bytes), because a
// browser-supplied MIME type or filename is easy to fake.

export type UploadCheck = { ok: true; ext: ".pdf" | ".docx"; mime: string } | { ok: false; reason: string };

export function validateUpload(file: { name: string; size: number; bytes: Uint8Array }): UploadCheck {
  if (file.size === 0) return { ok: false, reason: "The file is empty." };
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, reason: `The file is larger than ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.` };
  }
  const lower = file.name.toLowerCase();
  const ext = ALLOWED_EXTENSIONS.find((e) => lower.endsWith(e));
  if (!ext) return { ok: false, reason: "Only PDF or DOCX files are accepted." };

  const b = file.bytes;
  if (ext === ".pdf") {
    const isPdf = b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46; // %PDF
    if (!isPdf) return { ok: false, reason: "This file is not a valid PDF." };
    return { ok: true, ext, mime: "application/pdf" };
  }
  const isZip = b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04; // PK..
  if (!isZip) return { ok: false, reason: "This file is not a valid DOCX." };
  return {
    ok: true,
    ext,
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  };
}
