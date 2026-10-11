"use client";

import Link from "next/link";
import { useMemo, useOptimistic, useRef, startTransition } from "react";
import { ChevronRight } from "lucide-react";
import { CategorySwitcher } from "@/components/categories/CategorySwitcher";
import { Avatar } from "@/components/ui/Avatar";
import { Card, SectionTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { TransactionRow } from "@/components/transactions/TransactionRow";
import { formatMoney } from "@/lib/money";
import type { CategoryDTO, TagDTO, TransactionDTO } from "@/lib/types";
import type { Totals } from "@/server/queries/transactions";
import { createTransactionAction, deleteTransactionAction } from "@/server/actions/transactions";
import { QuickAdd } from "./QuickAdd";
import { SummaryCard } from "./SummaryCard";

type Props = {
  userId: string;
  userName: string;
  currency: string;
  today: string;
  periodLabel: string;
  categories: CategoryDTO[];
  current: CategoryDTO;
  tags: TagDTO[];
  totals: Totals;
  recent: TransactionDTO[];
};

type State = { totals: Totals; recent: TransactionDTO[] };
type OptimisticAction = { kind: "add"; tx: TransactionDTO } | { kind: "remove"; tx: TransactionDTO };

const RECENT_LIMIT = 5;

function byNewest(a: TransactionDTO, b: TransactionDTO) {
  return a.date === b.date ? (a.id < b.id ? 1 : -1) : a.date < b.date ? 1 : -1;
}

export function HomeView({ userId, userName, currency, today, periodLabel, categories, current, tags, totals, recent }: Props) {
  const toast = useToast();
  const created = useRef(new Map<string, Promise<unknown>>());
  const tagsById = useMemo(() => new Map(tags.map((t) => [t.id, t])), [tags]);
  const year = today.slice(0, 4);

  const [state, apply] = useOptimistic<State, OptimisticAction>({ totals, recent }, (s, action) => {
    const { tx } = action;
    const inPeriod = tx.date.slice(0, 4) === year;
    const delta = (action.kind === "add" ? 1 : -1) * (inPeriod ? tx.amount : 0);
    const nextTotals = { ...s.totals, [tx.type]: s.totals[tx.type] + delta };
    const nextRecent =
      action.kind === "add"
        ? [tx, ...s.recent.filter((r) => r.id !== tx.id)].sort(byNewest).slice(0, RECENT_LIMIT)
        : s.recent.filter((r) => r.id !== tx.id);
    return { totals: nextTotals, recent: nextRecent };
  });

  function undo(tx: TransactionDTO) {
    startTransition(async () => {
      apply({ kind: "remove", tx });
      await created.current.get(tx.id); // never delete before the create landed
      const res = await deleteTransactionAction(tx.id);
      toast(res.ok ? { message: "Transaction removed", tone: "info" } : { message: res.message ?? "Couldn't undo", tone: "error" });
    });
  }

  function add(tx: TransactionDTO) {
    toast({
      message: `${tx.type === "income" ? "Income" : "Expense"} of ${formatMoney(tx.amount, currency)} saved`,
      action: { label: "Undo", onClick: () => undo(tx) },
    });
    startTransition(async () => {
      apply({ kind: "add", tx });
      const promise = createTransactionAction(tx);
      created.current.set(tx.id, promise);
      const res = await promise;
      if (!res.ok) toast({ message: res.message ?? "Couldn't save the transaction", tone: "error" });
    });
  }

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-8">
      <div className="flex flex-col gap-5">
        <header className="flex items-center justify-between gap-3">
          <Link href="/profile" className="flex min-w-0 items-center gap-2.5 rounded-full py-1 pr-2" aria-label="Your profile">
            <Avatar name={userName} size={40} />
            <span className="min-w-0">
              <span className="block text-[12px] leading-tight text-muted">Hello</span>
              <span className="block truncate text-[15px] font-semibold leading-tight tracking-[-0.01em]">
                {userName.split(" ")[0]}
              </span>
            </span>
          </Link>
          <CategorySwitcher categories={categories} current={current} />
        </header>

        <SummaryCard income={state.totals.income} expense={state.totals.expense} currency={currency} periodLabel={periodLabel} />

        <section aria-labelledby="recent-title" className="flex flex-col gap-3">
          <SectionTitle
            action={
              <Link
                href="/transactions"
                className="-mr-2 inline-flex h-9 items-center gap-0.5 rounded-lg px-2 text-[13px] font-semibold text-accent hover:bg-accent-soft"
              >
                See all <ChevronRight className="size-3.5" aria-hidden />
              </Link>
            }
          >
            <span id="recent-title">Recent</span>
          </SectionTitle>
          <Card className="overflow-hidden">
            {state.recent.length === 0 ? (
              <EmptyState
                icon="✨"
                title="No transactions yet"
                description="Type an amount and tap Income or Expense — that's it."
              />
            ) : (
              <ul className="divide-y divide-line/70">
                {state.recent.map((tx) => (
                  <li key={tx.id}>
                    <TransactionRow
                      tx={tx}
                      tagsById={tagsById}
                      currency={currency}
                      today={today}
                      viewerId={current.shared ? userId : undefined}
                      highlight={!recent.some((r) => r.id === tx.id)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </section>
      </div>

      <QuickAdd
        key={current.id}
        categoryId={current.id}
        tags={tags}
        currency={currency}
        today={today}
        me={{ id: userId, name: userName }}
        onAdd={add}
      />
    </div>
  );
}
