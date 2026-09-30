import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Container, Icon } from "@/components/ui";
import { getGuides } from "@/lib/data";
import { getSettingsMap, setting } from "@/lib/control";
import { formatDate, pad2 } from "@/lib/format";
import { whatsappLink } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Navigating Palawan — a practical field guide",
  description:
    "Getting there, moving around, where to stay, infrastructure realities and what people don’t tell you — from people building on the ground in Palawan.",
  alternates: { canonical: "/palawan" },
};

const travelTimes = [
  { route: "Manila → Puerto Princesa", mode: "Flight", time: "~1.5 hrs" },
  { route: "Puerto Princesa → Sabang", mode: "Road", time: "~2 hrs" },
  { route: "Puerto Princesa → Port Barton", mode: "Road", time: "3–4 hrs" },
  { route: "Puerto Princesa → El Nido", mode: "Road", time: "5–6 hrs" },
  { route: "Taytay → El Nido", mode: "Road", time: "1.5–2 hrs" },
  { route: "El Nido → Coron", mode: "Ferry", time: "4–8 hrs" },
];

export default async function PalawanPage() {
  const guides = await getGuides();
  let headerImage = "/images/page-palawan.jpg";
  try {
    headerImage = setting<string>(await getSettingsMap(), "page_image_palawan", headerImage);
  } catch {
    /* default keeps the page alive */
  }
  const lastVerified = guides.reduce<Date | null>(
    (latest, g) => (!latest || g.verifiedAt > latest ? g.verifiedAt : latest),
    null,
  );

  return (
    <>
      <Container className="pt-10 md:pt-14">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="label-mono text-clay-deep">§ 06 — The practical layer</p>
            <h1 className="mt-4 font-display text-[clamp(3.6rem,10.5vw,9.6rem)] uppercase leading-[0.86]">
              Navigating
              <span className="block text-clay">Palawan</span>
            </h1>
            <p className="mt-8 max-w-xl font-serif text-[1.5rem] leading-snug md:text-[1.8rem]">
              What we wish someone had told us before the first boat ride.
            </p>
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-ink-2">
              Written by people building on the ground — resorts, logistics, automation — and re-checked as things
              change. Not a travel blog. A field manual.
            </p>
            <div className="label-mono mt-8 flex flex-wrap gap-x-6 gap-y-2 text-muted">
              <span>{guides.length} sections</span>
              {lastVerified && <span>Last verified {formatDate(lastVerified)}</span>}
              <span>Maintained on the ground</span>
            </div>
          </div>
          <figure className="lg:col-span-5">
            <div className="relative aspect-[4/5] overflow-hidden rounded-t-full bg-ink/10">
              <Image
                src={headerImage}
                alt="Outrigger boats beneath limestone cliffs in northern Palawan"
                fill
                preload
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="doc-photo object-cover"
              />
            </div>
            <figcaption className="label-mono mt-3 text-muted">Fig. — Bangkas under the limestone, northern Palawan</figcaption>
          </figure>
        </div>
      </Container>

      <Container className="mt-20">
        <div className="border-t border-ink">
          {guides.map((guide) => (
            <Link
              key={guide.slug}
              href={`/palawan/${guide.slug}`}
              className="group grid gap-6 border-b border-ink/15 py-8 md:grid-cols-12 md:items-start"
            >
              <span className="font-display text-[3rem] leading-none text-clay md:col-span-1">{pad2(guide.position)}</span>
              <div className="md:col-span-5">
                <p className="label-mono text-muted">{guide.kicker}</p>
                <h2 className="mt-1 font-serif text-[2.1rem] leading-tight transition-colors group-hover:text-clay-deep md:text-[2.7rem]">
                  {guide.title}
                </h2>
                <p className="mt-3 max-w-md text-[15px] leading-relaxed text-ink-2">{guide.summary}</p>
              </div>
              <ul className="space-y-2 md:col-span-4 md:pt-7">
                {guide.quickFacts.map((fact) => (
                  <li key={fact} className="flex gap-3 font-mono text-[12.5px] leading-snug text-ink-2">
                    <span className="text-clay">→</span>
                    {fact}
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between gap-4 md:col-span-2 md:flex-col md:items-end md:pt-7">
                <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-ink/10">
                  <Image src={guide.image} alt="" fill sizes="112px" className="doc-photo object-cover" />
                </div>
                <span className="label-mono flex items-center gap-2 text-muted">
                  <span className="h-1.5 w-1.5 rounded-full bg-moss" />
                  {formatDate(guide.verifiedAt, "short")}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </Container>

      <Container className="mt-20 grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <p className="label-mono text-clay-deep">Reality check</p>
          <h2 className="mt-3 font-serif text-[2.3rem] font-light uppercase leading-[0.95] md:text-[2.9rem]">
            Distances are <span className="text-clay">measured in hours</span>
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-ink-2">
            Approximate dry-season times. In habagat season, add a buffer day to anything that depends on a boat.
          </p>
        </div>
        <div className="lg:col-span-8">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="label-mono border-b border-ink text-muted">
                <th className="py-3 pr-4 font-normal">Route</th>
                <th className="py-3 pr-4 font-normal">Mode</th>
                <th className="py-3 text-right font-normal">Time</th>
              </tr>
            </thead>
            <tbody>
              {travelTimes.map((row) => (
                <tr key={row.route} className="border-b border-ink/15">
                  <td className="py-4 pr-4 font-serif text-[1.15rem] md:text-[1.3rem]">{row.route}</td>
                  <td className="label-mono py-4 pr-4 text-muted">{row.mode}</td>
                  <td className="py-4 text-right font-mono text-[14px] text-clay-deep">{row.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Container>

      <Container className="mt-20">
        <div className="grain flex flex-col gap-6 border border-ink/15 bg-sand-2 p-8 md:flex-row md:items-center md:justify-between md:p-10">
          <div>
            <p className="label-mono text-clay-deep">Living document</p>
            <p className="mt-2 max-w-xl font-serif text-[1.6rem] leading-snug md:text-[1.9rem]">
              Ferry cancelled? Road finally paved? Tell us what changed and we’ll re-verify it.
            </p>
          </div>
          <a
            href={whatsappLink("Palawan guide update: ")}
            target="_blank"
            rel="noreferrer"
            className="label-mono inline-flex shrink-0 items-center gap-3 bg-ink px-5 py-3.5 text-sand transition-colors hover:bg-clay-deep"
          >
            <Icon name="whatsapp" className="h-4 w-4" /> Send an update
          </a>
        </div>
      </Container>
    </>
  );
}
