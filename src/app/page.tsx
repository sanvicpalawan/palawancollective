import { BuiltSection } from "@/components/home/BuiltSection";
import { FieldNotesSection } from "@/components/home/FieldNotesSection";
import { Hero } from "@/components/home/Hero";
import { PalawanSection } from "@/components/home/PalawanSection";
import { PartnersSection } from "@/components/home/PartnersSection";
import { StatusStrip } from "@/components/home/StatusStrip";
import { TeamSection } from "@/components/home/TeamSection";
import { StoriesSection } from "@/components/home/StoriesSection";
import { SystemsSection } from "@/components/home/SystemsSection";
import { WorkSection } from "@/components/home/WorkSection";
import { CustomSection, FaqSection, GallerySection } from "@/components/ops/DynamicSections";
import type { Faq, Gallery, SiteSection } from "@/db/schema";
import { getCatalog, getFaqs, getGalleries, getPublishedSections, getSettingsMap, setting } from "@/lib/control";
import { getBuilds, getFieldLog, getGuides, getStories } from "@/lib/data";

export const dynamic = "force-dynamic";

function str(v: unknown, fallback: string): string {
  return typeof v === "string" && v ? v : fallback;
}

export default async function HomePage() {
  const [stories, builds, guides, log] = await Promise.all([
    getStories(),
    getBuilds(),
    getGuides(),
    getFieldLog(6),
  ]);

  const featured = stories.find((story) => story.featured) ?? stories[0];
  const others = stories.filter((story) => story.id !== featured?.id);

  // Ops-controlled layer. If it fails, the static composition below still renders.
  let sections: SiteSection[] = [];
  let faqs: Faq[] = [];
  let galleries: Gallery[] = [];
  let settings: Record<string, unknown> = {};
  try {
    [sections, faqs, galleries, settings] = await Promise.all([
      getPublishedSections("home"),
      getFaqs(true),
      getGalleries(true),
      getSettingsMap(),
    ]);
  } catch {
    sections = [];
  }

  // Systems + Work collections live in settings so ops can edit them.
  let catalog: Awaited<ReturnType<typeof getCatalog>> = { systems: [], services: [] };
  try {
    catalog = await getCatalog();
  } catch {
    catalog = { systems: [], services: [] };
  }

  if (sections.length === 0) {
    return (
      <>
        <Hero settings={settings} />
        <TeamSection />
        <StatusStrip latest={stories[0]} lastLog={log[0]} />
        <BuiltSection builds={builds} />
        <StoriesSection featured={featured} stories={others.slice(0, 6)} log={log} />
        <FieldNotesSection recent={stories.slice(0, 3)} />
        <PartnersSection />
        <WorkSection services={catalog.services} />
        <SystemsSection systems={catalog.systems} />
        <PalawanSection guides={guides} />
      </>
    );
  }

  return (
    <>
      {sections.map((s) => {
        switch (s.key) {
          case "hero":
            return <Hero key={s.id} settings={settings} />;
          case "team":
            return <TeamSection key={s.id} section={s} />;
          case "status":
            return <StatusStrip key={s.id} latest={stories[0]} lastLog={log[0]} />;
          case "built":
            return <BuiltSection key={s.id} builds={builds} section={s} />;
          case "stories":
            return <StoriesSection key={s.id} featured={featured} stories={others.slice(0, 6)} log={log} section={s} />;
          case "fieldnotes":
            return (
              <FieldNotesSection
                key={s.id}
                recent={stories.slice(0, 3)}
                copy={{
                  index: str(s.data?.index, "03"),
                  title: setting<string>(settings, "newsletter_title", "Field Notes"),
                  subtitle: setting<string>(settings, "newsletter_subtitle", "Weekly dispatches from Palawan."),
                  body: setting<string>(
                    settings,
                    "newsletter_copy",
                    "What’s working, what’s breaking, and what we’re building next.",
                  ),
                }}
              />
            );
          case "partners":
            return <PartnersSection key={s.id} section={s} />;
          case "systems":
            return <SystemsSection key={s.id} section={s} systems={catalog.systems} />;
          case "work":
            return <WorkSection key={s.id} section={s} services={catalog.services} />;
          case "faq":
            return <FaqSection key={s.id} faqs={faqs} section={s} />;
          case "gallery": {
            const slug = str(s.data?.gallerySlug, "");
            const gallery = galleries.find((x) => x.slug === slug) ?? galleries[0];
            return <GallerySection key={s.id} gallery={gallery} section={s} />;
          }
          case "palawan":
            return <PalawanSection key={s.id} guides={guides} section={s} />;
          default:
            return <CustomSection key={s.id} section={s} galleries={galleries} />;
        }
      })}
    </>
  );
}
