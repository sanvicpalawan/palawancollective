import type { ReactNode } from "react";
import { PalawanClock } from "@/components/PalawanClock";
import { Container, cn } from "@/components/ui";
import type { FieldLogEntry, Story } from "@/db/schema";
import { dispatchNo, formatTime, palawanSeason, timeAgo } from "@/lib/format";
import { site } from "@/lib/site";

/** A field-station readout: the "living system" layer under the masthead. */
export function StatusStrip({ latest, lastLog }: { latest?: Story; lastLog?: FieldLogEntry }) {
  const now = new Date();
  const season = palawanSeason(now);

  const items: { k: string; v: ReactNode; sub?: string }[] = [
    {
      k: "Latest dispatch",
      v: latest ? dispatchNo(latest.dispatchNo) : "—",
      sub: latest ? `Filed ${timeAgo(latest.publishedAt, now.getTime())}` : undefined,
    },
    {
      k: "Last log entry",
      v: lastLog ? timeAgo(lastLog.loggedAt, now.getTime()) : "—",
      sub: lastLog ? `${lastLog.tag} · ${lastLog.location}` : undefined,
    },
    {
      k: "Local time",
      v: (
        <>
          <PalawanClock initial={formatTime(now)} /> PHT
        </>
      ),
      sub: "UTC+8 · Palawan",
    },
    { k: "Season", v: season.name, sub: season.detail },
    { k: "Uplink", v: "Satellite + 4G", sub: "Automatic failover" },
    { k: "Position", v: site.coordinates, sub: "Northern Palawan" },
  ];

  return (
    <Container className="mt-16 lg:mt-20">
      <div
        aria-label="Field status"
        className="grid grid-cols-2 gap-y-2 border-y border-ink/15 py-2 md:grid-cols-3 lg:grid-cols-6 lg:py-0"
      >
        {items.map((item, i) => (
          <div key={item.k} className={cn("py-3 pr-4 lg:py-5", i > 0 && "lg:border-l lg:border-ink/15 lg:pl-5")}>
            <p className="label-mono text-muted">{item.k}</p>
            <p className="mt-1 font-mono text-[13px] uppercase tracking-[0.06em] text-ink">{item.v}</p>
            {item.sub && <p className="mt-0.5 text-[12px] text-muted">{item.sub}</p>}
          </div>
        ))}
      </div>
    </Container>
  );
}
