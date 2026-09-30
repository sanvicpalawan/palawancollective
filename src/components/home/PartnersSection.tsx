import Link from "next/link";
import { Container, SectionHeading } from "@/components/ui";
import { getPartners } from "@/lib/control";
import type { SiteSection } from "@/db/schema";
import { PartnersGrid } from "./PartnersGrid";

function pick(section: SiteSection | undefined, key: string, fallback: string): string {
  const v = section?.data?.[key];
  return typeof v === "string" && v ? v : fallback;
}

export async function PartnersSection({ section }: { section?: SiteSection }) {
  let partners: Awaited<ReturnType<typeof getPartners>> = [];
  try {
    partners = await getPartners(true);
  } catch {
    partners = [];
  }
  if (partners.length === 0) return null;

  return (
    <section id="partners" className="mt-28 md:mt-36">
      <Container>
        <SectionHeading
          index={pick(section, "index", "04")}
          first={pick(section, "first", "Our")}
          second={pick(section, "second", "Partners")}
          description={
            pick(section, "description", "The companies building and running this ecosystem with us. Hover or tap a logo to visit their work.")
          }
          href="/work-with-us?type=partner#inquire"
          linkLabel="Become a partner"
        />

        <PartnersGrid
          partners={partners.map((p) => ({ id: p.id, name: p.name, logo: p.logo, url: p.url }))}
        />
      </Container>
    </section>
  );
}
