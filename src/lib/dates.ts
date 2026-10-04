/**
 * Transactions carry a calendar date (no time). We store it as UTC midnight and
 * exchange it as an ISO "yyyy-mm-dd" string everywhere else.
 */

const pad = (n: number) => String(n).padStart(2, "0");

export const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Local calendar date of the device → "yyyy-mm-dd". */
export function todayISO(now = new Date()) {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** UTC-midnight Date → "yyyy-mm-dd". */
export function toISODate(date: Date) {
  return date.toISOString().slice(0, 10);
}

/** "yyyy-mm-dd" → UTC-midnight Date. */
export function fromISODate(iso: string) {
  return new Date(`${iso}T00:00:00.000Z`);
}

export function addDays(iso: string, days: number) {
  const d = fromISODate(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return toISODate(d);
}

export function addMonths(iso: string, months: number) {
  const d = fromISODate(iso);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, lastDay));
  return toISODate(d);
}

export function startOfMonth(iso: string) {
  return `${iso.slice(0, 7)}-01`;
}

export function startOfYear(iso: string) {
  return `${iso.slice(0, 4)}-01-01`;
}

/** Monday-based week start. */
export function startOfWeek(iso: string) {
  const dow = (fromISODate(iso).getUTCDay() + 6) % 7;
  return addDays(iso, -dow);
}

/** Inclusive number of days between two ISO dates. */
export function daysBetween(fromIso: string, toIso: string) {
  return Math.round((fromISODate(toIso).getTime() - fromISODate(fromIso).getTime()) / 86_400_000) + 1;
}

const dayFmt = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
const longDayFmt = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const fullFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const monthFmt = new Intl.DateTimeFormat("en-GB", { month: "long", timeZone: "UTC" });

/** "Today", "Yesterday", or "Mon 2 Oct" — relative to `today`. */
export function relativeDayLabel(iso: string, today: string, long = false) {
  if (iso === today) return "Today";
  if (iso === addDays(today, -1)) return "Yesterday";
  if (iso === addDays(today, 1)) return "Tomorrow";
  const d = fromISODate(iso);
  const sameYear = iso.slice(0, 4) === today.slice(0, 4);
  if (!sameYear) return fullFmt.format(d);
  return (long ? longDayFmt : dayFmt).format(d);
}

export function formatFullDate(iso: string) {
  return fullFmt.format(fromISODate(iso));
}

export function monthName(iso: string) {
  return monthFmt.format(fromISODate(iso));
}
