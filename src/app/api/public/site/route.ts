import { getDesign, getFaqs, getGalleries, getNav, getPublishedSections, getSettingsMap, getSocialLinks } from "@/lib/control";

export const dynamic = "force-dynamic";

/** Public bundle: everything the live site needs to render dynamically. */
export async function GET() {
  try {
    const [settings, design, nav, sections, faqs, galleries, socials] = await Promise.all([
      getSettingsMap(),
      getDesign(),
      getNav(),
      getPublishedSections("home"),
      getFaqs(true),
      getGalleries(true),
      getSocialLinks(true).catch(() => []),
    ]);
    // no-cache → every admin save is visible on the next page load
    return Response.json(
      { ok: true, settings, design, nav, sections, faqs, galleries, socials },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[public/site]", error);
    return Response.json({ ok: false, error: "unavailable" }, { status: 503 });
  }
}
