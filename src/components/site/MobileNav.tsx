"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SocialRow, type SocialLinkItem } from "@/components/SocialLinks";
import { ArrowRight, cn } from "@/components/ui";

type Item = { href: string; label: string };

export function MobileNav({ items, socials }: { items: ReadonlyArray<Item>; socials: SocialLinkItem[] }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((v) => !v)}
        className="label-mono flex min-h-[44px] items-center gap-3 py-2 pl-1 text-ink"
      >
        <span>{open ? "Close" : "Menu"}</span>
        <span className="relative block h-2.5 w-5" aria-hidden="true">
          <span
            className={cn(
              "absolute left-0 h-px w-5 bg-current transition-transform duration-300",
              open ? "top-1 rotate-45" : "top-0",
            )}
          />
          <span
            className={cn(
              "absolute left-0 h-px w-5 bg-current transition-transform duration-300",
              open ? "top-1 -rotate-45" : "top-2",
            )}
          />
        </span>
      </button>

      {open && (
        <div
          id="mobile-menu"
          className="grain fixed inset-x-0 bottom-0 top-16 z-40 overflow-y-auto border-t border-ink/10 bg-sand px-5 pb-12 pt-4"
        >
          <nav aria-label="Mobile" className="flex flex-col border-t border-ink/15">
            {items.map((item, i) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-baseline justify-between gap-4 border-b border-ink/15 py-4 font-serif text-[1.75rem] font-light uppercase leading-tight sm:text-4xl"
              >
                <span className="min-w-0">{item.label}</span>
                <span className="label-mono shrink-0 text-clay-deep">{String(i + 1).padStart(2, "0")}</span>
              </Link>
            ))}
          </nav>
          <Link
            href="/#field-notes"
            onClick={() => setOpen(false)}
            className="label-mono mt-8 flex items-center justify-between rounded-full bg-ink px-6 py-4 text-sand shadow-[0_14px_30px_-14px_rgba(22,20,17,0.6)]"
          >
            Subscribe to the dispatch
            <ArrowRight className="h-3 w-8" />
          </Link>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
            <p className="label-mono text-muted">Follow the build</p>
            <SocialRow links={socials} tone="light" />
          </div>
          <p className="label-mono mt-6 border-t border-ink/10 pt-5 text-muted">Remote + on-ground operations · Palawan, Philippines</p>
        </div>
      )}
    </div>
  );
}
