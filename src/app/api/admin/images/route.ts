import { eq } from "drizzle-orm";
import { db } from "@/db";
import { builds, galleries, guides, partners, siteSections, siteSettings, stories } from "@/db/schema";
import { getPartners, getSettingsMap, snapshot } from "@/lib/control";
import { getBuilds, getGuides, getStories } from "@/lib/data";
import { requireOps, withOpsRefresh } from "@/lib/ops-auth";

export const dynamic = "force-dynamic";

/**
 * One inventory of every image the live site renders, each tagged with where
 * it appears. The panel drives a straight "swap this photo" flow without the
 * operator having to know which table, section or file a picture lives in.
 *
 * Keys are `kind:id[:index]`:
 *   hero:0  setting:og_image  story:3  build:1  guide:2  gallery:4:0  partner:2  section:9
 */
export type ImageSlot = {
  key: string;
  group: string;
  title: string;
  where: string;
  url: string;
};

function slot(key: string, group: string, title: string, where: string, url: string): ImageSlot {
  return { key, group, title, where, url: url || "" };
}

async function settings(): Promise<Record<string, unknown>> {
  try {
    return await getSettingsMap();
  } catch {
    return {};
  }
}

function slidesOf(map: Record<string, unknown>): Array<Record<string, unknown>> {
  const raw = map.hero_slides;
  return Array.isArray(raw) ? (raw as Array<Record<string, unknown>>) : [];
}

async function inventory(): Promise<ImageSlot[]> {
  const map = await settings();
  const out: ImageSlot[] = [];

  // --- Home: hero carousel -------------------------------------------------
  const slides = slidesOf(map);
  slides.forEach((s, i) => {
    out.push(
      slot(
        `hero:${i}`,
        "Home · Hero carousel",
        `Slide ${i + 1} — ${typeof s.caption === "string" ? s.caption : "untitled"}`,
        `/ (first screen)`,
        String(s.src ?? ""),
      ),
    );
  });

  // --- Global marks --------------------------------------------------------
  out.push(slot("setting:site_logo", "Brand marks", "Site logo / wordmark", "Header, hero, footer", String(map.site_logo ?? "")));
  out.push(slot("setting:og_image", "Page headers & share", "Share card (Open Graph)", "Every shared link", String(map.og_image ?? "")));
  out.push(slot("setting:page_image_work", "Page headers & share", "Work With Us header", "/work-with-us", String(map.page_image_work ?? "")));
  out.push(slot("setting:page_image_built", "Page headers & share", "Built header", "/built", String(map.page_image_built ?? "")));
  out.push(slot("setting:page_image_palawan", "Page headers & share", "Palawan header", "/palawan", String(map.page_image_palawan ?? "")));

  // --- Content -------------------------------------------------------------
  try {
    for (const s of await getStories()) {
      out.push(slot(`story:${s.id}`, "Stories (dispatches)", s.title, `/stories/${s.slug}`, s.coverImage));
    }
  } catch { /* DB down — omit */ }

  try {
    for (const b of await getBuilds()) {
      out.push(slot(`build:${b.id}`, "Built environments", b.title, `/built/${b.slug}`, b.image));
    }
  } catch { /* DB down — omit */ }

  try {
    for (const g of await getGuides()) {
      out.push(slot(`guide:${g.id}`, "Palawan guides", g.title, `/palawan/${g.slug}`, g.image));
    }
  } catch { /* DB down — omit */ }

  try {
    const sections = await db.select().from(siteSections);
    for (const sec of sections) {
      const data = (sec.data ?? {}) as Record<string, unknown>;
      const image = typeof data.image === "string" ? data.image : "";
      if (!image) continue;
      out.push(
        slot(
          `section:${sec.id}`,
          "Home sections",
          `${sec.title}${typeof data.kicker === "string" && data.kicker ? ` — ${data.kicker}` : ""}`,
          `home · ${sec.key}`,
          image,
        ),
      );
    }
  } catch { /* DB down — omit */ }

  try {
    for (const p of await getPartners()) {
      out.push(slot(`partner:${p.id}`, "Partner logos", p.name, "Home · Partners marquee", p.logo));
    }
  } catch { /* DB down — omit */ }

  try {
    const gals = await db.select().from(galleries);
    for (const g of gals) {
      const items = Array.isArray(g.items) ? g.items : [];
      items.forEach((item, i) => {
        if (item.kind !== "image") return;
        out.push(slot(`gallery:${g.id}:${i}`, `Gallery · ${g.title}`, item.caption || `Item ${i + 1}`, `home · gallery (${g.slug})`, item.url));
      });
    }
  } catch { /* DB down — omit */ }

  return out;
}

async function assign(key: string, url: string): Promise<{ ok: boolean; error?: string }> {
  const [kind, idRaw, indexRaw] = key.split(":");
  const id = Number(idRaw);
  const now = new Date();

  const putSetting = async (name: string) => {
    await db
      .insert(siteSettings)
      .values({ key: name, value: url, updatedAt: now })
      .onConflictDoUpdate({ target: siteSettings.key, set: { value: url, updatedAt: now } });
  };

  switch (kind) {
    case "setting":
      await putSetting(idRaw); // idRaw holds the setting name
      return { ok: true };

    case "hero": {
      const map = await settings();
      const slides = slidesOf(map);
      const i = Number.isFinite(id) ? id : Number(indexRaw);
      if (!slides[i]) return { ok: false, error: "Slide not found." };
      slides[i] = { ...slides[i], src: url };
      await db
        .insert(siteSettings)
        .values({ key: "hero_slides", value: slides, updatedAt: now })
        .onConflictDoUpdate({ target: siteSettings.key, set: { value: slides, updatedAt: now } });
      return { ok: true };
    }

    case "story":
      await db.update(stories).set({ coverImage: url }).where(eq(stories.id, id));
      return { ok: true };

    case "build":
      await db.update(builds).set({ image: url }).where(eq(builds.id, id));
      return { ok: true };

    case "guide":
      await db.update(guides).set({ image: url }).where(eq(guides.id, id));
      return { ok: true };

    case "partner":
      await db.update(partners).set({ logo: url }).where(eq(partners.id, id));
      return { ok: true };

    case "section": {
      const rows = await db.select().from(siteSections).where(eq(siteSections.id, id)).limit(1);
      if (!rows[0]) return { ok: false, error: "Section not found." };
      const data = { ...((rows[0].data ?? {}) as Record<string, unknown>), image: url };
      await db.update(siteSections).set({ data, updatedAt: now }).where(eq(siteSections.id, id));
      return { ok: true };
    }

    case "gallery": {
      const itemIndex = Number(indexRaw);
      const rows = await db.select().from(galleries).where(eq(galleries.id, id)).limit(1);
      if (!rows[0]) return { ok: false, error: "Gallery not found." };
      const items = Array.isArray(rows[0].items) ? [...rows[0].items] : [];
      if (!items[itemIndex]) return { ok: false, error: "Gallery item not found." };
      items[itemIndex] = { ...items[itemIndex], url, mediaId: null };
      await db.update(galleries).set({ items }).where(eq(galleries.id, id));
      return { ok: true };
    }

    default:
      return { ok: false, error: "Unknown image slot." };
  }
}

export async function GET(request: Request) {
  const gate = await requireOps(request);
  if (gate.res) return gate.res;
  return withOpsRefresh(Response.json({ ok: true, slots: await inventory() }), gate.refresh);
}

export async function PUT(request: Request) {
  const gate = await requireOps(request);
  if (gate.res) return gate.res;
  const body = (await request.json().catch(() => ({}))) as { key?: string; url?: string };
  const key = typeof body.key === "string" ? body.key : "";
  const url = typeof body.url === "string" ? body.url.trim() : "";
  if (!key || !url) {
    return withOpsRefresh(Response.json({ ok: false, error: "Missing image or key." }, { status: 400 }), gate.refresh);
  }

  const before = (await inventory()).find((s) => s.key === key);
  await snapshot("image", key, `Swapped image — ${before?.title ?? key}`, { from: before?.url ?? null, to: url });

  const result = await assign(key, url);
  if (!result.ok) {
    return withOpsRefresh(Response.json({ ok: false, error: result.error ?? "Could not save." }, { status: 400 }), gate.refresh);
  }
  return withOpsRefresh(Response.json({ ok: true }), gate.refresh);
}
