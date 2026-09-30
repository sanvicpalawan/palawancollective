import { opsCookieHeader, readOpsToken, verifyOpsToken } from "@/lib/ops-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const check = await verifyOpsToken(readOpsToken(request));
  if (!check.ok) return Response.json({ ok: true, authed: false });
  // Return the refreshed token in the body too, so Bearer clients stay alive
  // even when the browser blocks Set-Cookie in cross-site iframes.
  const res = Response.json({ ok: true, authed: true, token: check.refresh });
  res.headers.set("Set-Cookie", opsCookieHeader(check.refresh));
  return res;
}
