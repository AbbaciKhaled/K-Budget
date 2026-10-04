import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { formatMoney, formatMoneyParts } from "@/lib/money";
import type { KpiValues } from "@/server/queries/kpis";
import { cn } from "@/lib/utils";

type Direction = "up-good" | "up-bad";

type Delta = { text: string; trend: "up" | "down" | "flat"; tone: "good" | "bad" | "neutral" };

function percentDelta(current: number, previous: number, direction: Direction): Delta {
  if (previous === 0 && current === 0) return { text: "No change", trend: "flat", tone: "neutral" };
  if (previous === 0) return { text: "New", trend: current > 0 ? "up" : "down", tone: "neutral" };
  const change = (current - previous) / Math.abs(previous);
  if (Math.abs(change) < 0.005) return { text: "0%", trend: "flat", tone: "neutral" };
  const trend = change > 0 ? "up" : "down";
  const good = direction === "up-good" ? change > 0 : change < 0;
  const pct = Math.abs(change) >= 10 ? "999%+" : `${Math.round(Math.abs(change) * 100)}%`;
  return { text: `${change > 0 ? "+" : "−"}${pct}`, trend, tone: good ? "good" : "bad" };
}

/** Net can change sign, where a % is meaningless — show the money difference then. */
function netDelta(current: number, previous: number, currency: string): Delta {
  if (previous !== 0 && Math.sign(current) === Math.sign(previous)) return percentDelta(current, previous, "up-good");
  const diff = current - previous;
  if (diff === 0) return { text: "No change", trend: "flat", tone: "neutral" };
  return {
    text: formatMoney(diff, currency, { sign: "always", compact: Math.abs(diff) >= 1_000_000 }),
    trend: diff > 0 ? "up" : "down",
    tone: diff > 0 ? "good" : "bad",
  };
}

function pointsDelta(current: number | null, previous: number | null): Delta {
  if (current === null || previous === null) return { text: "—", trend: "flat", tone: "neutral" };
  const pp = (current - previous) * 100;
  if (Math.abs(pp) < 0.5) return { text: "0 pts", trend: "flat", tone: "neutral" };
  return { text: `${pp > 0 ? "+" : "−"}${Math.abs(Math.round(pp))} pts`, trend: pp > 0 ? "up" : "down", tone: pp > 0 ? "good" : "bad" };
}

function DeltaBadge({ delta, vsLabel }: { delta: Delta; vsLabel: string }) {
  const Icon = delta.trend === "up" ? ArrowUpRight : delta.trend === "down" ? ArrowDownRight : Minus;
  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[12px]">
      <span
        className={cn(
          "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-semibold",
          delta.tone === "good" && "bg-income-soft text-income-hover",
          delta.tone === "bad" && "bg-expense-soft text-[#b22c32]",
          delta.tone === "neutral" && "bg-subtle text-ink-2",
        )}
      >
        <Icon className="size-3.5 stroke-[2.5]" aria-hidden />
        {delta.text}
      </span>
      <span className="text-muted">{vsLabel}</span>
    </p>
  );
}

function Tile({ label, value, delta, vsLabel, hint }: { label: string; value: string; delta: Delta; vsLabel: string; hint?: string }) {
  return (
    <Card className="p-4 sm:p-5">
      <p className="text-[13px] font-medium text-muted">{label}</p>
      <p className="mt-1 truncate text-[22px] font-semibold tracking-[-0.03em] sm:text-[24px]" title={hint}>
        {value}
      </p>
      <DeltaBadge delta={delta} vsLabel={vsLabel} />
    </Card>
  );
}

export function KpiCards({
  current,
  previous,
  currency,
  vsLabel,
  periodLabel,
}: {
  current: KpiValues;
  previous: KpiValues;
  currency: string;
  vsLabel: string;
  periodLabel: string;
}) {
  const hero = formatMoneyParts(current.net, currency, "exceptZero");
  const savings = current.savingsRate === null ? "—" : `${Math.round(current.savingsRate * 100)}%`;

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <Card className="col-span-2 flex flex-col justify-between p-5 sm:p-6 lg:col-span-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-[13px] font-medium text-muted">Net balance · {periodLabel}</p>
          <p
            className={cn(
              "mt-1 text-[44px] font-semibold leading-none tracking-[-0.045em] sm:text-[52px]",
              current.net < 0 && "text-expense",
            )}
            aria-label={formatMoney(current.net, currency, { sign: "exceptZero" })}
          >
            <span aria-hidden>{hero.main}</span>
            <span aria-hidden className="opacity-40">
              {hero.fraction}
            </span>
          </p>
          <DeltaBadge delta={netDelta(current.net, previous.net, currency)} vsLabel={vsLabel} />
        </div>
        <p className="mt-4 text-[13px] text-muted lg:mt-0 lg:text-right">
          {current.count} transaction{current.count === 1 ? "" : "s"}
        </p>
      </Card>

      <Tile
        label="Total income"
        value={formatMoney(current.income, currency)}
        delta={percentDelta(current.income, previous.income, "up-good")}
        vsLabel={vsLabel}
      />
      <Tile
        label="Total expenses"
        value={formatMoney(current.expense, currency)}
        delta={percentDelta(current.expense, previous.expense, "up-bad")}
        vsLabel={vsLabel}
      />
      <Tile
        label="Savings rate"
        value={savings}
        delta={pointsDelta(current.savingsRate, previous.savingsRate)}
        vsLabel={vsLabel}
        hint="Net balance ÷ income"
      />
      <Tile
        label="Avg. daily spending"
        value={formatMoney(current.avgDailySpending, currency)}
        delta={percentDelta(current.avgDailySpending, previous.avgDailySpending, "up-bad")}
        vsLabel={vsLabel}
      />
    </div>
  );
}
