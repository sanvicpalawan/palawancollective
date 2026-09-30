import { eq } from "drizzle-orm";
import { db } from "@/db";
import { siteSections } from "@/db/schema";
import { getSections, snapshot } from "@/lib/control";
import { requireOps, withOpsRefresh } from "@/lib/ops-auth";

export const dynamic = "force-dynamic";

function str(v: unknown, max = 200): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export async function GET(request: Request) {
  const gate = await requireOps(request);
  if (gate.res) return gate.res;
  const rows = await getSections();
  return withOpsRefresh(Response.json({ ok: true, sections: rows }), gate.refresh);
}

export async function POST(request: Request) {
  const gate = await requireOps(request);
  if (gate.res) return gate.res;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  // Duplicate
  if (body.action === "duplicate" && typeof body.id === "number") {
    const rows = await db.select().from(siteSections).where(eq(siteSections.id, body.id)).limit(1);
    const src = rows[0];
    if (!src) return withOpsRefresh(Response.json({ ok: false, error: "Not found." }, { status: 404 }), gate.refresh);
    const [row] = await db
      .insert(siteSections)
      .values({
        page: src.page,
        key: `${src.key}-copy-${Date.now().toString(36)}`,
        type: src.type,
        title: `${src.title} (copy)`,
        position: src.position + 1,
        visible: src.visible,
        status: "draft",
        data: src.data,
      })
      .returning();
    return withOpsRefresh(Response.json({ ok: true, section: row }), gate.refresh);
  }

  // Reorder
  if (Array.isArray(body.reorder)) {
    const ids = body.reorder.filter((x): x is number => typeof x === "number").slice(0, 200);
    for (let i = 0; i < ids.length; i++) {
      await db.update(siteSections).set({ position: i, updatedAt: new Date() }).where(eq(siteSections.id, ids[i]));
    }
    const rows = await getSections();
    return withOpsRefresh(Response.json({ ok: true, sections: rows }), gate.refresh);
  }

  const key = str(body.key, 60) || `section-${Date.now().toString(36)}`;
  const type = str(body.type, 40) || "custom";
  const title = str(body.title, 120) || "Untitled section";
  const data = body.data && typeof body.data === "object" ? (body.data as Record<string, unknown>) : {};
  const [row] = await db
    .insert(siteSections)
    .values({
      page: str(body.page, 40) || "home",
      key,
      type,
      title,
      position: typeof body.position === "number" ? body.position : 99,
      visible: body.visible !== false,
      status: body.status === "draft" ? "draft" : "published",
      data,
    })
    .returning();
  await snapshot("section", String(row.id), `Created ${row.title}`, row);
  return withOpsRefresh(Response.json({ ok: true, section: row }), gate.refresh);
}

export async function PUT(request: Request) {
  const gate = await requireOps(request);
  if (gate.res) return gate.res;
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!id) return withOpsRefresh(Response.json({ ok: false, error: "Missing id." }, { status: 400 }), gate.refresh);
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const current = (await db.select().from(siteSections).where(eq(siteSections.id, id)).limit(1))[0];
  if (!current) return withOpsRefresh(Response.json({ ok: false, error: "Not found." }, { status: 404 }), gate.refresh);

  await snapshot("section", String(id), `Before editing ${current.title}`, current);
  const patch: Partial<typeof current> = { updatedAt: new Date() };
  if (body.title !== undefined) patch.title = str(body.title, 120) || current.title;
  if (body.type !== undefined) patch.type = str(body.type, 40) || current.type;
  if (body.key !== undefined) patch.key = str(body.key, 60) || current.key;
  if (typeof body.position === "number") patch.position = body.position;
  if (typeof body.visible === "boolean") patch.visible = body.visible;
  if (body.status === "draft" || body.status === "published") patch.status = body.status;
  if (body.data && typeof body.data === "object") patch.data = body.data as Record<string, unknown>;
  const [row] = await db.update(siteSections).set(patch).where(eq(siteSections.id, id)).returning();
  return withOpsRefresh(Response.json({ ok: true, section: row }), gate.refresh);
}

export async function DELETE(request: Request) {
  const gate = await requireOps(request);
  if (gate.res) return gate.res;
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!id) return withOpsRefresh(Response.json({ ok: false, error: "Missing id." }, { status: 400 }), gate.refresh);
  const current = (await db.select().from(siteSections).where(eq(siteSections.id, id)).limit(1))[0];
  if (current) await snapshot("section", String(id), `Deleted ${current.title}`, current);
  await db.delete(siteSections).where(eq(siteSections.id, id));
  return withOpsRefresh(Response.json({ ok: true }), gate.refresh);
}
