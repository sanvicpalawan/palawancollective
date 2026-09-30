import type { Metadata } from "next";
import Image from "next/image";
import { InquiryForm } from "@/components/InquiryForm";
import { ButtonLink, Container, Icon } from "@/components/ui";
import { services, site, whatsappDisplay, whatsappLink } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Work With Us",
  description:
    "Resort & land development in Palawan, business automation systems, AI agent deployment and ecosystem partnerships — on the ground and remote.",
  alternates: { canonical: "/work-with-us" },
};

type Props = { searchParams: Promise<{ type?: string | string[] }> };

const steps = [
  {
    n: "01",
    title: "A conversation",
    body: "WhatsApp, a call, or coffee in El Nido or Puerto Princesa. What you’re building, what’s broken, what you’ve already tried.",
  },
  {
    n: "02",
    title: "A site visit or systems audit",
    body: "We go and look. Land, access, power, water and logistics — or the phone, the inbox and the booking sheet.",
  },
  {
    n: "03",
    title: "A plan with honest timelines",
    body: "What we’d build, in what order, what it costs, and what will probably break. Then we build it with you — and document it.",
  },
];

export default async function WorkWithUsPage({ searchParams }: Props) {
  const { type } = await searchParams;
  const initialKind = type === "partner" ? "partner" : "project";

  return (
    <>
      <Container className="pt-10 md:pt-14">
        <p className="label-mono text-clay-deep">§ 05 — Work with us</p>
        <div className="mt-4 grid items-end gap-8 lg:grid-cols-12">
          <h1 className="font-serif text-[3.4rem] font-light uppercase leading-[0.88] tracking-[-0.015em] md:text-[6rem] lg:col-span-7 lg:text-[7rem]">
            Work
            <span className="block text-clay">With Us</span>
          </h1>
          <div className="lg:col-span-5 lg:pb-3">
            <p className="font-serif text-[1.45rem] leading-snug md:text-[1.7rem]">{site.positioning}</p>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink-2">
              We take on a small number of projects each year, usually where land, operations and technology overlap.
              Tight scope, on-ground presence, honest timelines.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href="/work-with-us?type=project#inquire">Start a Project</ButtonLink>
              <ButtonLink href="/work-with-us?type=partner#inquire" variant="outline">
                Partner With Us
              </ButtonLink>
            </div>
          </div>
        </div>
      </Container>

      <Container className="mt-12">
        <figure className="relative aspect-[16/9] overflow-hidden rounded-[var(--pc-radius,18px)] bg-ink/10 shadow-[0_24px_50px_-25px_rgba(22,20,17,0.45)] md:aspect-[21/8]">
          <Image
            src="/images/page-work.jpg"
            alt="Two construction workers on bamboo scaffolding"
            fill
            preload
            sizes="(min-width: 1320px) 1256px, 100vw"
            className="doc-photo object-cover"
          />
        </figure>
      </Container>

      <Container className="mt-16">
        <div className="grid overflow-hidden rounded-[var(--pc-radius,18px)] border-l border-t border-ink/15 md:grid-cols-2">
          {services.map((service) => (
            <article key={service.id} className="grid gap-6 border-b border-r border-ink/15 p-6 md:p-9 lg:grid-cols-[5rem_1fr]">
              <span className="font-serif text-[3.2rem] font-light leading-none text-clay">{service.number}</span>
              <div>
                <h2 className="font-serif text-[1.9rem] leading-[1.08] md:text-[2.2rem]">
                  {service.title}
                  {service.qualifier && <span className="text-muted"> ({service.qualifier})</span>}
                </h2>
                <p className="mt-3 text-[15px] leading-relaxed text-ink-2">{service.summary}</p>
                <ul className="mt-5 grid gap-1.5">
                  {service.includes.map((item) => (
                    <li key={item} className="flex gap-2 text-[14px] text-ink-2">
                      <span className="text-clay" aria-hidden="true">
                        —
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="label-mono mt-6 text-muted">{service.format}</p>
              </div>
            </article>
          ))}
        </div>
      </Container>

      <Container className="mt-20">
        <div className="border-t border-ink/20 pt-7">
          <p className="label-mono text-clay-deep">How it starts</p>
          <div className="mt-8 grid gap-10 md:grid-cols-3">
            {steps.map((step) => (
              <div key={step.n}>
                <p className="font-display text-[3.4rem] leading-none text-clay">{step.n}</p>
                <h3 className="mt-4 font-serif text-[1.7rem] leading-tight">{step.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </Container>

      <Container id="inquire" className="mt-24 grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <p className="label-mono text-clay-deep">Inquiry</p>
          <h2 className="mt-3 font-serif text-[2.6rem] font-light uppercase leading-[0.92] md:text-[3.2rem]">
            Tell us what <span className="text-clay">you’re building</span>
          </h2>
          <p className="mt-5 text-[15px] leading-relaxed text-ink-2">
            Projects and partnerships both start here. The more specific you are — site, business, numbers, what broke —
            the more useful our reply.
          </p>
          <ul className="mt-8 space-y-4 border-t border-ink/15 pt-6">
            <li>
              <a href={whatsappLink("Hi David — I’d like to talk about a project.")} target="_blank" rel="noreferrer" className="flex items-center gap-3 hover:text-clay-deep">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-clay text-sand">
                  <Icon name="whatsapp" className="h-[18px] w-[18px]" />
                </span>
                <span>
                  <span className="label-mono block text-muted">WhatsApp</span>
                  <span className="text-[15px]">{whatsappDisplay()}</span>
                </span>
              </a>
            </li>
            <li>
              <a href={`mailto:${site.email}`} className="flex items-center gap-3 hover:text-clay-deep">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-clay text-sand">
                  <Icon name="mail" className="h-[18px] w-[18px]" />
                </span>
                <span>
                  <span className="label-mono block text-muted">Email</span>
                  <span className="text-[15px]">{site.email}</span>
                </span>
              </a>
            </li>
            <li className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-clay text-sand">
                <Icon name="pin" className="h-[18px] w-[18px]" />
              </span>
              <span>
                <span className="label-mono block text-muted">Based in</span>
                <span className="text-[15px]">{site.location} · Remote + on-ground</span>
              </span>
            </li>
          </ul>
        </div>
        <div className="lg:col-span-8">
          <InquiryForm key={initialKind} initialKind={initialKind} />
        </div>
      </Container>
    </>
  );
}
