import { db } from "@/db";
import { analyticsEvents } from "@/db/schema";

export const dynamic = "force-dynamic";

const ALLOWED = new Set(["pageview", "chat", "subscribe", "inquiry", "cta"]);

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { type?: unknown; path?: unknown; meta?: unknown };
    const type = typeof body.type === "string" ? body.type.slice(0, 32) : "";
    if (!ALLOWED.has(type)) return Response.json({ ok: false }, { status: 400 });
    const path = typeof body.path === "string" ? body.path.slice(0, 200) : "/";
    const meta = body.meta && typeof body.meta === "object" ? (body.meta as Record<string, unknown>) : {};
    await db.insert(analyticsEvents).values({ type, path, meta });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }
}
