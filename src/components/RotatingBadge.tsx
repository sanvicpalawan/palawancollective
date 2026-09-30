import type { ReactNode } from "react";
import { cn } from "@/components/ui";

/** Circular rotating text badge (SVG textPath). `id` must be unique per page. */
export function RotatingBadge({
  id,
  text,
  className,
  children,
}: {
  id: string;
  text: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={cn("relative aspect-square rounded-full", className)}>
      <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full animate-spin-slow" aria-hidden="true">
        <defs>
          <path id={id} d="M 100,100 m -76,0 a 76,76 0 1,1 152,0 a 76,76 0 1,1 -152,0" />
        </defs>
        <text fill="currentColor" fontSize="15" style={{ fontFamily: "var(--font-jetbrains), monospace" }}>
          <textPath href={`#${id}`} textLength="468" lengthAdjust="spacing">
            {text}
          </textPath>
        </text>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-center">{children}</div>
    </div>
  );
}
