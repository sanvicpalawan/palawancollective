export const PALAWAN_TZ = "Asia/Manila";

export function formatDate(date: Date, style: "long" | "short" = "long"): string {
  const options: Intl.DateTimeFormatOptions =
    style === "long"
      ? { day: "numeric", month: "long", year: "numeric", timeZone: PALAWAN_TZ }
      : { day: "numeric", month: "short", timeZone: PALAWAN_TZ };
  return new Intl.DateTimeFormat("en-GB", options).format(date);
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: PALAWAN_TZ,
  }).format(date);
}

export function timeAgo(date: Date, now: number = Date.now()): string {
  const minutes = Math.max(1, Math.round((now - date.getTime()) / 60_000));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  if (days < 14) return `${days} day${days === 1 ? "" : "s"} ago`;
  if (days < 60) return `${Math.round(days / 7)} weeks ago`;
  return `${Math.round(days / 30)} months ago`;
}

export function dispatchNo(n: number): string {
  return `No. ${String(n).padStart(3, "0")}`;
}

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function palawanSeason(date: Date = new Date()): { name: string; detail: string } {
  const month = Number(new Intl.DateTimeFormat("en-US", { month: "numeric", timeZone: PALAWAN_TZ }).format(date));
  if (month >= 6 && month <= 10) return { name: "Habagat", detail: "SW monsoon · wet" };
  if (month === 11) return { name: "Transition", detail: "Amihan arriving" };
  if (month >= 3 && month <= 5) return { name: "Tag-init", detail: "Hot · dry" };
  return { name: "Amihan", detail: "NE monsoon · cool, dry" };
}
