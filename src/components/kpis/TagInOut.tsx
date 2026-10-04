import { Card, SectionTitle } from "@/components/ui/Card";
import { formatMoney } from "@/lib/money";
import type { TagDTO, TransactionType } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { TagSlice } from "@/server/queries/kpis";
import { CHART_COLORS, Legend } from "./charts";

type Row = { id: string; label: string; color: string; income: number; expense: number };

const UNTAGGED_COLOR = "#cfd3da";

/** Per tag: money in, money out and net — a diverging bar (out ← | → in) for each tag. */
export function TagInOut({
  byTag,
  tags,
  currency,
}: {
  byTag: Record<TransactionType, TagSlice[]>;
  tags: TagDTO[];
  currency: string;
}) {
  const tagsById = new Map(tags.map((t) => [t.id, t]));
  const rows = new Map<string, Row>();

  for (const type of ["income", "expense"] as const) {
    for (const slice of byTag[type]) {
      const tag = slice.tagId ? tagsById.get(slice.tagId) : undefined;
      const id = tag?.id ?? "untagged";
      const row = rows.get(id) ?? {
        id,
        label: tag?.name ?? "Untagged",
        color: tag?.color ?? UNTAGGED_COLOR,
        income: 0,
        expense: 0,
      };
      row[type] += slice.total;
      rows.set(id, row);
    }
  }

  // Busiest tags first; "Untagged" always last.
  const list = [...rows.values()].sort((a, b) =>
    a.id === "untagged" ? 1 : b.id === "untagged" ? -1 : b.income + b.expense - (a.income + a.expense),
  );
  const max = Math.max(1, ...list.flatMap((r) => [r.income, r.expense]));

  if (list.length === 0) return null;

  return (
    <Card className="p-5 sm:p-6">
      <SectionTitle
        action={
          <Legend
            items={[
              { label: "Out", color: CHART_COLORS.expense },
              { label: "In", color: CHART_COLORS.income },
            ]}
          />
        }
      >
        In &amp; out by tag
      </SectionTitle>

      <ul className="mt-4 flex flex-col divide-y divide-line/70">
        {list.map((r) => {
          const net = r.income - r.expense;
          return (
            <li key={r.id} className="py-3 first:pt-1 last:pb-0">
              <div className="flex items-center gap-2.5">
                <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: r.color }} aria-hidden />
                <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-ink">{r.label}</span>
                <span className="text-[12px] text-muted">Net</span>
                <span className={cn("tabular text-[14px] font-semibold", net < 0 ? "text-expense" : net > 0 ? "text-income" : "text-ink")}>
                  {formatMoney(net, currency, { sign: "exceptZero" })}
                </span>
              </div>

              <div className="mt-2 grid grid-cols-2 gap-[2px]" aria-hidden>
                <div className="flex h-2 justify-end overflow-hidden rounded-l-full bg-subtle">
                  <div className="h-full rounded-l-full" style={{ width: `${(r.expense / max) * 100}%`, backgroundColor: CHART_COLORS.expense }} />
                </div>
                <div className="flex h-2 overflow-hidden rounded-r-full bg-subtle">
                  <div className="h-full rounded-r-full" style={{ width: `${(r.income / max) * 100}%`, backgroundColor: CHART_COLORS.income }} />
                </div>
              </div>

              <div className="mt-1.5 grid grid-cols-2 text-[13px]">
                <span className="tabular text-ink-2">
                  <span className="text-muted">Out </span>
                  {formatMoney(-r.expense, currency, { sign: "exceptZero" })}
                </span>
                <span className="tabular text-right text-ink-2">
                  <span className="text-muted">In </span>
                  {formatMoney(r.income, currency, { sign: "exceptZero" })}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
