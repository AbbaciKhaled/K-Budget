"use client";

import { useState, useTransition } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Sheet } from "@/components/ui/Sheet";
import { useToast } from "@/components/ui/Toast";
import { formatFullDate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import type { TagDTO, TransactionDTO } from "@/lib/types";
import { deleteTransactionAction } from "@/server/actions/transactions";
import { TransactionForm } from "./TransactionForm";

/** Edit sheet + delete confirmation for one transaction. Shared by Home and Transactions. */
export function EditTransactionSheet({
  tx,
  onClose,
  tags,
  currency,
  viewerId,
}: {
  tx: TransactionDTO | null;
  onClose: () => void;
  tags: TagDTO[];
  currency: string;
  /** Set in shared categories, to show who added the transaction. */
  viewerId?: string;
}) {
  const toast = useToast();
  const [deleting, setDeleting] = useState<TransactionDTO | null>(null);
  const [pendingDelete, startDelete] = useTransition();

  function confirmDelete() {
    if (!deleting) return;
    const target = deleting;
    startDelete(async () => {
      const res = await deleteTransactionAction(target.id);
      setDeleting(null);
      onClose();
      toast(res.ok ? { message: "Transaction deleted" } : { message: res.message ?? "Couldn't delete", tone: "error" });
    });
  }

  return (
    <>
      <Sheet
        open={tx !== null && deleting === null}
        onClose={onClose}
        title="Edit transaction"
        description={tx && viewerId ? `Added by ${tx.author.id === viewerId ? "you" : tx.author.name}` : undefined}
      >
        {tx ? (
          <TransactionForm
            key={tx.id}
            tx={tx}
            tags={tags}
            currency={currency}
            onSaved={onClose}
            onDelete={() => setDeleting(tx)}
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
