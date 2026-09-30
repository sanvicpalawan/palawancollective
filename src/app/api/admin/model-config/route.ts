import { eq } from "drizzle-orm";
import { db } from "@/db";
import { modelConfig } from "@/db/schema";
import { getModelConfig } from "@/lib/control";
import { requireOps, withOpsRefresh } from "@/lib/ops-auth";

export const dynamic = "force-dynamic";

function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export async function GET(request: Request) {
  const gate = await requireOps(request);
  if (gate.res) return gate.res;
  const row = await getModelConfig();
  const { openrouterKey, ...rest } = row;
  return withOpsRefresh(
    Response.json({
      ok: true,
      config: {
        ...rest,
        hasOpenRouterKey: openrouterKey.length > 0,
        openrouterKeyMasked: openrouterKey ? `••••${openrouterKey.slice(-4)}` : "",
      },
    }),
    gate.refresh,
  );
}

export async function PUT(request: Request) {
  const gate = await requireOps(request);
  if (gate.res) return gate.res;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const current = await getModelConfig();
  const patch: Partial<typeof current> = { updatedAt: new Date() };
  if (body.provider === "openrouter" || body.provider === "ollama") patch.provider = body.provider;
  if (typeof body.showFree === "boolean") patch.showFree = body.showFree;
  if (typeof body.showPaid === "boolean") patch.showPaid = body.showPaid;
  if (body.selectedModel !== undefined) patch.selectedModel = str(body.selectedModel, 160);
  if (body.ollamaBaseUrl !== undefined && str(body.ollamaBaseUrl, 200)) patch.ollamaBaseUrl = str(body.ollamaBaseUrl, 200);
  if (body.ollamaModel !== undefined) patch.ollamaModel = str(body.ollamaModel, 160);
  if (body.clearKey === true) {
    patch.openrouterKey = "";
  } else if (typeof body.openrouterKey === "string" && body.openrouterKey.trim() && !body.openrouterKey.startsWith("•")) {
    patch.openrouterKey = body.openrouterKey.trim().slice(0, 200);
  }
  const [row] = await db.update(modelConfig).set(patch).where(eq(modelConfig.id, current.id)).returning();
  const { openrouterKey, ...rest } = row;
  return withOpsRefresh(
    Response.json({
      ok: true,
      config: {
        ...rest,
        hasOpenRouterKey: openrouterKey.length > 0,
        openrouterKeyMasked: openrouterKey ? `••••${openrouterKey.slice(-4)}` : "",
      },
    }),
    gate.refresh,
  );
}
