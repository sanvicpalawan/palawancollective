import { asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { builds, fieldLog, guides, stories } from "@/db/schema";
import type { Build, FieldLogEntry, Guide, Story } from "@/db/schema";
import { storySeeds } from "@/content/stories";
import { buildSeeds, guideSeeds, logSeeds } from "@/content/ecosystem";

/**
 * Data access for Palawan Collective.
 *
 * Content lives in PostgreSQL. On first access the bundled seed content is
 * inserted (idempotently — existing rows are never overwritten), so editing
 * rows in the database is the way to publish. If the database is unreachable
 * the site keeps rendering from the bundled seed content instead of failing.
 */

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

function seedData(now: number = Date.now()) {
  const created = new Date(now);
  const storyRows: Story[] = storySeeds.map(({ daysAgo, ...story }, i) => ({
    ...story,
    id: i + 1,
    publishedAt: new Date(now - daysAgo * DAY),
    createdAt: created,
  }));
  const buildRows: Build[] = buildSeeds.map((build, i) => ({ ...build, id: i + 1, createdAt: created }));
  const guideRows: Guide[] = guideSeeds.map(({ verifiedDaysAgo, ...guide }, i) => ({
    ...guide,
    id: i + 1,
    verifiedAt: new Date(now - verifiedDaysAgo * DAY),
    createdAt: created,
  }));
  const logRows: FieldLogEntry[] = logSeeds.map(({ hoursAgo, ...entry }, i) => ({
    ...entry,
    id: i + 1,
    loggedAt: new Date(now - hoursAgo * HOUR),
  }));
  return { storyRows, buildRows, guideRows, logRows };
}

type SeedData = ReturnType<typeof seedData>;

function withoutId<T extends { id: number }>(rows: T[]): Omit<T, "id">[] {
  return rows.map(({ id, ...rest }) => {
    void id;
    return rest;
  });
}

const globalForSeed = globalThis as typeof globalThis & { __palawanSeed?: Promise<void> | null };

function ensureSeeded(): Promise<void> {
  let pending = globalForSeed.__palawanSeed;
  if (!pending) {
    pending = (async () => {
      const { storyRows, buildRows, guideRows, logRows } = seedData();
      await db.insert(stories).values(withoutId(storyRows)).onConflictDoNothing({ target: stories.slug });
      await db.insert(builds).values(withoutId(buildRows)).onConflictDoNothing({ target: builds.slug });
      await db.insert(guides).values(withoutId(guideRows)).onConflictDoNothing({ target: guides.slug });
      await db.insert(fieldLog).values(withoutId(logRows)).onConflictDoNothing({ target: fieldLog.key });
    })().catch((error: unknown) => {
      globalForSeed.__palawanSeed = null;
      throw error;
    });
    globalForSeed.__palawanSeed = pending;
  }
  return pending;
}

let warned = false;

async function query<T>(run: () => Promise<T>, fallback: (seed: SeedData) => T): Promise<T> {
  try {
    await ensureSeeded();
    return await run();
  } catch (error) {
    if (!warned) {
      warned = true;
      console.warn(
        "[palawan-collective] Database unavailable — serving bundled seed content.",
        error instanceof Error ? error.message : error,
      );
    }
    return fallback(seedData());
  }
}

const newestFirst = (a: Story, b: Story) =>
  b.publishedAt.getTime() - a.publishedAt.getTime() || b.dispatchNo - a.dispatchNo;

/* ------------------------------- Stories ------------------------------- */

export function getStories(category?: string): Promise<Story[]> {
  return query(
    () =>
      db
        .select()
        .from(stories)
        .where(category ? eq(stories.category, category) : undefined)
        .orderBy(desc(stories.publishedAt), desc(stories.dispatchNo)),
    ({ storyRows }) => storyRows.filter((s) => !category || s.category === category).sort(newestFirst),
  );
}

export function getStory(slug: string): Promise<Story | null> {
  return query(
    async () => (await db.select().from(stories).where(eq(stories.slug, slug)).limit(1))[0] ?? null,
    ({ storyRows }) => storyRows.find((s) => s.slug === slug) ?? null,
  );
}

export function getStoriesBySlugs(slugs: string[]): Promise<Story[]> {
  if (slugs.length === 0) return Promise.resolve([]);
  return query(
    () => db.select().from(stories).where(inArray(stories.slug, slugs)).orderBy(desc(stories.publishedAt)),
    ({ storyRows }) => storyRows.filter((s) => slugs.includes(s.slug)).sort(newestFirst),
  );
}

/* --------------------------- Built environments ------------------------- */

export function getBuilds(): Promise<Build[]> {
  return query(
    () => db.select().from(builds).orderBy(asc(builds.position)),
    ({ buildRows }) => buildRows,
  );
}

export function getBuild(slug: string): Promise<Build | null> {
  return query(
    async () => (await db.select().from(builds).where(eq(builds.slug, slug)).limit(1))[0] ?? null,
    ({ buildRows }) => buildRows.find((b) => b.slug === slug) ?? null,
  );
}

/* ---------------------------- Palawan guides ---------------------------- */

export function getGuides(): Promise<Guide[]> {
  return query(
    () => db.select().from(guides).orderBy(asc(guides.position)),
    ({ guideRows }) => guideRows,
  );
}

export function getGuide(slug: string): Promise<Guide | null> {
  return query(
    async () => (await db.select().from(guides).where(eq(guides.slug, slug)).limit(1))[0] ?? null,
    ({ guideRows }) => guideRows.find((g) => g.slug === slug) ?? null,
  );
}

/* ------------------------------- Field log ------------------------------ */

export function getFieldLog(limit = 8): Promise<FieldLogEntry[]> {
  return query(
    () => db.select().from(fieldLog).orderBy(desc(fieldLog.loggedAt)).limit(limit),
    ({ logRows }) => [...logRows].sort((a, b) => b.loggedAt.getTime() - a.loggedAt.getTime()).slice(0, limit),
  );
}
