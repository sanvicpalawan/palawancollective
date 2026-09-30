import { Globe, Link as LinkIcon, MessageCircle, Send } from "lucide-react";
import { cn } from "@/components/ui";

export type SocialLinkItem = { platform: string; label: string; url: string };

/* ------------------------------------------------------------------ */
/* Brand glyphs in the Lucide 24px stroke language (lucide-react no      */
/* longer ships brand icons, so these match its stroke/round-cap style). */
/* ------------------------------------------------------------------ */

function StrokeIcon({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function GithubIcon({ className }: { className?: string }) {
  return (
    <StrokeIcon className={className}>
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </StrokeIcon>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <StrokeIcon className={className}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </StrokeIcon>
  );
}

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <StrokeIcon className={className}>
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <path d="m10 15 5-3-5-3z" />
    </StrokeIcon>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <StrokeIcon className={className}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </StrokeIcon>
  );
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <StrokeIcon className={className}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </StrokeIcon>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.451-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644Z" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07Z" />
    </svg>
  );
}

export function SocialIcon({ platform, className }: { platform: string; className?: string }) {
  const cls = className ?? "h-[16px] w-[16px]";
  switch (platform.toLowerCase()) {
    case "github":
      return <GithubIcon className={cls} />;
    case "x":
    case "twitter":
      return <XIcon className={cls} />;
    case "instagram":
      return <InstagramIcon className={cls} />;
    case "youtube":
      return <YoutubeIcon className={cls} />;
    case "facebook":
      return <FacebookIcon className={cls} />;
    case "linkedin":
      return <LinkedinIcon className={cls} />;
    case "tiktok":
      return <TikTokIcon className={cls} />;
    case "telegram":
      return <Send className={cls} strokeWidth={1.8} />;
    case "whatsapp":
      return <MessageCircle className={cls} strokeWidth={1.8} />;
    case "website":
    case "url":
    case "site":
      return <Globe className={cls} strokeWidth={1.8} />;
    default:
      return <LinkIcon className={cls} strokeWidth={1.8} />;
  }
}

/** Resolve @handles to full profile URLs. */
export function resolveSocialHref(platform: string, url: string): string {
  const value = url.trim();
  if (!value) return "";
  if (!value.startsWith("@")) return value;
  const handle = value.slice(1).replace(/^@/, "");
  switch (platform.toLowerCase()) {
    case "x":
    case "twitter":
      return `https://x.com/${handle}`;
    case "instagram":
      return `https://www.instagram.com/${handle}`;
    case "tiktok":
      return `https://www.tiktok.com/@${handle}`;
    case "facebook":
      return `https://www.facebook.com/${handle}`;
    case "youtube":
      return `https://www.youtube.com/@${handle}`;
    case "telegram":
      return `https://t.me/${handle}`;
    case "github":
      return `https://github.com/${handle}`;
    case "linkedin":
      return `https://www.linkedin.com/in/${handle}`;
    default:
      return value;
  }
}

/**
 * Uniform social icon row — same component in header, mobile menu and footer.
 * `tone="light"` for sand backgrounds (header), `tone="dark"` for ink (footer).
 */
export function SocialRow({
  links,
  tone = "light",
  className,
  label = "Follow Palawan Collective",
}: {
  links: SocialLinkItem[];
  tone?: "light" | "dark";
  className?: string;
  label?: string;
}) {
  const visible = links.filter((l) => l.url.trim());
  if (visible.length === 0) return null;
  const dark = tone === "dark";
  return (
    <ul aria-label={label} className={cn("flex flex-wrap items-center gap-2", className)}>
      {visible.map((link) => (
        <li key={link.platform}>
          <a
            href={resolveSocialHref(link.platform, link.url)}
            target="_blank"
            rel="me noreferrer"
            aria-label={`${link.label} (opens in new tab)`}
            title={link.label}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full border transition-colors duration-300",
              dark
                ? "border-sand/25 text-sand/70 hover:border-sand/70 hover:bg-sand hover:text-ink"
                : "border-ink/20 text-ink-2 hover:border-ink hover:bg-ink hover:text-sand",
            )}
          >
            <SocialIcon platform={link.platform} />
          </a>
        </li>
      ))}
    </ul>
  );
}
