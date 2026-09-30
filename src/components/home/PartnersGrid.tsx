"use client";

import { motion, useReducedMotion } from "framer-motion";

type PartnerItem = { id: number; name: string; logo: string; url: string };

/**
 * Uniform partner logo wall: site-matched beige cards + the site's corner
 * radius, logos in their own colors on a transparent background,
 * staggered entrance motion and a hover lift.
 */
export function PartnersGrid({ partners }: { partners: PartnerItem[] }) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {partners.map((p, i) => {
        const inner = (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.logo}
              alt={p.name}
              loading="lazy"
              className="h-full w-full object-contain transition-transform duration-500 ease-out group-hover:scale-[1.05]"
            />
            {p.url && (
              <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-ink px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-sand opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                Visit ↗
              </span>
            )}
          </>
        );

        const card = (
          <div className="group relative flex aspect-[16/10] items-center justify-center overflow-hidden rounded-[var(--pc-radius,18px)] border border-ink/10 bg-paper p-6 shadow-[0_16px_36px_-24px_rgba(22,20,17,0.4)] transition-[border-color,box-shadow] duration-300 group-hover:border-clay/40 group-hover:shadow-[0_24px_48px_-22px_rgba(161,74,41,0.45)]">
            {inner}
          </div>
        );

        const motionProps = reduceMotion
          ? {}
          : {
              initial: { opacity: 0, y: 28 },
              whileInView: { opacity: 1, y: 0 },
              viewport: { once: true, margin: "-40px" },
              transition: { duration: 0.55, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] as const },
              whileHover: { y: -6 },
            };

        return (
          <motion.div key={p.id} {...motionProps} className="h-full">
            {p.url ? (
              <a
                href={p.url}
                target="_blank"
                rel="me noreferrer"
                aria-label={`${p.name} — visit website`}
                className="block h-full"
              >
                {card}
              </a>
            ) : (
              <div aria-label={p.name}>{card}</div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
