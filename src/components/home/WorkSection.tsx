import { ButtonLink, Container, SectionHeading } from "@/components/ui";
import type { SiteSection } from "@/db/schema";
import { services, whatsappLink } from "@/lib/site";

export function WorkSection({ section }: { section?: SiteSection }) {
  const pick = (key: string, fallback: string): string => {
    const v = section?.data?.[key];
    return typeof v === "string" && v ? v : fallback;
  };
  return (
    <section id="work" className="mt-28 md:mt-36">
      <Container>
        <SectionHeading
          index={pick("index", "05")}
          first={pick("first", "Work")}
          second={pick("second", "With Us")}
          description={pick("description", "A small number of projects each year, where land, operations and technology overlap. On the ground when it matters, remote when it doesn’t.")}
          href="/work-with-us"
          linkLabel="How we work"
        />

        <div className="mt-12 grid overflow-hidden rounded-[var(--pc-radius,18px)] border-l border-t border-ink/15 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service) => (
            <article key={service.id} className="flex flex-col border-b border-r border-ink/15 p-6 md:p-7">
              <span className="font-serif text-[3rem] font-light leading-none text-clay">{service.number}</span>
              <h3 className="mt-6 font-serif text-[1.55rem] leading-[1.1]">
                {service.title}
                {service.qualifier && (
                  <span className="mt-1 block text-[1.05rem] italic text-muted">({service.qualifier})</span>
                )}
              </h3>
              <p className="mt-4 text-[14.5px] leading-relaxed text-ink-2">{service.summary}</p>
              <ul className="mt-5 space-y-1.5">
                {service.includes.map((item) => (
                  <li key={item} className="flex gap-2 text-[13.5px] leading-snug text-ink-2">
                    <span className="text-clay" aria-hidden="true">
                      —
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <p className="label-mono mt-auto pt-7 text-muted">{service.format}</p>
            </article>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
          <ButtonLink href="/work-with-us?type=project#inquire">Start a Project</ButtonLink>
          <ButtonLink href="/work-with-us?type=partner#inquire" variant="outline">
            Partner With Us
          </ButtonLink>
          <a
            href={whatsappLink("Hi David — I’d like to talk about a project in Palawan.")}
            target="_blank"
            rel="noreferrer"
            className="label-mono link-underline mt-2 self-start text-muted hover:text-ink sm:ml-4 sm:mt-0 sm:self-center"
          >
            or message on WhatsApp
          </a>
        </div>
      </Container>
    </section>
  );
}
