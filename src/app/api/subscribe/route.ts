import { db } from "@/db";
import { subscribers } from "@/db/schema";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(request: Request) {
  let body: Record<string, unknown> = {};
  try {
    const parsed: unknown = await request.json();
    if (parsed && typeof parsed === "object") body = parsed as Record<string, unknown>;
  } catch {
    return Response.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  // Honeypot: bots fill hidden fields. Pretend it worked.
  if (typeof body.website === "string" && body.website.trim()) {
    return Response.json({ ok: true, message: "You’re on the list." });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return Response.json({ ok: false, error: "That email doesn’t look right." }, { status: 400 });
  }
  const source = typeof body.source === "string" && body.source.trim() ? body.source.trim().slice(0, 60) : "site";

  try {
    const inserted = await db
      .insert(subscribers)
      .values({ email, source })
      .onConflictDoNothing({ target: subscribers.email })
      .returning({ id: subscribers.id });
    const already = inserted.length === 0;
    return Response.json({
      ok: true,
      already,
      message: already
        ? "You’re already on the list. Next dispatch lands Sunday."
        : "You’re on the list. The next dispatch lands Sunday morning, Manila time.",
    });
  } catch (error) {
    console.error("[subscribe] insert failed", error);
    return Response.json(
      { ok: false, error: "Couldn’t save that right now — the uplink may be down. Try again in a minute." },
      { status: 503 },
    );
  }
}
