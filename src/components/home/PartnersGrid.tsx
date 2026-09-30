"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, X } from "lucide-react";

type PartnerItem = { id: number; name: string; logo: string; url: string };

/**
 * Infinite horizontal logo marquee (duplicated track, CSS-driven so it stays
 * smooth on mobile) + a modal on click with a clear "visit" / "close" choice.
 * Reduced-motion and low-logo-count fall back to the static wall.
 */
export function PartnersGrid({ partners }: { partners: PartnerItem[] }) {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState<PartnerItem | null>(null);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setActive(null);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [active]);

  const speed = Math.max(28, partners.length * 9); // seconds per loop
  const animate = !reduceMotion && partners.length > 2;

  const tile = (p: PartnerItem, key: string) => (
    <button
      key={key}
      type="button"
      onClick={() => setActive(p)}
      aria-label={`${p.name} — open details`}
      className="group relative flex h-[132px] w-[210px] shrink-0 items-center justify-center overflow-hidden rounded-[var(--pc-radius,18px)] border border-ink/10 bg-paper px-7 shadow-[0_16px_36px_-24px_rgba(22,20,17,0.4)] transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-1.5 hover:border-clay/40 hover:shadow-[0_24px_48px_-22px_rgba(161,74,41,0.45)] focus-visible:border-clay focus-visible:outline-none sm:h-[150px] sm:w-[248px]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={p.logo}
        alt={p.name}
        loading="lazy"
        className="max-h-full w-full object-contain transition-transform duration-500 ease-out group-hover:scale-[1.06]"
      />
      <span className="pointer-events-none absolute inset-0 flex items-end justify-center bg-gradient-to-t from-ink/85 to-transparent pb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-sand opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        View
      </span>
    </button>
  );

  // ---- static wall (reduced motion / 1–2 partners) --------------------
  if (!animate) {
    return (
      <>
        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {partners.map((p) => (
            <div key={p.id} className="h-full">
              {tile(p, String(p.id))}
            </div>
          ))}
        </div>
        <PartnerModal partner={active} onClose={() => setActive(null)} />
      </>
    );
  }

  // ---- marquee --------------------------------------------------------
  const track = (dup: boolean) => (
    <div className="flex shrink-0 items-center gap-4 sm:gap-6" aria-hidden={dup}>
      {partners.map((p) => tile(p, `${dup ? "d" : "p"}-${p.id}`))}
    </div>
  );

  return (
    <>
      <div
        className="group/marquee relative mt-12 -mx-6 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        <div
          className="flex w-max items-center gap-4 sm:gap-6"
          style={{
            animation: `pc-marquee ${speed}s linear infinite`,
            animationPlayState: hovering ? "paused" : "running",
          }}
        >
          {track(false)}
          {track(true)}
        </div>
      </div>

      {/* second row, opposite direction */}
      <div
        className="relative mt-4 -mx-6 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)] sm:mt-6"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        <div
          className="flex w-max items-center gap-4 sm:gap-6"
          style={{
            animation: `pc-marquee ${speed}s linear infinite reverse`,
            animationPlayState: hovering ? "paused" : "running",
          }}
        >
          {track(true)}
          {track(false)}
        </div>
      </div>

      <PartnerModal partner={active} onClose={() => setActive(null)} />
    </>
  );
}

function PartnerModal({ partner, onClose }: { partner: PartnerItem | null; onClose: () => void }) {
  return (
    <AnimatePresence>
      {partner && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center p-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          role="dialog"
          aria-modal="true"
          aria-label={partner.name}
        >
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="absolute inset-0 cursor-default bg-ink/55 backdrop-blur-[3px]"
          />

          <motion.div
            initial={{ opacity: 0, y: 26, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-md overflow-hidden rounded-[calc(var(--pc-radius,18px)+6px)] border border-ink/10 bg-paper p-8 text-center shadow-[0_40px_90px_-40px_rgba(22,20,17,0.7)]"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-ink/10 text-ink/60 transition hover:border-clay hover:text-clay"
            >
              <X size={16} strokeWidth={1.75} />
            </button>

            <div className="flex h-28 items-center justify-center px-4 sm:h-32">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={partner.logo} alt={partner.name} className="max-h-full max-w-full object-contain" />
            </div>

            <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.22em] text-clay">{partner.name}</p>

            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
              {partner.url && (
                <a
                  href={partner.url}
                  target="_blank"
                  rel="me noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-sand transition hover:bg-clay"
                >
                  Visit site <ArrowUpRight size={14} strokeWidth={1.75} />
                </a>
              )}
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-full border border-ink/15 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-ink/70 transition hover:border-clay hover:text-clay"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
