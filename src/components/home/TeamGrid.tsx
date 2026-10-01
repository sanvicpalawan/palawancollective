"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { ArrowRight, Icon } from "@/components/ui";

/** One Dream Team card, in the shape the home page renders. */
export type TeamCard = {
  id: number;
  name: string;
  role: string;
  location: string;
  photo: string;
  photoAlt: string;
  bio: string;
  url: string;
};

/**
 * Portrait cards for the people behind the ecosystem, in the same visual
 * language as the partners wall: paper cards, `doc-photo` film on the images,
 * mono micro-labels, clay on hover, and a modal for the full profile.
 *
 * A missing or unreadable photo degrades to an initials monogram so the roster
 * never shows broken-image icons.
 */
export function TeamGrid({ members }: { members: TeamCard[] }) {
  const [active, setActive] = useState<TeamCard | null>(null);

  return (
    <>
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((m, i) => (
          <TeamCardButton key={m.id} member={m} index={i} onOpen={() => setActive(m)} />
        ))}
      </div>
      <TeamModal member={active} onClose={() => setActive(null)} />
    </>
  );
}

/* --------------------------------- card ---------------------------------- */

function TeamCardButton({ member, index, onOpen }: { member: TeamCard; index: number; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${member.name} — open profile`}
      className="group relative flex flex-col overflow-hidden rounded-[var(--pc-radius,18px)] border border-ink/10 bg-paper text-left shadow-[0_16px_36px_-24px_rgba(22,20,17,0.4)] transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-1.5 hover:border-clay/40 hover:shadow-[0_24px_48px_-22px_rgba(161,74,41,0.45)] focus-visible:border-clay focus-visible:outline-none"
    >
      <TeamPhoto member={member} className="aspect-[4/5] w-full" index={index} />

      <div className="flex flex-1 flex-col p-5 md:p-6">
        {member.role && <p className="label-mono text-clay-deep">{member.role}</p>}
        <h3 className="mt-2 font-serif text-[1.45rem] leading-[1.08] text-ink transition-colors duration-300 group-hover:text-clay-deep">
          {member.name}
        </h3>
        {member.location && (
          <p className="label-mono mt-2.5 flex items-center gap-1.5 text-muted">
            <Icon name="pin" className="h-3.5 w-3.5" />
            {member.location}
          </p>
        )}
        {member.bio && <p className="mt-3 line-clamp-3 text-[14.5px] leading-relaxed text-ink-2">{member.bio}</p>}
        <span className="label-mono mt-auto inline-flex items-center gap-2 pt-4 text-ink/70 transition-colors group-hover:text-clay-deep">
          Full profile
          <ArrowRight className="h-3 w-7 transition-transform duration-300 group-hover:translate-x-1" />
        </span>
      </div>
    </button>
  );
}

/* --------------------------------- photo --------------------------------- */

function TeamPhoto({ member, className, index }: { member: TeamCard; className?: string; index?: number }) {
  // Remember *which* src failed, so a new photo resets this on its own — no effect.
  const [failedFor, setFailedFor] = useState<string | null>(null);
  const failed = failedFor === member.photo;

  return (
    <div className={`relative overflow-hidden bg-ink/10 ${className ?? ""}`}>
      {member.photo && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={member.photo}
          alt={member.photoAlt || `Portrait of ${member.name}`}
          loading="lazy"
          onError={() => setFailedFor(member.photo)}
          className="doc-photo h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
        />
      ) : (
        <span
          aria-hidden="true"
          className="flex h-full w-full items-center justify-center bg-sand-2 font-serif text-[clamp(2.6rem,7vw,4.2rem)] font-light text-ink/25"
        >
          {initials(member.name)}
        </span>
      )}
      {/* Numbered plate, top-left, in the same idiom as the hero carousel tags. */}
      {typeof index === "number" && (
        <span className="absolute left-3 top-3 rounded-full bg-ink/45 px-2.5 py-1 font-mono text-[10px] tracking-[0.16em] text-sand backdrop-blur-md">
          {String(index + 1).padStart(2, "0")}
        </span>
      )}
      <span className="pointer-events-none absolute inset-0 bg-linear-to-t from-ink/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    </div>
  );
}

function initials(name: string): string {
  return name
    .split(/[\s&]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/* --------------------------------- modal --------------------------------- */

function TeamModal({ member, onClose }: { member: TeamCard | null; onClose: () => void }) {
  useEffect(() => {
    if (!member) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [member, onClose]);

  return (
    <AnimatePresence>
      {member && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center p-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          role="dialog"
          aria-modal="true"
          aria-label={member.name}
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
            className="group relative grid w-full max-w-3xl overflow-hidden rounded-[calc(var(--pc-radius,18px)+6px)] border border-ink/10 bg-paper shadow-[0_40px_90px_-40px_rgba(22,20,17,0.7)] md:grid-cols-[minmax(0,10rem)_1fr]"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-ink/10 bg-paper/80 text-ink/60 transition hover:border-clay hover:text-clay"
            >
              <X size={16} strokeWidth={1.75} />
            </button>

            <TeamPhoto member={member} className="h-full min-h-40 md:min-h-full" />

            <div className="p-7 md:p-8">
              {member.role && <p className="label-mono text-clay-deep">{member.role}</p>}
              <h3 className="mt-2 font-serif text-[2rem] leading-[1.02] text-ink md:text-[2.4rem]">{member.name}</h3>
              {member.location && (
                <p className="label-mono mt-3 flex items-center gap-1.5 text-muted">
                  <Icon name="pin" className="h-3.5 w-3.5" />
                  {member.location}
                </p>
              )}
              {member.bio &&
                member.bio.split(/\n\n+/).map((para, i) => (
                  <p key={i} className="mt-4 text-[15px] leading-relaxed text-ink-2">
                    {para}
                  </p>
                ))}

              <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
                {member.url && (
                  <a
                    href={member.url}
                    target={member.url.startsWith("http") ? "_blank" : undefined}
                    rel="me noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-sand transition hover:bg-clay"
                  >
                    Visit site <ArrowRight className="h-3 w-6" />
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
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
