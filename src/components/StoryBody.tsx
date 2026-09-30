import type { StoryBlock } from "@/db/schema";
import { cn } from "@/components/ui";

export function StoryBody({ blocks }: { blocks: StoryBlock[] }) {
  const firstParagraph = blocks.findIndex((b) => b.type === "p");

  return (
    <div>
      {blocks.map((block, i) => {
        switch (block.type) {
          case "p":
            return (
              <p
                key={i}
                className={cn(
                  "mt-6 font-serif text-[1.2rem] leading-[1.72] text-ink-2 md:text-[1.3rem]",
                  i === firstParagraph && "dropcap text-ink",
                )}
              >
                {block.text}
              </p>
            );
          case "h2":
            return (
              <h2
                key={i}
                className="mt-14 flex items-baseline gap-3 font-serif text-[1.9rem] font-normal leading-tight text-ink md:text-[2.35rem]"
              >
                <span className="label-mono shrink-0 text-clay-deep">§</span>
                <span>{block.text}</span>
              </h2>
            );
          case "quote":
            return (
              <blockquote key={i} className="my-12 border-l-2 border-clay pl-6 md:-ml-8 md:pl-8">
                <p className="font-serif text-[1.8rem] font-light italic leading-[1.25] text-ink md:text-[2.3rem]">
                  “{block.text}”
                </p>
                {block.cite && <footer className="label-mono mt-4 text-muted">— {block.cite}</footer>}
              </blockquote>
            );
          case "list":
            return (
              <ul key={i} className="mt-6 space-y-3.5">
                {block.items.map((item, j) => (
                  <li
                    key={j}
                    className="grid grid-cols-[1.6rem_1fr] font-serif text-[1.13rem] leading-[1.62] text-ink-2 md:text-[1.2rem]"
                  >
                    <span className="text-clay" aria-hidden="true">
                      —
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            );
          case "log":
            return (
              <figure key={i} className="my-10 border border-ink/15 bg-paper">
                <figcaption className="label-mono flex items-center justify-between gap-4 border-b border-ink/15 px-5 py-3">
                  <span className="flex items-center gap-2 text-ink">
                    <span className="h-1.5 w-1.5 rounded-full bg-clay" />
                    Field log{block.title ? ` — ${block.title}` : ""}
                  </span>
                  <span className="hidden text-muted sm:inline">Raw · unedited</span>
                </figcaption>
                <ol className="divide-y divide-ink/10">
                  {block.entries.map((entry, j) => (
                    <li key={j} className="grid grid-cols-[4.8rem_1fr] gap-4 px-5 py-3.5 md:grid-cols-[5.5rem_1fr]">
                      <span className="pt-0.5 font-mono text-[12px] text-clay-deep">{entry.time}</span>
                      <span className="text-[14.5px] leading-relaxed text-ink-2">{entry.text}</span>
                    </li>
                  ))}
                </ol>
              </figure>
            );
          case "callout":
            return (
              <aside key={i} className="my-10 rounded-[var(--pc-radius,18px)] bg-ink p-6 text-sand shadow-[0_24px_50px_-25px_rgba(22,20,17,0.55)] md:p-8">
                <p className="label-mono text-clay-light">{block.label}</p>
                <p className="mt-3 font-serif text-[1.3rem] leading-[1.5] md:text-[1.45rem]">{block.text}</p>
              </aside>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
