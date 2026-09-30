import Link from "next/link";
import type { ReactNode } from "react";

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function Container({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <div id={id} className={cn("mx-auto w-full max-w-[1320px] px-5 md:px-8", className)}>
      {children}
    </div>
  );
}

/* ------------------------------- Glyphs -------------------------------- */

export function ArrowRight({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 44 12"
      className={className ?? "h-3 w-10"}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.2}
      aria-hidden="true"
    >
      <path d="M0 6h42M36.5 1 42 6l-5.5 5" />
    </svg>
  );
}

export function Asterisk({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M12 2.5v19M2.5 12h19M5.3 5.3l13.4 13.4M18.7 5.3 5.3 18.7" />
    </svg>
  );
}

export type IconName =
  | "sun"
  | "chat"
  | "agent"
  | "approve"
  | "layers"
  | "whatsapp"
  | "mail"
  | "pin"
  | "signal"
  | "rss";

const iconPaths: Record<IconName, ReactNode> = {
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5V5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" />
    </>
  ),
  chat: (
    <>
      <path d="M4 5.5h16v10H9.5L4 19.5z" />
      <path d="M8 9.5h8M8 12.5h5" />
    </>
  ),
  agent: (
    <>
      <circle cx="12" cy="12.5" r="3" />
      <circle cx="12" cy="4.5" r="1.5" />
      <circle cx="19" cy="17" r="1.5" />
      <circle cx="5" cy="17" r="1.5" />
      <path d="M12 6v3.5M17.7 16.2l-3.1-1.9M6.3 16.2l3.1-1.9" />
    </>
  ),
  approve: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="m8 12.5 2.7 2.7L16 9.5" />
    </>
  ),
  layers: (
    <>
      <path d="m12 3.5 8.5 4.5-8.5 4.5L3.5 8z" />
      <path d="m3.5 12 8.5 4.5 8.5-4.5" />
      <path d="m3.5 16 8.5 4.5 8.5-4.5" />
    </>
  ),
  whatsapp: (
    <>
      <path d="M4.5 19.5 5.8 16A7.5 7.5 0 1 1 8.5 18.4z" />
      <path d="M9.3 8.6c.2 2.9 2.6 5.4 5.6 5.8l.9-1.3-1.7-.9-.8.8a4.4 4.4 0 0 1-2.4-2.4l.8-.8-.9-1.7z" />
    </>
  ),
  mail: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="1.5" />
      <path d="m4 6.5 8 6 8-6" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s-6.5-6.2-6.5-11.2a6.5 6.5 0 0 1 13 0C18.5 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.8" r="2.3" />
    </>
  ),
  signal: (
    <>
      <circle cx="12" cy="12" r="1.6" />
      <path d="M8.5 8.5a5 5 0 0 0 0 7M15.5 8.5a5 5 0 0 1 0 7M5.6 5.6a9 9 0 0 0 0 12.8M18.4 5.6a9 9 0 0 1 0 12.8" />
    </>
  ),
  rss: (
    <>
      <path d="M5 11a8 8 0 0 1 8 8M5 5a14 14 0 0 1 14 14" />
      <circle cx="6" cy="18" r="1.3" />
    </>
  ),
};

export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? "h-5 w-5"}
      aria-hidden="true"
    >
      {iconPaths[name]}
    </svg>
  );
}

/* ------------------------------- Buttons ------------------------------- */

type ButtonVariant = "solid" | "outline" | "light" | "clay";

const buttonStyles: Record<ButtonVariant, string> = {
  solid: "bg-ink text-sand hover:bg-clay-deep",
  outline: "border border-ink/70 text-ink hover:bg-ink hover:text-sand",
  light: "bg-sand text-ink hover:bg-clay hover:text-sand",
  clay: "bg-clay text-sand hover:bg-clay-deep",
};

export function ButtonLink({
  href,
  children,
  variant = "solid",
  className,
  arrow = true,
}: {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
  arrow?: boolean;
}) {
  const classes = cn(
    "group inline-flex items-center justify-center gap-3 rounded-full px-6 py-3.5 label-mono transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0",
    buttonStyles[variant],
    className,
  );
  const content = (
    <>
      <span>{children}</span>
      {arrow && <ArrowRight className="h-3 w-7 transition-transform duration-300 group-hover:translate-x-1" />}
    </>
  );
  if (/^(https?:|mailto:|tel:)/.test(href)) {
    return (
      <a href={href} className={classes} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
        {content}
      </a>
    );
  }
  return (
    <Link href={href} className={classes}>
      {content}
    </Link>
  );
}

/* --------------------------- Section headings -------------------------- */

export function SectionHeading({
  index,
  first,
  second,
  description,
  href,
  linkLabel,
  tone = "light",
}: {
  index: string;
  first: string;
  second: string;
  description?: string;
  href?: string;
  linkLabel?: string;
  tone?: "light" | "dark";
}) {
  const dark = tone === "dark";
  return (
    <div className={cn("border-t pt-7", dark ? "border-sand/20" : "border-ink/20")}>
      <div className="grid items-end gap-6 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-6">
          <p className={cn("label-mono", dark ? "text-clay-light" : "text-clay-deep")}>§ {index}</p>
          {/* Sized so the longest second line ("Environments" ≈ 7.95em) always fits its column */}
          <h2 className="mt-3 font-serif text-[clamp(2.4rem,5.4vw,3.7rem)] font-light uppercase leading-[0.9] tracking-[-0.01em]">
            <span className="block">{first}</span>
            <span className={cn("block", dark ? "text-clay-light" : "text-clay")}>{second}</span>
          </h2>
        </div>
        {(description || (href && linkLabel)) && (
          <div className="flex flex-col gap-5 lg:col-span-6 xl:flex-row xl:items-end xl:justify-between xl:gap-10">
            {description && (
              <p className={cn("max-w-md text-[15px] leading-relaxed", dark ? "text-sand/70" : "text-ink-2")}>
                {description}
              </p>
            )}
            {href && linkLabel && (
              <Link
                href={href}
                className={cn(
                  "label-mono group inline-flex shrink-0 items-center gap-3 whitespace-nowrap transition-colors",
                  dark ? "hover:text-clay-light" : "hover:text-clay-deep",
                )}
              >
                {linkLabel}
                <ArrowRight className="h-3 w-10 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------ Status chip ---------------------------- */

const statusTone: Record<string, string> = {
  operational: "bg-moss",
  online: "bg-moss",
  "in build": "bg-clay",
  expanding: "bg-ochre",
  pilot: "bg-ink-2",
  weekly: "bg-clay",
};

export function StatusDot({ status, className }: { status: string; className?: string }) {
  const tone = statusTone[status.toLowerCase()] ?? "bg-ink-2";
  return <span className={cn("inline-block h-1.5 w-1.5 shrink-0 rounded-full pulse-dot", tone, className)} />;
}

export function StatusChip({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 bg-sand/95 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-ink",
        className,
      )}
    >
      <StatusDot status={status} />
      {status}
    </span>
  );
}
