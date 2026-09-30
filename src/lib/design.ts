import type { DesignTokens } from "@/db/schema";

/** Client-safe: no database imports in this module. */
export const DEFAULT_DESIGN: DesignTokens = {
  colors: {
    primary: "#161411",
    secondary: "#3a352f",
    accent: "#c2603b",
    background: "#f2ece3",
    text: "#161411",
    sand: "#f2ece3",
    paper: "#f8f4ed",
    ink: "#161411",
    clay: "#c2603b",
    clayDeep: "#a14a29",
    clayLight: "#e48a62",
    moss: "#5f7a4c",
  },
  fonts: { display: "Anton", serif: "Newsreader", sans: "Inter", mono: "JetBrains Mono", hand: "Caveat" },
  fontScale: 1,
  spacingScale: 1,
  radius: 18,
  shadow: "soft",
};

/** Curated Google Fonts choices per slot (all support latin). */
export const FONT_CHOICES: Record<keyof DesignTokens["fonts"], string[]> = {
  display: ["Anton", "Archivo Black", "Bebas Neue", "Oswald", "Space Grotesk", "Bricolage Grotesque"],
  serif: ["Newsreader", "Playfair Display", "Lora", "Fraunces", "Source Serif 4"],
  sans: ["Inter", "DM Sans", "Work Sans", "Public Sans", "Archivo"],
  mono: ["JetBrains Mono", "IBM Plex Mono", "Space Mono", "Roboto Mono"],
  hand: ["Caveat", "Shadows Into Light", "Kalam", "Permanent Marker"],
};

export const SHADOW_PRESETS: Record<DesignTokens["shadow"], string> = {
  none: "none",
  soft: "0 18px 40px -22px rgba(22,20,17,.35)",
  lifted: "0 28px 60px -24px rgba(22,20,17,.45)",
  brutal: "6px 6px 0 0 rgba(22,20,17,.9)",
};

function cleanFamily(name: string): string | null {
  const v = name.trim().replace(/[^A-Za-z0-9 ]/g, "");
  return v.length >= 2 && v.length <= 40 ? v : null;
}

export function googleFontsHref(fonts: DesignTokens["fonts"]): string | null {
  const fams = new Map<string, string>();
  const pairs: Array<[string, string]> = [
    [fonts.display, "400"],
    [fonts.serif, "ital,opsz,wght@0,6..72,300..700;1,6..72,300..700"],
    [fonts.sans, "wght@400;500;600"],
    [fonts.mono, "wght@400;500"],
    [fonts.hand, "wght@400;700"],
  ];
  for (const [name, axis] of pairs) {
    const clean = cleanFamily(name);
    if (clean && !fams.has(clean)) fams.set(clean, axis);
  }
  if (fams.size === 0) return null;
  const q = [...fams.entries()].map(([n, a]) => `family=${n.replace(/ /g, "+")}:${a}`).join("&");
  return `https://fonts.googleapis.com/css2?${q}&display=swap`;
}

/** Runtime CSS variables derived from tokens (mirrors globals.css theme). */
export function designCssVars(tokens: DesignTokens): Record<string, string> {
  const c = tokens.colors;
  return {
    "--color-sand": c.sand,
    "--color-paper": c.paper,
    "--color-ink": c.ink,
    "--color-ink-2": c.secondary,
    "--color-clay": c.clay,
    "--color-clay-deep": c.clayDeep,
    "--color-clay-light": c.clayLight,
    "--color-moss": c.moss,
    "--font-display": `"${tokens.fonts.display}", "Arial Narrow", Impact, sans-serif`,
    "--font-serif": `"${tokens.fonts.serif}", Georgia, serif`,
    "--font-sans": `"${tokens.fonts.sans}", ui-sans-serif, system-ui, sans-serif`,
    "--font-mono": `"${tokens.fonts.mono}", ui-monospace, monospace`,
    "--font-hand": `"${tokens.fonts.hand}", cursive`,
    "--spacing": `calc(0.25rem * ${tokens.spacingScale})`,
    "--pc-radius": `${tokens.radius}px`,
    "--pc-shadow": SHADOW_PRESETS[tokens.shadow],
  };
}

export function applyDesign(tokens: DesignTokens): void {
  const root = document.documentElement;
  for (const [k, v] of Object.entries(designCssVars(tokens))) root.style.setProperty(k, v);
  root.style.fontSize = `${16 * tokens.fontScale}px`;
  const href = googleFontsHref(tokens.fonts);
  if (href) {
    let link = document.getElementById("pc-fonts") as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = "pc-fonts";
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    if (link.href !== href) link.href = href;
  }
}
