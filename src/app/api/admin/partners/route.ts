import { unlink } from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { partners } from "@/db/schema";
import { getPartners, snapshot } from "@/lib/control";
import { deleteUploadedFile, saveUploadedFile, uploadNameFromUrl } from "@/lib/storage";
import { requireOps, withOpsRefresh } from "@/lib/ops-auth";

export const dynamic = "force-dynamic";

// Legacy disk location — cleaned for pre-Postgres files only.
const LEGACY_DIR = path.join(process.cwd(), "uploads");
const LOGO_MIMES = new Set(["image/svg+xml", "image/png", "image/jpeg", "image/webp"]);
// Leave headroom beneath Vercel's 4.5 MB function request-body limit.
const MAX_LOGO = 3_500_000;
const EXT_BY_MIME: Record<string, string> = {
  "image/svg+xml": ".svg",
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
};

function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function normalizeUrl(raw: string): string {
  const value = raw.trim();
  if (!value) return "";
  if (/^(https?:\/\/|mailto:)/i.test(value)) return value;
  if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(value)) return `https://${value}`;
  return value;
}

async function saveLogo(file: File): Promise<string> {
  if (!LOGO_MIMES.has(file.type)) throw new Error("Logo must be SVG, PNG, JPG or WebP.");
  if (file.size === 0) throw new Error("Logo file is empty.");
  if (file.size > MAX_LOGO) throw new Error("Logo must be under 3.5 MB after compression to fit Vercel's upload limit.");
  const buf = Buffer.from(await file.arrayBuffer());
  if (file.type === "image/svg+xml") {
    const head = buf.subarray(0, 512).toString("utf8").toLowerCase();
    if (!head.includes("<svg")) throw new Error("That file is not valid SVG.");
  }
  const filename = `partner-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}${EXT_BY_MIME[file.type]}`;
  await saveUploadedFile(filename, file.type, buf);
  return `/uploads/${filename}`;
}

async function removeUploadFile(url: string): Promise<void> {
  if (!url.startsWith("/uploads/partner-")) return;
  const name = uploadNameFromUrl(url);
  if (!name) return;
  await deleteUploadedFile(name).catch(() => undefined);
  await unlink(path.join(LEGACY_DIR, name)).catch(() => undefined);
}

/** List all partners (admin). */
export async function GET(request: Request) {
  const gate = await requireOps(request);
  if (gate.res) return gate.res;
  return withOpsRefresh(Response.json({ ok: true, partners: await getPartners() }), gate.refresh);
}

/** Create a partner. Multipart: name, url?, logo (file). */
export async function POST(request: Request) {
  const gate = await requireOps(request);
  if (gate.res) return gate.res;
  const form = await request.formData().catch(() => null);
  if (!form) return withOpsRefresh(Response.json({ ok: false, error: "Invalid request." }, { status: 400 }), gate.refresh);

  const name = str(form.get("name"), 80);
  if (!name) return withOpsRefresh(Response.json({ ok: false, error: "Name is required." }, { status: 400 }), gate.refresh);
  const file = form.get("logo");
  if (!(file instanceof File)) {
    return withOpsRefresh(Response.json({ ok: false, error: "A logo file is required." }, { status: 400 }), gate.refresh);
  }

  try {
    const logo = await saveLogo(file);
    const all = await getPartners();
    const [row] = await db
      .insert(partners)
      .values({
        name,
        logo,
        url: normalizeUrl(str(form.get("url"), 500)),
        position: typeof form.get("position") === "string" ? Number(form.get("position")) || all.length : all.length,
        visible: form.get("visible") !== "false",
      })
      .returning();
    await snapshot("partner", String(row.id), `Added partner “${row.name}”`, row);
    return withOpsRefresh(Response.json({ ok: true, partner: row }), gate.refresh);
  } catch (e) {
    return withOpsRefresh(
      Response.json({ ok: false, error: e instanceof Error ? e.message : "Upload failed." }, { status: 400 }),
      gate.refresh,
    );
  }
}

/** Update a partner. Multipart: name?, url?, position?, visible?, logo? (file to replace the logo). */
export async function PUT(request: Request) {
  const gate = await requireOps(request);
  if (gate.res) return gate.res;
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!id) return withOpsRefresh(Response.json({ ok: false, error: "Missing id." }, { status: 400 }), gate.refresh);
  const current = (await db.select().from(partners).where(eq(partners.id, id)).limit(1))[0];
  if (!current) return withOpsRefresh(Response.json({ ok: false, error: "Not found." }, { status: 404 }), gate.refresh);

  const form = await request.formData().catch(() => null);
  if (!form) return withOpsRefresh(Response.json({ ok: false, error: "Invalid request." }, { status: 400 }), gate.refresh);
  await snapshot("partner", String(id), `Before editing “${current.name}”`, current);

  const patch: { name?: string; url?: string; position?: number; visible?: boolean; logo?: string } = {};
  const name = str(form.get("name"), 80);
  if (name && name !== current.name) patch.name = name;
  if (form.has("url")) patch.url = normalizeUrl(str(form.get("url"), 500));
  if (typeof form.get("position") === "string") patch.position = Number(form.get("position")) || 0;
  if (typeof form.get("visible") === "string") patch.visible = form.get("visible") !== "false";
  const file = form.get("logo");
  if (file instanceof File && file.size > 0) {
    try {
      const logo = await saveLogo(file);
      if (current.logo.startsWith("/uploads/partner-")) await removeUploadFile(current.logo);
      patch.logo = logo;
    } catch (e) {
      return withOpsRefresh(Response.json({ ok: false, error: e instanceof Error ? e.message : "Logo upload failed." }, { status: 400 }), gate.refresh);
    }
  }

  const [row] = await db.update(partners).set(patch).where(eq(partners.id, id)).returning();
  return withOpsRefresh(Response.json({ ok: true, partner: row }), gate.refresh);
}

/** Reorder: POST body { reorder: number[] } (also handled by PUT with a form field). */
export async function DELETE(request: Request) {
  const gate = await requireOps(request);
  if (gate.res) return gate.res;
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!id) return withOpsRefresh(Response.json({ ok: false, error: "Missing id." }, { status: 400 }), gate.refresh);
  const current = (await db.select().from(partners).where(eq(partners.id, id)).limit(1))[0];
  if (current) {
    await snapshot("partner", String(id), `Deleted “${current.name}”`, current);
    await removeUploadFile(current.logo);
    await db.delete(partners).where(eq(partners.id, id));
  }
  return withOpsRefresh(Response.json({ ok: true }), gate.refresh);
}
