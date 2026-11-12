"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Plus, Tags, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { InputField } from "@/components/ui/Field";
import { FormAlert } from "@/components/ui/FormAlert";
import { Segmented } from "@/components/ui/Segmented";
import { useToast } from "@/components/ui/Toast";
import { TagPickerSheet } from "@/components/home/TagPickerSheet";
import { centsToInput, currencySymbol, parseAmountToCents } from "@/lib/money";
import { pickColor } from "@/lib/palette";
import type { TagDTO, TransactionDTO, TransactionType } from "@/lib/types";
import { transactionSchema } from "@/lib/validation/budget";
import { fieldErrors, type FieldErrors } from "@/lib/validation/form";
import { createTagAction } from "@/server/actions/tags";
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
  const [newTags, setNewTags] = useState<TagDTO[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [creatingTag, startCreatingTag] = useTransition();

  const allTags = [...tags, ...newTags.filter((t) => !tags.some((x) => x.id === t.id))];
  // Few tags: show them all inline. Many: show the selected ones, the rest live in the picker.
  const inline = allTags.length <= 8 ? allTags : allTags.filter((t) => tagIds.includes(t.id));

  function toggleTag(id: string) {
    setTagIds((ids) => (ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]));
  }

  /** Creates (or reuses) a tag in this transaction's category and selects it. */
  function createTag(name: string) {
    const existing = allTags.find((t) => t.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      setTagIds((ids) => (ids.includes(existing.id) ? ids : [...ids, existing.id]));
      return Promise.resolve(true);
    }
    return new Promise<boolean>((resolve) => {
      startCreatingTag(async () => {
        const res = await createTagAction({ categoryId: tx.categoryId, name, color: pickColor(allTags.length) });
        if (res.ok && res.data) {
          const tag = res.data;
          setNewTags((t) => [...t, tag]);
          setTagIds((ids) => [...ids, tag.id]);
          resolve(true);
        } else {
          toast({ message: (!res.ok && (res.errors?.name?.[0] ?? res.message)) || "Couldn't create tag", tone: "error" });
          resolve(false);
        }
      });
    });
  }

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
      <fieldset>
        <legend className="mb-2 text-[13px] font-medium text-ink-2">
          Tags{tagIds.length ? <span className="text-muted"> · {tagIds.length} selected</span> : null}
        </legend>
        <div className="flex flex-wrap gap-2">
          {inline.map((t) => (
            <Chip key={t.id} color={t.color} selected={tagIds.includes(t.id)} onClick={() => toggleTag(t.id)}>
              {t.name}
            </Chip>
          ))}
          <Chip onClick={() => setPickerOpen(true)} className="border-dashed text-muted">
            {allTags.length ? <Tags className="size-4" aria-hidden /> : <Plus className="size-4" aria-hidden />}
            {allTags.length === 0 ? "Add a tag" : allTags.length > 8 ? "Edit tags" : "More / new tag"}
          </Chip>
        </div>
      </fieldset>
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

      <TagPickerSheet
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        tags={allTags}
        selected={tagIds}
        onToggle={toggleTag}
        onCreate={createTag}
        creating={creatingTag}
      />
    </form>
  );
}
