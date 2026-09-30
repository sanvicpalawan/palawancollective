import { eq } from "drizzle-orm";
import { db } from "@/db";
import { uploadedFiles } from "@/db/schema";
import type { UploadedFile } from "@/db/schema";

/**
 * File storage in the database (hex-encoded in `uploaded_files`).
 *
 * This keeps the stack to a single backend — Postgres/Neon — which is what
 * makes the site deployable to serverless hosts (Vercel) where the
 * filesystem is read-only and ephemeral. Logos and media are small files,
 * so storing them alongside the content is a good fit; for very large media
 * libraries, swap these three functions for an S3-compatible bucket without
 * touching anything else (everything is referenced by /uploads/* URL).
 */

export async function saveUploadedFile(name: string, mime: string, data: Buffer): Promise<void> {
  await db
    .insert(uploadedFiles)
    .values({ name, mime, data: data.toString("hex"), size: data.length, createdAt: new Date() })
    .onConflictDoUpdate({
      target: uploadedFiles.name,
      set: { mime, data: data.toString("hex"), size: data.length, createdAt: new Date() },
    });
}

export async function getUploadedFile(name: string): Promise<UploadedFile | null> {
  const rows = await db.select().from(uploadedFiles).where(eq(uploadedFiles.name, name)).limit(1);
  return rows[0] ?? null;
}

export async function deleteUploadedFile(name: string): Promise<void> {
  await db.delete(uploadedFiles).where(eq(uploadedFiles.name, name));
}

/** Decode a stored row into a Buffer (null if the row is corrupt/missing). */
export function decodeUploadedFile(row: UploadedFile | null): Buffer | null {
  if (!row) return null;
  if (!/^[0-9a-fA-F]*$/.test(row.data)) return null;
  return Buffer.from(row.data, "hex");
}

/** Strip a /uploads/<name> URL down to its bare file name, or null if unsafe. */
export function uploadNameFromUrl(url: string): string | null {
  if (!url.startsWith("/uploads/")) return null;
  const name = url.replace("/uploads/", "");
  if (!name || name.includes("..") || name.includes("/")) return null;
  return name;
}
