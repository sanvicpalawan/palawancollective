import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { FieldLogPanel, StoryRow } from "@/components/StoryCard";
import { SubscribeForm } from "@/components/SubscribeForm";
import { ArrowRight, Container, Icon, cn } from "@/components/ui";
import { getFieldLog, getStories } from "@/lib/data";
import { dispatchNo, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Stories",
  description:
    "Operational dispatches from building off-grid resorts, automation systems and real-world infrastructure in Palawan. Raw, specific, and usually written after something broke.",
  alternates: { canonical: "/stories" },
};

type Props = { searchParams: Promise<{ category?: string | string[] }> };

function FilterLink({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "label-mono rounded-full border px-3.5 py-1.5 transition-all",
        active ? "border-ink bg-ink text-sand" : "border-ink/20 text-ink-2 hover:border-ink hover:text-ink",
      )}
    >
      {children}
    </Link>
  );
}

export default async function StoriesPage({ searchParams }: Props) {
  const params = await searchParams;
  const category = typeof params.category === "string" ? params.category : undefined;
  const [all, log] = await Promise.all([getStories(), getFieldLog(6)]);
  const categories = Array.from(new Set(all.map((s) => s.category)));
  const list = category ? all.filter((s) => s.category === category) : all;
  const featured = category ? undefined : (list.find((s) => s.featured) ?? list[0]);
  const rest = featured ? list.filter((s) => s.id !== featured.id) : list;

  return (
    <>
      <Container className="pt-10 md:pt-14">
        <p className="label-mono text-clay-deep">§ 02 — Stories · not a blog</p>
        <div className="mt-4 grid items-end gap-8 lg:grid-cols-12">
          <h1 className="font-display text-[clamp(5.2rem,15.5vw,14.5rem)] uppercase leading-[0.84] lg:col-span-7">
            Stories
          </h1>
          <div className="pb-3 lg:col-span-5">
            <p className="font-serif text-[1.6rem] leading-snug md:text-[1.9rem]">
              Dispatches from building a real-world + digital ecosystem in Palawan.
            </p>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-ink-2">
              Raw, operational, specific. What we built, what broke, what we changed — filed weekly from the site.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-6">
              <a href="/feed.xml" className="label-mono inline-flex items-center gap-2 hover:text-clay-deep">
                <Icon name="rss" className="h-4 w-4" /> RSS feed
              </a>
              <a href="#subscribe" className="label-mono group inline-flex items-center gap-3 hover:text-clay-deep">
                Get them weekly
                <ArrowRight className="h-3 w-8 transition-transform duration-300 group-hover:translate-x-1" />
              </a>
            </div>
          </div>
        </div>

        <nav
          aria-label="Filter stories by category"
          className="mt-10 flex flex-wrap items-center gap-2 border-y border-ink/15 py-4"
        >
          <span className="label-mono mr-2 text-muted">Filter</span>
          <FilterLink href="/stories" active={!category}>
            All · {all.length}
          </FilterLink>
          {categories.map((c) => (
            <FilterLink key={c} href={`/stories?category=${encodeURIComponent(c)}`} active={c === category}>
              {c}
            </FilterLink>
          ))}
        </nav>
      </Container>

      <Container className="mt-12 grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-8">
          {featured && (
            <Link href={`/stories/${featured.slug}`} className="group mb-12 block">
              <div className="relative aspect-[16/10] overflow-hidden rounded-[var(--pc-radius,18px)] bg-ink/10 shadow-[0_24px_50px_-25px_rgba(22,20,17,0.45)]">
                <Image
                  src={featured.coverImage}
                  alt={featured.coverAlt}
                  fill
                  preload
                  sizes="(min-width: 1024px) 62vw, 100vw"
                  className="doc-photo object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.03]"
                />
                <div className="absolute left-4 top-4 flex gap-2">
                  <span className="label-mono bg-clay px-2.5 py-1.5 text-sand">Featured</span>
                  <span className="label-mono bg-sand px-2.5 py-1.5 text-ink">{dispatchNo(featured.dispatchNo)}</span>
                </div>
              </div>
              <p className="label-mono mt-5 text-clay-deep">
                {featured.category} · {featured.location} · {formatDate(featured.publishedAt)}
              </p>
              <h2 className="mt-3 font-serif text-[2.4rem] font-light leading-[1.02] tracking-[-0.01em] transition-colors group-hover:text-clay-deep md:text-[3.3rem]">
                {featured.title}
              </h2>
              <p className="mt-4 max-w-2xl text-[15.5px] leading-relaxed text-ink-2">{featured.dek}</p>
            </Link>
          )}

          {rest.length > 0 ? (
            <div className="border-t border-ink/15">
              {rest.map((story) => (
                <StoryRow key={story.id} story={story} showImage />
              ))}
            </div>
          ) : (
            !featured && (
              <p className="border-y border-ink/15 py-10 font-serif text-2xl">
                Nothing filed under “{category}” yet. <Link href="/stories" className="text-clay-deep underline">See all stories</Link>.
              </p>
            )
          )}
        </div>

        <aside className="space-y-8 lg:col-span-4">
          <FieldLogPanel entries={log} />
          <div id="subscribe" className="grain border border-ink/15 bg-sand-2 p-6">
            <p className="label-mono text-clay-deep">Field Notes</p>
            <p className="mt-2 font-serif text-2xl leading-snug">Weekly dispatches from Palawan.</p>
            <p className="mt-2 text-[14px] text-ink-2">What’s working, what’s breaking, and what we’re building next.</p>
            <div className="mt-4">
              <SubscribeForm source="stories-index" compact />
            </div>
          </div>
        </aside>
      </Container>
    </>
  );
}
