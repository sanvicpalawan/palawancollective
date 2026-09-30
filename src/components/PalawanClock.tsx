"use client";

import { useEffect, useState } from "react";

function format(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Manila",
  }).format(date);
}

/** Live local time in Palawan (PHT, UTC+8). Server renders the initial value. */
export function PalawanClock({ initial }: { initial: string }) {
  const [time, setTime] = useState(initial);

  useEffect(() => {
    const tick = () => setTime(format(new Date()));
    const timer = window.setInterval(tick, 15_000);
    tick();
    return () => window.clearInterval(timer);
  }, []);

  return <span suppressHydrationWarning>{time}</span>;
}
