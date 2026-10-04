import { describe, expect, it } from "vitest";
import { decideSubmission, validateUpload } from "@/lib/submission-rules";
import { MAX_UPLOAD_BYTES } from "@/lib/constants";

const deadline = new Date("2026-06-15T12:00:00Z");
const before = new Date("2026-06-15T11:59:59Z");
const after = new Date("2026-06-15T12:00:01Z");

describe("decideSubmission", () => {
  it("accepts a first submission before the deadline as on time", () => {
    expect(decideSubmission({ now: before, deadline, hasExisting: false })).toEqual({ ok: true, mode: "create", isLate: false });
  });
  it("lets a student replace their file before the deadline", () => {
    expect(decideSubmission({ now: before, deadline, hasExisting: true })).toEqual({ ok: true, mode: "replace", isLate: false });
  });
  it("accepts a first submission after the deadline but flags it Late", () => {
    expect(decideSubmission({ now: after, deadline, hasExisting: false })).toEqual({ ok: true, mode: "create", isLate: true });
  });
  it("blocks resubmission once the deadline has passed", () => {
    const r = decideSubmission({ now: after, deadline, hasExisting: true });
    expect(r.ok).toBe(false);
  });
  it("treats submitting exactly at the deadline as on time", () => {
    expect(decideSubmission({ now: deadline, deadline, hasExisting: false })).toMatchObject({ ok: true, isLate: false });
  });
});

const pdf = new TextEncoder().encode("%PDF-1.4 fake body");
const zip = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0, 0]);

describe("validateUpload", () => {
  it("accepts a real PDF and a real DOCX signature", () => {
    expect(validateUpload({ name: "work.PDF", size: pdf.length, bytes: pdf })).toMatchObject({ ok: true, ext: ".pdf" });
    expect(validateUpload({ name: "work.docx", size: zip.length, bytes: zip })).toMatchObject({ ok: true, ext: ".docx" });
  });
  it("rejects other extensions", () => {
    expect(validateUpload({ name: "work.exe", size: 10, bytes: pdf }).ok).toBe(false);
    expect(validateUpload({ name: "work.doc", size: 10, bytes: zip }).ok).toBe(false);
  });
  it("rejects a file renamed to .pdf whose content is not a PDF", () => {
    const r = validateUpload({ name: "sneaky.pdf", size: 4, bytes: new TextEncoder().encode("MZ..") });
    expect(r.ok).toBe(false);
  });
  it("rejects empty and oversized files", () => {
    expect(validateUpload({ name: "a.pdf", size: 0, bytes: new Uint8Array() }).ok).toBe(false);
    expect(validateUpload({ name: "a.pdf", size: MAX_UPLOAD_BYTES + 1, bytes: pdf }).ok).toBe(false);
  });
});
