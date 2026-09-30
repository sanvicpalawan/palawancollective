import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { siteSettings, subscribers } from "@/db/schema";
import { getSettingsMap, snapshot } from "@/lib/control";
import { requireOps, withOpsRefresh } from "@/lib/ops-auth";

export const dynamic = "force-dynamic";

const TEXT_KEYS = ["newsletter_title", "newsletter_subtitle", "newsletter_copy", "newsletter_provider", "newsletter_provider_url"];

export async function GET(request: Request) {
  const gate = await requireOps(request);
  if (gate.res) return gate.res;
  const url = new URL(request.url);

  if (url.searchParams.get("format") === "csv") {
    const rows = await db.select().from(subscribers).orderBy(desc(subscribers.createdAt)).limit(5000);
    const csv = ["email,source,created_at", ...rows.map((r) => `${JSON.stringify(r.email)},${JSON.stringify(r.source ?? "")},${r.createdAt.toISOString()}`)].join("\n");
    const res = new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="palawan-dispatch-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
    return withOpsRefresh(res, gate.refresh);
  }

  const [rows, settings] = await Promise.all([
    db.select().from(subscribers).orderBy(desc(subscribers.createdAt)).limit(500),
    getSettingsMap(),
  ]);
  const text: Record<string, unknown> = {};
  for (const k of TEXT_KEYS) text[k] = settings[k];
  return withOpsRefresh(Response.json({ ok: true, subscribers: rows, total: rows.length, text }), gate.refresh);
}

export async function PUT(request: Request) {
  const gate = await requireOps(request);
  if (gate.res) return gate.res;
  const body = (await request.json().catch(() => ({}))) as { values?: Record<string, unknown> };
  const values = body.values && typeof body.values === "object" ? body.values : {};
  const allowed = new Set([...TEXT_KEYS, "newsletter_provider_key"]);
  for (const [key, value] of Object.entries(values)) {
    if (!allowed.has(key) || typeof value !== "string") continue;
    const v = value.slice(0, 2000);
    await db.insert(siteSettings).values({ key, value: v, updatedAt: new Date() }).onConflictDoUpdate({
      target: siteSettings.key,
      set: { value: v, updatedAt: new Date() },
    });
  }
  await snapshot("settings", "newsletter", "Newsletter text updated", values);
  return withOpsRefresh(Response.json({ ok: true }), gate.refresh);
}

export async function DELETE(request: Request) {
  const gate = await requireOps(request);
  if (gate.res) return gate.res;
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!id) return withOpsRefresh(Response.json({ ok: false, error: "Missing id." }, { status: 400 }), gate.refresh);
  await db.delete(subscribers).where(eq(subscribers.id, id));
  return withOpsRefresh(Response.json({ ok: true }), gate.refresh);
}
