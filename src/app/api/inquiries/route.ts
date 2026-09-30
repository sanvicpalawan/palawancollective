import { db } from "@/db";
import { inquiries } from "@/db/schema";
import { inquiryFocusOptions, inquiryTimelineOptions } from "@/lib/site";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[+\d\s().-]{6,40}$/;

function str(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  let body: Record<string, unknown> = {};
  try {
    const parsed: unknown = await request.json();
    if (parsed && typeof parsed === "object") body = parsed as Record<string, unknown>;
  } catch {
    return Response.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  // Honeypot
  if (str(body.website, 200)) return Response.json({ ok: true });

  const kind = body.kind === "partner" ? "partner" : "project";
  const name = str(body.name, 120);
  const email = str(body.email, 254).toLowerCase();
  const whatsapp = str(body.whatsapp, 40) || null;
  const organization = str(body.organization, 160) || null;
  const focusInput = str(body.focus, 80);
  const focus = (inquiryFocusOptions as readonly string[]).includes(focusInput) ? focusInput : "Something else";
  const timelineInput = str(body.timeline, 40);
  const timeline = (inquiryTimelineOptions as readonly string[]).includes(timelineInput) ? timelineInput : null;
  const message = str(body.message, 5000);

  const fieldErrors: Record<string, string> = {};
  if (!name) fieldErrors.name = "Tell us who you are.";
  if (!EMAIL_RE.test(email)) fieldErrors.email = "We need an email that works.";
  if (whatsapp && !PHONE_RE.test(whatsapp)) fieldErrors.whatsapp = "That number looks off.";
  if (message.length < 20) fieldErrors.message = "A few more details, please — at least 20 characters.";
  if (Object.keys(fieldErrors).length > 0) {
    return Response.json({ ok: false, error: "Check the highlighted fields.", fieldErrors }, { status: 422 });
  }

  try {
    const [row] = await db
      .insert(inquiries)
      .values({ kind, name, email, whatsapp, organization, focus, timeline, message })
      .returning({ id: inquiries.id });
    return Response.json({ ok: true, id: row?.id ?? null });
  } catch (error) {
    console.error("[inquiries] insert failed", error);
    return Response.json(
      { ok: false, error: "Couldn’t save that right now — the uplink may be down. Try again, or message us on WhatsApp." },
      { status: 503 },
    );
  }
}
