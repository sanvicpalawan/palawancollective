import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { agentLogs, agents } from "@/db/schema";
import { DEFAULT_AGENT_PROMPT, getAgents, snapshot } from "@/lib/control";
import { requireOps, withOpsRefresh } from "@/lib/ops-auth";

export const dynamic = "force-dynamic";

function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export async function GET(request: Request) {
  const gate = await requireOps(request);
  if (gate.res) return gate.res;
  const [list, logs] = await Promise.all([
    getAgents(),
    db.select().from(agentLogs).orderBy(desc(agentLogs.id)).limit(30),
  ]);
  return withOpsRefresh(Response.json({ ok: true, agents: list, logs: logs.reverse() }), gate.refresh);
}

export async function POST(request: Request) {
  const gate = await requireOps(request);
  if (gate.res) return gate.res;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const name = str(body.name, 60) || "Untitled Agent";
  const [row] = await db
    .insert(agents)
    .values({
      name,
      role: str(body.role, 40) || "Customer Assistant",
      systemPrompt: str(body.systemPrompt, 6000) || DEFAULT_AGENT_PROMPT,
      temperature: typeof body.temperature === "number" ? Math.min(2, Math.max(0, body.temperature)) : 0.7,
      maxTokens: typeof body.maxTokens === "number" ? Math.min(8000, Math.max(50, Math.round(body.maxTokens))) : 800,
      behaviorRules: str(body.behaviorRules, 4000),
      provider: ["auto", "openrouter", "ollama"].includes(str(body.provider, 20)) ? str(body.provider, 20) : "auto",
      modelId: str(body.modelId, 120),
      status: "stopped",
      isDefault: false,
    })
    .returning();
  await snapshot("agent", String(row.id), `Created agent “${row.name}”`, row);
  return withOpsRefresh(Response.json({ ok: true, agent: row }), gate.refresh);
}

export async function PUT(request: Request) {
  const gate = await requireOps(request);
  if (gate.res) return gate.res;
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!id) return withOpsRefresh(Response.json({ ok: false, error: "Missing id." }, { status: 400 }), gate.refresh);
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const current = (await db.select().from(agents).where(eq(agents.id, id)).limit(1))[0];
  if (!current) return withOpsRefresh(Response.json({ ok: false, error: "Not found." }, { status: 404 }), gate.refresh);
  await snapshot("agent", String(id), `Before editing “${current.name}”`, current);

  const patch: Partial<typeof current> = { updatedAt: new Date() };
  if (body.name !== undefined && str(body.name, 60)) patch.name = str(body.name, 60);
  if (body.role !== undefined) patch.role = str(body.role, 40) || current.role;
  if (body.systemPrompt !== undefined && str(body.systemPrompt, 6000)) patch.systemPrompt = str(body.systemPrompt, 6000);
  if (typeof body.temperature === "number") patch.temperature = Math.min(2, Math.max(0, body.temperature));
  if (typeof body.maxTokens === "number") patch.maxTokens = Math.min(8000, Math.max(50, Math.round(body.maxTokens)));
  if (body.behaviorRules !== undefined) patch.behaviorRules = str(body.behaviorRules, 4000);
  if (typeof body.provider === "string" && ["auto", "openrouter", "ollama"].includes(body.provider)) patch.provider = body.provider;
  if (body.modelId !== undefined) patch.modelId = str(body.modelId, 120);
  if (body.status === "active" || body.status === "stopped") patch.status = body.status;
  if (body.isDefault === true) {
    await db.update(agents).set({ isDefault: false }).where(eq(agents.isDefault, true));
    patch.isDefault = true;
  } else if (body.isDefault === false) {
    patch.isDefault = false;
  }
  const [row] = await db.update(agents).set(patch).where(eq(agents.id, id)).returning();
  return withOpsRefresh(Response.json({ ok: true, agent: row }), gate.refresh);
}

export async function DELETE(request: Request) {
  const gate = await requireOps(request);
  if (gate.res) return gate.res;
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!id) return withOpsRefresh(Response.json({ ok: false, error: "Missing id." }, { status: 400 }), gate.refresh);
  const current = (await db.select().from(agents).where(eq(agents.id, id)).limit(1))[0];
  if (current?.isDefault) {
    return withOpsRefresh(Response.json({ ok: false, error: "The default agent can't be deleted. Promote another first." }, { status: 400 }), gate.refresh);
  }
  if (current) await snapshot("agent", String(id), `Deleted “${current.name}”`, current);
  await db.delete(agents).where(eq(agents.id, id));
  return withOpsRefresh(Response.json({ ok: true }), gate.refresh);
}
