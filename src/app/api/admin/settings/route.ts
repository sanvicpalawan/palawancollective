import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { getSettingsMap, snapshot } from "@/lib/control";
import { requireOps, withOpsRefresh } from "@/lib/ops-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const gate = await requireOps(request);
  if (gate.res) return gate.res;
  return withOpsRefresh(Response.json({ ok: true, settings: await getSettingsMap() }), gate.refresh);
}

export async function PUT(request: Request) {
  const gate = await requireOps(request);
  if (gate.res) return gate.res;
  const body = (await request.json().catch(() => ({}))) as { values?: Record<string, unknown> };
  const values = body.values && typeof body.values === "object" ? body.values : {};
  let saved = 0;
  for (const [key, value] of Object.entries(values)) {
    if (!/^[a-z0-9_]{1,60}$/.test(key)) continue;
    if (typeof value !== "string" && typeof value !== "boolean" && typeof value !== "number") continue;
    const v = typeof value === "string" ? value.slice(0, 4000) : value;
    await db
      .insert(siteSettings)
      .values({ key, value: v, updatedAt: new Date() })
      .onConflictDoUpdate({ target: siteSettings.key, set: { value: v, updatedAt: new Date() } });
    saved += 1;
  }
  if (saved > 0) await snapshot("settings", "site", `Updated ${saved} setting${saved === 1 ? "" : "s"}`, values);
  return withOpsRefresh(Response.json({ ok: true, saved }), gate.refresh);
}
