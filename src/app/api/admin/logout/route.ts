import { clearOpsCookieHeader } from "@/lib/ops-auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const res = Response.json({ ok: true });
  res.headers.set("Set-Cookie", clearOpsCookieHeader());
  return res;
}
