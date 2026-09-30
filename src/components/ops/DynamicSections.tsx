"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { SubscribeForm } from "@/components/SubscribeForm";
import { ArrowRight, ButtonLink, Container, SectionHeading } from "@/components/ui";
import type { Faq, Gallery, SectionData, SiteSection } from "@/db/schema";

function get(section: SiteSection, key: string, fallback = ""): string {
  const v: unknown = section.data?.[key];
  return typeof v === "string" && v ? v : fallback;
}

/* ------------------------------------------------------------------ */
/* FAQ — accordion                                                       */
/* ------------------------------------------------------------------ */

export function FaqSection({ faqs, section }: { faqs: Faq[]; section?: SiteSection }) {
  const [open, setOpen] = useState<number | null>(0);
  if (faqs.length === 0) return null;
  return (
    <section id="faq" className="mt-28 md:mt-36">
      <Container>
        <SectionHeading
          index={section ? get(section, "index", "06") : "06"}
          first={section ? get(section, "first", "Questions") : "Questions"}
          second={section ? get(section, "second", "Answered") : "Answered"}
          description="Short answers, checked on the ground. Anything longer lives in the stories and guides."
        />
        <div className="mx-auto mt-10 max-w-3xl border-t border-ink/15">
          {faqs.map((faq, i) => {
            const isOpen = open === i;
            return (
              <div key={faq.id} className="border-b border-ink/15">
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-baseline gap-5 py-5 text-left"
                >
                  <span className="label-mono shrink-0 text-clay-deep">{String(i + 1).padStart(2, "0")}</span>
                  <span className="flex-1 font-serif text-[1.35rem] leading-snug md:text-[1.6rem]">{faq.question}</span>
                  <motion.span
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="font-serif text-2xl leading-none text-clay"
                    aria-hidden="true"
                  >
                    +
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="max-w-2xl pb-6 pl-10 text-[15px] leading-relaxed text-ink-2 md:pl-12">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Gallery — grid / horizontal scroll + lightbox                         */
/* ------------------------------------------------------------------ */

export function GallerySection({ gallery, section }: { gallery: Gallery | undefined; section?: SiteSection }) {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const items = gallery?.items ?? [];
  const scroll = gallery?.layout === "scroll";

  const step = useCallback(
    (dir: 1 | -1) => {
      if (lightbox === null || items.length === 0) return;
      setLightbox((lightbox + dir + items.length) % items.length);
    },
    [lightbox, items.length],
  );

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox, step]);

  if (!gallery || items.length === 0) return null;

  return (
    <section id="gallery" className="mt-28 md:mt-36">
      <Container>
        <SectionHeading
          index={section ? get(section, "index", "07") : "07"}
          first={gallery.title.split("—")[0]?.trim() || "Field"}
          second={gallery.title.split("—")[1]?.trim() || "Gallery"}
          description={gallery.description || undefined}
        />
        <div className={scroll ? "mt-10 flex gap-4 overflow-x-auto pb-4" : "mt-10 grid grid-cols-2 gap-4 lg:grid-cols-3"}>
          {items.map((item, i) => (
            <button
              key={i}
              onClick={() => setLightbox(i)}
              className={`group relative block overflow-hidden rounded-[var(--pc-radius,18px)] bg-ink/10 text-left shadow-[0_20px_45px_-25px_rgba(22,20,17,0.4)] ${scroll ? "h-64 w-80 shrink-0" : "aspect-[4/3]"}`}
              aria-label={`Open: ${item.caption || `photo ${i + 1}`}`}
            >
              {item.kind === "video" ? (
                <video src={item.url} className="doc-photo h-full w-full object-cover" muted playsInline preload="metadata" />
              ) : (
                <Image
                  src={item.url}
                  alt={item.caption || `Field photo ${i + 1}`}
                  fill
                  sizes={scroll ? "320px" : "(min-width:1024px) 30vw, 45vw"}
                  className="doc-photo object-cover transition-transform duration-1000 group-hover:scale-[1.04]"
                />
              )}
              {item.caption && (
                <span className="absolute inset-x-0 bottom-0 bg-linear-to-t from-ink/80 to-transparent px-3 pb-2 pt-8 text-left font-mono text-[11px] text-sand">
                  {item.caption}
                </span>
              )}
              {item.kind === "video" && (
                <span className="absolute right-2 top-2 bg-ink/70 px-2 py-1 font-mono text-[10px] uppercase text-sand">▶</span>
              )}
            </button>
          ))}
        </div>
      </Container>

      <AnimatePresence>
        {lightbox !== null && items[lightbox] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center bg-ink/90 p-4 md:p-10"
            onClick={() => setLightbox(null)}
            role="dialog"
            aria-modal="true"
            aria-label="Gallery viewer"
          >
            <button
              className="label-mono absolute right-5 top-5 text-sand/80 hover:text-sand"
              onClick={() => setLightbox(null)}
              aria-label="Close viewer"
            >
              Close ✕
            </button>
            <button
              className="absolute left-3 top-1/2 -translate-y-1/2 px-3 py-6 font-serif text-4xl text-sand/70 hover:text-sand md:left-8"
              onClick={(e) => {
                e.stopPropagation();
                step(-1);
              }}
              aria-label="Previous"
            >
              ←
            </button>
            <motion.figure
              key={lightbox}
              initial={{ scale: 0.97, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="max-h-full max-w-5xl"
              onClick={(e) => e.stopPropagation()}
            >
              {items[lightbox].kind === "video" ? (
                <video src={items[lightbox].url} controls autoPlay className="max-h-[80vh] w-auto max-w-full" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={items[lightbox].url} alt={items[lightbox].caption || ""} className="max-h-[80vh] w-auto max-w-full object-contain" />
              )}
              <figcaption className="mt-3 flex items-center justify-between gap-4 font-mono text-[12px] text-sand/80">
                <span>{items[lightbox].caption}</span>
                <span>
                  {lightbox + 1} / {items.length}
                </span>
              </figcaption>
            </motion.figure>
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-6 font-serif text-4xl text-sand/70 hover:text-sand md:right-8"
              onClick={(e) => {
                e.stopPropagation();
                step(1);
              }}
              aria-label="Next"
            >
              →
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Custom sections rendered from Content Builder data                    */
/* ------------------------------------------------------------------ */

function paragraphs(text: string): string[] {
  return text.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
}

export function CustomSection({ section, galleries }: { section: SiteSection; galleries: Gallery[] }) {
  const d: SectionData = section.data ?? {};
  const s = (k: string) => (typeof d[k] === "string" ? (d[k] as string) : "");

  if (section.type === "gallery") {
    const slug = s("gallerySlug");
    const gallery = galleries.find((x) => x.slug === slug) ?? galleries[0];
    return <GallerySection gallery={gallery} section={section} />;
  }

  if (section.type === "newsletter") {
    return (
      <section className="grain mt-28 border-y border-ink/10 bg-sand-2 md:mt-36">
        <Container className="grid gap-8 py-16 md:py-20 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="label-mono text-clay-deep">{s("index") || "§ — Newsletter"}</p>
            <h2 className="mt-3 font-serif text-[2.6rem] font-light uppercase leading-[0.9]">{s("title") || section.title}</h2>
            <p className="mt-4 font-serif text-[1.4rem] italic">{s("subtitle") || "Weekly dispatches from Palawan."}</p>
            {s("copy") && <p className="mt-2 text-[15px] text-ink-2">{s("copy")}</p>}
          </div>
          <div className="lg:col-span-7 lg:pt-8">
            <SubscribeForm source={`section-${section.key}`} />
          </div>
        </Container>
      </section>
    );
  }

  if (section.type === "cta") {
    return (
      <section className="mt-28 md:mt-36">
        <Container>
          <div className="grid items-center gap-8 rounded-[var(--pc-radius,18px)] bg-ink p-8 text-sand shadow-[0_24px_50px_-25px_rgba(22,20,17,0.55)] md:p-12 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <p className="label-mono text-clay-light">{s("kicker") || section.title}</p>
              <p className="mt-3 font-serif text-[2rem] font-light leading-tight md:text-[2.6rem]">{s("title") || "Ready when you are."}</p>
              {s("copy") && <p className="mt-3 max-w-xl text-[15px] text-sand/70">{s("copy")}</p>}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:col-span-5 lg:justify-end">
              {s("primaryHref") && <ButtonLink href={s("primaryHref")} variant="clay">{s("primaryLabel") || "Start"}</ButtonLink>}
              {s("secondaryHref") && <ButtonLink href={s("secondaryHref")} variant="light">{s("secondaryLabel") || "Learn more"}</ButtonLink>}
            </div>
          </div>
        </Container>
      </section>
    );
  }

  if (section.type === "text-image" || section.type === "text_image") {
    const flip = d.flip === true;
    return (
      <section className="mt-28 md:mt-36">
        <Container className="grid items-center gap-10 lg:grid-cols-12">
          <div className={flip ? "lg:order-2 lg:col-span-6" : "lg:col-span-6"}>
            {s("image") ? (
              <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--pc-radius,18px)] bg-ink/10 shadow-[0_20px_45px_-25px_rgba(22,20,17,0.4)]">
                <Image src={s("image")} alt={s("imageAlt") || section.title} fill sizes="(min-width:1024px) 45vw, 100vw" className="doc-photo object-cover" />
              </div>
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center border border-dashed border-ink/30 font-mono text-[12px] text-muted">
                text+image · set “image” in Content Builder
              </div>
            )}
          </div>
          <div className={flip ? "lg:order-1 lg:col-span-6" : "lg:col-span-6"}>
            {s("kicker") && <p className="label-mono text-clay-deep">{s("kicker")}</p>}
            <h2 className="mt-3 font-serif text-[2.4rem] font-light leading-[1.02] md:text-[3.2rem]">{s("title") || section.title}</h2>
            {paragraphs(s("body")).map((p, i) => (
              <p key={i} className="mt-4 text-[15.5px] leading-relaxed text-ink-2">{p}</p>
            ))}
            {s("ctaHref") && (
              <a href={s("ctaHref")} className="label-mono group mt-6 inline-flex items-center gap-3 border-b border-ink pb-1">
                {s("ctaLabel") || "Read more"}
                <ArrowRight className="h-3 w-8 transition-transform group-hover:translate-x-1" />
              </a>
            )}
          </div>
        </Container>
      </section>
    );
  }

  if (section.type === "grid") {
    const items = Array.isArray(d.items) ? (d.items as Array<{ title?: string; text?: string }>) : [];
    return (
      <section className="mt-28 md:mt-36">
        <Container>
          <SectionHeading index={s("index") || "§"} first={s("first") || section.title} second={s("second") || ""} description={s("description") || undefined} />
          <div className="mt-10 grid gap-px overflow-hidden rounded-[var(--pc-radius,18px)] border border-ink/15 bg-ink/15 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item, i) => (
              <div key={i} className="bg-paper p-6 md:p-8">
                <p className="label-mono text-clay-deep">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="mt-3 font-serif text-[1.5rem] leading-tight">{item.title || `Item ${i + 1}`}</h3>
                {item.text && <p className="mt-2 text-[14px] leading-relaxed text-ink-2">{item.text}</p>}
              </div>
            ))}
            {items.length === 0 && (
              <div className="bg-paper p-8 font-mono text-[12px] text-muted sm:col-span-2 lg:col-span-3">
                grid · add “items” (title + text) in Content Builder
              </div>
            )}
          </div>
        </Container>
      </section>
    );
  }

  // Fallback: generic hero/custom block
  return (
    <section className="mt-28 md:mt-36">
      <Container>
        {s("kicker") && <p className="label-mono text-clay-deep">{s("kicker")}</p>}
        <h2 className="mt-3 max-w-4xl font-serif text-[2.6rem] font-light uppercase leading-[0.92] md:text-[4rem]">
          {s("title") || section.title}
        </h2>
        <div className="mt-6 max-w-2xl">
          {paragraphs(s("body")).map((p, i) => (
            <p key={i} className="mt-4 text-[15.5px] leading-relaxed text-ink-2">{p}</p>
          ))}
        </div>
        {s("image") && (
          <div className="relative mt-8 aspect-[21/9] overflow-hidden rounded-[var(--pc-radius,18px)] bg-ink/10 shadow-[0_20px_45px_-25px_rgba(22,20,17,0.4)]">
            <Image src={s("image")} alt={s("imageAlt") || section.title} fill sizes="100vw" className="doc-photo object-cover" />
          </div>
        )}
        {s("ctaHref") && (
          <div className="mt-8">
            <ButtonLink href={s("ctaHref")}>{s("ctaLabel") || "Continue"}</ButtonLink>
          </div>
        )}
      </Container>
    </section>
  );
}
