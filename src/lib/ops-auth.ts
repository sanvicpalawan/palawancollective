import { jwtVerify, SignJWT } from "jose";

/**
 * Stealth ops authentication.
 * - Passkey gate (default 5309, override with ADMIN_PASSKEY).
 * - Stateless JWT delivered BOTH as an obfuscated httpOnly cookie AND as a
 *   JSON token the client mirrors to localStorage.
 * - Dual transport: every guard accepts `Authorization: Bearer <token>` first,
 *   cookie second. This keeps login working inside cross-site preview iframes
 *   (e.g. Arena battle view), where browsers block SameSite=Lax cookies.
 * - True inactivity expiry: token carries `seen`; requests older than
 *   INACTIVITY_MS are rejected. Each valid request re-issues with fresh `seen`.
 */

const COOKIE = "__pc_ops";
const ABS_TTL_SECONDS = 12 * 3600; // absolute session cap
const INACTIVITY_MS = 30 * 60 * 1000; // auto-expire after 30 min idle
const PASSKEY = process.env.ADMIN_PASSKEY || "5309";

function secret(): Uint8Array {
  const s = process.env.ADMIN_JWT_SECRET || "palawan-collective-dev-secret-change-me";
  return new TextEncoder().encode(s);
}

export function opsCookieName(): string {
  return COOKIE;
}

export function checkPasskey(candidate: string): boolean {
  const a = candidate.trim();
  if (!a || a.length > 64) return false;
  // constant-time-ish compare to avoid trivial timing leaks
  const b = PASSKEY;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function mintOpsToken(): Promise<string> {
  const now = Date.now();
  return new SignJWT({ sub: "ops", seen: now })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(Math.floor(now / 1000))
    .setExpirationTime(Math.floor(now / 1000) + ABS_TTL_SECONDS)
    .sign(secret());
}

export type OpsCheck = { ok: true; refresh: string } | { ok: false };

export async function verifyOpsToken(token: string | undefined | null): Promise<OpsCheck> {
  if (!token) return { ok: false };
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    if (payload.sub !== "ops") return { ok: false };
    const seen = typeof payload.seen === "number" ? payload.seen : 0;
    if (Date.now() - seen > INACTIVITY_MS) return { ok: false };
    return { ok: true, refresh: await mintOpsToken() };
  } catch {
    return { ok: false };
  }
}

export function opsCookieHeader(token: string): string {
  // Production previews are HTTPS and often embedded cross-site (Arena iframe),
  // where SameSite=Lax cookies are blocked. SameSite=None + Secure + Partitioned
  // (CHIPS) keeps the cookie working there. Dev stays Lax (plain HTTP).
  if (process.env.NODE_ENV === "production") {
    return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=None; Secure; Partitioned; Max-Age=${ABS_TTL_SECONDS}`;
  }
  return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${ABS_TTL_SECONDS}`;
}

export function clearOpsCookieHeader(): string {
  if (process.env.NODE_ENV === "production") {
    return `${COOKIE}=; Path=/; HttpOnly; SameSite=None; Secure; Partitioned; Max-Age=0`;
  }
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function readOpsCookie(request: Request): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === COOKIE) return rest.join("=") || null;
  }
  return null;
}

export function readBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  const token = match?.[1]?.trim();
  return token ? token : null;
}

/** Bearer header first (iframe-proof), cookie second. */
export function readOpsToken(request: Request): string | null {
  return readBearerToken(request) ?? readOpsCookie(request);
}

/** Guard for admin API routes. Returns a 401 Response when unauthenticated. */
export async function requireOps(request: Request): Promise<{ res: Response | null; refresh: string | null }> {
  const check = await verifyOpsToken(readOpsToken(request));
  if (!check.ok) {
    return { res: Response.json({ ok: false, error: "unauthorized" }, { status: 401 }), refresh: null };
  }
  return { res: null, refresh: check.refresh };
}

export function withOpsRefresh(res: Response, refresh: string | null): Response {
  if (refresh) {
    res.headers.append("Set-Cookie", opsCookieHeader(refresh));
    // Bearer twin of the cookie refresh — readable by same-origin fetch even
    // when the browser blocks Set-Cookie in cross-site iframes.
    res.headers.set("X-Ops-Token", refresh);
  }
  return res;
}
