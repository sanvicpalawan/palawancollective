import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { guides } from "@/db/schema";
import { coerceDate, coerceSections, num, slugify, str, strList } from "@/lib/content-shape";
import { snapshot } from "@/lib/control";
import { requireOps, withOpsRefresh } from "@/lib/ops-auth";

export const dynamic = "force-dynamic";

async function list() {
  return db.select().from(guides).orderBy(asc(guides.position), asc(guides.id));
}

async function nextPosition(): Promise<number> {
  const row = await db.select({ max: sql<number | null>`max(${guides.position})` }).from(guides);
  return (row[0]?.max ?? -1) + 1;
}

async function slugTaken(slug: string, exceptId?: number): Promise<boolean> {
  const rows = await db.select({ id: guides.id }).from(guides).where(eq(guides.slug, slug)).limit(1);
  return rows.length > 0 && rows[0].id !== exceptId;
}

export async function GET(request: Request) {
  const gate = await requireOps(request);
  if (gate.res) return gate.res;
  return withOpsRefresh(Response.json({ ok: true, rows: await list() }), gate.refresh);
}

export async function POST(request: Request) {
  const gate = await requireOps(request);
  if (gate.res) return gate.res;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  const title = str(body.title, 300);
  if (!title) {
    return withOpsRefresh(Response.json({ ok: false, error: "Title is required." }, { status: 400 }), gate.refresh);
  }
  let slug = slugify(str(body.slug, 120)) || slugify(title);
  if (!slug) {
    return withOpsRefresh(Response.json({ ok: false, error: "Could not build a slug from that title." }, { status: 400 }), gate.refresh);
  }
  if (await slugTaken(slug)) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;

  const [row] = await db
    .insert(guides)
    .values({
      slug,
      position: num(body.position, -1) >= 0 ? num(body.position, 0) : await nextPosition(),
      title,
      kicker: str(body.kicker, 160),
      summary: str(body.summary, 900),
      image: str(body.image, 400) || "/images/guide-untold.jpg",
      imageAlt: str(body.imageAlt, 300) || title,
      quickFacts: strList(body.quickFacts, 30, 300),
      sections: coerceSections(body.sections, true),
      verifiedAt: coerceDate(body.verifiedAt),
      createdAt: new Date(),
    })
    .returning();

  await snapshot("guide", String(row.id), `Created “${row.title}”`, row);
  return withOpsRefresh(Response.json({ ok: true, row }), gate.refresh);
}

export async function PUT(request: Request) {
  const gate = await requireOps(request);
  if (gate.res) return gate.res;
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!id) return withOpsRefresh(Response.json({ ok: false, error: "Missing id." }, { status: 400 }), gate.refresh);

  const current = (await db.select().from(guides).where(eq(guides.id, id)).limit(1))[0];
  if (!current) return withOpsRefresh(Response.json({ ok: false, error: "Not found." }, { status: 404 }), gate.refresh);

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  await snapshot("guide", String(id), `Before edit — ${current.title}`, current);

  const patch: Partial<typeof guides.$inferInsert> = {};
  if (body.title !== undefined && str(body.title, 300)) patch.title = str(body.title, 300);
  if (body.slug !== undefined) {
    const slug = slugify(str(body.slug, 120));
    if (slug && slug !== current.slug) {
      if (await slugTaken(slug, id)) {
        return withOpsRefresh(Response.json({ ok: false, error: "That slug is already in use." }, { status: 409 }), gate.refresh);
      }
      patch.slug = slug;
    }
  }
  if (body.position !== undefined) patch.position = num(body.position, current.position);
  if (body.kicker !== undefined) patch.kicker = str(body.kicker, 160);
  if (body.summary !== undefined) patch.summary = str(body.summary, 900);
  if (body.image !== undefined) patch.image = str(body.image, 400);
  if (body.imageAlt !== undefined) patch.imageAlt = str(body.imageAlt, 300);
  if (body.quickFacts !== undefined) patch.quickFacts = strList(body.quickFacts, 30, 300);
  if (body.sections !== undefined) patch.sections = coerceSections(body.sections, true);
  if (body.verifiedAt !== undefined) patch.verifiedAt = coerceDate(body.verifiedAt);

  if (Object.keys(patch).length === 0) {
    return withOpsRefresh(Response.json({ ok: false, error: "Nothing to save." }, { status: 400 }), gate.refresh);
  }

  const [row] = await db.update(guides).set(patch).where(eq(guides.id, id)).returning();
  return withOpsRefresh(Response.json({ ok: true, row }), gate.refresh);
}

export async function DELETE(request: Request) {
  const gate = await requireOps(request);
  if (gate.res) return gate.res;
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!id) return withOpsRefresh(Response.json({ ok: false, error: "Missing id." }, { status: 400 }), gate.refresh);

  const current = (await db.select().from(guides).where(eq(guides.id, id)).limit(1))[0];
  if (current) await snapshot("guide", String(id), `Deleted “${current.title}”`, current);
  await db.delete(guides).where(eq(guides.id, id));
  return withOpsRefresh(Response.json({ ok: true }), gate.refresh);
}
