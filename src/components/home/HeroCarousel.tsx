"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/components/ui";

type Slide = {
  src: string;
  alt: string;
  caption: string;
  tag: string;
  location: string;
};

const SLIDES: Slide[] = [
  {
    src: "/images/hero-build.jpg",
    alt: "Crew framing a timber roof in a jungle clearing",
    caption: "Roof framing, before the rains",
    tag: "Build",
    location: "Site 01 · Northern Palawan",
  },
  {
    src: "/images/story-no-road.jpg",
    alt: "Workers unloading cargo from a boat across a wooden plank at first light",
    caption: "Unloading at high tide",
    tag: "Logistics",
    location: "Landing beach · 06:10",
  },
  {
    src: "/images/page-palawan.jpg",
    alt: "Outrigger boats beneath limestone cliffs in northern Palawan",
    caption: "Bangkas under the limestone",
    tag: "Palawan",
    location: "Northern coast",
  },
  {
    src: "/images/story-off-grid.jpg",
    alt: "An electrician wiring a solar power system",
    caption: "Power room wiring",
    tag: "Off-grid",
    location: "Site 01 · Power shed",
  },
  {
    src: "/images/built-infrastructure.jpg",
    alt: "Colourful outrigger boats moored in a Filipino harbour",
    caption: "Supply day at the harbour",
    tag: "Network",
    location: "Taytay",
  },
];

const AUTOPLAY_MS = 6000;

/**
 * Cinematic hero slide stage:
 *  - slow crossfade between photos (no horizontal slide)
 *  - gentle continuous zoom drift while each photo is on screen (Ken Burns)
 *  - segmented progress bar below the stage — it IS the autoplay timer,
 *    so pause/resume and jump-to-slide stay perfectly in sync
 *  - glass circular arrows + counter, pausable on hover/focus, swipeable
 *
 * `slides` comes from the ops-editable `hero_slides` setting; the shipped
 * SLIDES array is the fallback when nothing has been saved yet.
 */
export function HeroCarousel({ slides = [] }: { slides?: Slide[] }) {
  const items = slides.length ? slides : SLIDES;
  const [rawIndex, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useReducedMotion();
  const touchX = useRef<number | null>(null);
  // Slide count can change when ops saves new photos — clamp at render rather
  // than correcting in an effect (the count only ever shrinks while mounted).
  const index = rawIndex < items.length ? rawIndex : 0;

  const go = useCallback((dir: 1 | -1) => setIndex((i) => (i + dir + items.length) % items.length), [items.length]);
  const jump = useCallback((i: number) => setIndex(i), []);

  // With reduced motion the progress-bar animation is off, so a timer drives autoplay instead.
  useEffect(() => {
    if (paused || !reduceMotion) return;
    const t = window.setTimeout(() => go(1), AUTOPLAY_MS);
    return () => window.clearTimeout(t);
  }, [index, paused, reduceMotion, go]);

  // Slide count can change when ops saves new photos — `index` is clamped at
  // render, so the stage is always in range without a corrective effect.
  const slide = items[index];
  if (!slide) return null;

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div
        role="region"
        aria-roledescription="carousel"
        aria-label="Field photography from Palawan"
        className="group/hero relative aspect-[4/3] w-full overflow-hidden rounded-[var(--pc-radius,18px)] bg-ink/10 shadow-[0_44px_90px_-42px_rgba(22,20,17,0.55)] ring-1 ring-ink/10 sm:aspect-[16/10]"
        onTouchStart={(e) => {
          touchX.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          touchX.current = null;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        }}
      >
        <AnimatePresence initial={false} mode="popLayout">
          {items.map((s, i) =>
            i === index ? (
              <motion.div
                key={s.src}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 1, ease: "easeInOut" } }}
                exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
                className="absolute inset-0"
              >
                <div
                  className={cn(
                    "absolute inset-0",
                    !reduceMotion && "hero-kenburns group-hover/hero:[animation-play-state:paused]",
                  )}
                >
                  <Image
                    src={s.src}
                    alt={s.alt}
                    fill
                    fetchPriority={i === 0 ? "high" : undefined}
                    sizes="(min-width: 1024px) 55vw, 100vw"
                    className="doc-photo object-cover"
                  />
                </div>
                <div className="absolute inset-0 bg-linear-to-t from-ink/60 via-ink/10 to-ink/25" />
              </motion.div>
            ) : null,
          )}
        </AnimatePresence>

        {/* Top row: tag + counter */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between p-4">
          <span className="rounded-full bg-clay px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-sand shadow-md">
            {slide.tag}
          </span>
          <span className="rounded-full bg-ink/45 px-3 py-1.5 font-mono text-[10px] tracking-[0.16em] text-sand backdrop-blur-md">
            {String(index + 1).padStart(2, "0")} — {String(items.length).padStart(2, "0")}
          </span>
        </div>

        {/* Bottom row: caption + glass arrows */}
        <div className="absolute inset-x-0 bottom-0 z-20 flex items-end justify-between gap-4 p-5 md:p-6">
          <div className="pointer-events-none min-w-0 max-w-[72%]">
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.15 } }}
                exit={{ opacity: 0, y: -6, transition: { duration: 0.3 } }}
              >
                <p className="font-serif text-[1.3rem] leading-tight text-sand md:text-[1.7rem]">{slide.caption}</p>
                <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-sand/75">{slide.location}</p>
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous photo"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-sand/25 bg-ink/40 text-base leading-none text-sand backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-ink/70"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next photo"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-sand/25 bg-ink/40 text-base leading-none text-sand backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-ink/70"
            >
              →
            </button>
          </div>
        </div>
      </div>

      {/* Segmented progress — clickable, and it is the autoplay timer */}
      <div className="mt-4 flex items-center gap-1.5" role="tablist" aria-label="Choose photo">
        {items.map((s, i) => (
          <button
            key={s.src}
            role="tab"
            aria-selected={i === index}
            aria-label={`Photo ${i + 1}: ${s.caption}`}
            onClick={() => jump(i)}
            className="group/seg relative h-5 min-w-0 flex-1 cursor-pointer"
          >
            <span className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 overflow-hidden rounded-full bg-ink/15 transition-colors duration-300 group-hover/seg:bg-ink/30">
              {i < index && <span className="block h-full w-full bg-ink/40" />}
              {i === index &&
                (reduceMotion ? (
                  <span className="block h-full w-full bg-clay" />
                ) : (
                  <span
                    key={`fill-${index}`}
                    className="block h-full bg-clay"
                    style={{
                      animation: `hero-seg-fill ${AUTOPLAY_MS}ms linear forwards`,
                      animationPlayState: paused ? "paused" : "running",
                    }}
                    onAnimationEnd={() => go(1)}
                  />
                ))}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
