import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { inquiries } from "@/db/schema";
import { requireOps, withOpsRefresh } from "@/lib/ops-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const gate = await requireOps(request);
  if (gate.res) return gate.res;
  const rows = await db.select().from(inquiries).orderBy(desc(inquiries.createdAt)).limit(150);
  return withOpsRefresh(Response.json({ ok: true, inquiries: rows }), gate.refresh);
}

export async function PUT(request: Request) {
  const gate = await requireOps(request);
  if (gate.res) return gate.res;
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!id) return withOpsRefresh(Response.json({ ok: false, error: "Missing id." }, { status: 400 }), gate.refresh);
  const body = (await request.json().catch(() => ({}))) as { status?: unknown };
  if (body.status !== "new" && body.status !== "read" && body.status !== "archived") {
    return withOpsRefresh(Response.json({ ok: false, error: "Bad status." }, { status: 400 }), gate.refresh);
  }
  await db.update(inquiries).set({ status: body.status }).where(eq(inquiries.id, id));
  return withOpsRefresh(Response.json({ ok: true }), gate.refresh);
}
