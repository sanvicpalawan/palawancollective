import type { Metadata, Viewport } from "next";
import type { CSSProperties, ReactNode } from "react";
import { Anton, Caveat, Inter, JetBrains_Mono, Newsreader } from "next/font/google";
import { AgentChat } from "@/components/ops/AgentChat";
import { Runtime } from "@/components/ops/Runtime";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { getDesign, getSettingsMap, setting } from "@/lib/control";
import { DEFAULT_DESIGN, designCssVars } from "@/lib/design";
import { site } from "@/lib/site";
import "./globals.css";

const anton = Anton({ subsets: ["latin"], weight: "400", variable: "--font-anton", display: "swap" });
const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--font-newsreader",
  display: "swap",
});
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap" });
const caveat = Caveat({ subsets: ["latin"], variable: "--font-caveat", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  let ogImage = "/images/hero-build.jpg";
  let description = site.positioning;
  try {
    const map = await getSettingsMap();
    ogImage = setting<string>(map, "og_image", ogImage);
    description = setting<string>(map, "positioning", description);
  } catch {
    /* defaults keep the share card working */
  }
  return {
    metadataBase: new URL(site.url),
    title: {
      default: "Palawan Collective — Field notes from building in Palawan",
      template: "%s — Palawan Collective",
    },
    description,
    applicationName: site.name,
    authors: [{ name: site.person }],
    keywords: [
      "Palawan",
      "off-grid resort",
      "El Nido",
      "automation",
      "AI agents",
      "Philippines infrastructure",
      "field notes",
    ],
    openGraph: {
      type: "website",
      siteName: site.name,
      title: "Palawan Collective",
      description,
      images: [{ url: ogImage, width: 1800, height: 1352, alt: "Palawan Collective" }],
    },
    twitter: { card: "summary_large_image", title: "Palawan Collective", description },
    alternates: { types: { "application/rss+xml": [{ url: "/feed.xml", title: "Palawan Collective — Field Notes" }] } },
  };
}

export const viewport: Viewport = {
  themeColor: "#f2ece3",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  let design = DEFAULT_DESIGN;
  try {
    design = await getDesign();
  } catch {
    /* theme defaults keep the site alive */
  }
  const vars = { ...designCssVars(design), fontSize: `${16 * design.fontScale}px` } as CSSProperties;

  return (
    <html
      lang="en"
      style={vars}
      className={`${anton.variable} ${newsreader.variable} ${inter.variable} ${jetbrains.variable} ${caveat.variable}`}
    >
      <body className="min-h-screen font-sans text-ink antialiased">
        <a
          href="#main"
          className="label-mono sr-only z-[200] bg-ink px-4 py-3 text-sand focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
        <Runtime initialDesign={design} />
        <AgentChat />
      </body>
    </html>
  );
}
