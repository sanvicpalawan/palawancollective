import { ButtonLink, Container } from "@/components/ui";
import { site } from "@/lib/site";
import { HeroCarousel } from "./HeroCarousel";

const TICKER = [
  "18 kWp solar",
  "12,000 L water",
  "Boat access only",
  "Agents online",
  "Northern Palawan",
  "Field notes weekly",
  "Built, not rendered",
];

export function Hero({ settings }: { settings?: Record<string, unknown> }) {
  const str = (key: string, fallback: string): string => {
    const v = settings?.[key];
    return typeof v === "string" && v ? v : fallback;
  };
  const tagline = str("tagline", site.tagline);
  const kicker = str("hero_kicker", "");
  const name = str("hero_name", "David Le Smith");
  const role = str("hero_role", site.role);
  const intro = str("hero_intro", site.intro);
  const heroLogo = str("site_logo", "/images/palawan-collective-wordmark.svg");
  return (
    <Container className="pt-8 md:pt-12">
      <section className="hero relative isolate" aria-labelledby="hero-title">
        {/* Vertical margin labels (desktop) */}
        <div aria-hidden="true" className="hidden lg:block">
          <div className="side-label side-label-left">
            <span>Off-grid infrastructure</span>
            <span className="rule" />
            <span>Automation systems</span>
          </div>
          <div className="side-label side-label-right">
            <span>AI agents</span>
            <span className="rule" />
            <span>Local operations</span>
          </div>
        </div>

        <h1 id="hero-title" className="hero-title relative z-10 text-ink">
          <span className="hero-logo-frame">
            {/* Transparent vector wordmark; an uploaded admin logo takes precedence. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroLogo}
              alt="Palawan Collective"
              width={1400}
              height={650}
              fetchPriority="high"
              className="hero-wordmark"
            />
          </span>
        </h1>

        <div className="hero-pad relative mt-8 grid gap-14 lg:mt-10 lg:grid-cols-12 lg:gap-8">
          {/* Intro */}
          <div className="hero-intro relative z-20 lg:col-span-5">
            {kicker && <p className="label-mono mb-4 text-clay-deep">{kicker}</p>}
            <p className="max-w-xl text-balance font-serif text-[clamp(1.3rem,5.2vw,1.8rem)] leading-[1.25] text-ink">{tagline}</p>

            <div className="mt-7 flex items-center gap-4 md:mt-9">
              <span className="h-px w-14 bg-ink/40" />
              <span className="label-mono text-ink-2">Hello, I’m</span>
            </div>
            <h2 className="hero-person-name mt-3 whitespace-nowrap font-serif font-light uppercase leading-[0.98] md:mt-4 md:leading-[0.94]">
              {name}
            </h2>
            <p className="label-mono mt-4 max-w-sm text-balance leading-relaxed text-clay-deep md:mt-5">{role}</p>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ink-2 md:mt-6">{intro}</p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap md:mt-8">
              <ButtonLink href="#stories" className="w-full sm:w-auto">Read the Stories</ButtonLink>
              <ButtonLink href="#ecosystem" variant="outline" className="w-full sm:w-auto">
                Explore the Ecosystem
              </ButtonLink>
            </div>

          </div>

          {/* Image carousel — overlaps the masthead on desktop */}
          <div className="hero-overlap relative lg:col-span-7">
            <HeroCarousel />
          </div>
        </div>

        {/* Motion ticker */}
        <div aria-hidden="true" className="hero-marquee mt-12 border-y border-ink/15 py-3 lg:mt-16">
          <div className="hero-marquee-track label-mono text-ink-2">
            {[0, 1].map((half) => (
              <div key={half} className="flex shrink-0 items-center">
                {TICKER.map((t) => (
                  <span key={t} className="flex items-center whitespace-nowrap">
                    <span className="px-6">{t}</span>
                    <span className="text-clay">✳</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>
    </Container>
  );
}
