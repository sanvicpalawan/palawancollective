import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StoryBody } from "@/components/StoryBody";
import { StoryCard } from "@/components/StoryCard";
import { SubscribeForm } from "@/components/SubscribeForm";
import { ArrowRight, Container } from "@/components/ui";
import { getStories, getStory } from "@/lib/data";
import { dispatchNo, formatDate } from "@/lib/format";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const story = await getStory(slug);
  if (!story) return { title: "Story not found" };
  return {
    title: story.title,
    description: story.dek,
    alternates: { canonical: `/stories/${story.slug}` },
    openGraph: {
      type: "article",
      title: story.title,
      description: story.dek,
      publishedTime: story.publishedAt.toISOString(),
      authors: [site.person],
      images: [{ url: story.coverImage, alt: story.coverAlt }],
    },
  };
}

export default async function StoryPage({ params }: Props) {
  const { slug } = await params;
  const [story, all] = await Promise.all([getStory(slug), getStories()]);
  if (!story) notFound();

  const index = all.findIndex((s) => s.slug === story.slug);
  const newer = index > 0 ? all[index - 1] : undefined;
  const older = index >= 0 && index < all.length - 1 ? all[index + 1] : undefined;
  const more = all.filter((s) => s.slug !== story.slug).slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: story.title,
    description: story.dek,
    datePublished: story.publishedAt.toISOString(),
    author: { "@type": "Person", name: site.person },
    publisher: { "@type": "Organization", name: site.name },
    image: `${site.url}${story.coverImage}`,
    mainEntityOfPage: `${site.url}/stories/${story.slug}`,
  };

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <Container className="pt-10 md:pt-14">
        <nav aria-label="Breadcrumb" className="label-mono flex flex-wrap items-center gap-2 text-muted">
          <Link href="/stories" className="hover:text-ink">
            Stories
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-clay-deep">{dispatchNo(story.dispatchNo)}</span>
          <span aria-hidden="true">/</span>
          <Link href={`/stories?category=${encodeURIComponent(story.category)}`} className="hover:text-ink">
            {story.category}
          </Link>
        </nav>

        <div className="mt-8 grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <p className="font-display text-[5.5rem] leading-[0.85] text-clay md:text-[7rem]">
              {String(story.dispatchNo).padStart(3, "0")}
            </p>
            <dl className="label-mono mt-6 grid grid-cols-3 gap-4 lg:grid-cols-1 lg:gap-3">
              <div>
                <dt className="text-muted">Filed</dt>
                <dd className="mt-0.5 text-ink">{formatDate(story.publishedAt)}</dd>
              </div>
              <div>
                <dt className="text-muted">From</dt>
                <dd className="mt-0.5 text-ink">{story.location}</dd>
              </div>
              <div>
                <dt className="text-muted">Reading time</dt>
                <dd className="mt-0.5 text-ink">{story.readingMinutes} min</dd>
              </div>
            </dl>
          </div>
          <div className="lg:col-span-9">
            <h1 className="font-serif text-[2.9rem] font-light leading-[0.98] tracking-[-0.015em] md:text-[4.4rem] lg:text-[5.2rem]">
              {story.title}
            </h1>
            <p className="mt-6 max-w-3xl font-serif text-[1.4rem] italic leading-snug text-ink-2 md:text-[1.7rem]">
              {story.dek}
            </p>
          </div>
        </div>
      </Container>

      <Container className="mt-12">
        <figure>
          <div className="relative aspect-[16/9] overflow-hidden rounded-[var(--pc-radius,18px)] bg-ink/10 shadow-[0_24px_50px_-25px_rgba(22,20,17,0.45)] md:aspect-[21/9]">
            <Image
              src={story.coverImage}
              alt={story.coverAlt}
              fill
              preload
              sizes="(min-width: 1320px) 1256px, 100vw"
              className="doc-photo object-cover"
            />
          </div>
          <figcaption className="label-mono mt-3 flex justify-between gap-4 text-muted">
            <span>Fig. — {story.coverAlt}</span>
            <span className="hidden md:inline">{story.location}</span>
          </figcaption>
        </figure>
      </Container>

      <Container className="mt-14 grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-7 lg:col-start-5 lg:row-start-1">
          <StoryBody blocks={story.body} />
          <div className="mt-14 flex flex-wrap items-center gap-4 border-t border-ink/20 pt-6">
            <span className="font-hand text-3xl text-ink-2">— D.</span>
            <span className="label-mono text-muted">Filed from {story.location}</span>
          </div>
        </div>

        <aside className="lg:col-span-3 lg:col-start-1 lg:row-start-1">
          <div className="space-y-8 lg:sticky lg:top-28">
            <div className="border-t border-ink pt-4">
              <p className="label-mono text-muted">Written by</p>
              <p className="mt-2 font-serif text-xl">{site.person}</p>
              <p className="mt-1 text-[13.5px] leading-snug text-ink-2">{site.role}</p>
            </div>
            <div className="border-t border-ink/20 pt-4">
              <p className="label-mono text-muted">Field Notes</p>
              <p className="mt-2 text-[13.5px] leading-snug text-ink-2">Get the next dispatch on Sunday.</p>
              <div className="mt-3">
                <SubscribeForm source={`story-${story.slug}`} compact buttonLabel="Subscribe" />
              </div>
            </div>
          </div>
        </aside>
      </Container>

      {(older || newer) && (
        <Container className="mt-20">
          <nav aria-label="Adjacent dispatches" className="grid border-y border-ink/15 md:grid-cols-2">
            {older ? (
              <Link href={`/stories/${older.slug}`} className="group py-7 md:pr-8">
                <p className="label-mono text-muted">← Previous dispatch · {dispatchNo(older.dispatchNo)}</p>
                <p className="mt-2 font-serif text-[1.6rem] leading-snug transition-colors group-hover:text-clay-deep">
                  {older.title}
                </p>
              </Link>
            ) : (
              <div />
            )}
            {newer ? (
              <Link
                href={`/stories/${newer.slug}`}
                className="group border-t border-ink/15 py-7 md:border-l md:border-t-0 md:pl-8 md:text-right"
              >
                <p className="label-mono text-muted">Next dispatch · {dispatchNo(newer.dispatchNo)} →</p>
                <p className="mt-2 font-serif text-[1.6rem] leading-snug transition-colors group-hover:text-clay-deep">
                  {newer.title}
                </p>
              </Link>
            ) : (
              <div />
            )}
          </nav>
        </Container>
      )}

      {more.length > 0 && (
        <Container className="mt-20">
          <div className="flex flex-wrap items-end justify-between gap-4 border-t border-ink/20 pt-6">
            <h2 className="font-serif text-[2.4rem] font-light uppercase leading-none md:text-[3rem]">
              More <span className="text-clay">stories</span>
            </h2>
            <Link href="/stories" className="label-mono group inline-flex items-center gap-3 hover:text-clay-deep">
              All stories
              <ArrowRight className="h-3 w-10 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="mt-10 grid gap-x-8 gap-y-12 md:grid-cols-3">
            {more.map((s) => (
              <StoryCard key={s.id} story={s} />
            ))}
          </div>
        </Container>
      )}
    </article>
  );
}
