import { unlink } from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { snapshot } from "@/lib/control";
import { deleteUploadedFile, saveUploadedFile, uploadNameFromUrl } from "@/lib/storage";
import { requireOps, withOpsRefresh } from "@/lib/ops-auth";

export const dynamic = "force-dynamic";

// Legacy disk location — only read/cleaned for files uploaded before the
// move to database storage (Vercel's filesystem is read-only; new files go to Postgres).
const LEGACY_DIR = path.join(process.cwd(), "uploads");
const LOGO_MIMES = new Set(["image/svg+xml", "image/png", "image/jpeg", "image/webp"]);
// Keep uploads below Vercel Functions' 4.5 MB total request-body limit.
const MAX_LOGO = 3_500_000;

const EXT_BY_MIME: Record<string, string> = {
  "image/svg+xml": ".svg",
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
};

async function currentLogoUrl(): Promise<string> {
  const rows = await db.select().from(siteSettings).where(eq(siteSettings.key, "site_logo")).limit(1);
  const v = rows[0]?.value;
  return typeof v === "string" ? v : "";
}

async function setLogoUrl(url: string): Promise<void> {
  await db
    .insert(siteSettings)
    .values({ key: "site_logo", value: url, updatedAt: new Date() })
    .onConflictDoUpdate({ target: siteSettings.key, set: { value: url, updatedAt: new Date() } });
}

async function removeUploadFile(url: string): Promise<void> {
  const name = uploadNameFromUrl(url);
  if (!name) return;
  // New files live in Postgres; also sweep any legacy disk copy.
  await deleteUploadedFile(name).catch(() => undefined);
  await unlink(path.join(LEGACY_DIR, name)).catch(() => undefined);
}

/** Upload (or replace) the site logo. Original file is kept — display size is controlled in admin. */
export async function POST(request: Request) {
  const gate = await requireOps(request);
  if (gate.res) return gate.res;
  const form = await request.formData().catch(() => null);
  const file = form?.get("logo");
  if (!(file instanceof File) || file.size === 0) {
    return withOpsRefresh(Response.json({ ok: false, error: "No file received." }, { status: 400 }), gate.refresh);
  }
  if (!LOGO_MIMES.has(file.type)) {
    return withOpsRefresh(
      Response.json({ ok: false, error: "Use SVG, PNG, JPG or WebP." }, { status: 400 }),
      gate.refresh,
    );
  }
  if (file.size > MAX_LOGO) {
    return withOpsRefresh(Response.json({ ok: false, error: "Logo must be under 3.5 MB after compression to fit Vercel's upload limit." }, { status: 400 }), gate.refresh);
  }

  const buf = Buffer.from(await file.arrayBuffer());
  if (file.type === "image/svg+xml") {
    const head = buf.subarray(0, 512).toString("utf8").toLowerCase();
    if (!head.includes("<svg")) {
      return withOpsRefresh(Response.json({ ok: false, error: "That file is not valid SVG." }, { status: 400 }), gate.refresh);
    }
  }

  const filename = `logo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}${EXT_BY_MIME[file.type]}`;
  await saveUploadedFile(filename, file.type, buf);

  const previous = await currentLogoUrl();
  const url = `/uploads/${filename}`;
  await setLogoUrl(url);
  if (previous && previous !== url) await removeUploadFile(previous);
  await snapshot("settings", "site_logo", "Logo uploaded", { url });

  return withOpsRefresh(Response.json({ ok: true, url }), gate.refresh);
}

/** Remove the site logo (reverts header/footer to the wordmark). */
export async function DELETE(request: Request) {
  const gate = await requireOps(request);
  if (gate.res) return gate.res;
  const previous = await currentLogoUrl();
  await setLogoUrl("");
  if (previous) await removeUploadFile(previous);
  await snapshot("settings", "site_logo", "Logo removed", { url: "" });
  return withOpsRefresh(Response.json({ ok: true }), gate.refresh);
}
