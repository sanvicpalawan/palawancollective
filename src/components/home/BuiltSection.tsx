import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Container, SectionHeading, StatusChip } from "@/components/ui";
import type { Build, SiteSection } from "@/db/schema";
import { pad2 } from "@/lib/format";

export function BuiltSection({ builds, section }: { builds: Build[]; section?: SiteSection }) {
  const pick = (key: string, fallback: string): string => {
    const v = section?.data?.[key];
    return typeof v === "string" && v ? v : fallback;
  };
  return (
    <section id="ecosystem" className="mt-24 md:mt-32">
      <Container>
        <SectionHeading
          index={pick("index", "01")}
          first={pick("first", "Built")}
          second={pick("second", "Environments")}
          description={pick("description", "Not client work — proof of execution. Places and systems we’ve built, run, and had to fix. Each one is part case study, part story.")}
          href="/built"
          linkLabel="All builds"
        />

        <div className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {builds.map((build) => (
            <Link key={build.slug} href={`/built/${build.slug}`} className="group block">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--pc-radius,18px)] bg-ink shadow-[0_24px_50px_-25px_rgba(22,20,17,0.5)]">
                <Image
                  src={build.image}
                  alt={build.imageAlt}
                  fill
                  sizes="(min-width: 1024px) 24vw, (min-width: 640px) 45vw, 100vw"
                  className="doc-photo object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-linear-to-t from-ink/90 via-ink/15 to-transparent" />
                <StatusChip status={build.status} className="absolute left-3 top-3" />
                <div className="absolute inset-x-4 bottom-4 text-sand">
                  <p className="font-serif text-[1.6rem] font-light uppercase leading-[0.95] lg:text-[clamp(1.2rem,1.85vw,1.75rem)]">
                    {build.title}
                  </p>
                  <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-sand/75">{build.fieldSpec}</p>
                </div>
              </div>
              <div className="mt-4 flex items-start gap-4">
                <span className="font-serif text-[2rem] font-light leading-none text-clay">{pad2(build.position)}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-medium text-ink">{build.title}</p>
                  <p className="text-[13.5px] text-muted">{build.tags}</p>
                </div>
                <ArrowRight className="mt-2 h-3 w-8 shrink-0 -translate-x-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
