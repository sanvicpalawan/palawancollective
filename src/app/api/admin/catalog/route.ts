import { getCatalog, saveCatalog, snapshot, type Catalog } from "@/lib/control";
import { requireOps, withOpsRefresh } from "@/lib/ops-auth";

export const dynamic = "force-dynamic";

const SYSTEM_ICONS = new Set(["sun", "chat", "agent", "approve", "layers"]);

function cleanList(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string").map((x) => x.trim().slice(0, 300)).filter(Boolean).slice(0, 40);
}

function cleanStr(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

/** Normalise the two editable collections that render the Systems + Work blocks. */
function coerceCatalog(body: Record<string, unknown>, base: Catalog): Catalog {
  const next: Catalog = { systems: base.systems, services: base.services };

  if (Array.isArray(body.systems)) {
    next.systems = body.systems
      .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
      .map((x, i) => ({
        code: cleanStr(x.code, 12) || `S/${String(i + 1).padStart(2, "0")}`,
        icon: SYSTEM_ICONS.has(String(x.icon)) ? (String(x.icon) as Catalog["systems"][number]["icon"]) : "layers",
        title: cleanStr(x.title, 200),
        detail: cleanStr(x.detail, 500),
        parts: cleanList(x.parts),
      }))
      .filter((x) => x.title)
      .slice(0, 24);
  }

  if (Array.isArray(body.services)) {
    next.services = body.services
      .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
      .map((x, i) => {
        const service = {
          id: cleanStr(x.id, 60) || `service-${i + 1}`,
          number: cleanStr(x.number, 6) || String(i + 1).padStart(2, "0"),
          title: cleanStr(x.title, 200),
          qualifier: cleanStr(x.qualifier, 80) || undefined,
          summary: cleanStr(x.summary, 600),
          format: cleanStr(x.format, 120),
          includes: cleanList(x.includes),
        };
        return service;
      })
      .filter((x) => x.title)
      .slice(0, 16);
  }

  return next;
}

export async function GET(request: Request) {
  const gate = await requireOps(request);
  if (gate.res) return gate.res;
  return withOpsRefresh(Response.json({ ok: true, catalog: await getCatalog() }), gate.refresh);
}

export async function PUT(request: Request) {
  const gate = await requireOps(request);
  if (gate.res) return gate.res;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const base = await getCatalog();
  const next = coerceCatalog(body, base);

  if (JSON.stringify(next) === JSON.stringify(base)) {
    return withOpsRefresh(Response.json({ ok: true, catalog: base, unchanged: true }), gate.refresh);
  }
  await snapshot("catalog", "systems-services", "Updated Systems / Work content", next);
  const catalog = await saveCatalog(next);
  return withOpsRefresh(Response.json({ ok: true, catalog }), gate.refresh);
}
