import type { BuildSection, GuideSection, StoryBlock } from "@/db/schema";

/**
 * Shared coercers for the content admin APIs (stories / builds / guides).
 *
 * Every payload arrives as untrusted JSON from the ops console, so each field
 * is normalised into the exact shape `src/db/schema.ts` declares before it
 * reaches Drizzle. Keeping them here means the three routes stay thin and can
 * never disagree about what a block or a section looks like.
 */

export const BLOCK_TYPES = ["p", "h2", "quote", "list", "log", "callout"] as const;
export type BlockType = (typeof BLOCK_TYPES)[number];

export function str(v: unknown, max = 500): string {
  return typeof v === "string" ? v.replace(/\r\n/g, "\n").trim().slice(0, max) : "";
}

/** Preserves internal whitespace — used for long-form body copy. */
export function raw(v: unknown, max = 40_000): string {
  return typeof v === "string" ? v.replace(/\r\n/g, "\n").slice(0, max) : "";
}

export function num(v: unknown, fallback = 0): number {
  const x = typeof v === "number" ? v : Number(v);
  return Number.isFinite(x) ? Math.round(x) : fallback;
}

export function bool(v: unknown, fallback = false): boolean {
  return typeof v === "boolean" ? v : fallback;
}

export function slugify(v: string): string {
  return v
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function strList(v: unknown, maxItems = 300, maxLen = 400): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is string => typeof x === "string")
    .map((x) => x.slice(0, maxLen))
    .slice(0, maxItems);
}

export function coerceDate(v: unknown): Date {
  const d = new Date(typeof v === "string" ? v : "");
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

export function coerceKv(v: unknown): Array<{ label: string; value: string }> {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
    .map((x) => ({ label: str(x.label, 120), value: str(x.value, 300) }))
    .filter((x) => x.label || x.value)
    .slice(0, 60);
}

/** `{ heading, body[], items? }[]` — the shared shape of build + guide sections. */
export function coerceSections(v: unknown, withItems = false): GuideSection[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
    .map((x) => {
      const section: GuideSection = {
        heading: str(x.heading, 200),
        body: strList(x.body, 40, 6000),
      };
      if (withItems) {
        const items = strList(x.items, 60, 300);
        if (items.length) section.items = items;
      }
      return section;
    })
    .filter((x) => x.heading || x.body.length)
    .slice(0, 40);
}

export function coerceBlocks(v: unknown): StoryBlock[] {
  if (!Array.isArray(v)) return [];
  const out: StoryBlock[] = [];

  for (const entry of v.slice(0, 300)) {
    if (!entry || typeof entry !== "object") continue;
    const b = entry as Record<string, unknown>;
    const type = typeof b.type === "string" && (BLOCK_TYPES as readonly string[]).includes(b.type) ? b.type : "p";
    const text = raw(b.text, 12_000);

    switch (type) {
      case "h2":
        out.push({ type: "h2", text: str(b.text, 300) });
        break;
      case "quote":
        out.push({ type: "quote", text: str(b.text, 800), cite: str(b.cite, 200) || undefined });
        break;
      case "list":
        out.push({ type: "list", items: strList(b.items, 60, 600) });
        break;
      case "log":
        out.push({
          type: "log",
          title: str(b.title, 200) || undefined,
          entries: (Array.isArray(b.entries) ? b.entries : [])
            .filter((e): e is Record<string, unknown> => !!e && typeof e === "object")
            .map((e) => ({ time: str(e.time, 40), text: str(e.text, 600) }))
            .slice(0, 60),
        });
        break;
      case "callout":
        out.push({ type: "callout", label: str(b.label, 120), text: str(b.text, 1200) });
        break;
      default:
        out.push({ type: "p", text });
    }
  }
  return out;
}
