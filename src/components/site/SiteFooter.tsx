import Link from "next/link";
import QRCode from "qrcode";
import { FooterAdminButton } from "@/components/ops/FooterAdminButton";
import { SocialRow, type SocialLinkItem } from "@/components/SocialLinks";
import { SubscribeForm } from "@/components/SubscribeForm";
import { Asterisk, Container, Icon, StatusDot } from "@/components/ui";
import type { IconName } from "@/components/ui";
import { getSettingsMap, getSocialLinks, setting } from "@/lib/control";
import { networkNodes, site, whatsappDisplay, whatsappLink } from "@/lib/site";
import { FALLBACK_SOCIALS } from "@/lib/social";
import { SiteLogo } from "./SiteLogo";

async function qrSvg(url: string): Promise<string | null> {
  try {
    return await QRCode.toString(url, {
      type: "svg",
      margin: 0,
      errorCorrectionLevel: "M",
      color: { dark: "#f2ece3", light: "#00000000" },
    });
  } catch {
    return null;
  }
}

function ContactRow({ icon, label, value, href }: { icon: IconName; label: string; value: string; href?: string }) {
  const body = (
    <>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-clay text-sand md:h-9 md:w-9">
        <Icon name={icon} className="h-4 w-4 md:h-[18px] md:w-[18px]" />
      </span>
      <span className="min-w-0">
        <span className="label-mono block text-sand/50">{label}</span>
        <span className="mt-0.5 block break-words text-[14px] text-sand md:text-[15px]">{value}</span>
      </span>
    </>
  );
  return (
    <li>
      {href ? (
        <a
          href={href}
          target={href.startsWith("http") ? "_blank" : undefined}
          rel="noreferrer"
          className="flex items-center gap-3 transition-opacity hover:opacity-80 md:gap-4"
        >
          {body}
        </a>
      ) : (
        <div className="flex items-center gap-3 md:gap-4">{body}</div>
      )}
    </li>
  );
}

const indexLinks = [
  { href: "/", label: "Home" },
  { href: "/stories", label: "Stories" },
  { href: "/built", label: "Built environments" },
  { href: "/#systems", label: "Systems we build" },
  { href: "/palawan", label: "Navigating Palawan" },
  { href: "/work-with-us", label: "Work with us" },
];

export async function SiteFooter() {
  const wa = whatsappLink("Hi David — found you through Palawan Collective.");
  const qr = await qrSvg(wa);
  const year = new Date().getFullYear();
  let footerNote = "Written on solar power, between squalls.";
  let socials: SocialLinkItem[] = FALLBACK_SOCIALS;
  let logo = "";
  let logoFooterW = 168;
  try {
    const [settings, rows] = await Promise.all([getSettingsMap(), getSocialLinks(true).catch(() => [])]);
    footerNote = setting<string>(settings, "footer_note", footerNote);
    logo = setting<string>(settings, "site_logo", "");
    logoFooterW = setting<number>(settings, "site_logo_footer_width", 168);
    if (rows.length > 0) socials = rows.map((r) => ({ platform: r.platform, label: r.label, url: r.url }));
  } catch {
    /* defaults keep the footer alive */
  }

  return (
    <footer className="mt-20 bg-ink text-sand md:mt-28">
      <Container className="pb-8 pt-12 md:pb-10 md:pt-20">
        {/* Brand + contact row */}
        <div className="grid gap-8 md:grid-cols-2 md:gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="md:col-span-2 lg:col-span-5">
            {logo && (
              <div className="mb-6">
                <SiteLogo url={logo} width={logoFooterW} className="max-h-20" />
              </div>
            )}
            <p className="label-mono flex items-center gap-3 text-clay-light">
              <Asterisk className="h-4 w-4" /> The network
            </p>
            <h2 className="mt-4 font-serif text-[2.1rem] font-light uppercase leading-[0.95] sm:text-[2.8rem] md:mt-5 md:text-[3.9rem] md:leading-[0.9]">
              On the ground
              <span className="block text-clay-light">in Palawan</span>
            </h2>
            <p className="mt-5 max-w-md text-[14px] leading-relaxed text-sand/70 md:mt-6 md:text-[15px]">{site.positioning}</p>
            <div className="mt-6 md:mt-8">
              <p className="label-mono text-sand/45">Follow the build</p>
              <SocialRow links={socials} tone="dark" className="mt-4" />
            </div>
          </div>

          <div className="rounded-2xl border border-sand/15 bg-white/[0.03] p-5 sm:p-6 lg:col-span-3 lg:rounded-none lg:border-0 lg:border-l lg:bg-transparent lg:p-0 lg:pl-8">
            <p className="label-mono text-sand/45 lg:hidden">WhatsApp</p>
            <div className="mt-4 flex items-center gap-5 lg:mt-0 lg:items-start">
              {qr && (
                <div
                  role="img"
                  aria-label="QR code — message Palawan Collective on WhatsApp"
                  className="h-20 w-20 shrink-0 [&_svg]:h-full [&_svg]:w-full lg:h-28 lg:w-28"
                  dangerouslySetInnerHTML={{ __html: qr }}
                />
              )}
              <div>
                <p className="label-mono text-sand/80">
                  Scan to message
                  <br />
                  on WhatsApp
                </p>
                <svg viewBox="0 0 60 40" className="mt-3 hidden h-8 w-12 text-clay-light lg:block" fill="none" stroke="currentColor" strokeWidth={1.4} aria-hidden="true">
                  <path d="M55 5C45 25 25 33 6 30" strokeLinecap="round" />
                  <path d="M13 24 5 30l8 5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <a
                  href={wa}
                  target="_blank"
                  rel="noreferrer"
                  className="label-mono mt-3 inline-block border-b border-sand/40 pb-0.5 text-sand/85 lg:hidden"
                >
                  Open chat →
                </a>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 lg:border-l lg:border-sand/15 lg:pl-8">
            <p className="label-mono text-sand/45">Contact</p>
            <ul className="mt-5 space-y-4">
              <ContactRow icon="whatsapp" label="WhatsApp" value={whatsappDisplay()} href={wa} />
              <ContactRow icon="mail" label="Email" value={site.email} href={`mailto:${site.email}`} />
              <ContactRow icon="pin" label="Location" value={site.location} />
              <ContactRow icon="signal" label="Operations" value="Remote + On-ground operations" />
            </ul>
          </div>
        </div>

        {/* Directory row */}
        <div className="mt-10 grid gap-8 border-t border-sand/15 pt-8 sm:grid-cols-2 md:mt-14 md:grid-cols-12 md:gap-12 md:pt-10">
          <div className="sm:col-span-2 md:col-span-5">
            <p className="label-mono text-sand/45">Nodes in the network</p>
            <ul className="mt-5 divide-y divide-sand/10 border-y border-sand/10">
              {networkNodes.map((node) => (
                <li key={node.name} className="grid grid-cols-[1fr_auto] items-center gap-3 py-3">
                  <span className="min-w-0">
                    <span className="block text-[14px] text-sand md:text-[15px]">{node.name}</span>
                    <span className="block truncate text-[12.5px] text-sand/55 md:text-[13px]">{node.detail}</span>
                  </span>
                  <span className="label-mono flex shrink-0 items-center gap-2 text-sand/70">
                    <StatusDot status={node.status} />
                    {node.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-3">
            <p className="label-mono text-sand/45">Index</p>
            <ul className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 sm:flex sm:flex-col sm:gap-0 sm:space-y-3">
              {indexLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="link-underline text-[14px] text-sand/85 hover:text-sand md:text-[15px]">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li className="col-span-2 sm:col-span-1">
                <a href="/feed.xml" className="inline-flex items-center gap-2 text-[14px] text-sand/85 hover:text-sand md:text-[15px]">
                  <Icon name="rss" className="h-4 w-4" /> RSS feed
                </a>
              </li>
            </ul>
          </div>

          <div className="md:col-span-4">
            <p className="label-mono text-sand/45">Field Notes</p>
            <p className="mt-4 font-serif text-[1.35rem] leading-snug sm:text-2xl md:mt-5">Weekly dispatches from Palawan.</p>
            <p className="mt-2 text-[13.5px] text-sand/60 md:text-[14px]">What’s working, what’s breaking, and what we’re building next.</p>
            <div className="mt-5 md:mt-6">
              <SubscribeForm source="footer" tone="dark" compact />
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="label-mono mt-10 flex flex-col items-center gap-3 border-t border-sand/15 pt-6 text-center text-sand/45 md:mt-14 md:flex-row md:justify-between md:text-left">
          <span>© {year} Palawan Collective · {site.person}</span>
          <span className="hidden lg:inline">{footerNote}</span>
          <span className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 md:justify-end">
            <span>{site.coordinates}</span>
            <FooterAdminButton />
          </span>
        </div>
      </Container>
    </footer>
  );
}
