import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  agents,
  contentVersions,
  designTokens,
  faqs,
  galleries,
  modelConfig,
  navItems,
  partners,
  siteSections,
  siteSettings,
  socialLinks,
} from "@/db/schema";
import type {
  Agent,
  CachedModel,
  ContentVersion,
  DesignTokens,
  Faq,
  Gallery,
  MediaAsset,
  ModelConfig,
  NavItem,
  Partner,
  SectionData,
  SiteSection,
  SocialLink,
} from "@/db/schema";
import { mediaAssets } from "@/db/schema";
import { services as DEFAULT_SERVICES, systems as DEFAULT_SYSTEMS } from "./site";
import type { ServiceItem, SystemItem } from "./site";

/* ------------------------------------------------------------------ */
/* Defaults                                                              */
/* ------------------------------------------------------------------ */

import { DEFAULT_DESIGN } from "./design";

export { DEFAULT_DESIGN };

export const DEFAULT_SETTINGS: Record<string, unknown> = {
  site_name: "Palawan Collective",
  site_logo: "",
  site_logo_width: 148,
  site_logo_width_mobile: 116,
  site_logo_footer_width: 168,
  tagline: "Stories, systems, and infrastructure from building off-grid resorts and automation ecosystems in Palawan.",
  positioning:
    "Building off-grid resorts, automation systems, and real-world infrastructure in Palawan — and documenting the process.",
  newsletter_title: "Field Notes",
  newsletter_subtitle: "Weekly dispatches from Palawan.",
  newsletter_copy: "What’s working, what’s breaking, and what we’re building next.",
  newsletter_provider: "none",
  newsletter_provider_url: "",
  newsletter_provider_key: "",
  hero_kicker: "Dispatches from building a real-world + digital ecosystem",
  hero_name: "David Le Smith",
  hero_role: "Builder of places, systems, and autonomous operations.",
  hero_intro:
    "I document the process of building sustainable resorts, deploying automation for local businesses, and creating an ecosystem where technology and nature operate together.",
  footer_note: "Written on solar power, between squalls.",
  chat_enabled: true,
  chat_title: "Palawan Operator",
  chat_greeting: "Hi — I run the front desk here. Ask about the builds, the stories, or getting around Palawan.",
  // Page-header photos + share card (previously hardcoded in the JSX).
  og_image: "/images/hero-build.jpg",
  page_image_work: "/images/page-work.jpg",
  page_image_built: "/images/page-built.jpg",
  page_image_palawan: "/images/page-palawan.jpg",
  // Home hero carousel. Edited from Ops → Site images.
  hero_slides: [
    {
      src: "/images/hero-build.jpg",
      alt: "Crew framing a timber roof in a jungle clearing",
      caption: "Roof framing, before the rains",
      tag: "Build",
      location: "Site 01 · Northern Palawan",
    },
    {
      src: "/images/story-no-road.jpg",
      alt: "Workers unloading cargo from a boat across a wooden plank at first light",
      caption: "Unloading at high tide",
      tag: "Logistics",
      location: "Landing beach · 06:10",
    },
    {
      src: "/images/page-palawan.jpg",
      alt: "Outrigger boats beneath limestone cliffs in northern Palawan",
      caption: "Bangkas under the limestone",
      tag: "Palawan",
      location: "Northern coast",
    },
    {
      src: "/images/story-off-grid.jpg",
      alt: "An electrician wiring a solar power system",
      caption: "Power room wiring",
      tag: "Off-grid",
      location: "Site 01 · Power shed",
    },
    {
      src: "/images/built-infrastructure.jpg",
      alt: "Colourful outrigger boats moored in a Filipino harbour",
      caption: "Supply day at the harbour",
      tag: "Network",
      location: "Taytay",
    },
  ] satisfies HeroSlide[],
};

export type HeroSlide = { src: string; alt: string; caption: string; tag: string; location: string };

export const DEFAULT_AGENT_PROMPT =
  "You are the operator of Palawan Collective. You help users understand the ecosystem, navigate Palawan, explore projects, and take action.";

type SectionSeed = { key: string; type: string; title: string; position: number; data: SectionData };

const SECTION_SEEDS: SectionSeed[] = [
  { key: "hero", type: "hero", title: "Hero", position: 0, data: { index: "00", eyebrow: "PALAWAN COLLECTIVE" } },
  { key: "status", type: "custom", title: "Status strip", position: 1, data: { note: "Live field-station readout" } },
  { key: "built", type: "grid", title: "Built Environments", position: 2, data: { index: "01", first: "Built", second: "Environments", description: "Not client work — proof of execution. Places and systems we’ve built, run, and had to fix." } },
  { key: "stories", type: "story-blocks", title: "Stories", position: 3, data: { index: "02", first: "Stories", note: "Not a blog." } },
  { key: "fieldnotes", type: "newsletter", title: "Field Notes", position: 4, data: { index: "03" } },
  { key: "partners", type: "partners", title: "Our Partners", position: 5, data: { index: "04" } },
  { key: "systems", type: "grid", title: "Systems We Build", position: 6, data: { index: "05", first: "Systems", second: "We Build" } },
  { key: "work", type: "cta", title: "Work With Us", position: 7, data: { index: "06", first: "Work", second: "With Us" } },
  { key: "faq", type: "faq", title: "FAQ", position: 8, data: { index: "07", first: "Questions", second: "Answered" } },
  { key: "gallery", type: "gallery", title: "Field Gallery", position: 9, data: { index: "08", gallerySlug: "site-01-build-diary" } },
  { key: "palawan", type: "grid", title: "Navigating Palawan", position: 10, data: { index: "09", first: "Navigating", second: "Palawan" } },
];

const NAV_SEEDS = [
  { location: "header", label: "Stories", href: "/stories", position: 0 },
  { location: "header", label: "Built", href: "/built", position: 1 },
  { location: "header", label: "Systems", href: "/#systems", position: 2 },
  { location: "header", label: "Palawan", href: "/palawan", position: 3 },
  { location: "header", label: "Work with us", href: "/work-with-us", position: 4 },
];

const SOCIAL_SEEDS: Array<{ platform: string; label: string; url: string; position: number; visible: boolean }> = [
  { platform: "github", label: "GitHub", url: "https://github.com/sanvicpalawan", position: 0, visible: true },
  { platform: "x", label: "X", url: "https://x.com/merqatodigital", position: 1, visible: true },
  { platform: "instagram", label: "Instagram", url: "https://www.instagram.com/yesitsreallymedavid", position: 2, visible: true },
  { platform: "youtube", label: "YouTube", url: "", position: 3, visible: true },
  { platform: "website", label: "Website", url: "https://palawancollective.com", position: 4, visible: true },
  { platform: "tiktok", label: "TikTok", url: "", position: 5, visible: false },
  { platform: "facebook", label: "Facebook", url: "", position: 6, visible: false },
  { platform: "linkedin", label: "LinkedIn", url: "", position: 7, visible: false },
  { platform: "telegram", label: "Telegram", url: "", position: 8, visible: false },
  { platform: "whatsapp", label: "WhatsApp", url: "", position: 9, visible: false },
];

const PARTNER_SEEDS: Array<{ name: string; logo: string; url: string; position: number; visible: boolean }> = [
  { name: "Amuma Barefoot Boutique Resorts", logo: "/images/partners/amuma.svg", url: "", position: 0, visible: true },
  { name: "Sanvic", logo: "/images/partners/sanvic.svg", url: "https://sanvic.ph", position: 1, visible: true },
  { name: "merQato.digital", logo: "/images/partners/merqato.svg", url: "https://merqato.digital", position: 2, visible: true },
  { name: "Azarraga Glass & Aluminum", logo: "/images/partners/azarraga.svg", url: "https://azarragaglass.com", position: 3, visible: true },
  { name: "Kapwa Hospitality Group", logo: "/images/partners/kapwa.svg", url: "", position: 4, visible: true },
];

const FAQ_SEEDS = [
  {
    question: "What is Palawan Collective?",
    answer:
      "A living system, not a portfolio. We build off-grid resorts, automation systems and real-world infrastructure in Palawan — and document the process as field notes.",
    position: 0,
  },
  {
    question: "Can I stay at Site 01?",
    answer:
      "Not yet. Site 01 opens to guests once its water and power systems have survived a full season with people on site. Subscribe to the dispatch to hear first.",
    position: 1,
  },
  {
    question: "Do you take on client projects?",
    answer:
      "A small number each year, usually where land, operations and technology overlap: resort and land development, business automation, AI agent deployment, and ecosystem partnerships.",
    position: 2,
  },
  {
    question: "How do your AI agents work with unstable internet?",
    answer:
      "Agents queue every message locally, retry across satellite and 4G uplinks, and always hand bookings and payments to a human for approval. Offline-first by design.",
    position: 3,
  },
  {
    question: "When is the best time to come to Palawan?",
    answer:
      "November to May is the dry season, when boats and roads mostly behave. June to October is the habagat — beautiful, quieter, but build buffer days into anything that depends on a boat.",
    position: 4,
  },
];

/* ------------------------------------------------------------------ */
/* Seeding (idempotent — never overwrites)                               */
/* ------------------------------------------------------------------ */

const g = globalThis as typeof globalThis & { __pcControlSeed?: Promise<void> | null };

function ensureControlSeeded(): Promise<void> {
  if (!g.__pcControlSeed) {
    g.__pcControlSeed = (async () => {
      const existingSettings = await db.select({ key: siteSettings.key }).from(siteSettings);
      const have = new Set(existingSettings.map((r) => r.key));
      for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
        if (!have.has(key)) await db.insert(siteSettings).values({ key, value }).onConflictDoNothing();
      }
      const design = await db.select({ id: designTokens.id }).from(designTokens).limit(1);
      if (design.length === 0) await db.insert(designTokens).values({ tokens: DEFAULT_DESIGN });
      const sections = await db.select({ key: siteSections.key, position: siteSections.position }).from(siteSections);
      // One-time: DBs seeded before the Systems block existed need the tail
      // (position >= 6) pushed down a slot so Systems lands at 6 without
      // colliding with Work With Us. Fresh DBs have no rows to shift.
      if (sections.length > 0 && !sections.some((s) => s.key === "systems")) {
        for (const s of sections.filter((x) => x.position >= 6)) {
          await db
            .update(siteSections)
            .set({ position: s.position + 1, updatedAt: new Date() })
            .where(eq(siteSections.key, s.key));
        }
      }
      const haveSections = new Set(sections.map((r) => r.key));
      for (const s of SECTION_SEEDS) {
        if (!haveSections.has(s.key)) {
          await db.insert(siteSections).values({
            page: "home",
            key: s.key,
            type: s.type,
            title: s.title,
            position: s.position,
            visible: true,
            status: "published",
            data: s.data,
          });
        }
      }
      const nav = await db.select({ id: navItems.id }).from(navItems).limit(1);
      if (nav.length === 0) {
        for (const n of NAV_SEEDS) await db.insert(navItems).values({ ...n, visible: true });
      }
      const soc = await db.select({ platform: socialLinks.platform }).from(socialLinks);
      const haveSocial = new Set(soc.map((r) => r.platform));
      for (const s of SOCIAL_SEEDS) {
        if (!haveSocial.has(s.platform)) {
          await db.insert(socialLinks).values(s).onConflictDoNothing();
        }
      }
      const pCount = await db.select({ id: partners.id }).from(partners).limit(1);
      if (pCount.length === 0) {
        for (const p of PARTNER_SEEDS) await db.insert(partners).values(p);
      }
      // One-time migration: older sandboxes shipped a "systems" section here.
      // Replace it with the "Our Partners" section on the home page.
      const hasPartners = await db.select({ id: siteSections.id }).from(siteSections).where(eq(siteSections.key, "partners")).limit(1);
      const hasSystems = await db.select().from(siteSections).where(eq(siteSections.key, "systems")).limit(1);
      if (hasSystems.length > 0 && hasPartners.length === 0) {
        await db
          .update(siteSections)
          .set({ key: "partners", type: "partners", title: "Our Partners", position: 5, data: { index: "04" }, updatedAt: new Date() })
          .where(eq(siteSections.key, "systems"));
      }
      const fq = await db.select({ id: faqs.id }).from(faqs).limit(1);
      if (fq.length === 0) {
        for (const f of FAQ_SEEDS) await db.insert(faqs).values({ ...f, visible: true });
      }
      const gal = await db.select({ id: galleries.id }).from(galleries).limit(1);
      if (gal.length === 0) {
        await db.insert(galleries).values({
          slug: "site-01-build-diary",
          title: "Site 01 — Build Diary",
          description: "Roof framing, solar runs, boat logistics and the crew. Updated as we build.",
          layout: "grid",
          items: [
            { mediaId: null, url: "/images/built-resort.jpg", caption: "Roof framing", kind: "image" },
            { mediaId: null, url: "/images/story-no-road.jpg", caption: "Unloading at high tide", kind: "image" },
            { mediaId: null, url: "/images/story-off-grid.jpg", caption: "Power room wiring", kind: "image" },
            { mediaId: null, url: "/images/built-infrastructure.jpg", caption: "Harbour, supply day", kind: "image" },
            { mediaId: null, url: "/images/story-crew.jpg", caption: "Carrying timber", kind: "image" },
            { mediaId: null, url: "/images/guide-where-to-stay.jpg", caption: "Cove, dry season", kind: "image" },
          ],
          position: 0,
          visible: true,
        });
      }
      const ag = await db.select({ id: agents.id }).from(agents).limit(1);
      if (ag.length === 0) {
        await db.insert(agents).values({
          name: "Palawan Operator",
          role: "Customer Assistant",
          systemPrompt: `${DEFAULT_AGENT_PROMPT}\n\nVoice: short, plain, operational. No hype. If you don't know something, say so and suggest messaging on WhatsApp.`,
          temperature: 0.6,
          maxTokens: 600,
          behaviorRules: "Answer in 2-4 sentences. Offer one next action (read a story, check a guide, subscribe, WhatsApp). Never invent prices, dates, or availability.",
          provider: "auto",
          modelId: "",
          status: "active",
          isDefault: true,
        });
        await db.insert(agents).values({
          name: "Field Writer",
          role: "Content Writer",
          systemPrompt: `${DEFAULT_AGENT_PROMPT}\n\nYou draft dispatches in the field-journal voice: raw, operational, specific. Short paragraphs. Always include what broke and what changed.`,
          temperature: 0.8,
          maxTokens: 1200,
          behaviorRules: "Draft only — a human publishes. Ask for the raw notes first if none are provided.",
          provider: "auto",
          modelId: "",
          status: "stopped",
          isDefault: false,
        });
      }
      const mc = await db.select({ id: modelConfig.id }).from(modelConfig).limit(1);
      if (mc.length === 0) {
        await db.insert(modelConfig).values({
          provider: "openrouter",
          openrouterKey: process.env.OPENROUTER_API_KEY || "",
          showFree: true,
          showPaid: true,
          selectedModel: "",
          ollamaBaseUrl: process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434",
          ollamaModel: "",
          modelsCache: [],
        });
      }
    })().catch((error: unknown) => {
      g.__pcControlSeed = null;
      throw error;
    });
  }
  return g.__pcControlSeed;
}

/* ------------------------------------------------------------------ */
/* Readers                                                             */
/* ------------------------------------------------------------------ */

export async function getSettingsMap(): Promise<Record<string, unknown>> {
  await ensureControlSeeded();
  const rows = await db.select().from(siteSettings);
  const map: Record<string, unknown> = { ...DEFAULT_SETTINGS };
  for (const row of rows) map[row.key] = row.value;
  return map;
}

/**
 * Editable copies of the Systems + Work With Us collections. They ship with the
 * defaults from `lib/site.ts` and are stored in `site_settings` once an operator
 * edits them, so the live site keeps rendering even when the DB is unreachable.
 */
export type Catalog = { systems: SystemItem[]; services: ServiceItem[] };

export async function getCatalog(): Promise<Catalog> {
  let map: Record<string, unknown> = {};
  try {
    map = await getSettingsMap();
  } catch {
    map = {};
  }
  const systems = map.systems_catalog;
  const services = map.services_catalog;
  return {
    systems: Array.isArray(systems) && systems.length ? (systems as SystemItem[]) : DEFAULT_SYSTEMS,
    services: Array.isArray(services) && services.length ? (services as ServiceItem[]) : DEFAULT_SERVICES,
  };
}

export async function saveCatalog(catalog: Catalog): Promise<Catalog> {
  for (const [key, value] of [
    ["systems_catalog", catalog.systems],
    ["services_catalog", catalog.services],
  ] as const) {
    await db
      .insert(siteSettings)
      .values({ key, value, updatedAt: new Date() })
      .onConflictDoUpdate({ target: siteSettings.key, set: { value, updatedAt: new Date() } });
  }
  return catalog;
}

export function setting<T>(map: Record<string, unknown>, key: string, fallback: T): T {
  const v = map[key];
  return (v === undefined || v === null ? fallback : v) as T;
}

export async function getDesign(): Promise<DesignTokens> {
  await ensureControlSeeded();
  const rows = await db.select().from(designTokens).limit(1);
  if (!rows[0]) return DEFAULT_DESIGN;
  return {
    ...DEFAULT_DESIGN,
    ...rows[0].tokens,
    colors: { ...DEFAULT_DESIGN.colors, ...rows[0].tokens.colors },
    fonts: { ...DEFAULT_DESIGN.fonts, ...rows[0].tokens.fonts },
  };
}

export async function getSections(page = "home"): Promise<SiteSection[]> {
  await ensureControlSeeded();
  return db.select().from(siteSections).orderBy(asc(siteSections.position));
}

export async function getPublishedSections(page = "home"): Promise<SiteSection[]> {
  const all = await getSections(page);
  return all.filter((s) => s.page === page && s.visible && s.status === "published");
}

export async function getNav(location = "header"): Promise<NavItem[]> {
  await ensureControlSeeded();
  return db.select().from(navItems).orderBy(asc(navItems.position));
}

export async function getSocialLinks(onlyVisible = false): Promise<SocialLink[]> {
  await ensureControlSeeded();
  const rows = await db.select().from(socialLinks).orderBy(asc(socialLinks.position));
  const list = onlyVisible ? rows.filter((r) => r.visible && r.url.trim()) : rows;
  return list;
}

export async function getPartners(onlyVisible = false): Promise<Partner[]> {
  await ensureControlSeeded();
  const rows = await db.select().from(partners).orderBy(asc(partners.position));
  return onlyVisible ? rows.filter((r) => r.visible) : rows;
}

export async function getFaqs(onlyVisible = false): Promise<Faq[]> {
  await ensureControlSeeded();
  const rows = await db.select().from(faqs).orderBy(asc(faqs.position));
  return onlyVisible ? rows.filter((f) => f.visible) : rows;
}

export async function getGalleries(onlyVisible = false): Promise<Gallery[]> {
  await ensureControlSeeded();
  const rows = await db.select().from(galleries).orderBy(asc(galleries.position));
  return onlyVisible ? rows.filter((x) => x.visible) : rows;
}

export async function getMedia(): Promise<MediaAsset[]> {
  await ensureControlSeeded();
  return db.select().from(mediaAssets).orderBy(desc(mediaAssets.id));
}

export async function getAgents(): Promise<Agent[]> {
  await ensureControlSeeded();
  return db.select().from(agents).orderBy(asc(agents.id));
}

export async function getDefaultAgent(): Promise<Agent | null> {
  const all = await getAgents();
  return all.find((a) => a.isDefault && a.status === "active") ?? all.find((a) => a.status === "active") ?? null;
}

export async function getModelConfig(): Promise<ModelConfig> {
  await ensureControlSeeded();
  const rows = await db.select().from(modelConfig).limit(1);
  if (!rows[0]) throw new Error("model_config missing");
  const row = rows[0];
  // Env key fills the blank without overwriting a saved key.
  if (!row.openrouterKey && process.env.OPENROUTER_API_KEY) {
    return { ...row, openrouterKey: process.env.OPENROUTER_API_KEY };
  }
  return row;
}

export async function getVersions(entityType?: string, limit = 40): Promise<ContentVersion[]> {
  await ensureControlSeeded();
  const rows = await db.select().from(contentVersions).orderBy(desc(contentVersions.id)).limit(limit * 2);
  const filtered = entityType ? rows.filter((r) => r.entityType === entityType) : rows;
  return filtered.slice(0, limit);
}

export async function snapshot(entityType: string, entityId: string, label: string, data: unknown): Promise<void> {
  try {
    await ensureControlSeeded();
    await db.insert(contentVersions).values({ entityType, entityId, label, snapshot: data });
    // prune: keep last 120 versions total
    const rows = await db.select({ id: contentVersions.id }).from(contentVersions).orderBy(desc(contentVersions.id)).limit(400);
    if (rows.length > 120) {
      const stale = rows.slice(120);
      for (const s of stale) {
        await db.delete(contentVersions).where(eq(contentVersions.id, s.id));
      }
    }
  } catch {
    // versioning must never break a save
  }
}

export type { CachedModel };
