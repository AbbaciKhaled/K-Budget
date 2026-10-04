"use client";

import { useState } from "react";
import { TransactionRow } from "@/components/transactions/TransactionRow";
import { Card, SectionTitle } from "@/components/ui/Card";
import { Segmented } from "@/components/ui/Segmented";
import type { TagDTO, TransactionDTO, TransactionType } from "@/lib/types";

const TYPE_OPTIONS = [
  { value: "expense", label: "Expenses" },
  { value: "income", label: "Income" },
] as const;

export function LargestTransactions({
  largest,
  tagsById,
  currency,
  today,
}: {
  largest: Record<TransactionType, TransactionDTO[]>;
  tagsById: Map<string, TagDTO>;
  currency: string;
  today: string;
}) {
  const [type, setType] = useState<TransactionType>(largest.expense.length || !largest.income.length ? "expense" : "income");
  const items = largest[type];

  return (
    <section aria-labelledby="largest-title" className="flex flex-col gap-3">
      <SectionTitle action={<Segmented size="sm" label="Largest transactions type" options={TYPE_OPTIONS} value={type} onChange={setType} />}>
        <span id="largest-title">Largest transactions</span>
      </SectionTitle>
      <Card className="overflow-hidden">
        {items.length === 0 ? (
          <p className="py-8 text-center text-[14px] text-muted">No {type === "expense" ? "expenses" : "income"} in this period.</p>
        ) : (
          <ol className="divide-y divide-line/70">
            {items.map((tx) => (
              <li key={tx.id}>
                <TransactionRow tx={tx} tagsById={tagsById} currency={currency} today={today} />
              </li>
            ))}
          </ol>
        )}
      </Card>
    </section>
  );
}
