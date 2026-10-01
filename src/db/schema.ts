import { boolean, integer, jsonb, pgTable, real, serial, text, timestamp } from "drizzle-orm/pg-core";

/* ------------------------------------------------------------------ */
/* JSON shapes                                                          */
/* ------------------------------------------------------------------ */

export type StoryBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "quote"; text: string; cite?: string }
  | { type: "list"; items: string[] }
  | { type: "log"; title?: string; entries: { time: string; text: string }[] }
  | { type: "callout"; label: string; text: string };

export type BuildSpec = { label: string; value: string };
export type BuildSection = { heading: string; body: string[] };
export type GuideSection = { heading: string; body: string[]; items?: string[] };

/* ------------------------------------------------------------------ */
/* Content: stories (dispatches), built environments, Palawan guides   */
/* ------------------------------------------------------------------ */

export const stories = pgTable("stories", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  dispatchNo: integer("dispatch_no").notNull(),
  title: text("title").notNull(),
  dek: text("dek").notNull(),
  category: text("category").notNull(),
  location: text("location").notNull(),
  readingMinutes: integer("reading_minutes").notNull(),
  coverImage: text("cover_image").notNull(),
  coverAlt: text("cover_alt").notNull(),
  body: jsonb("body").$type<StoryBlock[]>().notNull(),
  featured: boolean("featured").notNull().default(false),
  publishedAt: timestamp("published_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const builds = pgTable("builds", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  position: integer("position").notNull(),
  title: text("title").notNull(),
  tags: text("tags").notNull(),
  status: text("status").notNull(),
  location: text("location").notNull(),
  since: text("since").notNull(),
  summary: text("summary").notNull(),
  fieldSpec: text("field_spec").notNull(),
  image: text("image").notNull(),
  imageAlt: text("image_alt").notNull(),
  specs: jsonb("specs").$type<BuildSpec[]>().notNull(),
  sections: jsonb("sections").$type<BuildSection[]>().notNull(),
  relatedStories: jsonb("related_stories").$type<string[]>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const guides = pgTable("guides", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  position: integer("position").notNull(),
  title: text("title").notNull(),
  kicker: text("kicker").notNull(),
  summary: text("summary").notNull(),
  image: text("image").notNull(),
  imageAlt: text("image_alt").notNull(),
  quickFacts: jsonb("quick_facts").$type<string[]>().notNull(),
  sections: jsonb("sections").$type<GuideSection[]>().notNull(),
  verifiedAt: timestamp("verified_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Short, timestamped operational notes — the "living" layer of the site. */
export const fieldLog = pgTable("field_log", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  tag: text("tag").notNull(),
  location: text("location").notNull(),
  text: text("text").notNull(),
  loggedAt: timestamp("logged_at", { withTimezone: true }).notNull(),
});

/* ------------------------------------------------------------------ */
/* Audience: newsletter + project / partnership inquiries               */
/* ------------------------------------------------------------------ */

export const subscribers = pgTable("subscribers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  source: text("source").notNull().default("site"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const inquiries = pgTable("inquiries", {
  id: serial("id").primaryKey(),
  kind: text("kind").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  whatsapp: text("whatsapp"),
  organization: text("organization"),
  focus: text("focus").notNull(),
  timeline: text("timeline"),
  message: text("message").notNull(),
  status: text("status").notNull().default("new"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Story = typeof stories.$inferSelect;
export type Build = typeof builds.$inferSelect;
export type Guide = typeof guides.$inferSelect;
export type FieldLogEntry = typeof fieldLog.$inferSelect;
export type Subscriber = typeof subscribers.$inferSelect;
export type Inquiry = typeof inquiries.$inferSelect;

/* ------------------------------------------------------------------ */
/* ADMIN CONTROL LAYER                                                   */
/* ------------------------------------------------------------------ */

export type SectionData = Record<string, unknown>;
export type DesignTokens = {
  colors: { primary: string; secondary: string; accent: string; background: string; text: string; sand: string; paper: string; ink: string; clay: string; clayDeep: string; clayLight: string; moss: string };
  fonts: { display: string; serif: string; sans: string; mono: string; hand: string };
  fontScale: number;
  spacingScale: number;
  radius: number;
  shadow: "none" | "soft" | "lifted" | "brutal";
};
export type GalleryItem = { mediaId: number | null; url: string; caption?: string; kind: "image" | "video" };
export type CachedModel = { id: string; name: string; free: boolean; context?: number; provider?: string };

export const siteSettings = pgTable("site_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").$type<unknown>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const siteSections = pgTable("site_sections", {
  id: serial("id").primaryKey(),
  page: text("page").notNull().default("home"),
  key: text("key").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  position: integer("position").notNull().default(0),
  visible: boolean("visible").notNull().default(true),
  status: text("status").notNull().default("published"),
  data: jsonb("data").$type<SectionData>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const designTokens = pgTable("design_tokens", {
  id: serial("id").primaryKey(),
  tokens: jsonb("tokens").$type<DesignTokens>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const mediaAssets = pgTable("media_assets", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  url: text("url").notNull(),
  mime: text("mime").notNull(),
  size: integer("size").notNull().default(0),
  width: integer("width"),
  height: integer("height"),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const navItems = pgTable("nav_items", {
  id: serial("id").primaryKey(),
  location: text("location").notNull().default("header"),
  label: text("label").notNull(),
  href: text("href").notNull(),
  position: integer("position").notNull().default(0),
  visible: boolean("visible").notNull().default(true),
});

export const socialLinks = pgTable("social_links", {
  id: serial("id").primaryKey(),
  platform: text("platform").notNull().unique(),
  label: text("label").notNull(),
  url: text("url").notNull().default(""),
  position: integer("position").notNull().default(0),
  visible: boolean("visible").notNull().default(true),
});

export const partners = pgTable("partners", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  logo: text("logo").notNull(),
  url: text("url").notNull().default(""),
  position: integer("position").notNull().default(0),
  visible: boolean("visible").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Dream Team — the people in the ecosystem, shown on the home page right
 * after the hero. Same control shape as `partners` (position + visible) with
 * editorial fields, so ops can add, edit, reorder, hide and delete members
 * from the console with no deploy. `photo` is either a bundled path
 * (`/images/team/…`) or an upload served from `/uploads/…`.
 */
export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull().default(""),
  location: text("location").notNull().default(""),
  photo: text("photo").notNull().default(""),
  photoAlt: text("photo_alt").notNull().default(""),
  bio: text("bio").notNull().default(""),
  url: text("url").notNull().default(""),
  position: integer("position").notNull().default(0),
  visible: boolean("visible").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Operator uploads (site logo, partner logos, media library) stored in the
 * database so they work on serverless hosts (Vercel) where the filesystem
 * is read-only. `data` is hex-encoded binary.
 */
export const uploadedFiles = pgTable("uploaded_files", {
  name: text("name").primaryKey(),
  mime: text("mime").notNull(),
  data: text("data").notNull(),
  size: integer("size").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const faqs = pgTable("faqs", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  position: integer("position").notNull().default(0),
  visible: boolean("visible").notNull().default(true),
});

export const galleries = pgTable("galleries", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  layout: text("layout").notNull().default("grid"),
  items: jsonb("items").$type<GalleryItem[]>().notNull().default([]),
  position: integer("position").notNull().default(0),
  visible: boolean("visible").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const agents = pgTable("agents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  systemPrompt: text("system_prompt").notNull(),
  temperature: real("temperature").notNull().default(0.7),
  maxTokens: integer("max_tokens").notNull().default(800),
  behaviorRules: text("behavior_rules").notNull().default(""),
  provider: text("provider").notNull().default("auto"),
  modelId: text("model_id").notNull().default(""),
  status: text("status").notNull().default("stopped"),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const modelConfig = pgTable("model_config", {
  id: serial("id").primaryKey(),
  provider: text("provider").notNull().default("openrouter"),
  openrouterKey: text("openrouter_key").notNull().default(""),
  showFree: boolean("show_free").notNull().default(true),
  showPaid: boolean("show_paid").notNull().default(true),
  selectedModel: text("selected_model").notNull().default(""),
  ollamaBaseUrl: text("ollama_base_url").notNull().default("http://127.0.0.1:11434"),
  ollamaModel: text("ollama_model").notNull().default(""),
  modelsCache: jsonb("models_cache").$type<CachedModel[]>().notNull().default([]),
  modelsFetchedAt: timestamp("models_fetched_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const contentVersions = pgTable("content_versions", {
  id: serial("id").primaryKey(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  label: text("label").notNull(),
  snapshot: jsonb("snapshot").$type<unknown>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const analyticsEvents = pgTable("analytics_events", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  path: text("path").notNull().default("/"),
  meta: jsonb("meta").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const agentLogs = pgTable("agent_logs", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id"),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type SiteSection = typeof siteSections.$inferSelect;
export type DesignTokensRow = typeof designTokens.$inferSelect;
export type MediaAsset = typeof mediaAssets.$inferSelect;
export type NavItem = typeof navItems.$inferSelect;
export type SocialLink = typeof socialLinks.$inferSelect;
export type Partner = typeof partners.$inferSelect;
export type TeamMember = typeof teamMembers.$inferSelect;
export type UploadedFile = typeof uploadedFiles.$inferSelect;
export type Faq = typeof faqs.$inferSelect;
export type Gallery = typeof galleries.$inferSelect;
export type Agent = typeof agents.$inferSelect;
export type ModelConfig = typeof modelConfig.$inferSelect;
export type ContentVersion = typeof contentVersions.$inferSelect;
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
