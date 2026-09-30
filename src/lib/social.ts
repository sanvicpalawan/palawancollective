import type { SocialLink } from "@/db/schema";

/**
 * Social platform catalog. Safe to import from client components.
 * Defaults: GitHub, X, Instagram, YouTube, Website.
 * Admin can enable the extended set (TikTok, Facebook, LinkedIn, …).
 */

export type SocialPlatform = {
  platform: string;
  label: string;
  placeholder: string;
  hint: string;
};

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  { platform: "github", label: "GitHub", placeholder: "https://github.com/…", hint: "Code + builds" },
  { platform: "x", label: "X", placeholder: "https://x.com/…", hint: "Short updates" },
  { platform: "instagram", label: "Instagram", placeholder: "https://www.instagram.com/…", hint: "Field photos" },
  { platform: "youtube", label: "YouTube", placeholder: "https://www.youtube.com/@…", hint: "Video dispatches" },
  { platform: "website", label: "Website", placeholder: "https://…", hint: "Your home URL" },
  { platform: "tiktok", label: "TikTok", placeholder: "https://www.tiktok.com/@…", hint: "Short video" },
  { platform: "facebook", label: "Facebook", placeholder: "https://www.facebook.com/…", hint: "Community" },
  { platform: "linkedin", label: "LinkedIn", placeholder: "https://www.linkedin.com/in/…", hint: "Professional" },
  { platform: "telegram", label: "Telegram", placeholder: "https://t.me/…", hint: "Channel / chat" },
  { platform: "whatsapp", label: "WhatsApp", placeholder: "https://wa.me/63…", hint: "Direct chat" },
];

export const DEFAULT_SOCIAL_URLS: Record<string, string> = {
  github: "https://github.com/sanvicpalawan",
  x: "https://x.com/merqatodigital",
  instagram: "https://www.instagram.com/yesitsreallymedavid",
  youtube: "",
  website: "https://palawancollective.com",
  tiktok: "",
  facebook: "",
  linkedin: "",
  telegram: "",
  whatsapp: "",
};

/** Fallback links when the database is unreachable — the owner's real profiles. */
export const FALLBACK_SOCIALS: Pick<SocialLink, "platform" | "label" | "url">[] = [
  { platform: "github", label: "GitHub", url: DEFAULT_SOCIAL_URLS.github },
  { platform: "x", label: "X", url: DEFAULT_SOCIAL_URLS.x },
  { platform: "instagram", label: "Instagram", url: DEFAULT_SOCIAL_URLS.instagram },
  { platform: "youtube", label: "YouTube", url: DEFAULT_SOCIAL_URLS.youtube },
  { platform: "website", label: "Website", url: DEFAULT_SOCIAL_URLS.website },
];

export function platformLabel(platform: string): string {
  return SOCIAL_PLATFORMS.find((p) => p.platform === platform)?.label ?? platform;
}

export function normalizeSocialUrl(raw: string): string {
  const value = raw.trim().slice(0, 500);
  if (!value) return "";
  // Allow @handles for X / Instagram / TikTok.
  if (value.startsWith("@") && !value.includes(" ")) return value;
  if (/^(https?:\/\/|mailto:)/i.test(value)) return value;
  // Bare domains become https links.
  if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(value)) return `https://${value}`;
  return value;
}
