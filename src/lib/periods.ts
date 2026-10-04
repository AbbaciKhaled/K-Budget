import {
  addDays,
  addMonths,
  daysBetween,
  fromISODate,
  ISO_DATE_RE,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "@/lib/dates";

export type PeriodKind = "week" | "month" | "year" | "custom";
export type Granularity = "day" | "month" | "year";

export type Period = {
  kind: PeriodKind;
  from: string; // inclusive
  to: string; // inclusive
  granularity: Granularity;
  previous: { from: string; to: string };
};

export const PERIOD_OPTIONS = [
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
  { value: "custom", label: "Custom" },
] as const;

export const GRANULARITY_OPTIONS = [
  { value: "day", label: "Day" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
] as const;

const DEFAULT_GRANULARITY: Record<PeriodKind, Granularity> = {
  week: "day",
  month: "day",
  year: "month",
  custom: "day",
};

const MAX_DAY_BUCKETS = 400;

function addYears(iso: string, years: number) {
  return addMonths(iso, years * 12);
}

/**
 * Resolves URL params into a concrete period. Current periods run "to date"
 * (start of week/month/year → today) and compare against the same stretch of the
 * previous week/month/year. Custom ranges compare against the window just before.
 */
export function resolvePeriod(
  params: { period?: string; from?: string; to?: string; g?: string },
  today: string,
): Period {
  const kind: PeriodKind = (["week", "month", "year", "custom"] as const).find((k) => k === params.period) ?? "month";

  let from: string;
  let to = today;
  let previous: Period["previous"];

  if (kind === "custom" && params.from && params.to && ISO_DATE_RE.test(params.from) && ISO_DATE_RE.test(params.to)) {
    [from, to] = params.from <= params.to ? [params.from, params.to] : [params.to, params.from];
    const len = daysBetween(from, to);
    previous = { from: addDays(from, -len), to: addDays(from, -1) };
  } else {
    const k = kind === "custom" ? "month" : kind;
    if (k === "week") {
      from = startOfWeek(today);
      previous = { from: addDays(from, -7), to: addDays(today, -7) };
    } else if (k === "year") {
      from = startOfYear(today);
      previous = { from: addYears(from, -1), to: addYears(today, -1) };
    } else {
      from = startOfMonth(today);
      previous = { from: addMonths(from, -1), to: addMonths(today, -1) };
    }
  }

  let granularity: Granularity =
    (["day", "month", "year"] as const).find((g) => g === params.g) ??
    (kind === "custom" ? autoGranularity(from, to) : DEFAULT_GRANULARITY[kind]);
  // Keep charts readable: never render more than ~400 daily bars.
  if (granularity === "day" && daysBetween(from, to) > MAX_DAY_BUCKETS) granularity = "month";

  return { kind, from, to, granularity, previous };
}

function autoGranularity(from: string, to: string): Granularity {
  const days = daysBetween(from, to);
  if (days <= 62) return "day";
  if (days <= 366 * 3) return "month";
  return "year";
}

/** Bucket key for a date at a given granularity: "2026-10-04" | "2026-10" | "2026". */
export function bucketKey(iso: string, g: Granularity) {
  return g === "day" ? iso : g === "month" ? iso.slice(0, 7) : iso.slice(0, 4);
}

/** All bucket keys covering [from, to], in order. */
export function bucketKeys(from: string, to: string, g: Granularity) {
  const keys: string[] = [];
  let cursor = g === "day" ? from : g === "month" ? startOfMonth(from) : startOfYear(from);
  while (cursor <= to) {
    keys.push(bucketKey(cursor, g));
    cursor = g === "day" ? addDays(cursor, 1) : g === "month" ? addMonths(cursor, 1) : addYears(cursor, 1);
  }
  return keys;
}

const dayLabel = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const monthLabel = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" });
const monthYearLabel = new Intl.DateTimeFormat("en-GB", { month: "short", year: "2-digit", timeZone: "UTC" });

export function bucketLabel(key: string, g: Granularity, spansYears: boolean) {
  if (g === "year") return key;
  if (g === "month") return (spansYears ? monthYearLabel : monthLabel).format(fromISODate(`${key}-01`));
  return dayLabel.format(fromISODate(key));
}

export function periodTitle(p: Period, today: string) {
  const range = `${dayLabel.format(fromISODate(p.from))} – ${dayLabel.format(fromISODate(p.to))}`;
  switch (p.kind) {
    case "week":
      return { title: "This week", range };
    case "month":
      return { title: "This month", range };
    case "year":
      return { title: `${today.slice(0, 4)} so far`, range };
    default:
      return { title: "Custom range", range: `${range} ${p.to.slice(0, 4)}` };
  }
}
