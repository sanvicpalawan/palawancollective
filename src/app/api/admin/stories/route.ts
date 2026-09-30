import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { stories } from "@/db/schema";
import { coerceBlocks, coerceDate, bool, num, slugify, str } from "@/lib/content-shape";
import { snapshot } from "@/lib/control";
import { requireOps, withOpsRefresh } from "@/lib/ops-auth";

export const dynamic = "force-dynamic";

async function list() {
  return db.select().from(stories).orderBy(desc(stories.publishedAt), desc(stories.dispatchNo));
}

async function nextDispatchNo(): Promise<number> {
  const row = await db.select({ max: sql<number | null>`max(${stories.dispatchNo})` }).from(stories);
  return (row[0]?.max ?? 0) + 1;
}

async function slugTaken(slug: string, exceptId?: number): Promise<boolean> {
  const rows = await db
    .select({ id: stories.id })
    .from(stories)
    .where(eq(stories.slug, slug))
    .limit(1);
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

  const bodyBlocks = coerceBlocks(body.body);
  const [row] = await db
    .insert(stories)
    .values({
      slug,
      dispatchNo: num(body.dispatchNo, 0) > 0 ? num(body.dispatchNo, 0) : await nextDispatchNo(),
      title,
      dek: str(body.dek, 600),
      category: str(body.category, 80) || "Field note",
      location: str(body.location, 120) || "Palawan, Philippines",
      readingMinutes: Math.max(1, num(body.readingMinutes, 4)),
      coverImage: str(body.coverImage, 400) || "/images/hero-build.jpg",
      coverAlt: str(body.coverAlt, 300) || title,
      body: bodyBlocks.length ? bodyBlocks : [{ type: "p", text: "" }],
      featured: bool(body.featured, false),
      publishedAt: coerceDate(body.publishedAt),
    })
    .returning();

  await snapshot("story", String(row.id), `Created “${row.title}”`, row);
  return withOpsRefresh(Response.json({ ok: true, row }), gate.refresh);
}

export async function PUT(request: Request) {
  const gate = await requireOps(request);
  if (gate.res) return gate.res;
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!id) return withOpsRefresh(Response.json({ ok: false, error: "Missing id." }, { status: 400 }), gate.refresh);

  const current = (await db.select().from(stories).where(eq(stories.id, id)).limit(1))[0];
  if (!current) return withOpsRefresh(Response.json({ ok: false, error: "Not found." }, { status: 404 }), gate.refresh);

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  await snapshot("story", String(id), `Before edit — ${current.title}`, current);

  const patch: Partial<typeof stories.$inferInsert> = {};
  if (body.title !== undefined) {
    const title = str(body.title, 300);
    if (title) patch.title = title;
  }
  if (body.slug !== undefined) {
    const slug = slugify(str(body.slug, 120));
    if (slug && slug !== current.slug) {
      if (await slugTaken(slug, id)) {
        return withOpsRefresh(Response.json({ ok: false, error: "That slug is already in use." }, { status: 409 }), gate.refresh);
      }
      patch.slug = slug;
    }
  }
  if (body.dek !== undefined) patch.dek = str(body.dek, 600);
  if (body.category !== undefined) patch.category = str(body.category, 80);
  if (body.location !== undefined) patch.location = str(body.location, 120);
  if (body.dispatchNo !== undefined) patch.dispatchNo = Math.max(1, num(body.dispatchNo, current.dispatchNo));
  if (body.readingMinutes !== undefined) patch.readingMinutes = Math.max(1, num(body.readingMinutes, current.readingMinutes));
  if (body.coverImage !== undefined) patch.coverImage = str(body.coverImage, 400);
  if (body.coverAlt !== undefined) patch.coverAlt = str(body.coverAlt, 300);
  if (body.body !== undefined) patch.body = coerceBlocks(body.body);
  if (body.featured !== undefined) patch.featured = bool(body.featured, current.featured);
  if (body.publishedAt !== undefined) patch.publishedAt = coerceDate(body.publishedAt);

  if (Object.keys(patch).length === 0) {
    return withOpsRefresh(Response.json({ ok: false, error: "Nothing to save." }, { status: 400 }), gate.refresh);
  }

  if (patch.featured === true) {
    await db.update(stories).set({ featured: false }).where(sql`true`);
  }

  const [row] = await db.update(stories).set(patch).where(eq(stories.id, id)).returning();
  return withOpsRefresh(Response.json({ ok: true, row }), gate.refresh);
}

export async function DELETE(request: Request) {
  const gate = await requireOps(request);
  if (gate.res) return gate.res;
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!id) return withOpsRefresh(Response.json({ ok: false, error: "Missing id." }, { status: 400 }), gate.refresh);

  const current = (await db.select().from(stories).where(eq(stories.id, id)).limit(1))[0];
  if (current) await snapshot("story", String(id), `Deleted “${current.title}”`, current);
  await db.delete(stories).where(eq(stories.id, id));
  return withOpsRefresh(Response.json({ ok: true }), gate.refresh);
}
