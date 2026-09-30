import { checkPasskey, mintOpsToken, opsCookieHeader } from "@/lib/ops-auth";

export const dynamic = "force-dynamic";

/*
 * Failure-only rate limit: 20 bad attempts / 5 min per IP.
 * Successful logins always clear the counter, so the correct
 * passkey can never be locked out by earlier typos.
 */
const failures = new Map<string, { count: number; reset: number }>();

function isLimited(ip: string): boolean {
  const now = Date.now();
  const rec = failures.get(ip);
  if (!rec) return false;
  if (now > rec.reset) {
    failures.delete(ip);
    return false;
  }
  return rec.count >= 20;
}

function recordFailure(ip: string): void {
  const now = Date.now();
  const rec = failures.get(ip);
  if (!rec || now > rec.reset) {
    failures.set(ip, { count: 1, reset: now + 5 * 60_000 });
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
    const token = await mintOpsToken();
    // Token in body mirrors the cookie for Bearer clients (iframe-proof).
    const res = Response.json({ ok: true, token });
    res.headers.set("Set-Cookie", opsCookieHeader(token));
    return res;
  }

  if (!isLimited(ip)) recordFailure(ip);
  await new Promise((r) => setTimeout(r, 350));
  return Response.json({ ok: false });
}
