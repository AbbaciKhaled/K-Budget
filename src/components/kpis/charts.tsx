"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMoney } from "@/lib/money";
import type { SeriesPoint } from "@/server/queries/kpis";

/* Chart tokens — mark colors only; text stays in ink tokens. */
const C = {
  income: "#07875a",
  expense: "#de3f45",
  accent: "#3245ff",
  grid: "#eef0f3",
  axis: "#646b78",
  surface: "#ffffff",
};

const axisTick = { fill: C.axis, fontSize: 12 };

function TooltipCard({ title, rows }: { title: string; rows: { label: string; value: string; color: string }[] }) {
  return (
    <div className="min-w-40 rounded-xl border border-line bg-surface px-3 py-2.5 text-[13px] shadow-pop">
      <p className="mb-1.5 font-semibold text-ink">{title}</p>
      {rows.map((r) => (
        <p key={r.label} className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-1.5 text-ink-2">
            <span className="size-2 rounded-full" style={{ backgroundColor: r.color }} aria-hidden />
            {r.label}
          </span>
          <span className="tabular font-semibold text-ink">{r.value}</span>
        </p>
      ))}
    </div>
  );
}

export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-ink-2">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px]" style={{ backgroundColor: i.color }} aria-hidden />
          {i.label}
        </li>
      ))}
    </ul>
  );
}

/** Grouped income vs expenses columns per bucket. */
export function IncomeExpenseChart({ data, currency }: { data: SeriesPoint[]; currency: string }) {
  const compact = (v: number) => formatMoney(v, currency, { compact: true });
  // Cap bar thickness at 24px; thinner when there are many buckets.
  const barSize = data.length > 60 ? 3 : data.length > 31 ? 6 : data.length > 14 ? 10 : data.length > 7 ? 16 : 24;
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} barGap={2} barCategoryGap="20%" margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} stroke={C.grid} />
        <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={{ stroke: C.grid }} minTickGap={16} />
        <YAxis tick={axisTick} tickLine={false} axisLine={false} tickFormatter={compact} width={56} />
        <Tooltip
          cursor={{ fill: "rgb(16 24 40 / 0.04)" }}
          content={({ active, payload, label }) =>
            active && payload?.length ? (
              <TooltipCard
                title={String(label)}
                rows={[
                  { label: "Income", value: formatMoney(Number(payload[0]?.payload.income ?? 0), currency), color: C.income },
                  { label: "Expenses", value: formatMoney(Number(payload[0]?.payload.expense ?? 0), currency), color: C.expense },
                ]}
              />
            ) : null
          }
        />
        <Bar dataKey="income" name="Income" fill={C.income} barSize={barSize} radius={[4, 4, 0, 0]} />
        <Bar dataKey="expense" name="Expenses" fill={C.expense} barSize={barSize} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Running net balance across the period. */
export function BalanceChart({ data, currency }: { data: SeriesPoint[]; currency: string }) {
  const compact = (v: number) => formatMoney(v, currency, { compact: true });
  const hasNegative = data.some((d) => d.balance < 0);
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.accent} stopOpacity={0.14} />
            <stop offset="100%" stopColor={C.accent} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={C.grid} />
        <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={{ stroke: C.grid }} minTickGap={16} />
        <YAxis tick={axisTick} tickLine={false} axisLine={false} tickFormatter={compact} width={56} />
        {hasNegative ? <ReferenceLine y={0} stroke={C.axis} strokeOpacity={0.4} /> : null}
        <Tooltip
          cursor={{ stroke: C.axis, strokeOpacity: 0.3, strokeWidth: 1 }}
          content={({ active, payload, label }) =>
            active && payload?.length ? (
              <TooltipCard
                title={String(label)}
                rows={[
                  {
                    label: "Balance",
                    value: formatMoney(Number(payload[0]?.payload.balance ?? 0), currency, { sign: "exceptZero" }),
                    color: C.accent,
                  },
                ]}
              />
            ) : null
          }
        />
        <Area
          type="monotone"
          dataKey="balance"
          stroke={C.accent}
          strokeWidth={2}
          fill="url(#balanceFill)"
          dot={false}
          activeDot={{ r: 5, fill: C.accent, stroke: C.surface, strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export type DonutSlice = { id: string; label: string; value: number; color: string };

/** Donut with a centered total; hovering a slice (or its list row) shows its share. */
export function Donut({
  slices,
  currency,
  activeId,
  onActiveChange,
}: {
  slices: DonutSlice[];
  currency: string;
  activeId: string | null;
  onActiveChange: (id: string | null) => void;
}) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  const active = slices.find((s) => s.id === activeId);
  const data = slices.map((s) => ({ ...s, fill: s.color, fillOpacity: activeId && activeId !== s.id ? 0.35 : 1 }));

  return (
    <div className="relative mx-auto size-[200px] shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            innerRadius={68}
            outerRadius={96}
            startAngle={90}
            endAngle={-270}
            stroke={C.surface}
            strokeWidth={2}
            isAnimationActive={false}
            onMouseEnter={(_, index) => onActiveChange(slices[index]?.id ?? null)}
            onMouseLeave={() => onActiveChange(null)}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="max-w-[120px] truncate text-[12px] font-medium text-muted">{active ? active.label : "Total"}</span>
        <span className="text-[18px] font-semibold tracking-[-0.03em] text-ink">
          {formatMoney(active ? active.value : total, currency, { compact: (active?.value ?? total) >= 1_000_000 })}
        </span>
        {active && total > 0 ? (
          <span className="text-[12px] font-medium text-muted">{Math.round((active.value / total) * 100)}%</span>
        ) : null}
      </div>
    </div>
  );
}

export const CHART_COLORS = C;

/** Accessible table view of the time series (also handy to read exact values). */
export function SeriesTable({ data, currency }: { data: SeriesPoint[]; currency: string }) {
  return (
    <details className="group mt-3">
      <summary className="inline-flex h-9 cursor-pointer list-none items-center rounded-lg px-2 text-[13px] font-semibold text-accent hover:bg-accent-soft [&::-webkit-details-marker]:hidden">
        <span className="group-open:hidden">View as table</span>
        <span className="hidden group-open:inline">Hide table</span>
      </summary>
      <div className="mt-2 max-h-72 overflow-auto rounded-xl border border-line">
        <table className="w-full text-[13px]">
          <thead className="sticky top-0 bg-subtle text-left text-ink-2">
            <tr>
              <th scope="col" className="px-3 py-2 font-medium">Period</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">Income</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">Expenses</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">Balance</th>
            </tr>
          </thead>
          <tbody className="tabular divide-y divide-line/70">
            {data.map((d) => (
              <tr key={d.key}>
                <th scope="row" className="px-3 py-1.5 text-left font-medium text-ink">{d.label}</th>
                <td className="px-3 py-1.5 text-right">{formatMoney(d.income, currency)}</td>
                <td className="px-3 py-1.5 text-right">{formatMoney(d.expense, currency)}</td>
                <td className="px-3 py-1.5 text-right">{formatMoney(d.balance, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
