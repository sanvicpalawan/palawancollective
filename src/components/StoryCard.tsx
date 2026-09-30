import Image from "next/image";
import Link from "next/link";
import type { FieldLogEntry, Story } from "@/db/schema";
import { ArrowRight, cn } from "@/components/ui";
import { dispatchNo, formatDate, formatTime } from "@/lib/format";

export function StoryCard({
  story,
  className,
  sizes = "(min-width: 1024px) 30vw, (min-width: 768px) 45vw, 100vw",
}: {
  story: Story;
  className?: string;
  sizes?: string;
}) {
  return (
    <Link href={`/stories/${story.slug}`} className={cn("group block", className)}>
      <div className="relative aspect-[3/2] overflow-hidden rounded-[var(--pc-radius,18px)] bg-ink/10 shadow-[0_20px_45px_-25px_rgba(22,20,17,0.45)]">
        <Image
          src={story.coverImage}
          alt={story.coverAlt}
          fill
          sizes={sizes}
          className="doc-photo object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
        />
      </div>
      <p className="label-mono mt-4 flex flex-wrap items-center gap-x-3 text-muted">
        <span className="text-clay-deep">{dispatchNo(story.dispatchNo)}</span>
        <span aria-hidden="true">·</span>
        <span>{story.category}</span>
      </p>
      <h3 className="mt-2 font-serif text-[1.6rem] leading-[1.08] text-ink transition-colors group-hover:text-clay-deep">
        {story.title}
      </h3>
      <p className="mt-3 line-clamp-3 text-[14.5px] leading-relaxed text-ink-2">{story.dek}</p>
      <p className="label-mono mt-4 text-muted">
        {story.readingMinutes} min read · {formatDate(story.publishedAt, "short")}
      </p>
    </Link>
  );
}

export function StoryRow({ story, showImage = false }: { story: Story; showImage?: boolean }) {
  return (
    <Link
      href={`/stories/${story.slug}`}
      className="group grid grid-cols-[auto_1fr_auto] items-center gap-5 border-b border-ink/15 py-5 md:gap-8"
    >
      {showImage ? (
        <div className="relative h-20 w-24 overflow-hidden bg-ink/10 md:h-24 md:w-36">
          <Image src={story.coverImage} alt="" fill sizes="144px" className="doc-photo object-cover" />
        </div>
      ) : (
        <span className="w-14 font-serif text-3xl font-light text-clay md:w-20 md:text-[2.6rem]">
          {String(story.dispatchNo).padStart(3, "0")}
        </span>
      )}
      <div className="min-w-0">
        <p className="label-mono truncate text-muted">
          {showImage && <span className="text-clay-deep">{dispatchNo(story.dispatchNo)} · </span>}
          {story.category} · {story.location}
        </p>
        <h3 className="mt-1 font-serif text-[1.3rem] leading-snug text-ink transition-colors group-hover:text-clay-deep md:text-[1.7rem]">
          {story.title}
        </h3>
      </div>
      <div className="label-mono flex items-center gap-5 text-muted">
        <span className="hidden md:inline">{story.readingMinutes} min</span>
        <ArrowRight className="h-3 w-8 transition-transform duration-300 group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

export function FieldLogPanel({
  entries,
  title = "Field log",
  className,
}: {
  entries: FieldLogEntry[];
  title?: string;
  className?: string;
}) {
  return (
    <div className={cn("border border-ink/15 bg-paper", className)}>
      <div className="flex items-center justify-between border-b border-ink/15 px-5 py-4">
        <p className="label-mono flex items-center gap-2 text-ink">
          <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-clay" />
          {title}
        </p>
        <p className="label-mono text-muted">Times in PHT</p>
      </div>
      <ol className="divide-y divide-ink/10">
        {entries.map((entry) => (
          <li key={entry.id} className="px-5 py-4">
            <p className="label-mono flex items-center justify-between gap-3 text-muted">
              <span>
                <span className="text-clay-deep">{formatTime(entry.loggedAt)}</span> · {formatDate(entry.loggedAt, "short")}
              </span>
              <span className="truncate">
                {entry.tag} · {entry.location}
              </span>
            </p>
            <p className="mt-1.5 text-[14px] leading-snug text-ink-2">{entry.text}</p>
          </li>
        ))}
      </ol>
      <p className="border-t border-ink/15 px-5 py-4 font-hand text-[1.35rem] leading-tight text-ink-2">
        The log updates as we go. The stories come later.
      </p>
    </div>
  );
}
