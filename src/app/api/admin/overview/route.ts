import { desc, gte } from "drizzle-orm";
import { db } from "@/db";
import { agentLogs, agents, analyticsEvents, builds, guides, inquiries, mediaAssets, stories, subscribers } from "@/db/schema";
import { getGalleries, getModelConfig, getSections } from "@/lib/control";
import { requireOps, withOpsRefresh } from "@/lib/ops-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const gate = await requireOps(request);
  if (gate.res) return gate.res;

  const since7 = new Date(Date.now() - 7 * 24 * 3600_000);
  const since30 = new Date(Date.now() - 30 * 24 * 3600_000);

  const [storyRows, buildRows, guideRows, subRows, inqRows, sectionRows, galRows, mediaRows, agentRows, events, logs, mc] =
    await Promise.all([
      db.select({ id: stories.id }).from(stories),
      db.select({ id: builds.id }).from(builds),
      db.select({ id: guides.id }).from(guides),
      db.select().from(subscribers).orderBy(desc(subscribers.createdAt)).limit(200),
      db.select().from(inquiries).orderBy(desc(inquiries.createdAt)).limit(50),
      getSections().catch(() => []),
      getGalleries().catch(() => []),
      db.select({ id: mediaAssets.id }).from(mediaAssets),
      db.select().from(agents),
      db.select().from(analyticsEvents).where(gte(analyticsEvents.createdAt, since30)).limit(5000),
      db.select().from(agentLogs).orderBy(desc(agentLogs.id)).limit(8),
      getModelConfig().catch(() => null),
    ]);

  const views7 = events.filter((e) => e.type === "pageview" && e.createdAt >= since7);
  const byDay: Record<string, number> = {};
  for (const e of views7) {
    const day = e.createdAt.toISOString().slice(0, 10);
    byDay[day] = (byDay[day] ?? 0) + 1;
  }
  const topPaths: Record<string, number> = {};
  for (const e of events.filter((e) => e.type === "pageview")) {
    topPaths[e.path] = (topPaths[e.path] ?? 0) + 1;
  }

  // Ollama reachability probe (fast, non-blocking failure)
  let ollamaUp: boolean | null = null;
  if (mc?.ollamaBaseUrl) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 3000);
      const res = await fetch(`${mc.ollamaBaseUrl.replace(/\/$/, "")}/api/tags`, { signal: ctrl.signal });
      ollamaUp = res.ok;
      clearTimeout(t);
    } catch {
      ollamaUp = false;
    }
  }

  return withOpsRefresh(
    Response.json({
      ok: true,
      stats: {
        stories: storyRows.length,
        builds: buildRows.length,
        guides: guideRows.length,
        subscribers: subRows.length,
        subscribers7: subRows.filter((s) => s.createdAt >= since7).length,
        inquiriesNew: inqRows.filter((i) => i.status === "new").length,
        sections: sectionRows.length,
        sectionsDraft: sectionRows.filter((s) => s.status === "draft").length,
        galleries: galRows.length,
        media: mediaRows.length,
        agentsActive: agentRows.filter((a) => a.status === "active").length,
        agentsTotal: agentRows.length,
        views7: views7.length,
        chats30: events.filter((e) => e.type === "chat").length,
      },
      traffic: {
        byDay: Object.entries(byDay).sort(([a], [b]) => (a < b ? -1 : 1)),
        topPaths: Object.entries(topPaths).sort(([, a], [, b]) => b - a).slice(0, 8),
      },
      inquiries: inqRows.slice(0, 6),
      subscribers: subRows.slice(0, 6),
      agentLogs: logs.reverse(),
      provider: {
        active: mc?.provider ?? "openrouter",
        openRouterKey: Boolean(mc?.openrouterKey),
        selectedModel: mc?.selectedModel || null,
        ollamaModel: mc?.ollamaModel || null,
        ollamaUp,
        modelsCached: mc?.modelsCache.length ?? 0,
        modelsFetchedAt: mc?.modelsFetchedAt ?? null,
      },
    }),
    gate.refresh,
  );
}
