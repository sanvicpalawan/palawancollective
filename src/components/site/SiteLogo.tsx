import { cn } from "@/components/ui";

/**
 * Brand mark uploaded in Admin → Logo.
 * Plain <img> (not next/image) so SVG + the /uploads route work with no config.
 * Width comes from admin settings; height always scales proportionally.
 */
export function SiteLogo({
  url,
  width,
  alt = "Palawan Collective",
  className,
}: {
  url: string;
  width: number;
  alt?: string;
  className?: string;
}) {
  if (!url.trim()) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      width={width}
      height={Math.max(1, Math.round(width / 4))}
      style={{ width, height: "auto" }}
      className={cn("h-auto max-w-full shrink-0 object-contain", className)}
    />
  );
}
