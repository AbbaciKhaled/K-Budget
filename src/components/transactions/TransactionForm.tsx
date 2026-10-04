"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { InputField } from "@/components/ui/Field";
import { FormAlert } from "@/components/ui/FormAlert";
import { Segmented } from "@/components/ui/Segmented";
import { useToast } from "@/components/ui/Toast";
import { centsToInput, currencySymbol, parseAmountToCents } from "@/lib/money";
import type { TagDTO, TransactionDTO, TransactionType } from "@/lib/types";
import { transactionSchema } from "@/lib/validation/budget";
import { fieldErrors, type FieldErrors } from "@/lib/validation/form";
import { updateTransactionAction } from "@/server/actions/transactions";

const TYPE_OPTIONS = [
  { value: "expense", label: "Expense" },
  { value: "income", label: "Income" },
] as const;

export function TransactionForm({
  tx,
  tags,
  currency,
  onSaved,
  onDelete,
}: {
  tx: TransactionDTO;
  tags: TagDTO[];
  currency: string;
  onSaved: () => void;
  onDelete: () => void;
}) {
  const toast = useToast();
  const [type, setType] = useState<TransactionType>(tx.type);
  const [amount, setAmount] = useState(centsToInput(tx.amount));
  const [date, setDate] = useState(tx.date);
  const [tagIds, setTagIds] = useState(tx.tagIds);
  const [note, setNote] = useState(tx.note);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<string>();
  const [pending, startTransition] = useTransition();

  function submit(e: FormEvent) {
    e.preventDefault();
    const cents = parseAmountToCents(amount);
    if (!cents) {
      setErrors({ amount: ["Enter a valid amount, e.g. 12.50"] });
      return;
    }
    const input = { categoryId: tx.categoryId, type, amount: cents, date, tagIds, note };
    const parsed = transactionSchema.safeParse(input);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    startTransition(async () => {
      const res = await updateTransactionAction(tx.id, input);
      if (res.ok) {
        toast({ message: "Transaction updated" });
        onSaved();
      } else {
        setErrors(res.errors ?? {});
        setMessage(res.message);
      }
    });
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      {message ? <FormAlert>{message}</FormAlert> : null}
      <Segmented label="Type" options={TYPE_OPTIONS} value={type} onChange={setType} className="w-full" />
      <div className="grid grid-cols-2 gap-3">
        <InputField
          label={`Amount (${currencySymbol(currency)})`}
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value);
            setErrors((er) => ({ ...er, amount: undefined }));
          }}
          inputMode="decimal"
          className="tabular text-[17px] font-semibold"
          error={errors.amount?.[0]}
        />
        <InputField
          label="Date"
          type="date"
          value={date}
          onChange={(e) => e.target.value && setDate(e.target.value)}
          error={errors.date?.[0]}
        />
      </div>
      {tags.length > 0 ? (
        <fieldset>
          <legend className="mb-2 text-[13px] font-medium text-ink-2">Tags</legend>
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <Chip
                key={t.id}
                color={t.color}
                selected={tagIds.includes(t.id)}
                onClick={() => setTagIds((ids) => (ids.includes(t.id) ? ids.filter((i) => i !== t.id) : [...ids, t.id]))}
              >
                {t.name}
              </Chip>
            ))}
          </div>
        </fieldset>
      ) : null}
      <InputField
        label="Note (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={200}
        placeholder="e.g. Size 4, pack of 60"
        error={errors.note?.[0]}
      />
      <Button type="submit" size="lg" block loading={pending} className="mt-1">
        Save changes
      </Button>
      <Button variant="ghost" block className="-mt-1 text-expense hover:bg-expense-soft hover:text-expense" onClick={onDelete}>
        <Trash2 className="size-4" aria-hidden /> Delete transaction
      </Button>
    </form>
  );
}
