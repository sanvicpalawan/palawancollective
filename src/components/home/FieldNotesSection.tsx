import Link from "next/link";
import { SubscribeForm } from "@/components/SubscribeForm";
import { Container } from "@/components/ui";
import type { Story } from "@/db/schema";

export function FieldNotesSection({
  recent,
  copy,
}: {
  recent: Story[];
  copy?: { index?: string; title?: string; subtitle?: string; body?: string };
}) {
  const title = copy?.title || "Field Notes";
  const [firstWord, ...restWords] = title.split(" ");
  return (
    <section id="field-notes" className="grain mt-28 border-y border-ink/10 bg-sand-2 md:mt-36">
      <Container className="grid gap-12 py-20 md:py-24 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="label-mono text-clay-deep">§ {copy?.index || "03"} — Newsletter</p>
          <h2 className="mt-3 font-serif text-[2.9rem] font-light uppercase leading-[0.9] md:text-[4rem]">
            {firstWord}
            <span className="block text-clay">{restWords.join(" ")}</span>
          </h2>
          <p className="mt-6 font-serif text-[1.6rem] italic leading-snug">{copy?.subtitle || "Weekly dispatches from Palawan."}</p>
          <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-ink-2">
            {copy?.body || "What’s working, what’s breaking, and what we’re building next."}
          </p>
        </div>

        <div className="lg:col-span-7 lg:pt-10">
          <SubscribeForm source="home-field-notes" />
          <p className="mt-4 text-[13px] leading-relaxed text-muted">
            One email a week, Sunday morning Manila time. No growth hacks, no launch sequences. Unsubscribe in one click.
          </p>

          {recent.length > 0 && (
            <div className="mt-10 border-t border-ink/15 pt-6">
              <p className="label-mono text-muted">Recent subject lines</p>
              <ul className="mt-4 space-y-3">
                {recent.map((story) => (
                  <li key={story.id}>
                    <Link href={`/stories/${story.slug}`} className="group flex items-baseline gap-4">
                      <span className="font-mono text-[12px] text-clay-deep">
                        #{String(story.dispatchNo).padStart(3, "0")}
                      </span>
                      <span className="font-serif text-[1.2rem] leading-snug transition-colors group-hover:text-clay-deep">
                        {story.title}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
