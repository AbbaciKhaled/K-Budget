"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { CategorySwitcher } from "@/components/categories/CategorySwitcher";
import { PageHeader } from "@/components/layout/Page";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { TransactionRow } from "@/components/transactions/TransactionRow";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { InputField } from "@/components/ui/Field";
import { Segmented } from "@/components/ui/Segmented";
import { Sheet } from "@/components/ui/Sheet";
import { useToast } from "@/components/ui/Toast";
import { addDays, formatFullDate, relativeDayLabel, startOfMonth, startOfYear } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import type { CategoryDTO, TagDTO, TransactionDTO } from "@/lib/types";
import { cn } from "@/lib/utils";
import { deleteTransactionAction } from "@/server/actions/transactions";
import type { TransactionFilters } from "@/server/queries/transactions";

type Props = {
  userId: string;
  categories: CategoryDTO[];
  current: CategoryDTO;
  tags: TagDTO[];
  currency: string;
  today: string;
  filters: TransactionFilters;
  pageSize: number;
  items: TransactionDTO[];
  hasMore: boolean;
  totals: { income: number; expense: number };
  count: number;
};

const TYPE_OPTIONS = [
  { value: "all", label: "All" },
  { value: "income", label: "Income" },
  { value: "expense", label: "Expenses" },
] as const;

type FilterPatch = Partial<Record<"type" | "tag" | "from" | "to" | "limit", string | undefined>>;

export function TransactionsView(props: Props) {
  const { userId, categories, current, tags, currency, today, filters, pageSize, items, hasMore, totals, count } = props;
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const [navigating, startNav] = useTransition();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [editing, setEditing] = useState<TransactionDTO | null>(null);
  const [deleting, setDeleting] = useState<TransactionDTO | null>(null);
  const [pendingDelete, startDelete] = useTransition();

  const tagsById = useMemo(() => new Map(tags.map((t) => [t.id, t])), [tags]);
  const groups = useMemo(() => groupByDay(items), [items]);
  const activeTag = filters.tagId ? tagsById.get(filters.tagId) : undefined;
  const hasFilters = Boolean(filters.type || filters.tagId || filters.from || filters.to);
  const advancedCount = (filters.tagId ? 1 : 0) + (filters.from || filters.to ? 1 : 0);

  function update(patch: FilterPatch) {
    const params = new URLSearchParams();
    const next = { type: filters.type, tag: filters.tagId, from: filters.from, to: filters.to, ...patch };
    for (const [k, v] of Object.entries(next)) if (v) params.set(k, v);
    const qs = params.toString();
    startNav(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  }

  function confirmDelete() {
    if (!deleting) return;
    const target = deleting;
    startDelete(async () => {
      const res = await deleteTransactionAction(target.id);
      setDeleting(null);
      setEditing(null);
      toast(res.ok ? { message: "Transaction deleted" } : { message: res.message ?? "Couldn't delete", tone: "error" });
    });
  }

  const rangeLabel =
    filters.from && filters.to
      ? `${formatFullDate(filters.from)} – ${formatFullDate(filters.to)}`
      : filters.from
        ? `From ${formatFullDate(filters.from)}`
        : filters.to
          ? `Until ${formatFullDate(filters.to)}`
          : null;

  return (
    <>
      <PageHeader title="Transactions" action={<CategorySwitcher categories={categories} current={current} />} />

      {/* Filter bar */}
      <div className="flex items-center gap-2">
        <Segmented
          label="Transaction type"
          options={TYPE_OPTIONS}
          value={filters.type ?? "all"}
          onChange={(v) => update({ type: v === "all" ? undefined : v })}
          className="flex-1 sm:flex-none"
        />
        <Button variant="secondary" onClick={() => setFiltersOpen(true)} className="relative h-12" aria-label="More filters">
          <SlidersHorizontal className="size-4" aria-hidden />
          <span className="hidden sm:inline">Filters</span>
          {advancedCount > 0 ? (
            <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-white">
              {advancedCount}
            </span>
          ) : null}
        </Button>
      </div>

      {activeTag || rangeLabel ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {activeTag ? (
            <RemovablePill onRemove={() => update({ tag: undefined })} label={`Remove tag filter ${activeTag.name}`}>
              <span className="size-2 rounded-full" style={{ backgroundColor: activeTag.color }} aria-hidden />
              {activeTag.name}
            </RemovablePill>
          ) : null}
          {rangeLabel ? (
            <RemovablePill onRemove={() => update({ from: undefined, to: undefined })} label="Remove date filter">
              {rangeLabel}
            </RemovablePill>
          ) : null}
        </div>
      ) : null}

      {/* Totals for the filtered set */}
      {count > 0 ? (
        <div className="mt-5 flex flex-wrap items-baseline gap-x-4 gap-y-1 px-1 text-[13px]">
          <span className="font-medium text-muted">
            {count} transaction{count === 1 ? "" : "s"}
          </span>
          {filters.type !== "expense" ? (
            <span className="tabular font-semibold text-income">{formatMoney(totals.income, currency, { sign: "exceptZero" })}</span>
          ) : null}
          {filters.type !== "income" ? (
            <span className="tabular font-semibold text-ink">{formatMoney(-totals.expense, currency, { sign: "exceptZero" })}</span>
          ) : null}
        </div>
      ) : null}

      <div className={cn("mt-3 flex flex-col gap-5 transition-opacity", navigating && "opacity-50")} aria-busy={navigating}>
        {groups.length === 0 ? (
          <Card>
            {hasFilters ? (
              <EmptyState
                icon="🔍"
                title="No matching transactions"
                description="Try another type, tag or date range."
                action={
                  <Button variant="secondary" onClick={() => update({ type: undefined, tag: undefined, from: undefined, to: undefined })}>
                    Clear filters
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon="🧾"
                title={`Nothing in ${current.name} yet`}
                description="Your history will appear here as soon as you add a transaction."
                action={
                  <Link href="/" className="press inline-flex h-11 items-center rounded-xl bg-ink px-4 text-[15px] font-semibold text-white">
                    Add a transaction
                  </Link>
                }
              />
            )}
          </Card>
        ) : (
          groups.map((g) => (
            <section key={g.date} aria-label={relativeDayLabel(g.date, today, true)}>
              <div className="mb-2 flex items-baseline justify-between px-1">
                <h2 className="text-[13px] font-semibold text-ink-2">{relativeDayLabel(g.date, today, true)}</h2>
                <span className={cn("tabular text-[13px] font-medium", g.net >= 0 ? "text-income" : "text-muted")}>
                  {formatMoney(g.net, currency, { sign: "exceptZero" })}
                </span>
              </div>
              <Card className="overflow-hidden">
                <ul className="divide-y divide-line/70">
                  {g.items.map((tx) => (
                    <li key={tx.id}>
                      <TransactionRow
                        tx={tx}
                        tagsById={tagsById}
                        currency={currency}
                        today={today}
                        showDate={false}
                        viewerId={current.shared ? userId : undefined}
                        onClick={() => setEditing(tx)}
                      />
                    </li>
                  ))}
                </ul>
              </Card>
            </section>
          ))
        )}

        {hasMore ? (
          <Button
            variant="secondary"
            block
            loading={navigating}
            onClick={() => update({ limit: String(filters.limit + pageSize) })}
          >
            Load more
          </Button>
        ) : null}
      </div>

      <FiltersSheet
        key={`${filtersOpen}`}
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        tags={tags}
        filters={filters}
        today={today}
        onApply={(patch) => {
          setFiltersOpen(false);
          update(patch);
        }}
      />

      <Sheet
        open={editing !== null && deleting === null}
        onClose={() => setEditing(null)}
        title="Edit transaction"
        description={
          editing && current.shared ? `Added by ${editing.author.id === userId ? "you" : editing.author.name}` : undefined
        }
      >
        {editing ? (
          <TransactionForm
            key={editing.id}
            tx={editing}
            tags={tags}
            currency={currency}
            onSaved={() => setEditing(null)}
            onDelete={() => setDeleting(editing)}
          />
        ) : null}
      </Sheet>

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        pending={pendingDelete}
        title="Delete this transaction?"
        description={
          deleting
            ? `${deleting.type === "income" ? "Income" : "Expense"} of ${formatMoney(deleting.amount, currency)} on ${formatFullDate(deleting.date)} will be permanently deleted.`
            : null
        }
      />
    </>
  );
}

function groupByDay(items: TransactionDTO[]) {
  const groups: { date: string; items: TransactionDTO[]; net: number }[] = [];
  for (const tx of items) {
    let g = groups[groups.length - 1];
    if (!g || g.date !== tx.date) {
      g = { date: tx.date, items: [], net: 0 };
      groups.push(g);
    }
    g.items.push(tx);
    g.net += tx.type === "income" ? tx.amount : -tx.amount;
  }
  return groups;
}

function RemovablePill({ children, onRemove, label }: { children: React.ReactNode; onRemove: () => void; label: string }) {
  return (
    <span className="inline-flex h-9 items-center gap-1.5 rounded-full bg-accent-soft pl-3 pr-1 text-[13px] font-medium text-accent-ink">
      {children}
      <button
        type="button"
        onClick={onRemove}
        aria-label={label}
        className="flex size-7 items-center justify-center rounded-full hover:bg-white/70"
      >
        <X className="size-3.5" aria-hidden />
      </button>
    </span>
  );
}

function FiltersSheet({
  open,
  onClose,
  tags,
  filters,
  today,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  tags: TagDTO[];
  filters: TransactionFilters;
  today: string;
  onApply: (patch: FilterPatch) => void;
}) {
  const [tag, setTag] = useState(filters.tagId);
  const [from, setFrom] = useState(filters.from ?? "");
  const [to, setTo] = useState(filters.to ?? "");
  const invalidRange = Boolean(from && to && from > to);

  const presets = [
    { label: "This month", from: startOfMonth(today), to: today },
    { label: "Last 30 days", from: addDays(today, -29), to: today },
    { label: "This year", from: startOfYear(today), to: today },
  ];

  return (
    <Sheet open={open} onClose={onClose} title="Filters">
      <div className="flex flex-col gap-6">
        <fieldset>
          <legend className="mb-2 text-[13px] font-medium text-ink-2">Tag</legend>
          {tags.length === 0 ? (
            <p className="text-[14px] text-muted">No tags in this category yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <Chip key={t.id} color={t.color} selected={tag === t.id} onClick={() => setTag(tag === t.id ? undefined : t.id)}>
                  {t.name}
                </Chip>
              ))}
            </div>
          )}
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-[13px] font-medium text-ink-2">Date range</legend>
          <div className="mb-3 flex flex-wrap gap-2">
            {presets.map((p) => (
              <Chip
                key={p.label}
                selected={from === p.from && to === p.to}
                onClick={() => {
                  setFrom(p.from);
                  setTo(p.to);
                }}
              >
                {p.label}
              </Chip>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InputField label="From" type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} />
            <InputField
              label="To"
              type="date"
              value={to}
              min={from || undefined}
              onChange={(e) => setTo(e.target.value)}
              error={invalidRange ? "Must be after the start date" : undefined}
            />
          </div>
        </fieldset>

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="secondary"
            size="lg"
            onClick={() => onApply({ tag: undefined, from: undefined, to: undefined })}
          >
            Reset
          </Button>
          <Button size="lg" disabled={invalidRange} onClick={() => onApply({ tag, from: from || undefined, to: to || undefined })}>
            Apply
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
