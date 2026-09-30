import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SubscribeForm } from "@/components/SubscribeForm";
import { Container, Icon, cn } from "@/components/ui";
import { getGuide, getGuides } from "@/lib/data";
import { formatDate, pad2 } from "@/lib/format";
import { site, whatsappLink } from "@/lib/site";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = await getGuide(slug);
  if (!guide) return { title: "Guide not found" };
  return {
    title: `${guide.title} — Navigating Palawan`,
    description: guide.summary,
    alternates: { canonical: `/palawan/${guide.slug}` },
    openGraph: { title: `${guide.title} — Navigating Palawan`, description: guide.summary, images: [{ url: guide.image, alt: guide.imageAlt }] },
  };
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const [guide, all] = await Promise.all([getGuide(slug), getGuides()]);
  if (!guide) notFound();

  const index = all.findIndex((g) => g.slug === guide.slug);
  const prev = index > 0 ? all[index - 1] : undefined;
  const next = index >= 0 && index < all.length - 1 ? all[index + 1] : undefined;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${guide.title} — Navigating Palawan`,
    description: guide.summary,
    dateModified: guide.verifiedAt.toISOString(),
    author: { "@type": "Person", name: site.person },
    publisher: { "@type": "Organization", name: site.name },
    image: `${site.url}${guide.image}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <Container className="pt-10 md:pt-14">
        <nav aria-label="Breadcrumb" className="label-mono flex flex-wrap items-center gap-2 text-muted">
          <Link href="/palawan" className="hover:text-ink">
            Navigating Palawan
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-clay-deep">
            {pad2(guide.position)} · {guide.kicker}
          </span>
        </nav>

        <div className="mt-8 grid items-end gap-8 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <p className="font-display text-[4.5rem] leading-none text-clay md:text-[6rem]">{pad2(guide.position)}</p>
            <h1 className="mt-3 font-serif text-[clamp(2.1rem,9.2vw,4.6rem)] font-light uppercase leading-[0.92] tracking-[-0.015em] lg:text-[clamp(3.6rem,6.3vw,5rem)]">
              {guide.title}
            </h1>
          </div>
          <p className="font-serif text-[1.35rem] leading-snug md:text-[1.55rem] lg:col-span-4 lg:pb-2">{guide.summary}</p>
        </div>
      </Container>

      <Container className="mt-12">
        <figure>
          <div className="relative aspect-[16/9] overflow-hidden rounded-[var(--pc-radius,18px)] bg-ink/10 shadow-[0_24px_50px_-25px_rgba(22,20,17,0.45)] md:aspect-[21/9]">
            <Image
              src={guide.image}
              alt={guide.imageAlt}
              fill
              preload
              sizes="(min-width: 1320px) 1256px, 100vw"
              className="doc-photo object-cover"
            />
          </div>
          <figcaption className="label-mono mt-3 text-muted">Fig. — {guide.imageAlt}</figcaption>
        </figure>
      </Container>

      <Container className="mt-14 grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-7 lg:col-start-6 lg:row-start-1">
          {guide.sections.map((section, i) => (
            <section key={section.heading} className={cn("border-t border-ink/15 py-9", i === 0 && "border-t-0 pt-0")}>
              <h2 className="flex items-baseline gap-3 font-serif text-[1.9rem] leading-tight md:text-[2.3rem]">
                <span className="label-mono shrink-0 text-clay-deep">{pad2(i + 1)}</span>
                <span>{section.heading}</span>
              </h2>
              {section.body.map((paragraph, j) => (
                <p key={j} className="mt-4 font-serif text-[1.15rem] leading-[1.7] text-ink-2 md:text-[1.22rem]">
                  {paragraph}
                </p>
              ))}
              {section.items && section.items.length > 0 && (
                <ul className="mt-5 space-y-3">
                  {section.items.map((item) => (
                    <li
                      key={item}
                      className="grid grid-cols-[1.6rem_1fr] font-serif text-[1.12rem] leading-[1.6] text-ink-2 md:text-[1.18rem]"
                    >
                      <span className="text-clay" aria-hidden="true">
                        —
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          <div className="grain mt-6 border border-ink/15 bg-sand-2 p-6 md:p-8">
            <p className="label-mono text-clay-deep">Field Notes</p>
            <p className="mt-2 font-serif text-2xl leading-snug">Guide updates arrive with the weekly dispatch.</p>
            <div className="mt-4">
              <SubscribeForm source={`guide-${guide.slug}`} />
            </div>
          </div>
        </div>

        <aside className="lg:col-span-4 lg:col-start-1 lg:row-start-1">
          <div className="space-y-6 lg:sticky lg:top-24">
            <div className="border border-ink/15 bg-paper p-6">
              <p className="label-mono text-clay-deep">Quick facts</p>
              <ul className="mt-4 space-y-2.5">
                {guide.quickFacts.map((fact) => (
                  <li key={fact} className="flex gap-3 font-mono text-[12.5px] leading-snug text-ink-2">
                    <span className="text-clay">→</span>
                    {fact}
                  </li>
                ))}
              </ul>
              <p className="label-mono mt-6 flex items-center gap-2 border-t border-ink/10 pt-4 text-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-moss" />
                Verified on the ground · {formatDate(guide.verifiedAt)}
              </p>
            </div>
            <div className="border-t border-ink/20 pt-5">
              <p className="label-mono text-muted">Spotted something out of date?</p>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-2">
                Ferry schedules, road works, prices — things change fast here. Tell us and we’ll re-check it.
              </p>
              <a
                href={whatsappLink(`Update for the guide “${guide.title}”: `)}
                target="_blank"
                rel="noreferrer"
                className="label-mono mt-3 inline-flex items-center gap-2 border-b border-ink pb-1 hover:text-clay-deep"
              >
                <Icon name="whatsapp" className="h-4 w-4" /> Send an update
              </a>
            </div>
          </div>
        </aside>
      </Container>

      <Container className="mt-20">
        <nav aria-label="Other guides" className="grid border-y border-ink/15 md:grid-cols-2">
          {prev ? (
            <Link href={`/palawan/${prev.slug}`} className="group py-7 md:pr-8">
              <p className="label-mono text-muted">← {pad2(prev.position)} · {prev.kicker}</p>
              <p className="mt-2 font-serif text-[1.7rem] leading-snug transition-colors group-hover:text-clay-deep">{prev.title}</p>
            </Link>
          ) : (
            <Link href="/palawan" className="group py-7 md:pr-8">
              <p className="label-mono text-muted">← Overview</p>
              <p className="mt-2 font-serif text-[1.7rem] leading-snug transition-colors group-hover:text-clay-deep">Navigating Palawan</p>
            </Link>
          )}
          {next ? (
            <Link
              href={`/palawan/${next.slug}`}
              className="group border-t border-ink/15 py-7 md:border-l md:border-t-0 md:pl-8 md:text-right"
            >
              <p className="label-mono text-muted">{pad2(next.position)} · {next.kicker} →</p>
              <p className="mt-2 font-serif text-[1.7rem] leading-snug transition-colors group-hover:text-clay-deep">{next.title}</p>
            </Link>
          ) : (
            <Link
              href="/stories"
              className="group border-t border-ink/15 py-7 md:border-l md:border-t-0 md:pl-8 md:text-right"
            >
              <p className="label-mono text-muted">Keep reading →</p>
              <p className="mt-2 font-serif text-[1.7rem] leading-snug transition-colors group-hover:text-clay-deep">Stories from the build</p>
            </Link>
          )}
        </nav>
      </Container>
    </>
  );
}
