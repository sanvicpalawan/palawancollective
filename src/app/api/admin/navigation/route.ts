import { eq } from "drizzle-orm";
import { db } from "@/db";
import { navItems } from "@/db/schema";
import { getNav, snapshot } from "@/lib/control";
import { requireOps, withOpsRefresh } from "@/lib/ops-auth";

export const dynamic = "force-dynamic";

function str(v: unknown, max = 120): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export async function GET(request: Request) {
  const gate = await requireOps(request);
  if (gate.res) return gate.res;
  return withOpsRefresh(Response.json({ ok: true, nav: await getNav() }), gate.refresh);
}

export async function POST(request: Request) {
  const gate = await requireOps(request);
  if (gate.res) return gate.res;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  if (Array.isArray(body.reorder)) {
    const ids = body.reorder.filter((x): x is number => typeof x === "number").slice(0, 100);
    for (let i = 0; i < ids.length; i++) {
      await db.update(navItems).set({ position: i }).where(eq(navItems.id, ids[i]));
    }
    return withOpsRefresh(Response.json({ ok: true, nav: await getNav() }), gate.refresh);
  }
  const label = str(body.label, 60);
  const href = str(body.href, 200);
  if (!label || !href) {
    return withOpsRefresh(Response.json({ ok: false, error: "Label and link are required." }, { status: 400 }), gate.refresh);
  }
  const [row] = await db
    .insert(navItems)
    .values({
      location: str(body.location, 20) || "header",
      label,
      href,
      position: typeof body.position === "number" ? body.position : 99,
      visible: body.visible !== false,
    })
    .returning();
  await snapshot("nav", String(row.id), `Added nav “${row.label}”`, row);
  return withOpsRefresh(Response.json({ ok: true, item: row }), gate.refresh);
}

export async function PUT(request: Request) {
  const gate = await requireOps(request);
  if (gate.res) return gate.res;
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!id) return withOpsRefresh(Response.json({ ok: false, error: "Missing id." }, { status: 400 }), gate.refresh);
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const patch: { label?: string; href?: string; position?: number; visible?: boolean } = {};
  if (body.label !== undefined && str(body.label, 60)) patch.label = str(body.label, 60);
  if (body.href !== undefined && str(body.href, 200)) patch.href = str(body.href, 200);
  if (typeof body.position === "number") patch.position = body.position;
  if (typeof body.visible === "boolean") patch.visible = body.visible;
  const [row] = await db.update(navItems).set(patch).where(eq(navItems.id, id)).returning();
  if (!row) return withOpsRefresh(Response.json({ ok: false, error: "Not found." }, { status: 404 }), gate.refresh);
  return withOpsRefresh(Response.json({ ok: true, item: row }), gate.refresh);
}

export async function DELETE(request: Request) {
  const gate = await requireOps(request);
  if (gate.res) return gate.res;
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!id) return withOpsRefresh(Response.json({ ok: false, error: "Missing id." }, { status: 400 }), gate.refresh);
  await db.delete(navItems).where(eq(navItems.id, id));
  return withOpsRefresh(Response.json({ ok: true }), gate.refresh);
}
