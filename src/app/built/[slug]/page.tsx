import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StoryCard } from "@/components/StoryCard";
import { ArrowRight, ButtonLink, Container, StatusChip } from "@/components/ui";
import { getBuild, getBuilds, getStoriesBySlugs } from "@/lib/data";
import { pad2 } from "@/lib/format";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const build = await getBuild(slug);
  if (!build) return { title: "Build not found" };
  return {
    title: `${build.title} — Built Environments`,
    description: build.summary,
    alternates: { canonical: `/built/${build.slug}` },
    openGraph: { title: build.title, description: build.summary, images: [{ url: build.image, alt: build.imageAlt }] },
  };
}

export default async function BuildPage({ params }: Props) {
  const { slug } = await params;
  const build = await getBuild(slug);
  if (!build) notFound();

  const [related, all] = await Promise.all([getStoriesBySlugs(build.relatedStories), getBuilds()]);
  const index = all.findIndex((b) => b.slug === build.slug);
  const next = all.length > 1 ? all[(index + 1) % all.length] : undefined;
  const sheet = [
    { label: "Location", value: build.location },
    { label: "Since", value: build.since },
    { label: "Status", value: build.status },
    ...build.specs,
  ];

  return (
    <>
      <Container className="pt-10 md:pt-14">
        <nav aria-label="Breadcrumb" className="label-mono flex items-center gap-2 text-muted">
          <Link href="/built" className="hover:text-ink">
            Built environments
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-clay-deep">{pad2(build.position)}</span>
        </nav>

        <div className="mt-8 grid items-end gap-8 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <div className="flex flex-wrap items-center gap-4">
              <span className="font-serif text-[4rem] font-light leading-none text-clay">{pad2(build.position)}</span>
              <StatusChip status={build.status} className="bg-paper" />
            </div>
            <h1 className="mt-5 font-serif text-[clamp(2.1rem,9.2vw,4.6rem)] font-light uppercase leading-[0.9] tracking-[-0.015em] lg:text-[clamp(3.6rem,6.3vw,5rem)]">
              {build.title}
            </h1>
            <p className="label-mono mt-5 text-ink-2">{build.tags}</p>
          </div>
          <p className="font-serif text-[1.4rem] leading-snug text-ink md:text-[1.6rem] lg:col-span-4 lg:pb-2">
            {build.summary}
          </p>
        </div>
      </Container>

      <Container className="mt-12">
        <figure>
          <div className="relative aspect-[16/9] overflow-hidden rounded-[var(--pc-radius,18px)] bg-ink/10 shadow-[0_24px_50px_-25px_rgba(22,20,17,0.45)] md:aspect-[21/9]">
            <Image
              src={build.image}
              alt={build.imageAlt}
              fill
              preload
              sizes="(min-width: 1320px) 1256px, 100vw"
              className="doc-photo object-cover"
            />
          </div>
          <figcaption className="label-mono mt-3 flex justify-between gap-4 text-muted">
            <span>Fig. — {build.imageAlt}</span>
            <span className="hidden md:inline">{build.fieldSpec}</span>
          </figcaption>
        </figure>
      </Container>

      <Container className="mt-14 grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-8 lg:col-start-5 lg:row-start-1">
          {build.sections.map((section, i) => (
            <section
              key={section.heading}
              className="grid gap-5 border-t border-ink/15 py-9 first:border-t-0 first:pt-0 md:grid-cols-8 md:gap-8"
            >
              <h2 className="font-serif text-[1.9rem] leading-tight md:col-span-3">
                <span className="label-mono mb-2 block text-clay-deep">{pad2(i + 1)}</span>
                {section.heading}
              </h2>
              <div className="space-y-4 md:col-span-5">
                {section.body.map((paragraph, j) => (
                  <p key={j} className="text-[16px] leading-[1.75] text-ink-2">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <aside className="lg:col-span-4 lg:col-start-1 lg:row-start-1 lg:pr-4">
          <div className="border-t border-ink pt-5 lg:sticky lg:top-24">
            <p className="label-mono text-clay-deep">Spec sheet</p>
            <dl className="mt-4 divide-y divide-ink/10 border-y border-ink/10">
              {sheet.map((row) => (
                <div key={row.label} className="grid grid-cols-[8rem_1fr] gap-4 py-3">
                  <dt className="label-mono pt-0.5 text-muted">{row.label}</dt>
                  <dd className="text-[14.5px] leading-snug text-ink">{row.value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-6 flex flex-col gap-3">
              <ButtonLink href="/work-with-us?type=project#inquire">Start a similar project</ButtonLink>
              <ButtonLink href="/work-with-us?type=partner#inquire" variant="outline">
                Partner on this
              </ButtonLink>
            </div>
          </div>
        </aside>
      </Container>

      {related.length > 0 && (
        <Container className="mt-20">
          <div className="flex flex-wrap items-end justify-between gap-4 border-t border-ink/20 pt-6">
            <h2 className="font-serif text-[2.3rem] font-light uppercase leading-none md:text-[3rem]">
              Stories from <span className="text-clay">this build</span>
            </h2>
            <Link href="/stories" className="label-mono group inline-flex items-center gap-3 hover:text-clay-deep">
              All stories
              <ArrowRight className="h-3 w-10 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="mt-10 grid gap-x-8 gap-y-12 md:grid-cols-3">
            {related.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        </Container>
      )}

      {next && (
        <Container className="mt-20">
          <Link
            href={`/built/${next.slug}`}
            className="group grid items-center gap-4 border-y border-ink/15 py-8 md:grid-cols-12 md:gap-6"
          >
            <p className="label-mono text-muted md:col-span-2">Next build</p>
            <p className="font-serif text-[2rem] font-light uppercase leading-none transition-colors group-hover:text-clay-deep md:col-span-8 md:text-[3.2rem]">
              <span className="text-clay">{pad2(next.position)}</span> {next.title}
            </p>
            <ArrowRight className="h-4 w-14 transition-transform duration-300 group-hover:translate-x-2 md:col-span-2 md:justify-self-end" />
          </Link>
        </Container>
      )}
    </>
  );
}
