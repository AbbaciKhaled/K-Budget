"use client";

import { useState } from "react";
import { Card, SectionTitle } from "@/components/ui/Card";
import { Segmented } from "@/components/ui/Segmented";
import { formatMoney } from "@/lib/money";
import type { TagDTO, TransactionType } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { TagSlice } from "@/server/queries/kpis";
import { Donut, type DonutSlice } from "./charts";

const MAX_SLICES = 6;
const OTHER_COLOR = "#9aa0aa";
const UNTAGGED_COLOR = "#cfd3da";

const TYPE_OPTIONS = [
  { value: "expense", label: "Expenses" },
  { value: "income", label: "Income" },
] as const;

type Row = { id: string; label: string; value: number; color: string };

export function TagBreakdown({
  byTag,
  tags,
  currency,
}: {
  byTag: Record<TransactionType, TagSlice[]>;
  tags: TagDTO[];
  currency: string;
}) {
  const [type, setType] = useState<TransactionType>(byTag.expense.length || !byTag.income.length ? "expense" : "income");
  const [activeId, setActiveId] = useState<string | null>(null);
  const tagsById = new Map(tags.map((t) => [t.id, t]));

  // Ranking: every tag, largest first; "Untagged" always last.
  const tagged: Row[] = byTag[type]
    .filter((s) => s.tagId && tagsById.has(s.tagId))
    .map((s) => {
      const t = tagsById.get(s.tagId!)!;
      return { id: t.id, label: t.name, value: s.total, color: t.color };
    });
  const untaggedTotal = byTag[type].filter((s) => !s.tagId || !tagsById.has(s.tagId)).reduce((sum, s) => sum + s.total, 0);
  const rows: Row[] = untaggedTotal > 0 ? [...tagged, { id: "untagged", label: "Untagged", value: untaggedTotal, color: UNTAGGED_COLOR }] : tagged;
  const total = rows.reduce((s, r) => s + r.value, 0);
  const top = rows[0]?.value ?? 0;

  // Donut: top tags, the rest folded into "Other" (never more hues than the palette can separate).
  const head = tagged.slice(0, MAX_SLICES);
  const rest = tagged.slice(MAX_SLICES).reduce((s, r) => s + r.value, 0);
  const slices: DonutSlice[] = [
    ...head,
    ...(rest > 0 ? [{ id: "other", label: "Other tags", value: rest, color: OTHER_COLOR }] : []),
    ...(untaggedTotal > 0 ? [{ id: "untagged", label: "Untagged", value: untaggedTotal, color: UNTAGGED_COLOR }] : []),
  ];
  const inDonut = new Set(slices.map((s) => s.id));

  return (
    <Card className="p-5 sm:p-6">
      <SectionTitle
        action={
          <Segmented size="sm" label="Breakdown type" options={TYPE_OPTIONS} value={type} onChange={(v) => { setType(v); setActiveId(null); }} />
        }
      >
        By tag
      </SectionTitle>

      {total === 0 ? (
        <p className="py-10 text-center text-[14px] text-muted">
          No {type === "expense" ? "expenses" : "income"} in this period.
        </p>
      ) : (
        <div className="mt-5 flex flex-col gap-6 md:flex-row md:items-center md:gap-8">
          <Donut slices={slices} currency={currency} activeId={activeId} onActiveChange={setActiveId} />
          <ol className="flex min-w-0 flex-1 flex-col gap-1" aria-label={`Top ${type === "expense" ? "expense" : "income"} tags`}>
            {rows.map((r, i) => {
              const share = r.value / total;
              const highlight = activeId === r.id || (activeId === "other" && !inDonut.has(r.id) && r.id !== "untagged");
              return (
                <li
                  key={r.id}
                  onMouseEnter={() => setActiveId(inDonut.has(r.id) ? r.id : "other")}
                  onMouseLeave={() => setActiveId(null)}
                  className={cn("rounded-xl px-2.5 py-2 transition-colors", highlight && "bg-subtle")}
                >
                  <div className="flex items-center gap-2.5 text-[14px]">
                    <span className="w-4 shrink-0 text-right text-[12px] font-medium text-muted tabular">{r.id === "untagged" ? "" : i + 1}</span>
                    <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: r.color }} aria-hidden />
                    <span className="min-w-0 flex-1 truncate font-medium text-ink">{r.label}</span>
                    <span className="tabular font-semibold text-ink">{formatMoney(r.value, currency)}</span>
                    <span className="tabular w-10 text-right text-[13px] text-muted">{Math.round(share * 100)}%</span>
                  </div>
                  <div className="ml-[42px] mt-1.5 h-1 overflow-hidden rounded-full bg-subtle" aria-hidden>
                    <div className="h-full rounded-full" style={{ width: `${(r.value / top) * 100}%`, backgroundColor: r.color }} />
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </Card>
  );
}
