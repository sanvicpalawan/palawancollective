import { eq } from "drizzle-orm";
import { db } from "@/db";
import { faqs } from "@/db/schema";
import { getFaqs, snapshot } from "@/lib/control";
import { requireOps, withOpsRefresh } from "@/lib/ops-auth";

export const dynamic = "force-dynamic";

function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export async function GET(request: Request) {
  const gate = await requireOps(request);
  if (gate.res) return gate.res;
  return withOpsRefresh(Response.json({ ok: true, faqs: await getFaqs() }), gate.refresh);
}

export async function POST(request: Request) {
  const gate = await requireOps(request);
  if (gate.res) return gate.res;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  if (Array.isArray(body.reorder)) {
    const ids = body.reorder.filter((x): x is number => typeof x === "number").slice(0, 200);
    for (let i = 0; i < ids.length; i++) {
      await db.update(faqs).set({ position: i }).where(eq(faqs.id, ids[i]));
    }
    return withOpsRefresh(Response.json({ ok: true, faqs: await getFaqs() }), gate.refresh);
  }
  const question = str(body.question, 300);
  const answer = str(body.answer, 4000);
  if (!question || !answer) {
    return withOpsRefresh(Response.json({ ok: false, error: "Question and answer are required." }, { status: 400 }), gate.refresh);
  }
  const [row] = await db
    .insert(faqs)
    .values({ question, answer, position: typeof body.position === "number" ? body.position : 99, visible: body.visible !== false })
    .returning();
  await snapshot("faq", String(row.id), `Added FAQ`, row);
  return withOpsRefresh(Response.json({ ok: true, faq: row }), gate.refresh);
}

export async function PUT(request: Request) {
  const gate = await requireOps(request);
  if (gate.res) return gate.res;
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!id) return withOpsRefresh(Response.json({ ok: false, error: "Missing id." }, { status: 400 }), gate.refresh);
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const current = (await db.select().from(faqs).where(eq(faqs.id, id)).limit(1))[0];
  if (!current) return withOpsRefresh(Response.json({ ok: false, error: "Not found." }, { status: 404 }), gate.refresh);
  await snapshot("faq", String(id), "Before FAQ edit", current);
  const patch: { question?: string; answer?: string; position?: number; visible?: boolean } = {};
  if (body.question !== undefined && str(body.question, 300)) patch.question = str(body.question, 300);
  if (body.answer !== undefined && str(body.answer, 4000)) patch.answer = str(body.answer, 4000);
  if (typeof body.position === "number") patch.position = body.position;
  if (typeof body.visible === "boolean") patch.visible = body.visible;
  const [row] = await db.update(faqs).set(patch).where(eq(faqs.id, id)).returning();
  return withOpsRefresh(Response.json({ ok: true, faq: row }), gate.refresh);
}

export async function DELETE(request: Request) {
  const gate = await requireOps(request);
  if (gate.res) return gate.res;
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!id) return withOpsRefresh(Response.json({ ok: false, error: "Missing id." }, { status: 400 }), gate.refresh);
  const current = (await db.select().from(faqs).where(eq(faqs.id, id)).limit(1))[0];
  if (current) await snapshot("faq", String(id), "Deleted FAQ", current);
  await db.delete(faqs).where(eq(faqs.id, id));
  return withOpsRefresh(Response.json({ ok: true }), gate.refresh);
}
