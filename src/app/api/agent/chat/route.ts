import { db } from "@/db";
import { agentLogs } from "@/db/schema";
import { getDefaultAgent, getModelConfig, getSettingsMap, setting } from "@/lib/control";
import { getBuilds, getGuides, getStories } from "@/lib/data";
import { chatOllama, chatOpenRouter, fallbackAnswer, type ChatMessage } from "@/lib/models";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const hits = new Map<string, { count: number; reset: number }>();

function limited(ip: string): boolean {
  const now = Date.now();
  const rec = hits.get(ip);
  if (!rec || now > rec.reset) {
    hits.set(ip, { count: 1, reset: now + 60_000 });
    return false;
  }
  rec.count += 1;
  return rec.count > 20;
}

type Body = { message?: unknown; history?: unknown; agentId?: unknown };

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (limited(ip)) return Response.json({ ok: false, error: "Slow down a little." }, { status: 429 });

  let message = "";
  let history: Array<{ role: string; content: string }> = [];
  let agentOverride: number | null = null;
  try {
    const body = (await request.json()) as Body;
    message = typeof body.message === "string" ? body.message.trim().slice(0, 2000) : "";
    if (typeof body.agentId === "number") agentOverride = body.agentId;
    if (Array.isArray(body.history)) {
      history = body.history
        .filter((h) => h && typeof h === "object" && typeof h.content === "string")
        .slice(-8)
        .map((h) => ({
          role: h.role === "assistant" ? "assistant" : "user",
          content: String(h.content).slice(0, 2000),
        }));
    }
  } catch {
    return Response.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }
  if (!message) return Response.json({ ok: false, error: "Say something first." }, { status: 400 });

  const settings = await getSettingsMap().catch(() => null);
  if (settings && setting<boolean>(settings, "chat_enabled", true) === false) {
    return Response.json({ ok: false, error: "The operator is offline right now. Try WhatsApp instead." }, { status: 503 });
  }

  const [defaultAgent, config] = await Promise.all([getDefaultAgent().catch(() => null), getModelConfig().catch(() => null)]);
  let agent = defaultAgent;
  // Ops console test bench: an authenticated operator may target any agent.
  if (agentOverride !== null) {
    const { readOpsToken, verifyOpsToken } = await import("@/lib/ops-auth");
    const check = await verifyOpsToken(readOpsToken(request));
    if (check.ok) {
      const { eq } = await import("drizzle-orm");
      const { agents } = await import("@/db/schema");
      const rows = await db.select().from(agents).where(eq(agents.id, agentOverride)).limit(1);
      if (rows[0]) agent = rows[0];
    }
  }
  if (!agent) {
    return Response.json({ ok: true, reply: fallbackAnswer(message), provider: "local-kb", fallback: true });
  }

  // Ground the agent in live site content.
  let context = "";
  try {
    const [stories, builds, guides] = await Promise.all([getStories(), getBuilds(), getGuides()]);
    context = [
      `Recent dispatches: ${stories.slice(0, 6).map((s) => `#${s.dispatchNo} ${s.title}`).join("; ")}.`,
      `Builds: ${builds.map((b) => `${b.title} (${b.status})`).join("; ")}.`,
      `Guides: ${guides.map((x) => x.title).join("; ")}.`,
    ].join("\n");
  } catch {
    /* context is a bonus, not a requirement */
  }

  const system = [
    agent.systemPrompt,
    agent.behaviorRules ? `Behavior rules: ${agent.behaviorRules}` : "",
    context ? `Live site context:\n${context}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const messages: ChatMessage[] = [
    { role: "system", content: system },
    ...history.map((h) => ({ role: h.role as "user" | "assistant", content: h.content })),
    { role: "user", content: message },
  ];

  // Fallback logic: local (Ollama) when selected, else OpenRouter, else knowledge base.
  const agentProvider = agent.provider === "auto" ? config?.provider : agent.provider;
  const useLocal = agentProvider === "ollama" || agentProvider === "local";
  const openRouterKey = config?.openrouterKey || process.env.OPENROUTER_API_KEY || "";
  const openRouterModel = agent.modelId || config?.selectedModel || "";
  const ollamaBase = config?.ollamaBaseUrl || "http://127.0.0.1:11434";
  const ollamaModel = agent.modelId && agentProvider === "ollama" ? agent.modelId : config?.ollamaModel || "";

  const opts = { temperature: agent.temperature ?? 0.7, maxTokens: agent.maxTokens ?? 600 };

  let reply: string | null = null;
  let provider = "local-kb";
  let model = "knowledge-base";
  let fallback = true;

  if (useLocal && ollamaModel) {
    try {
      reply = await chatOllama(ollamaBase, ollamaModel, messages, opts);
      provider = "ollama";
      model = ollamaModel;
      fallback = false;
    } catch (error) {
      console.warn("[agent] ollama failed, falling through:", error instanceof Error ? error.message : error);
    }
  }
  if (!reply && openRouterKey && openRouterModel) {
    try {
      reply = await chatOpenRouter(openRouterKey, openRouterModel, messages, opts);
      provider = "openrouter";
      model = openRouterModel;
      fallback = false;
    } catch (error) {
      console.warn("[agent] openrouter failed, using knowledge base:", error instanceof Error ? error.message : error);
    }
  }
  if (!reply) reply = fallbackAnswer(message);

  try {
    await db.insert(agentLogs).values([
      { agentId: agent.id, role: "user", content: message.slice(0, 2000) },
      { agentId: agent.id, role: "assistant", content: reply.slice(0, 4000) },
    ]);
  } catch {
    /* logging must never break chat */
  }

  return Response.json({ ok: true, reply, provider, model, fallback, agent: agent.name });
}
