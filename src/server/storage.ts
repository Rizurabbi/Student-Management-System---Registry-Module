import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

// Local-disk storage behind a tiny interface. In production this file is the only
// thing to swap for S3 / Azure Blob / GCS. Files live OUTSIDE public/, and are only
// served through an authorised API route.

const root = () => path.resolve(process.cwd(), process.env.UPLOAD_DIR || "./uploads");

function safeKey(key: string) {
  if (key !== path.basename(key)) throw new Error("Invalid storage key");
  return path.join(root(), key);
}

export async function saveFile(bytes: Uint8Array, ext: string): Promise<string> {
  await fs.mkdir(root(), { recursive: true });
  const key = `${randomUUID()}${ext}`;
  await fs.writeFile(safeKey(key), bytes);
  return key;
}

export async function readFile(key: string): Promise<Buffer> {
  return fs.readFile(safeKey(key));
}

export async function removeFile(key: string): Promise<void> {
  await fs.unlink(safeKey(key)).catch(() => undefined);
}
