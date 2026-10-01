import { unlink } from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { teamMembers } from "@/db/schema";
import type { TeamMember } from "@/db/schema";
import { getTeam, snapshot } from "@/lib/control";
import { num, raw, str } from "@/lib/content-shape";
import { deleteUploadedFile, saveUploadedFile, uploadNameFromUrl } from "@/lib/storage";
import { requireOps, withOpsRefresh } from "@/lib/ops-auth";

export const dynamic = "force-dynamic";

/**
 * Dream Team CRUD (Ops console → Dream team).
 *
 * Multipart in, JSON out — the same contract the partners wall uses, so a row
 * can be created with either an uploaded photo or a path/URL typed in by hand.
 * Uploads land in Postgres under `/uploads/team-*` and are deleted with the row.
 */

// Legacy disk location — cleaned for pre-Postgres files only.
const LEGACY_DIR = path.join(process.cwd(), "uploads");
const PHOTO_MIMES = new Set(["image/png", "image/jpeg", "image/webp", "image/avif"]);
const MAX_PHOTO = 12 * 1024 * 1024;
const EXT_BY_MIME: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/avif": ".avif",
};

function boolField(form: FormData, key: string, fallback: boolean): boolean {
  const v = form.get(key);
  if (typeof v !== "string") return fallback;
  return v !== "false";
}

function normalizeUrl(rawValue: string): string {
  const value = rawValue.trim();
  if (!value) return "";
  if (/^(https?:\/\/|mailto:|tel:|\/)/i.test(value)) return value;
  if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(value)) return `https://${value}`;
  return value;
}

/** A photo field typed into the panel: repo path, /uploads path, or https URL. */
function normalizePhoto(value: string): string {
  const v = value.trim();
  if (!v) return "";
  if (v.startsWith("/") || /^(https?:)?\/\//i.test(v)) return v;
  // Bare filename — assume it lives beside the rest of the team photos.
  if (/^[\w.-]+\.(png|jpe?g|webp|avif|svg)$/i.test(v)) return `/images/team/${v}`;
  return v;
}

async function savePhoto(file: File): Promise<string> {
  if (!PHOTO_MIMES.has(file.type)) throw new Error("Photo must be PNG, JPG, WebP or AVIF.");
  if (file.size === 0) throw new Error("Photo file is empty.");
  if (file.size > MAX_PHOTO) throw new Error("Photo must be ≤12MB.");
  const buf = Buffer.from(await file.arrayBuffer());
  const filename = `team-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}${EXT_BY_MIME[file.type]}`;
  await saveUploadedFile(filename, file.type, buf);
  return `/uploads/${filename}`;
}

async function removeUploadFile(url: string): Promise<void> {
  if (!url.startsWith("/uploads/team-")) return;
  const name = uploadNameFromUrl(url);
  if (!name) return;
  await deleteUploadedFile(name).catch(() => undefined);
  await unlink(path.join(LEGACY_DIR, name)).catch(() => undefined);
}

/** Fields shared by create + update. `null` means "not supplied". */
function readFields(form: FormData) {
  const has = (k: string) => form.get(k) !== null;
  return {
    name: str(form.get("name"), 80),
    role: has("role") ? str(form.get("role"), 80) : null,
    location: has("location") ? str(form.get("location"), 80) : null,
    bio: has("bio") ? raw(form.get("bio"), 4000) : null,
    photoAlt: has("photoAlt") ? str(form.get("photoAlt"), 200) : null,
    url: has("url") ? normalizeUrl(str(form.get("url"), 500)) : null,
    photoPath: has("photo") ? normalizePhoto(str(form.get("photo"), 500)) : null,
    position: has("position") ? num(form.get("position"), 0) : null,
    visible: has("visible") ? boolField(form, "visible", true) : null,
  };
}

/** List every member, hidden ones included (admin). */
export async function GET(request: Request) {
  const gate = await requireOps(request);
  if (gate.res) return gate.res;
  return withOpsRefresh(Response.json({ ok: true, team: await getTeam() }), gate.refresh);
}

/** Create a member. Fields: name, role?, location?, bio?, photo? (path/URL), photoFile? (upload), url?, position?, visible? */
export async function POST(request: Request) {
  const gate = await requireOps(request);
  if (gate.res) return gate.res;
  const form = await request.formData().catch(() => null);
  if (!form) return withOpsRefresh(Response.json({ ok: false, error: "Invalid request." }, { status: 400 }), gate.refresh);

  const f = readFields(form);
  if (!f.name) return withOpsRefresh(Response.json({ ok: false, error: "Name is required." }, { status: 400 }), gate.refresh);

  let photo = f.photoPath ?? "";
  const file = form.get("photoFile");
  try {
    if (file instanceof File && file.size > 0) photo = await savePhoto(file);
  } catch (e) {
    return withOpsRefresh(
      Response.json({ ok: false, error: e instanceof Error ? e.message : "Upload failed." }, { status: 400 }),
      gate.refresh,
    );
  }

  try {
    const all = await getTeam();
    const [row] = await db
      .insert(teamMembers)
      .values({
        name: f.name,
        role: f.role ?? "",
        location: f.location ?? "",
        bio: f.bio ?? "",
        photo,
        photoAlt: f.photoAlt ?? "",
        url: f.url ?? "",
        position: f.position ?? all.length,
        visible: f.visible ?? true,
      })
      .returning();
    await snapshot("team", String(row.id), `Added “${row.name}” to the Dream Team`, row);
    return withOpsRefresh(Response.json({ ok: true, member: row }), gate.refresh);
  } catch (e) {
    return withOpsRefresh(
      Response.json({ ok: false, error: e instanceof Error ? e.message : "Save failed." }, { status: 400 }),
      gate.refresh,
    );
  }
}

/** Update a member: ?id= + the same fields. A `photoFile` replaces the photo. */
export async function PUT(request: Request) {
  const gate = await requireOps(request);
  if (gate.res) return gate.res;
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!id) return withOpsRefresh(Response.json({ ok: false, error: "Missing id." }, { status: 400 }), gate.refresh);
  const current = (await db.select().from(teamMembers).where(eq(teamMembers.id, id)).limit(1))[0];
  if (!current) return withOpsRefresh(Response.json({ ok: false, error: "Not found." }, { status: 404 }), gate.refresh);

  const form = await request.formData().catch(() => null);
  if (!form) return withOpsRefresh(Response.json({ ok: false, error: "Invalid request." }, { status: 400 }), gate.refresh);
  await snapshot("team", String(id), `Before editing “${current.name}”`, current);

  const f = readFields(form);
  const patch: Partial<typeof current> = { updatedAt: new Date() };
  if (f.name && f.name !== current.name) patch.name = f.name;
  if (f.role !== null) patch.role = f.role;
  if (f.location !== null) patch.location = f.location;
  if (f.bio !== null) patch.bio = f.bio;
  if (f.photoAlt !== null) patch.photoAlt = f.photoAlt;
  if (f.url !== null) patch.url = f.url;
  if (f.photoPath !== null && f.photoPath !== current.photo) patch.photo = f.photoPath;
  if (f.position !== null) patch.position = f.position;
  if (f.visible !== null) patch.visible = f.visible;

  const file = form.get("photoFile");
  if (file instanceof File && file.size > 0) {
    try {
      const photo = await savePhoto(file);
      if (current.photo.startsWith("/uploads/team-")) await removeUploadFile(current.photo);
      patch.photo = photo;
    } catch (e) {
      return withOpsRefresh(
        Response.json({ ok: false, error: e instanceof Error ? e.message : "Photo upload failed." }, { status: 400 }),
        gate.refresh,
      );
    }
  }

  const [row] = await db.update(teamMembers).set(patch).where(eq(teamMembers.id, id)).returning();
  return withOpsRefresh(Response.json({ ok: true, member: row }), gate.refresh);
}

/** Delete a member and any upload it owned. */
export async function DELETE(request: Request) {
  const gate = await requireOps(request);
  if (gate.res) return gate.res;
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!id) return withOpsRefresh(Response.json({ ok: false, error: "Missing id." }, { status: 400 }), gate.refresh);
  const current: TeamMember | undefined = (await db.select().from(teamMembers).where(eq(teamMembers.id, id)).limit(1))[0];
  if (current) {
    await snapshot("team", String(id), `Deleted “${current.name}” from the Dream Team`, current);
    await removeUploadFile(current.photo);
    await db.delete(teamMembers).where(eq(teamMembers.id, id));
  }
  return withOpsRefresh(Response.json({ ok: true }), gate.refresh);
}
