import Image from "next/image";
import Link from "next/link";
import { FieldLogPanel, StoryCard, StoryRow } from "@/components/StoryCard";
import { ArrowRight, Container, Icon } from "@/components/ui";
import type { FieldLogEntry, SiteSection, Story } from "@/db/schema";
import { dispatchNo, timeAgo } from "@/lib/format";

export function StoriesSection({
  featured,
  stories,
  log,
  section,
}: {
  featured?: Story;
  stories: Story[];
  log: FieldLogEntry[];
  section?: SiteSection;
}) {
  const cards = stories.slice(0, 3);
  const rows = stories.slice(3, 6);
  const pick = (key: string, fallback: string): string => {
    const v = section?.data?.[key];
    return typeof v === "string" && v ? v : fallback;
  };

  return (
    <section id="stories" className="mt-28 md:mt-36">
      <Container>
        <div className="label-mono flex items-center justify-between gap-4 border-t border-ink pt-4 text-ink-2">
          <span className="text-clay-deep">§ {pick("index", "02")} — Stories</span>
          <span className="hidden md:inline">The core of the collective</span>
          <span>Filed weekly</span>
        </div>

        <div className="mt-6 grid items-end gap-6 lg:grid-cols-12">
          <h2 className="font-display text-[clamp(5.2rem,15.5vw,14.5rem)] uppercase leading-[0.84] lg:col-span-7">
            {pick("first", "Stories")}
          </h2>
          <div className="pb-3 lg:col-span-5">
            <p className="font-serif text-[1.9rem] italic leading-tight">{pick("note", "Not a blog.")}</p>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-ink-2">
              Dispatches from building a real-world + digital ecosystem — raw, operational, specific. Usually written
              after something broke.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-6">
              <Link href="/stories" className="label-mono group inline-flex items-center gap-3 hover:text-clay-deep">
                All stories
                <ArrowRight className="h-3 w-10 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <a href="/feed.xml" className="label-mono inline-flex items-center gap-2 text-muted hover:text-ink">
                <Icon name="rss" className="h-4 w-4" /> RSS
              </a>
            </div>
          </div>
        </div>

        {featured && (
          <div className="mt-12 grid gap-10 lg:grid-cols-12">
            <article className="lg:col-span-8">
              <Link href={`/stories/${featured.slug}`} className="group block">
                <div className="relative aspect-[16/10] overflow-hidden bg-ink/10">
                  <Image
                    src={featured.coverImage}
                    alt={featured.coverAlt}
                    fill
                    sizes="(min-width: 1024px) 62vw, 100vw"
                    className="doc-photo object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.03]"
                  />
                  <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                    <span className="label-mono rounded-full bg-clay px-3 py-1.5 text-sand shadow-md">Featured dispatch</span>
                    <span className="label-mono rounded-full bg-sand px-3 py-1.5 text-ink shadow-md">{dispatchNo(featured.dispatchNo)}</span>
                  </div>
                </div>
                <div className="mt-6 grid gap-6 md:grid-cols-12">
                  <div className="md:col-span-7">
                    <p className="label-mono text-clay-deep">
                      {featured.category} · {featured.location}
                    </p>
                    <h3 className="mt-3 font-serif text-[2.4rem] font-light leading-[1.02] tracking-[-0.01em] transition-colors group-hover:text-clay-deep md:text-[3.2rem]">
                      {featured.title}
                    </h3>
                  </div>
                  <div className="md:col-span-5 md:pt-7">
                    <p className="text-[15px] leading-relaxed text-ink-2">{featured.dek}</p>
                    <p className="label-mono mt-4 text-muted">
                      {featured.readingMinutes} min read · {timeAgo(featured.publishedAt)}
                    </p>
                    <span className="label-mono mt-5 inline-flex items-center gap-3 border-b border-ink pb-1">
                      Read the dispatch
                      <ArrowRight className="h-3 w-8 transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </Link>
            </article>
            <aside className="lg:col-span-4" aria-label="Field log">
              <FieldLogPanel entries={log} />
            </aside>
          </div>
        )}

        {cards.length > 0 && (
          <div className="mt-16 grid gap-x-8 gap-y-12 md:grid-cols-3">
            {cards.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        )}

        {rows.length > 0 && (
          <div className="mt-14 border-t border-ink/15">
            {rows.map((story) => (
              <StoryRow key={story.id} story={story} />
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
