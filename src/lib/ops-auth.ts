import { jwtVerify, SignJWT } from "jose";

/**
 * Stealth ops authentication.
 * - Passkey gate (default 5309, override with ADMIN_PASSKEY).
 * - Stateless JWT delivered BOTH as an obfuscated httpOnly cookie AND as a
 *   JSON token the client mirrors to localStorage.
 * - Dual transport: every guard accepts `Authorization: Bearer <token>` first,
 *   cookie second, so both same-origin fetches and direct API clients work.
 * - True inactivity expiry: token carries `seen`; requests older than
 *   INACTIVITY_MS are rejected. Each valid request re-issues with fresh `seen`.
 */

const COOKIE = "__pc_ops";
const ABS_TTL_SECONDS = 12 * 3600; // absolute session cap
const INACTIVITY_MS = 30 * 60 * 1000; // auto-expire after 30 min idle
const PASSKEY = process.env.ADMIN_PASSKEY || "5309";

const DEV_SECRET = "palawan-collective-dev-secret-change-me";
const PLACEHOLDERS = new Set([DEV_SECRET, "change-me-to-a-long-random-string", ""]);

/**
 * Session signing key.
 * Fails CLOSED: in production a missing/placeholder secret throws, which every
 * guard treats as "unauthorized" — the console locks rather than opening up.
 * Dev keeps a fixed throwaway so `npm run dev` works with no .env.
 */
function secret(): Uint8Array {
  const configured = process.env.ADMIN_JWT_SECRET?.trim() ?? "";
  if (PLACEHOLDERS.has(configured)) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "ADMIN_JWT_SECRET is missing or still a placeholder. Set a long random value before running in production.",
      );
    }
    return new TextEncoder().encode(DEV_SECRET);
  }
  return new TextEncoder().encode(configured);
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
  // Same-origin, httpOnly, Lax. The console is never embedded cross-site, so
  // there is no reason to widen the cookie to SameSite=None.
  const base = `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${ABS_TTL_SECONDS}`;
  return process.env.NODE_ENV === "production" ? `${base}; Secure` : base;
}

export function clearOpsCookieHeader(): string {
  const base = `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
  return process.env.NODE_ENV === "production" ? `${base}; Secure` : base;
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

/** Bearer header first, cookie second. */
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
    // Bearer twin of the cookie refresh, for same-origin fetch clients.
    res.headers.set("X-Ops-Token", refresh);
  }
  return res;
}
