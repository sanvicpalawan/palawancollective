import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { builds } from "@/db/schema";
import { coerceDate, coerceKv, coerceSections, num, slugify, str, strList } from "@/lib/content-shape";
import { snapshot } from "@/lib/control";
import { requireOps, withOpsRefresh } from "@/lib/ops-auth";

export const dynamic = "force-dynamic";

async function list() {
  return db.select().from(builds).orderBy(asc(builds.position), asc(builds.id));
}

async function nextPosition(): Promise<number> {
  const row = await db.select({ max: sql<number | null>`max(${builds.position})` }).from(builds);
  return (row[0]?.max ?? -1) + 1;
}

async function slugTaken(slug: string, exceptId?: number): Promise<boolean> {
  const rows = await db.select({ id: builds.id }).from(builds).where(eq(builds.slug, slug)).limit(1);
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
  const typedSlug = slugify(str(body.slug, 120));
  let slug = typedSlug || slugify(title);
  if (!slug) {
    return withOpsRefresh(Response.json({ ok: false, error: "Could not build a slug from that title." }, { status: 400 }), gate.refresh);
  }
  if (await slugTaken(slug)) {
    // A slug the operator typed by hand must not silently change the URL they
    // expect; one derived from a duplicate title gets a suffix instead so
    // publishing is never blocked.
    if (typedSlug) {
      return withOpsRefresh(Response.json({ ok: false, error: "That slug is already in use." }, { status: 409 }), gate.refresh);
    }
    slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
  }

  const [row] = await db
    .insert(builds)
    .values({
      slug,
      position: num(body.position, -1) >= 0 ? num(body.position, 0) : await nextPosition(),
      title,
      tags: str(body.tags, 300),
      status: str(body.status, 60) || "In build",
      location: str(body.location, 160),
      since: str(body.since, 60),
      summary: str(body.summary, 900),
      fieldSpec: str(body.fieldSpec, 300),
      image: str(body.image, 400) || "/images/built-infrastructure.jpg",
      imageAlt: str(body.imageAlt, 300) || title,
      specs: coerceKv(body.specs),
      sections: coerceSections(body.sections),
      relatedStories: strList(body.relatedStories, 20, 120),
      createdAt: new Date(),
    })
    .returning();

  await snapshot("build", String(row.id), `Created “${row.title}”`, row);
  return withOpsRefresh(Response.json({ ok: true, row }), gate.refresh);
}

export async function PUT(request: Request) {
  const gate = await requireOps(request);
  if (gate.res) return gate.res;
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!id) return withOpsRefresh(Response.json({ ok: false, error: "Missing id." }, { status: 400 }), gate.refresh);

  const current = (await db.select().from(builds).where(eq(builds.id, id)).limit(1))[0];
  if (!current) return withOpsRefresh(Response.json({ ok: false, error: "Not found." }, { status: 404 }), gate.refresh);

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  await snapshot("build", String(id), `Before edit — ${current.title}`, current);

  const patch: Partial<typeof builds.$inferInsert> = {};
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
  if (body.tags !== undefined) patch.tags = str(body.tags, 300);
  if (body.status !== undefined) patch.status = str(body.status, 60);
  if (body.location !== undefined) patch.location = str(body.location, 160);
  if (body.since !== undefined) patch.since = str(body.since, 60);
  if (body.summary !== undefined) patch.summary = str(body.summary, 900);
  if (body.fieldSpec !== undefined) patch.fieldSpec = str(body.fieldSpec, 300);
  if (body.image !== undefined) patch.image = str(body.image, 400);
  if (body.imageAlt !== undefined) patch.imageAlt = str(body.imageAlt, 300);
  if (body.specs !== undefined) patch.specs = coerceKv(body.specs);
  if (body.sections !== undefined) patch.sections = coerceSections(body.sections);
  if (body.relatedStories !== undefined) patch.relatedStories = strList(body.relatedStories, 20, 120);

  if (Object.keys(patch).length === 0) {
    return withOpsRefresh(Response.json({ ok: false, error: "Nothing to save." }, { status: 400 }), gate.refresh);
  }

  const [row] = await db.update(builds).set(patch).where(eq(builds.id, id)).returning();
  return withOpsRefresh(Response.json({ ok: true, row }), gate.refresh);
}

export async function DELETE(request: Request) {
  const gate = await requireOps(request);
  if (gate.res) return gate.res;
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!id) return withOpsRefresh(Response.json({ ok: false, error: "Missing id." }, { status: 400 }), gate.refresh);

  const current = (await db.select().from(builds).where(eq(builds.id, id)).limit(1))[0];
  if (current) await snapshot("build", String(id), `Deleted “${current.title}”`, current);
  await db.delete(builds).where(eq(builds.id, id));
  return withOpsRefresh(Response.json({ ok: true }), gate.refresh);
}
