import { eq } from "drizzle-orm";
import { db } from "@/db";
import { modelConfig } from "@/db/schema";
import type { CachedModel } from "@/db/schema";
import { getModelConfig } from "@/lib/control";
import { fetchOllamaModels, fetchOpenRouterModels } from "@/lib/models";
import { requireOps, withOpsRefresh } from "@/lib/ops-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  const gate = await requireOps(request);
  if (gate.res) return gate.res;
  const body = (await request.json().catch(() => ({}))) as { source?: string };
  const source = body.source === "ollama" ? "ollama" : body.source === "openrouter" ? "openrouter" : "all";
  const config = await getModelConfig();

  let openrouter: CachedModel[] = config.modelsCache;
  let ollama: CachedModel[] = [];
  const errors: string[] = [];

  if (source === "all" || source === "openrouter") {
    try {
      openrouter = await fetchOpenRouterModels(config.openrouterKey || undefined);
      await db
        .update(modelConfig)
        .set({ modelsCache: openrouter, modelsFetchedAt: new Date(), updatedAt: new Date() })
        .where(eq(modelConfig.id, config.id));
    } catch (error) {
      errors.push(`OpenRouter: ${error instanceof Error ? error.message : "fetch failed"}`);
    }
  }
  if (source === "all" || source === "ollama") {
    try {
      ollama = await fetchOllamaModels(config.ollamaBaseUrl);
    } catch (error) {
      errors.push(`Ollama (${config.ollamaBaseUrl}): ${error instanceof Error ? error.message : "unreachable"}`);
    }
  }

  return withOpsRefresh(
    Response.json({
      ok: errors.length === 0 || openrouter.length > 0 || ollama.length > 0,
      openrouter,
      ollama,
      counts: {
        openrouter: openrouter.length,
        free: openrouter.filter((m) => m.free).length,
        ollama: ollama.length,
      },
      errors,
      fetchedAt: new Date().toISOString(),
    }),
    gate.refresh,
  );
}

export async function GET(request: Request) {
  const gate = await requireOps(request);
  if (gate.res) return gate.res;
  const config = await getModelConfig();
  let ollama: CachedModel[] = [];
  let ollamaError: string | null = null;
  try {
    ollama = await fetchOllamaModels(config.ollamaBaseUrl);
  } catch (error) {
    ollamaError = error instanceof Error ? error.message : "unreachable";
  }
  return withOpsRefresh(
    Response.json({ ok: true, openrouter: config.modelsCache, fetchedAt: config.modelsFetchedAt, ollama, ollamaError }),
    gate.refresh,
  );
}
