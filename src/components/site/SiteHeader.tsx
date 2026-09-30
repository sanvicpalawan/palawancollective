import Link from "next/link";
import { StealthLogin } from "@/components/ops/StealthLogin";
import { SocialRow, type SocialLinkItem } from "@/components/SocialLinks";
import { ArrowRight, Asterisk } from "@/components/ui";
import { getNav, getSettingsMap, getSocialLinks, setting } from "@/lib/control";
import { FALLBACK_SOCIALS } from "@/lib/social";
import { navItems as fallbackNav } from "@/lib/site";
import { MobileNav } from "./MobileNav";
import { SiteLogo } from "./SiteLogo";

export async function SiteHeader() {
  let items: ReadonlyArray<{ href: string; label: string }> = fallbackNav;
  let socials: SocialLinkItem[] = FALLBACK_SOCIALS;
  let logo = "";
  let logoW = 148;
  let logoWMobile = 116;
  try {
    const [navRows, socialRows, settings] = await Promise.all([
      getNav(),
      getSocialLinks(true).catch(() => []),
      getSettingsMap().catch(() => null),
    ]);
    const headerRows = navRows.filter((n) => n.location === "header" && n.visible);
    if (headerRows.length > 0) items = headerRows.map((r) => ({ href: r.href, label: r.label }));
    if (socialRows.length > 0) {
      socials = socialRows.map((r) => ({ platform: r.platform, label: r.label, url: r.url }));
    }
    if (settings) {
      logo = setting<string>(settings, "site_logo", "");
      logoW = setting<number>(settings, "site_logo_width", 148);
      logoWMobile = setting<number>(settings, "site_logo_width_mobile", 116);
    }
  } catch {
    /* static fallbacks keep the header alive */
  }

  return (
    <header className="grain sticky top-0 z-50 border-b border-ink/10 bg-sand">
      <div className="mx-auto flex h-16 w-full max-w-[1320px] items-center justify-between gap-4 px-5 md:gap-6 md:px-8">
        <Link
          href="/"
          data-ops-trigger
          className="group flex min-w-0 select-none items-center gap-3"
          aria-label="Palawan Collective — home"
        >
          {logo ? (
            <>
              <span className="md:hidden">
                <SiteLogo url={logo} width={logoWMobile} className="max-h-8" />
              </span>
              <span className="hidden md:block">
                <SiteLogo url={logo} width={logoW} className="max-h-9" />
              </span>
              <span className="label-mono hidden whitespace-nowrap text-ink min-[420px]:inline">
                Palawan Collective
              </span>
            </>
          ) : (
            <>
              <Asterisk className="h-[18px] w-[18px] shrink-0 text-clay transition-transform duration-700 group-hover:rotate-90" />
              <span className="label-mono whitespace-nowrap text-ink">Palawan Collective</span>
            </>
          )}
          <span className="label-mono hidden whitespace-nowrap text-muted xl:inline">/ Field notes</span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-7 lg:flex xl:gap-8">
          {items.map((item) => (
            <Link key={item.href} href={item.href} className="label-mono link-underline whitespace-nowrap text-ink-2 hover:text-ink">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-4 md:gap-5">
          <SocialRow links={socials} tone="light" label="Follow Palawan Collective" className="hidden lg:flex" />
          <Link
            href="/#field-notes"
            className="label-mono group hidden items-center gap-3 whitespace-nowrap text-ink hover:text-clay-deep md:flex"
          >
            <span className="lg:hidden">Subscribe</span>
            <span className="hidden lg:inline">Subscribe to the dispatch</span>
            <ArrowRight className="h-3 w-9 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          <MobileNav items={items} socials={socials} />
        </div>
      </div>
      <StealthLogin />
    </header>
  );
}
