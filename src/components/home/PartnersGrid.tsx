"use client";

import { MotionConfig } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { PartnerCard, type PartnerItem } from "./PartnerCard";

/** Which card is raised, and whether a click/tap pinned it (vs. a passing hover). */
type Active = { id: number; pinned: boolean } | null;

/** Hover-out grace period: sweeping across the wall keeps the spotlight instead of flickering. */
const HOVER_OUT_MS = 140;

/**
 * The partner wall: centered rows of cards that raise on hover / tap.
 *
 * One interaction model on every device:
 *  - mouse / pen: hover raises a card, click pins it open
 *  - touch: tap raises (and pins) a card, tap again closes it
 *  - keyboard: Enter / Space opens, Tab reaches the link, Esc closes
 * Only one card is raised at a time; tapping outside dismisses it.
 *
 * `reducedMotion="user"` makes every transform animation instant for people
 * who ask for less motion (opacity still fades), so nothing here needs its
 * own reduced-motion branch.
 */
export function PartnersGrid({ partners }: { partners: PartnerItem[] }) {
  const [active, setActive] = useState<Active>(null);
  const hoverOut = useRef<number | null>(null);

  const cancelHoverOut = useCallback(() => {
    if (hoverOut.current !== null) {
      window.clearTimeout(hoverOut.current);
      hoverOut.current = null;
    }
  }, []);

  const preview = useCallback(
    (id: number) => {
      cancelHoverOut();
      setActive((a) => (a && a.id === id ? a : { id, pinned: false }));
    },
    [cancelHoverOut],
  );

  const previewEnd = useCallback(
    (id: number) => {
      cancelHoverOut();
      hoverOut.current = window.setTimeout(() => {
        hoverOut.current = null;
        setActive((a) => (a && a.id === id && !a.pinned ? null : a));
      }, HOVER_OUT_MS);
    },
    [cancelHoverOut],
  );

  const toggle = useCallback(
    (id: number) => {
      cancelHoverOut();
      setActive((a) => (a && a.id === id && a.pinned ? null : { id, pinned: true }));
    },
    [cancelHoverOut],
  );

  const close = useCallback(
    (id: number) => {
      cancelHoverOut();
      setActive((a) => (a && a.id === id ? null : a));
    },
    [cancelHoverOut],
  );

  // Tapping / clicking anywhere outside a card, or pressing Escape, puts the card back.
  const isOpen = active !== null;
  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target;
      if (!(target instanceof Element) || !target.closest("[data-partner-card]")) setActive(null);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  useEffect(() => cancelHoverOut, [cancelHoverOut]);

  return (
    <MotionConfig reducedMotion="user">
      <ul role="list" className="pc-wall mt-12">
        {partners.map((p, i) => (
          <PartnerCard
            key={p.id}
            partner={p}
            index={i}
            popped={active?.id === p.id}
            pinned={active?.id === p.id && active.pinned}
            dimmed={active !== null && active.id !== p.id}
            onPreview={() => preview(p.id)}
            onPreviewEnd={() => previewEnd(p.id)}
            onToggle={() => toggle(p.id)}
            onClose={() => close(p.id)}
          />
        ))}
      </ul>
    </MotionConfig>
  );
}
