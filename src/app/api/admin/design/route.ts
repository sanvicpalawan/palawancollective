import { db } from "@/db";
import { designTokens } from "@/db/schema";
import type { DesignTokens } from "@/db/schema";
import { DEFAULT_DESIGN, getDesign, snapshot } from "@/lib/control";
import { requireOps, withOpsRefresh } from "@/lib/ops-auth";

export const dynamic = "force-dynamic";

const HEX = /^#[0-9a-fA-F]{6}$/;

function sanitize(input: unknown): DesignTokens {
  const base = structuredClone(DEFAULT_DESIGN);
  if (!input || typeof input !== "object") return base;
  const t = input as Partial<DesignTokens>;
  if (t.colors && typeof t.colors === "object") {
    for (const [k, v] of Object.entries(t.colors)) {
      if (typeof v === "string" && HEX.test(v) && k in base.colors) {
        (base.colors as Record<string, string>)[k] = v;
      }
    }
  }
  if (t.fonts && typeof t.fonts === "object") {
    for (const [k, v] of Object.entries(t.fonts)) {
      if (typeof v === "string" && v.trim() && k in base.fonts) {
        (base.fonts as Record<string, string>)[k] = v.trim().slice(0, 60);
      }
    }
  }
  if (typeof t.fontScale === "number" && t.fontScale >= 0.8 && t.fontScale <= 1.4) base.fontScale = t.fontScale;
  if (typeof t.spacingScale === "number" && t.spacingScale >= 0.8 && t.spacingScale <= 1.4) base.spacingScale = t.spacingScale;
  if (typeof t.radius === "number" && t.radius >= 0 && t.radius <= 28) base.radius = Math.round(t.radius);
  if (t.shadow === "none" || t.shadow === "soft" || t.shadow === "lifted" || t.shadow === "brutal") base.shadow = t.shadow;
  return base;
}

export async function GET(request: Request) {
  const gate = await requireOps(request);
  if (gate.res) return gate.res;
  const tokens = await getDesign();
  return withOpsRefresh(Response.json({ ok: true, design: tokens }), gate.refresh);
}

export async function PUT(request: Request) {
  const gate = await requireOps(request);
  if (gate.res) return gate.res;
  const body = (await request.json().catch(() => ({}))) as { tokens?: unknown };
  const current = await getDesign();
  await snapshot("design", "global", "Before design change", current);
  const tokens = sanitize(body.tokens);
  const rows = await db.select({ id: designTokens.id }).from(designTokens).limit(1);
  if (rows[0]) {
    await db.update(designTokens).set({ tokens, updatedAt: new Date() }).where;
    const { eq } = await import("drizzle-orm");
    await db.update(designTokens).set({ tokens, updatedAt: new Date() }).where(eq(designTokens.id, rows[0].id));
  } else {
    await db.insert(designTokens).values({ tokens });
  }
  return withOpsRefresh(Response.json({ ok: true, design: tokens }), gate.refresh);
}
