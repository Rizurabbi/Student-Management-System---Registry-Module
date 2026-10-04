// Central place for every business threshold, so reviewers can find them fast.

export const CURRENCY = "USD";
export const APP_TIMEZONE = process.env.NEXT_PUBLIC_APP_TIMEZONE || "Asia/Dhaka";

export const PASS_MARK = 40;
export const MERIT_MARK = 60;
export const DISTINCTION_MARK = 70;

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB
export const ALLOWED_EXTENSIONS = [".pdf", ".docx"] as const;
export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export const DEFAULT_FEE_DUE_DAYS = 30;
export const PAGE_SIZE = 10;

export const MIN_STUDENT_AGE = 15;
export const MAX_STUDENT_AGE = 100;

export const STATUS_LABEL = {
  ENROLLED: "Enrolled",
  DEFERRED: "Deferred",
  WITHDRAWN: "Withdrawn",
  COMPLETED: "Completed",
} as const;

export const STATUSES = Object.keys(STATUS_LABEL) as (keyof typeof STATUS_LABEL)[];
