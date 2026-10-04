import { unlink } from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import sharp from "sharp";
import { db } from "@/db";
import { mediaAssets } from "@/db/schema";
import { getMedia } from "@/lib/control";
import { deleteUploadedFile, saveUploadedFile, uploadNameFromUrl } from "@/lib/storage";
import { requireOps, withOpsRefresh } from "@/lib/ops-auth";

export const dynamic = "force-dynamic";

// Legacy disk location — cleaned for pre-Postgres files only.
const LEGACY_DIR = path.join(process.cwd(), "uploads");
const IMAGE_MIMES = new Set(["image/jpeg", "image/png", "image/webp"]);
const VIDEO_MIMES = new Set(["video/mp4"]);
// A Vercel Function accepts request bodies up to 4.5 MB. Keep the total
// multipart payload below that ceiling, including form fields and boundaries.
const MAX_REQUEST_UPLOAD = 3_500_000;
const MAX_IMAGE = MAX_REQUEST_UPLOAD;
const MAX_VIDEO = MAX_REQUEST_UPLOAD;

function slugFilename(name: string): string {
  const clean = name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/-+/g, "-").slice(0, 60);
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}-${clean || "file"}`;
}

export async function GET(request: Request) {
  const gate = await requireOps(request);
  if (gate.res) return gate.res;
  const rows = await getMedia();
  return withOpsRefresh(Response.json({ ok: true, media: rows }), gate.refresh);
}

export async function POST(request: Request) {
  const gate = await requireOps(request);
  if (gate.res) return gate.res;
  const form = await request.formData().catch(() => null);
  if (!form) return withOpsRefresh(Response.json({ ok: false, error: "Invalid upload." }, { status: 400 }), gate.refresh);

  const tagsRaw = form.get("tags");
  const tags =
    typeof tagsRaw === "string"
      ? tagsRaw.split(",").map((t) => t.trim().slice(0, 32)).filter(Boolean).slice(0, 12)
      : [];

  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return withOpsRefresh(Response.json({ ok: false, error: "No files received." }, { status: 400 }), gate.refresh);
  }
  if (files.length > 10) {
    return withOpsRefresh(Response.json({ ok: false, error: "Max 10 files at a time." }, { status: 400 }), gate.refresh);
  }
  if (files.reduce((sum, file) => sum + file.size, 0) > MAX_REQUEST_UPLOAD) {
    return withOpsRefresh(
      Response.json({ ok: false, error: "Upload files one at a time; each Vercel request must stay under 3.5 MB." }, { status: 413 }),
      gate.refresh,
    );
  }

  const saved: Array<{ id: number; url: string }> = [];

  for (const file of files) {
    const mime = file.type;
    const isImage = IMAGE_MIMES.has(mime);
    const isVideo = VIDEO_MIMES.has(mime);
    if (!isImage && !isVideo) continue;
    if (isImage && file.size > MAX_IMAGE) continue;
    if (isVideo && file.size > MAX_VIDEO) continue;

    const buf = Buffer.from(await file.arrayBuffer());
    let out = buf;
    let width: number | null = null;
    let height: number | null = null;
    let filename = slugFilename(file.name);
    let outMime = mime;

    if (isImage) {
      try {
        const pipeline = sharp(buf, { failOn: "none" }).rotate().resize({ width: 1920, withoutEnlargement: true });
        const meta = await pipeline.metadata();
        width = meta.width ?? null;
        height = meta.height ?? null;
        if (mime === "image/png") {
          out = await pipeline.png({ compressionLevel: 8 }).toBuffer();
          if (!filename.endsWith(".png")) filename += ".png";
        } else if (mime === "image/webp") {
          out = await pipeline.webp({ quality: 82 }).toBuffer();
          if (!filename.endsWith(".webp")) filename += ".webp";
        } else {
          out = await pipeline.jpeg({ quality: 82, mozjpeg: true }).toBuffer();
          if (!/\.(jpe?g)$/.test(filename)) filename += ".jpg";
          outMime = "image/jpeg";
        }
      } catch {
        continue; // unreadable image — skip rather than store garbage
      }
    }

    await saveUploadedFile(filename, outMime, out);
    const url = `/uploads/${filename}`;
    const [row] = await db
      .insert(mediaAssets)
      .values({ filename, url, mime: outMime, size: out.length, width, height, tags })
      .returning({ id: mediaAssets.id, url: mediaAssets.url });
    saved.push(row);
  }

  if (saved.length === 0) {
    return withOpsRefresh(
      Response.json({ ok: false, error: "Nothing saved. Use JPG, PNG, WebP or MP4 under 3.5 MB per request." }, { status: 400 }),
      gate.refresh,
    );
  }
  return withOpsRefresh(Response.json({ ok: true, saved }), gate.refresh);
}

export async function PUT(request: Request) {
  const gate = await requireOps(request);
  if (gate.res) return gate.res;
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!id) return withOpsRefresh(Response.json({ ok: false, error: "Missing id." }, { status: 400 }), gate.refresh);
  const body = (await request.json().catch(() => ({}))) as { tags?: unknown };
  const tags = Array.isArray(body.tags)
    ? body.tags.filter((t): t is string => typeof t === "string").map((t) => t.trim().slice(0, 32)).filter(Boolean).slice(0, 12)
    : [];
  await db.update(mediaAssets).set({ tags }).where(eq(mediaAssets.id, id));
  return withOpsRefresh(Response.json({ ok: true, tags }), gate.refresh);
}

export async function DELETE(request: Request) {
  const gate = await requireOps(request);
  if (gate.res) return gate.res;
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!id) return withOpsRefresh(Response.json({ ok: false, error: "Missing id." }, { status: 400 }), gate.refresh);
  const rows = await db.select().from(mediaAssets).where(eq(mediaAssets.id, id)).limit(1);
  const asset = rows[0];
  if (asset && asset.url.startsWith("/uploads/")) {
    const name = uploadNameFromUrl(asset.url);
    if (name) {
      await deleteUploadedFile(name).catch(() => undefined);
      await unlink(path.join(LEGACY_DIR, name)).catch(() => undefined);
      await unlink(path.join(process.cwd(), "public", "uploads", name)).catch(() => undefined);
    }
  }
  await db.delete(mediaAssets).where(eq(mediaAssets.id, id));
  return withOpsRefresh(Response.json({ ok: true }), gate.refresh);
}
