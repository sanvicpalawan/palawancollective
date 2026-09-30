import Image from "next/image";
import Link from "next/link";
import { Container, SectionHeading } from "@/components/ui";
import type { Guide, SiteSection } from "@/db/schema";
import { formatDate, pad2 } from "@/lib/format";

export function PalawanSection({ guides, section }: { guides: Guide[]; section?: SiteSection }) {
  const pick = (key: string, fallback: string): string => {
    const v = section?.data?.[key];
    return typeof v === "string" && v ? v : fallback;
  };
  return (
    <section id="palawan" className="mt-28 md:mt-36">
      <Container>
        <SectionHeading
          index={pick("index", "06")}
          first={pick("first", "Navigating")}
          second={pick("second", "Palawan")}
          description={pick("description", "The practical layer. What we wish someone had told us before the first boat ride — checked on the ground and updated when things change.")}
          href="/palawan"
          linkLabel="The full guide"
        />

        <div className="mt-12 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-5">
          {guides.map((guide) => (
            <Link key={guide.slug} href={`/palawan/${guide.slug}`} className="group flex flex-col">
              <div className="relative aspect-[3/4] overflow-hidden rounded-[var(--pc-radius,18px)] bg-ink/10 shadow-[0_24px_50px_-25px_rgba(22,20,17,0.45)]">
                <Image
                  src={guide.image}
                  alt={guide.imageAlt}
                  fill
                  sizes="(min-width: 1024px) 19vw, (min-width: 640px) 45vw, 100vw"
                  className="doc-photo object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-linear-to-b from-ink/45 via-transparent to-transparent" />
                <span className="absolute left-3 top-2 font-display text-[2.8rem] leading-none text-sand">
                  {pad2(guide.position)}
                </span>
              </div>
              <p className="label-mono mt-4 text-clay-deep">{guide.kicker}</p>
              <h3 className="mt-1.5 font-serif text-[1.55rem] leading-[1.08] transition-colors group-hover:text-clay-deep">
                {guide.title}
              </h3>
              <p className="mt-2.5 line-clamp-3 text-[14px] leading-relaxed text-ink-2">{guide.summary}</p>
              <ul className="mt-3 space-y-1">
                {guide.quickFacts.slice(0, 2).map((fact) => (
                  <li key={fact} className="font-mono text-[11px] leading-snug text-muted">
                    → {fact}
                  </li>
                ))}
              </ul>
              <p className="label-mono mt-auto flex items-center gap-2 pt-4 text-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-moss" />
                Verified {formatDate(guide.verifiedAt, "short")}
              </p>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
