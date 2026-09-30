import { eq } from "drizzle-orm";
import { db } from "@/db";
import { galleries } from "@/db/schema";
import type { GalleryItem } from "@/db/schema";
import { getGalleries, snapshot } from "@/lib/control";
import { requireOps, withOpsRefresh } from "@/lib/ops-auth";

export const dynamic = "force-dynamic";

function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function cleanItems(v: unknown): GalleryItem[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
    .map((x) => ({
      mediaId: typeof x.mediaId === "number" ? x.mediaId : null,
      url: typeof x.url === "string" ? x.url.slice(0, 500) : "",
      caption: typeof x.caption === "string" ? x.caption.slice(0, 200) : "",
      kind: x.kind === "video" ? ("video" as const) : ("image" as const),
    }))
    .filter((x) => x.url.startsWith("/") || x.url.startsWith("http"))
    .slice(0, 60);
}

export async function GET(request: Request) {
  const gate = await requireOps(request);
  if (gate.res) return gate.res;
  return withOpsRefresh(Response.json({ ok: true, galleries: await getGalleries() }), gate.refresh);
}

export async function POST(request: Request) {
  const gate = await requireOps(request);
  if (gate.res) return gate.res;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const title = str(body.title, 120);
  if (!title) {
    return withOpsRefresh(Response.json({ ok: false, error: "Title is required." }, { status: 400 }), gate.refresh);
  }
  const slug =
    str(body.slug, 80).toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-") ||
    `gallery-${Date.now().toString(36)}`;
  const [row] = await db
    .insert(galleries)
    .values({
      slug,
      title,
      description: str(body.description, 1000),
      layout: body.layout === "scroll" ? "scroll" : "grid",
      items: cleanItems(body.items),
      position: typeof body.position === "number" ? body.position : 99,
      visible: body.visible !== false,
    })
    .returning();
  await snapshot("gallery", String(row.id), `Created gallery “${row.title}”`, row);
  return withOpsRefresh(Response.json({ ok: true, gallery: row }), gate.refresh);
}

export async function PUT(request: Request) {
  const gate = await requireOps(request);
  if (gate.res) return gate.res;
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!id) return withOpsRefresh(Response.json({ ok: false, error: "Missing id." }, { status: 400 }), gate.refresh);
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const current = (await db.select().from(galleries).where(eq(galleries.id, id)).limit(1))[0];
  if (!current) return withOpsRefresh(Response.json({ ok: false, error: "Not found." }, { status: 404 }), gate.refresh);
  await snapshot("gallery", String(id), `Before editing “${current.title}”`, current);
  const patch: Partial<typeof current> = {};
  if (body.title !== undefined && str(body.title, 120)) patch.title = str(body.title, 120);
  if (body.description !== undefined) patch.description = str(body.description, 1000);
  if (body.layout === "grid" || body.layout === "scroll") patch.layout = body.layout;
  if (body.items !== undefined) patch.items = cleanItems(body.items);
  if (typeof body.position === "number") patch.position = body.position;
  if (typeof body.visible === "boolean") patch.visible = body.visible;
  const [row] = await db.update(galleries).set(patch).where(eq(galleries.id, id)).returning();
  return withOpsRefresh(Response.json({ ok: true, gallery: row }), gate.refresh);
}

export async function DELETE(request: Request) {
  const gate = await requireOps(request);
  if (gate.res) return gate.res;
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!id) return withOpsRefresh(Response.json({ ok: false, error: "Missing id." }, { status: 400 }), gate.refresh);
  const current = (await db.select().from(galleries).where(eq(galleries.id, id)).limit(1))[0];
  if (current) await snapshot("gallery", String(id), `Deleted “${current.title}”`, current);
  await db.delete(galleries).where(eq(galleries.id, id));
  return withOpsRefresh(Response.json({ ok: true }), gate.refresh);
}
