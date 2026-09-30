import { checkPasskey, mintOpsToken, opsCookieHeader } from "@/lib/ops-auth";

export const dynamic = "force-dynamic";

/*
 * Failure-only rate limit: 10 bad attempts / 15 min per IP, then the
 * endpoint refuses further guesses with 429 until the window clears.
 * A *correct* passkey is checked before the limit is applied, so the real
 * operator can never be locked out by an attacker sharing their egress IP.
 *
 * In-memory: exact on a long-lived server (VPS). On serverless it resets on
 * cold start, so treat it as one layer, not the only one.
 */
const WINDOW_MS = 15 * 60_000;
const MAX_FAILURES = 10;
const failures = new Map<string, { count: number; reset: number }>();

function prune(now: number): void {
  if (failures.size < 1000) return;
  for (const [key, rec] of failures) if (now > rec.reset) failures.delete(key);
}

function isLimited(ip: string): boolean {
  const now = Date.now();
  const rec = failures.get(ip);
  if (!rec) return false;
  if (now > rec.reset) {
    failures.delete(ip);
    return false;
  }
  return rec.count >= MAX_FAILURES;
}

function recordFailure(ip: string): void {
  const now = Date.now();
  prune(now);
  const rec = failures.get(ip);
  if (!rec || now > rec.reset) {
    failures.set(ip, { count: 1, reset: now + WINDOW_MS });
  } else {
    rec.count += 1;
  }
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  let passkey = "";
  try {
    const body = (await request.json()) as { passkey?: unknown };
    passkey = typeof body.passkey === "string" ? body.passkey : "";
  } catch {
    /* fall through to fail */
  }

  // Correct passkey ALWAYS wins — even if this IP's bucket is exhausted
  // (preview hosts can share egress IPs across many viewers).
  if (checkPasskey(passkey)) {
    failures.delete(ip);
    let token: string;
    try {
      token = await mintOpsToken();
    } catch (error) {
      // Fail closed: a missing/placeholder ADMIN_JWT_SECRET must never let
      // anyone in, and must be loud about why.
      console.error("[admin/login] auth not configured:", error instanceof Error ? error.message : error);
      return Response.json(
        { ok: false, error: "Console authentication is not configured on this server." },
        { status: 503 },
      );
    }
    // Token in body mirrors the cookie so same-origin fetch clients can use it.
    const res = Response.json({ ok: true, token });
    res.headers.set("Set-Cookie", opsCookieHeader(token));
    return res;
  }

  if (isLimited(ip)) {
    const rec = failures.get(ip);
    const retryAfter = rec ? Math.max(1, Math.ceil((rec.reset - Date.now()) / 1000)) : 60;
    return Response.json(
      { ok: false, error: "Too many attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  recordFailure(ip);
  await new Promise((r) => setTimeout(r, 350));
  return Response.json({ ok: false });
}
