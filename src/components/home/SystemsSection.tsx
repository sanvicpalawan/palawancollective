import { Container, Icon, SectionHeading } from "@/components/ui";
import type { SiteSection } from "@/db/schema";
import { systems } from "@/lib/site";

export function SystemsSection({ section }: { section?: SiteSection }) {
  const pick = (key: string, fallback: string): string => {
    const v = section?.data?.[key];
    return typeof v === "string" && v ? v : fallback;
  };
  return (
    <section id="systems" className="mt-28 md:mt-36">
      <Container>
        <SectionHeading
          index={pick("index", "04")}
          first={pick("first", "Systems")}
          second={pick("second", "We Build")}
          description={pick("description", "No skill bars, no percentages. Only capability — what we can stand up, run, and fix. Usually at night. Usually in the rain.")}
        />

        <div className="mt-12 grid gap-12 lg:grid-cols-12">
          <figure className="lg:col-span-4">
            <div className="lg:sticky lg:top-28">
              <span aria-hidden="true" className="block font-serif text-[6.5rem] leading-[0.6] text-clay">
                “
              </span>
              <blockquote className="mt-3 font-serif text-[1.8rem] font-light leading-[1.22] text-ink md:text-[2.05rem]">
                Technology should disappear into the place. The guest sees a hammock. Underneath, there’s a battery
                bank, a water line, and an agent answering WhatsApp at 2 a.m.
              </blockquote>
              <figcaption className="label-mono mt-6 text-muted">— Field note, Site 01</figcaption>
            </div>
          </figure>

          <ol className="border-t border-ink/15 lg:col-span-8">
            {systems.map((system) => (
              <li
                key={system.code}
                className="group grid gap-5 border-b border-ink/15 py-7 md:grid-cols-[4.5rem_1fr_13rem] md:gap-8"
              >
                <div className="flex items-center gap-4 md:block">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-clay text-sand transition-transform duration-500 group-hover:rotate-12">
                    <Icon name={system.icon} className="h-6 w-6" />
                  </span>
                  <span className="label-mono text-muted md:mt-3 md:block">{system.code}</span>
                </div>
                <div>
                  <h3 className="font-serif text-[1.65rem] leading-tight md:text-[1.9rem]">{system.title}</h3>
                  <p className="mt-2 max-w-lg text-[15px] leading-relaxed text-ink-2">{system.detail}</p>
                </div>
                <ul className="flex flex-wrap content-start gap-1.5 md:justify-end">
                  {system.parts.map((part) => (
                    <li key={part} className="rounded-full border border-ink/20 bg-paper/60 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-2">
                      {part}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}
