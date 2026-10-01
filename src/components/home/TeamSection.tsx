import { Container, SectionHeading } from "@/components/ui";
import type { SiteSection } from "@/db/schema";
import { getTeamPublic } from "@/lib/control";
import { TeamGrid } from "./TeamGrid";

function pick(section: SiteSection | undefined, key: string, fallback: string): string {
  const v = section?.data?.[key];
  return typeof v === "string" && v ? v : fallback;
}

/**
 * The Dream Team wall — home page, straight after the hero.
 *
 * Roster + wording come from Postgres (`team_members` + this section's row in
 * `site_sections`), so the console edits land on the next request. Everything
 * degrades: no members → the block renders nothing, database unreachable → the
 * bundled roster renders instead (see `getTeamPublic`).
 */
export async function TeamSection({ section }: { section?: SiteSection }) {
  const members = await getTeamPublic();
  if (members.length === 0) return null;

  return (
    <section id="team" className="mt-28 md:mt-36">
      <Container>
        <SectionHeading
          index={pick(section, "index", "01")}
          first={pick(section, "first", "The")}
          second={pick(section, "second", "Dream Team")}
          description={
            pick(
              section,
              "description",
              "The people who build this ecosystem with us — architects, boat crews, chefs and resort owners, all on the ground in Palawan.",
            )
          }
          href={pick(section, "href", "/work-with-us?type=collaborate#inquire")}
          linkLabel={pick(section, "linkLabel", "Work with us")}
        />

        <TeamGrid
          members={members.map((m) => ({
            id: m.id,
            name: m.name,
            role: m.role,
            location: m.location,
            photo: m.photo,
            photoAlt: m.photoAlt,
            bio: m.bio,
            url: m.url,
          }))}
        />

        <p className="label-mono mt-6 text-muted">
          {String(members.length).padStart(2, "0")} {members.length === 1 ? "person" : "people"} on the wall ·
          Palawan, Philippines
        </p>
      </Container>
    </section>
  );
}
