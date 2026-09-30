import { eq } from "drizzle-orm";
import { db } from "@/db";
import { agents, designTokens, faqs, galleries, navItems, siteSections, siteSettings, socialLinks } from "@/db/schema";
import { getVersions } from "@/lib/control";
import { requireOps, withOpsRefresh } from "@/lib/ops-auth";

export const dynamic = "force-dynamic";

/** Version history + one-click restore (undo). */
export async function GET(request: Request) {
  const gate = await requireOps(request);
  if (gate.res) return gate.res;
  const entity = new URL(request.url).searchParams.get("entity") || undefined;
  const versions = await getVersions(entity, 40);
  return withOpsRefresh(Response.json({ ok: true, versions }), gate.refresh);
}

export async function POST(request: Request) {
  const gate = await requireOps(request);
  if (gate.res) return gate.res;
  const body = (await request.json().catch(() => ({}))) as { id?: unknown };
  if (typeof body.id !== "number") {
    return withOpsRefresh(Response.json({ ok: false, error: "Missing version id." }, { status: 400 }), gate.refresh);
  }
  const versions = await getVersions(undefined, 400);
  const version = versions.find((v) => v.id === body.id);
  if (!version) {
    return withOpsRefresh(Response.json({ ok: false, error: "Version not found." }, { status: 404 }), gate.refresh);
  }
  const snap = version.snapshot as Record<string, unknown>;
  const id = Number(version.entityId);

  try {
    switch (version.entityType) {
      case "section":
        if (id && typeof snap.title === "string") {
          const exists = (await db.select({ id: siteSections.id }).from(siteSections).where(eq(siteSections.id, id)).limit(1))[0];
          const row = {
            page: typeof snap.page === "string" ? snap.page : "home",
            key: typeof snap.key === "string" ? snap.key : `restored-${id}`,
            type: typeof snap.type === "string" ? snap.type : "custom",
            title: String(snap.title).slice(0, 120),
            position: typeof snap.position === "number" ? snap.position : 0,
            visible: snap.visible !== false,
            status: snap.status === "draft" ? "draft" : "published",
            data: (snap.data && typeof snap.data === "object" ? snap.data : {}) as Record<string, unknown>,
            updatedAt: new Date(),
          };
          if (exists) await db.update(siteSections).set(row).where(eq(siteSections.id, id));
          else await db.insert(siteSections).values(row);
        }
        break;
      case "design":
        if (snap && typeof snap === "object") {
          const tokens = (snap.tokens && typeof snap.tokens === "object" ? snap.tokens : snap) as never;
          const rows = await db.select({ id: designTokens.id }).from(designTokens).limit(1);
          if (rows[0]) await db.update(designTokens).set({ tokens, updatedAt: new Date() }).where(eq(designTokens.id, rows[0].id));
        }
        break;
      case "faq":
        if (id && typeof snap.question === "string") {
          const exists = (await db.select({ id: faqs.id }).from(faqs).where(eq(faqs.id, id)).limit(1))[0];
          const row = {
            question: String(snap.question).slice(0, 300),
            answer: typeof snap.answer === "string" ? snap.answer.slice(0, 4000) : "",
            position: typeof snap.position === "number" ? snap.position : 0,
            visible: snap.visible !== false,
          };
          if (exists) await db.update(faqs).set(row).where(eq(faqs.id, id));
          else await db.insert(faqs).values(row);
        }
        break;
      case "gallery":
        if (id && typeof snap.title === "string") {
          const exists = (await db.select({ id: galleries.id }).from(galleries).where(eq(galleries.id, id)).limit(1))[0];
          const row = {
            slug: typeof snap.slug === "string" ? snap.slug : `restored-${id}`,
            title: String(snap.title).slice(0, 120),
            description: typeof snap.description === "string" ? snap.description.slice(0, 1000) : "",
            layout: snap.layout === "scroll" ? "scroll" : "grid",
            items: Array.isArray(snap.items) ? (snap.items as never) : [],
            position: typeof snap.position === "number" ? snap.position : 0,
            visible: snap.visible !== false,
          };
          if (exists) await db.update(galleries).set(row).where(eq(galleries.id, id));
          else await db.insert(galleries).values(row);
        }
        break;
      case "nav":
        if (id && typeof snap.label === "string") {
          const exists = (await db.select({ id: navItems.id }).from(navItems).where(eq(navItems.id, id)).limit(1))[0];
          const row = {
            location: typeof snap.location === "string" ? snap.location : "header",
            label: String(snap.label).slice(0, 60),
            href: typeof snap.href === "string" ? snap.href.slice(0, 200) : "/",
            position: typeof snap.position === "number" ? snap.position : 0,
            visible: snap.visible !== false,
          };
          if (exists) await db.update(navItems).set(row).where(eq(navItems.id, id));
          else await db.insert(navItems).values(row);
        }
        break;
      case "agent":
        if (id && typeof snap.name === "string") {
          const exists = (await db.select({ id: agents.id }).from(agents).where(eq(agents.id, id)).limit(1))[0];
          const row = {
            name: String(snap.name).slice(0, 60),
            role: typeof snap.role === "string" ? snap.role.slice(0, 40) : "Customer Assistant",
            systemPrompt: typeof snap.systemPrompt === "string" ? snap.systemPrompt.slice(0, 6000) : "",
            temperature: typeof snap.temperature === "number" ? snap.temperature : 0.7,
            maxTokens: typeof snap.maxTokens === "number" ? snap.maxTokens : 800,
            behaviorRules: typeof snap.behaviorRules === "string" ? snap.behaviorRules.slice(0, 4000) : "",
            provider: typeof snap.provider === "string" ? snap.provider : "auto",
            modelId: typeof snap.modelId === "string" ? snap.modelId.slice(0, 120) : "",
            status: snap.status === "active" ? "active" : "stopped",
            isDefault: false,
            updatedAt: new Date(),
          };
          if (exists) await db.update(agents).set(row).where(eq(agents.id, id));
          else await db.insert(agents).values(row);
        }
        break;
      case "settings": {
        const values = (snap.values && typeof snap.values === "object" ? snap.values : snap) as Record<string, unknown>;
        for (const [key, value] of Object.entries(values)) {
          if (!/^[a-z0-9_]{1,60}$/.test(key)) continue;
          if (typeof value !== "string" && typeof value !== "boolean" && typeof value !== "number") continue;
          await db
            .insert(siteSettings)
            .values({ key, value, updatedAt: new Date() })
            .onConflictDoUpdate({ target: siteSettings.key, set: { value, updatedAt: new Date() } });
        }
        break;
      }
      case "social":
        if (id && typeof snap.platform === "string") {
          const exists = (await db.select({ id: socialLinks.id }).from(socialLinks).where(eq(socialLinks.id, id)).limit(1))[0];
          const row = {
            platform: String(snap.platform).slice(0, 30),
            label: typeof snap.label === "string" ? snap.label.slice(0, 40) : String(snap.platform),
            url: typeof snap.url === "string" ? snap.url.slice(0, 500) : "",
            position: typeof snap.position === "number" ? snap.position : 0,
            visible: snap.visible !== false,
          };
          if (exists) await db.update(socialLinks).set(row).where(eq(socialLinks.id, id));
          else {
            const clash = await db.select({ id: socialLinks.id }).from(socialLinks).where(eq(socialLinks.platform, row.platform)).limit(1);
            if (!clash[0]) await db.insert(socialLinks).values(row);
          }
        }
        break;
      default:
        return withOpsRefresh(Response.json({ ok: false, error: "Can't restore this type yet." }, { status: 400 }), gate.refresh);
    }
  } catch (error) {
    console.error("[versions] restore failed", error);
    return withOpsRefresh(Response.json({ ok: false, error: "Restore failed." }, { status: 500 }), gate.refresh);
  }
  return withOpsRefresh(Response.json({ ok: true }), gate.refresh);
}
