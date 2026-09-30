import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ButtonLink, Container, StatusChip, cn } from "@/components/ui";
import { getBuilds } from "@/lib/data";
import { getSettingsMap, setting } from "@/lib/control";
import { pad2 } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Built Environments",
  description:
    "Proof of execution: an off-grid resort build, local business automation, shared logistics infrastructure and agents running real-world operations in Palawan.",
  alternates: { canonical: "/built" },
};

export default async function BuiltPage() {
  const builds = await getBuilds();
  let headerImage = "/images/page-built.jpg";
  try {
    headerImage = setting<string>(await getSettingsMap(), "page_image_built", headerImage);
  } catch {
    /* default keeps the page alive */
  }

  return (
    <>
      <Container className="pt-10 md:pt-14">
        <p className="label-mono text-clay-deep">§ 01 — The ecosystem</p>
        <div className="mt-4 grid items-end gap-8 lg:grid-cols-12">
          <h1 className="font-serif text-[clamp(2.4rem,10.5vw,5.6rem)] font-light uppercase leading-[0.88] tracking-[-0.015em] lg:col-span-8 lg:text-[clamp(4rem,7.4vw,6.3rem)]">
            Built
            <span className="block text-clay">Environments</span>
          </h1>
          <p className="max-w-md text-[15px] leading-relaxed text-ink-2 lg:col-span-4 lg:pb-4">
            Not client work. Proof of execution — places and systems we’ve built, run and had to fix. Resorts,
            automation, logistics and agents, all feeding one ecosystem.
          </p>
        </div>
      </Container>

      <Container className="mt-12">
        <figure className="relative aspect-[16/9] overflow-hidden rounded-[var(--pc-radius,18px)] bg-ink shadow-[0_24px_50px_-25px_rgba(22,20,17,0.5)] md:aspect-[21/8]">
          <Image
            src={headerImage}
            alt="Thatched-roof houses in a lush tropical village"
            fill
            preload
            sizes="(min-width: 1320px) 1256px, 100vw"
            className="doc-photo object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-linear-to-t from-ink/80 via-ink/10 to-transparent" />
          <figcaption className="absolute inset-x-5 bottom-5 flex flex-col gap-2 text-sand md:inset-x-8 md:bottom-8 md:flex-row md:items-end md:justify-between">
            <p className="font-serif text-[1.6rem] leading-tight md:text-[2.2rem]">Resorts ⟷ Agents ⟷ Local infrastructure</p>
            <p className="label-mono text-sand/70">One network · Remote + on-ground</p>
          </figcaption>
        </figure>
      </Container>

      <Container className="mt-20 space-y-20 md:space-y-28">
        {builds.map((build, i) => (
          <article key={build.slug} className="grid items-center gap-8 lg:grid-cols-12 lg:gap-12">
            <Link
              href={`/built/${build.slug}`}
              className={cn(
                "group relative block aspect-[4/3] overflow-hidden rounded-[var(--pc-radius,18px)] bg-ink/10 shadow-[0_24px_50px_-25px_rgba(22,20,17,0.45)] lg:col-span-7",
                i % 2 === 1 && "lg:order-2",
              )}
            >
              <Image
                src={build.image}
                alt={build.imageAlt}
                fill
                sizes="(min-width: 1024px) 55vw, 100vw"
                className="doc-photo object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.03]"
              />
              <StatusChip status={build.status} className="absolute left-4 top-4" />
              <span className="absolute bottom-4 right-4 bg-ink/80 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-sand">
                {build.fieldSpec}
              </span>
            </Link>
            <div className={cn("lg:col-span-5", i % 2 === 1 && "lg:order-1")}>
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span className="font-serif text-[3.6rem] font-light leading-none text-clay">{pad2(build.position)}</span>
                <span className="label-mono text-muted">
                  {build.location} · since {build.since}
                </span>
              </div>
              <h2 className="mt-4 font-serif text-[2.2rem] leading-[1.02] md:text-[2.9rem]">{build.title}</h2>
              <p className="label-mono mt-3 text-clay-deep">{build.tags}</p>
              <p className="mt-5 text-[15.5px] leading-relaxed text-ink-2">{build.summary}</p>
              <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-ink/15 bg-ink/15">
                {build.specs.map((spec) => (
                  <div key={spec.label} className="bg-paper p-3">
                    <dt className="label-mono text-muted">{spec.label}</dt>
                    <dd className="mt-1 text-[14px] leading-snug text-ink">{spec.value}</dd>
                  </div>
                ))}
              </dl>
              <Link
                href={`/built/${build.slug}`}
                className="label-mono group mt-7 inline-flex items-center gap-3 border-b border-ink pb-1 hover:text-clay-deep"
              >
                Read the build log
                <ArrowRight className="h-3 w-8 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </article>
        ))}
      </Container>

      <Container className="mt-24">
        <div className="grid items-center gap-8 rounded-[var(--pc-radius,18px)] bg-ink p-8 text-sand shadow-[0_24px_50px_-25px_rgba(22,20,17,0.55)] md:p-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="label-mono text-clay-light">Building something similar?</p>
            <p className="mt-3 font-serif text-[2rem] font-light leading-tight md:text-[2.6rem]">
              Land, a business, or a coast that needs better logistics — we’ve probably broken it before.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:col-span-5 lg:justify-end">
            <ButtonLink href="/work-with-us?type=project#inquire" variant="clay">
              Start a Project
            </ButtonLink>
            <ButtonLink href="/work-with-us?type=partner#inquire" variant="light">
              Partner With Us
            </ButtonLink>
          </div>
        </div>
      </Container>
    </>
  );
}
