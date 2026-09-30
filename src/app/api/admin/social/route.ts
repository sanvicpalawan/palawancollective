import { eq } from "drizzle-orm";
import { db } from "@/db";
import { socialLinks } from "@/db/schema";
import { getSocialLinks, snapshot } from "@/lib/control";
import { requireOps, withOpsRefresh } from "@/lib/ops-auth";
import { normalizeSocialUrl, platformLabel } from "@/lib/social";

export const dynamic = "force-dynamic";

function str(v: unknown, max = 200): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function cleanPlatform(v: unknown): string {
  if (typeof v !== "string") return "";
  return v.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 30);
}

export async function GET(request: Request) {
  const gate = await requireOps(request);
  if (gate.res) return gate.res;
  return withOpsRefresh(Response.json({ ok: true, socials: await getSocialLinks() }), gate.refresh);
}

export async function POST(request: Request) {
  const gate = await requireOps(request);
  if (gate.res) return gate.res;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  if (Array.isArray(body.reorder)) {
    const ids = body.reorder.filter((x): x is number => typeof x === "number").slice(0, 50);
    for (let i = 0; i < ids.length; i++) {
      await db.update(socialLinks).set({ position: i }).where(eq(socialLinks.id, ids[i]));
    }
    return withOpsRefresh(Response.json({ ok: true, socials: await getSocialLinks() }), gate.refresh);
  }

  const platform = cleanPlatform(body.platform);
  if (!platform) {
    return withOpsRefresh(Response.json({ ok: false, error: "Platform is required." }, { status: 400 }), gate.refresh);
  }
  const existing = await db.select({ id: socialLinks.id }).from(socialLinks).where(eq(socialLinks.platform, platform)).limit(1);
  if (existing[0]) {
    return withOpsRefresh(Response.json({ ok: false, error: `“${platform}” already exists.` }, { status: 409 }), gate.refresh);
  }
  const label = str(body.label, 40) || platformLabel(platform);
  const url = normalizeSocialUrl(str(body.url, 500));
  const [row] = await db
    .insert(socialLinks)
    .values({
      platform,
      label,
      url,
      position: typeof body.position === "number" ? body.position : 99,
      visible: body.visible !== false,
    })
    .returning();
  await snapshot("social", String(row.id), `Added social “${row.label}”`, row);
  return withOpsRefresh(Response.json({ ok: true, social: row }), gate.refresh);
}

export async function PUT(request: Request) {
  const gate = await requireOps(request);
  if (gate.res) return gate.res;
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!id) return withOpsRefresh(Response.json({ ok: false, error: "Missing id." }, { status: 400 }), gate.refresh);
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const current = (await db.select().from(socialLinks).where(eq(socialLinks.id, id)).limit(1))[0];
  if (!current) return withOpsRefresh(Response.json({ ok: false, error: "Not found." }, { status: 404 }), gate.refresh);
  await snapshot("social", String(id), `Before editing “${current.label}”`, current);
  const patch: { label?: string; url?: string; position?: number; visible?: boolean } = {};
  if (body.label !== undefined && str(body.label, 40)) patch.label = str(body.label, 40);
  if (body.url !== undefined) patch.url = normalizeSocialUrl(str(body.url, 500));
  if (typeof body.position === "number") patch.position = body.position;
  if (typeof body.visible === "boolean") patch.visible = body.visible;
  const [row] = await db.update(socialLinks).set(patch).where(eq(socialLinks.id, id)).returning();
  return withOpsRefresh(Response.json({ ok: true, social: row }), gate.refresh);
}

export async function DELETE(request: Request) {
  const gate = await requireOps(request);
  if (gate.res) return gate.res;
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!id) return withOpsRefresh(Response.json({ ok: false, error: "Missing id." }, { status: 400 }), gate.refresh);
  const current = (await db.select().from(socialLinks).where(eq(socialLinks.id, id)).limit(1))[0];
  if (current) await snapshot("social", String(id), `Deleted “${current.label}”`, current);
  await db.delete(socialLinks).where(eq(socialLinks.id, id));
  return withOpsRefresh(Response.json({ ok: true }), gate.refresh);
}
