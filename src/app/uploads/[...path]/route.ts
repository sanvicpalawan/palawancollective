import { createReadStream, promises as fs } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { decodeUploadedFile, getUploadedFile } from "@/lib/storage";

/**
 * Serves operator-uploaded files at /uploads/<name>.
 *
 * Files live in Postgres (`uploaded_files`) so the site works on serverless
 * hosts (Vercel) with a read-only filesystem. Legacy disk copies in
 * ./uploads and ./public/uploads are still served for anything uploaded
 * before the move to database storage.
 */
export const dynamic = "force-dynamic";

const ROOT = path.join(process.cwd(), "uploads");
const LEGACY = path.join(process.cwd(), "public", "uploads");

const TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
};

async function serveFromDisk(file: string): Promise<Response | null> {
  try {
    const st = await fs.stat(file);
    if (!st.isFile()) return null;
    const ext = path.extname(file).toLowerCase();
    const stream = Readable.toWeb(createReadStream(file)) as ReadableStream<Uint8Array>;
    return new Response(stream, {
      headers: {
        "Content-Type": TYPES[ext] ?? "application/octet-stream",
        "Content-Length": String(st.size),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return null;
  }
}

export async function GET(_request: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path: parts } = await ctx.params;
  if (!Array.isArray(parts) || parts.length !== 1) {
    return new Response("Not found", { status: 404 });
  }
  const name = parts[0];
  if (!name || name.includes("..") || name.includes("/") || name.includes("\\") || !/^[a-z0-9][a-z0-9._-]*$/i.test(name)) {
    return new Response("Not found", { status: 404 });
  }
  const primary = path.join(ROOT, name);
  if (!primary.startsWith(ROOT + path.sep)) return new Response("Not found", { status: 404 });

  // 1) legacy disk copies
  const onDisk = (await serveFromDisk(primary)) ?? (await serveFromDisk(path.join(LEGACY, name)));
  if (onDisk) return onDisk;

  // 2) database (Vercel / fresh environments)
  const row = await getUploadedFile(name).catch(() => null);
  const data = decodeUploadedFile(row);
  if (row && data) {
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": row.mime,
        "Content-Length": String(row.size),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  return new Response("Not found", { status: 404 });
}
