"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import type { DesignTokens } from "@/db/schema";
import { applyDesign } from "@/lib/design";

/** Applies live design tokens + reports lightweight pageviews. */
export function Runtime({ initialDesign }: { initialDesign: DesignTokens }) {
  const pathname = usePathname();

  useEffect(() => {
    applyDesign(initialDesign);
    // Re-pull in case ops saved newer tokens after SSR.
    fetch("/api/public/site", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { design?: DesignTokens }) => {
        if (d.design) applyDesign(d.design);
      })
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (pathname?.startsWith("/admin")) return;
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "pageview", path: pathname || "/" }),
    }).catch(() => undefined);
  }, [pathname]);

  return null;
}

export function trackEvent(type: "chat" | "subscribe" | "inquiry" | "cta", path: string, meta?: Record<string, unknown>) {
  fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, path, meta: meta ?? {} }),
  }).catch(() => undefined);
}
