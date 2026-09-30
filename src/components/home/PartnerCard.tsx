"use client";

import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { useId, useRef } from "react";
import type { CSSProperties, FocusEvent, KeyboardEvent, PointerEvent } from "react";
import { ArrowUpRight, StatusDot, cn } from "@/components/ui";
import { pad2 } from "@/lib/format";
import { partnerLink } from "@/lib/partner-link";

export type PartnerItem = { id: number; name: string; logo: string; url: string };

const ENTER_SPRING = { type: "spring", stiffness: 130, damping: 17, mass: 0.9 } as const;
const POP_SPRING = { type: "spring", stiffness: 360, damping: 21, mass: 0.85 } as const;
const SETTLE_SPRING = { type: "spring", stiffness: 240, damping: 26, mass: 0.9 } as const;
const BAR_SPRING = { type: "spring", stiffness: 430, damping: 34 } as const;

type PartnerCardProps = {
  partner: PartnerItem;
  index: number;
  /** Raised: hovered (mouse/pen), tapped/clicked (any device) or pinned. */
  popped: boolean;
  /** Raised by a click/tap; stays up until dismissed. */
  pinned: boolean;
  /** Another card is raised — step back a little so this one reads as the focus. */
  dimmed: boolean;
  onPreview: () => void;
  onPreviewEnd: () => void;
  onToggle: () => void;
  onClose: () => void;
};

/**
 * One partner on the wall.
 *
 * Closed it is a catalogue card: index, logo, name. Raised (hover on mouse,
 * tap/click everywhere) it springs up, steps out of the row and an action bar
 * slides up inside the card with the option to visit the partner's site. The
 * card is a real disclosure button, so keyboards and screen readers get the
 * same two-step interaction as touch: open, then follow the link.
 */
export function PartnerCard({
  partner,
  index,
  popped,
  pinned,
  dimmed,
  onPreview,
  onPreviewEnd,
  onToggle,
  onClose,
}: PartnerCardProps) {
  const reduceMotion = useReducedMotion();
  const barId = useId();
  const faceRef = useRef<HTMLButtonElement>(null);
  const link = partnerLink(partner.url);

  // Pointer-follow (mouse/pen only): the logo drifts a few px toward the
  // cursor and a warm spotlight tracks it across the card.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 170, damping: 20, mass: 0.6 });
  const sy = useSpring(py, { stiffness: 170, damping: 20, mass: 0.6 });
  const logoX = useTransform(sx, (v) => v * 12);
  const logoY = useTransform(sy, (v) => v * 9);
  const glowX = useTransform(sx, (v) => (v + 0.5) * 100);
  const glowY = useTransform(sy, (v) => (v + 0.5) * 100);
  const spotlight = useMotionTemplate`radial-gradient(210px circle at ${glowX}% ${glowY}%, color-mix(in srgb, var(--color-clay) 20%, transparent), transparent 70%)`;

  function onPointerEnter(e: PointerEvent<HTMLElement>) {
    // Touch never hovers: tapping is handled by the button's click instead,
    // which avoids the "sticky hover" a finger leaves behind.
    if (e.pointerType !== "touch") onPreview();
  }

  function onPointerMove(e: PointerEvent<HTMLElement>) {
    if (reduceMotion || e.pointerType === "touch") return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  }

  function onPointerLeave(e: PointerEvent<HTMLElement>) {
    if (e.pointerType === "touch") return;
    px.set(0);
    py.set(0);
    onPreviewEnd();
  }

  function onBlur(e: FocusEvent<HTMLElement>) {
    // Keyboard focus moved on to something outside this card (Tab / Shift+Tab).
    // A null relatedTarget is deliberately ignored: it means a tap landed on a
    // non-focusable part of the card (e.g. the "Site coming soon" bar) or the
    // window lost focus (e.g. after opening the partner's site in a new tab).
    // Taps and clicks elsewhere are dismissed by the grid's pointerdown listener.
    const next = e.relatedTarget as Node | null;
    if (next && !e.currentTarget.contains(next)) onClose();
  }

  function onKeyDown(e: KeyboardEvent<HTMLElement>) {
    if (e.key !== "Escape" || !popped) return;
    // Hand focus back to the card before the bar becomes inert, so keyboard
    // users never lose their place.
    faceRef.current?.focus();
    onClose();
  }

  const pose = popped
    ? { scale: 1.06, y: -8, rotate: index % 2 ? 0.7 : -0.7, opacity: 1 }
    : dimmed
      ? { scale: 0.97, y: 0, rotate: 0, opacity: 0.72 }
      : { scale: 1, y: 0, rotate: 0, opacity: 1 };

  const bobStyle = {
    "--bob-dur": `${(5.8 + (index % 3) * 0.85).toFixed(2)}s`,
    "--bob-delay": `${(-index * 1.35).toFixed(2)}s`,
    "--bob-tilt": index % 2 ? "0.35deg" : "-0.35deg",
  } as CSSProperties;

  return (
    <motion.li
      data-partner-card=""
      data-popped={popped}
      className={cn("pc-wall-item group/card relative", popped ? "z-30" : "z-0")}
      initial={{ opacity: 0, y: 36, rotate: index % 2 ? 2.5 : -2.5, scale: 0.94 }}
      whileInView={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ ...ENTER_SPRING, delay: index * 0.07 }}
      onPointerEnter={onPointerEnter}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
    >
      <div className="pc-bob" style={bobStyle}>
        {/*
          Press feedback is plain CSS (`scale` composes with Motion's transform)
          rather than `whileTap`: Motion makes any non-interactive element that
          has `whileTap` focusable, which would add a hidden extra tab stop to
          every card.
        */}
        <motion.div
          className="transition-[scale] duration-150 ease-out active:scale-[0.97]"
          initial={false}
          animate={pose}
          transition={popped ? POP_SPRING : SETTLE_SPRING}
        >
          <div
            className={cn(
              "grain relative aspect-square overflow-hidden rounded-[var(--pc-radius,18px)] border transition-[box-shadow,border-color,background-color] duration-300 sm:aspect-[5/4]",
              "has-[button:focus-visible]:outline-2 has-[button:focus-visible]:outline-offset-4 has-[button:focus-visible]:outline-clay",
              popped
                ? cn(
                    "bg-[#fffaf3] shadow-[0_36px_60px_-26px_rgba(161,74,41,0.55),0_12px_26px_-16px_rgba(22,20,17,0.35)]",
                    pinned ? "border-clay" : "border-clay/45",
                  )
                : "border-ink/10 bg-paper shadow-[0_18px_34px_-26px_rgba(22,20,17,0.45)]",
            )}
          >
            {/* Warm spotlight that follows the cursor */}
            <motion.span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{ backgroundImage: spotlight }}
              initial={false}
              animate={{ opacity: popped ? 1 : 0 }}
              transition={{ duration: 0.3 }}
            />

            <button
              ref={faceRef}
              type="button"
              aria-label={partner.name}
              aria-expanded={popped}
              aria-controls={barId}
              onClick={onToggle}
              className="absolute inset-0 flex h-full w-full cursor-pointer touch-manipulation select-none flex-col text-left outline-none [-webkit-tap-highlight-color:transparent]"
            >
              <span className="flex h-9 shrink-0 items-start justify-between px-3.5 pt-3">
                <span className="font-mono text-[10px] leading-[22px] tracking-[0.16em] text-clay-deep">
                  {pad2(index + 1)}
                </span>
                <span
                  aria-hidden="true"
                  className="flex h-[22px] w-[22px] items-center justify-center rounded-full border border-ink/20 text-ink/60 transition-all duration-300 group-data-[popped=true]/card:rotate-45 group-data-[popped=true]/card:border-clay group-data-[popped=true]/card:bg-clay group-data-[popped=true]/card:text-sand"
                >
                  <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round">
                    <path d="M6 1.5v9M1.5 6h9" />
                  </svg>
                </span>
              </span>

              {/* multiply lets logos exported with a white background sit on the paper card */}
              <motion.span
                className="flex min-h-0 flex-1 items-center justify-center px-3 pb-1 mix-blend-multiply"
                style={{ x: logoX, y: logoY }}
                initial={false}
                animate={{ scale: popped ? 1.05 : 1 }}
                transition={POP_SPRING}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={partner.logo}
                  alt={partner.name}
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                  className="pointer-events-none h-full w-full select-none object-contain"
                />
              </motion.span>

              <span className="flex h-12 shrink-0 items-center border-t border-ink/10 px-3.5">
                <span className="line-clamp-2 text-[11.5px] font-medium leading-[1.25] text-ink-2 sm:text-[12px]">
                  {partner.name}
                </span>
              </span>
            </button>

            {/* The option to visit — slides up over the name strip when the card is raised */}
            <motion.div
              id={barId}
              className="absolute inset-x-0 bottom-0"
              initial={false}
              animate={{ y: popped ? "0%" : "105%", opacity: popped ? 1 : 0 }}
              transition={{ y: BAR_SPRING, opacity: { duration: 0.2 } }}
              inert={!popped}
            >
              {link ? (
                <a
                  href={link.href}
                  {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="group/cta flex h-12 w-full items-center justify-between gap-2 bg-ink px-3 text-sand outline-none transition-colors duration-200 hover:bg-clay-deep focus-visible:bg-clay-deep focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-sand min-[360px]:gap-3 min-[360px]:px-4"
                >
                  <span className="font-mono text-[10px] uppercase leading-tight tracking-[0.1em] min-[360px]:text-[11px] min-[360px]:tracking-[0.16em]">{link.label}</span>
                  <span className="sr-only">
                    {" "}
                    — {partner.name}
                    {link.external ? " (opens in a new tab)" : ""}
                  </span>
                  <ArrowUpRight className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover/cta:-translate-y-0.5 group-hover/cta:translate-x-0.5" />
                </a>
              ) : (
                <div className="flex h-12 w-full items-center gap-2.5 bg-sand-2 px-3 font-mono text-[9.5px] uppercase leading-[1.3] tracking-[0.14em] text-ink-2 min-[360px]:px-4 sm:text-[10px]">
                  <StatusDot status="in build" />
                  Site coming soon
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.li>
  );
}
