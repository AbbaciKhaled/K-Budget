"use client";

import { useRef, useState, useTransition, type KeyboardEvent } from "react";
import { ArrowDownLeft, ArrowUpRight, CalendarDays, PenLine, Plus, Tags, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { useToast } from "@/components/ui/Toast";
import { addDays, relativeDayLabel } from "@/lib/dates";
import { currencySymbol, parseAmountToCents } from "@/lib/money";
import { newObjectId } from "@/lib/objectId";
import { pickColor } from "@/lib/palette";
import type { TagDTO, TransactionDTO, TransactionType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { createTagAction } from "@/server/actions/tags";
import { TagPickerSheet } from "./TagPickerSheet";

/** Keep only digits and a single decimal separator with ≤ 2 decimals. */
function sanitizeAmount(raw: string) {
  const match = raw.replace(/[^\d.,]/g, "").match(/^(\d{0,9})([.,]?)(\d{0,2})/);
  if (!match) return "";
  const [, int, sep, dec] = match;
  return (int === "" && sep ? "0" : int) + sep + dec;
}

type Props = {
  categoryId: string;
  tags: TagDTO[];
  currency: string;
  today: string;
  me: { id: string; name: string };
  onAdd: (tx: TransactionDTO) => void;
};

export function QuickAdd({ categoryId, tags, currency, today, me, onAdd }: Props) {
  const toast = useToast();
  const amountRef = useRef<HTMLInputElement>(null);
  const tagRowRef = useRef<HTMLDivElement>(null);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today);
  const [selected, setSelected] = useState<string[]>([]);
  const [shaking, setShaking] = useState(false);
  const [note, setNote] = useState("");
  const [newTags, setNewTags] = useState<TagDTO[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [savingTag, startSavingTag] = useTransition();

  const allTags = [...tags, ...newTags.filter((t) => t.categoryId === categoryId && !tags.some((x) => x.id === t.id))];
  const cents = parseAmountToCents(amount);

  function save(type: TransactionType) {
    if (!cents) {
      setShaking(true);
      amountRef.current?.focus();
      return;
    }
    onAdd({
      id: newObjectId(),
      categoryId,
      type,
      amount: cents,
      date,
      tagIds: selected.filter((id) => allTags.some((t) => t.id === id)),
      note: note.trim(),
      author: me,
    });
    setAmount("");
    setNote("");
    setSelected([]);
    amountRef.current?.focus();
  }

  function onAmountKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      save(e.shiftKey ? "income" : "expense");
    }
  }

  function toggleTag(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  /** Creates (or reuses) a tag by name and selects it. Resolves true on success. */
  function createTag(name: string) {
    const existing = allTags.find((t) => t.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      setSelected((s) => (s.includes(existing.id) ? s : [...s, existing.id]));
      return Promise.resolve(true);
    }
    return new Promise<boolean>((resolve) => {
      startSavingTag(async () => {
        const res = await createTagAction({ categoryId, name, color: pickColor(allTags.length) });
        if (res.ok && res.data) {
          const tag = res.data;
          setNewTags((t) => [...t, tag]);
          setSelected((s) => [...s, tag.id]);
          resolve(true);
        } else {
          toast({ message: (!res.ok && (res.errors?.name?.[0] ?? res.message)) || "Couldn't create tag", tone: "error" });
          resolve(false);
        }
      });
    });
  }

  function onNoteKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    // On touch devices "Done" just closes the keyboard; with a keyboard, Enter saves like the amount field.
    if (window.matchMedia("(pointer: coarse)").matches) e.currentTarget.blur();
    else save(e.shiftKey ? "income" : "expense");
  }

  const isToday = date === today;

  return (
    <section
      aria-label="Quick add"
      className={cn(
        "fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-30 rounded-t-[28px] border-t border-line/70 bg-surface px-4 pb-4 pt-3 shadow-float",
        "lg:sticky lg:top-10 lg:bottom-auto lg:z-auto lg:rounded-2xl lg:border lg:p-5 lg:shadow-card",
      )}
    >
      <div className="mx-auto max-w-2xl">
        {/* Amount */}
        <label
          onAnimationEnd={() => setShaking(false)}
          className={cn("flex items-baseline gap-1.5 rounded-2xl px-1", shaking && "animate-shake")}
        >
          <span aria-hidden className="text-[28px] font-semibold text-muted">
            {currencySymbol(currency)}
          </span>
          <input
            ref={amountRef}
            value={amount}
            onChange={(e) => setAmount(sanitizeAmount(e.target.value))}
            onKeyDown={onAmountKeyDown}
            aria-label="Amount"
            inputMode="decimal"
            enterKeyHint="done"
            autoComplete="off"
            autoFocus
            placeholder="0.00"
            aria-invalid={shaking || undefined}
            className="tabular h-14 w-full min-w-0 bg-transparent text-[44px] font-semibold tracking-[-0.045em] text-ink caret-accent outline-none placeholder:text-line-strong focus-visible:outline-none"
          />
        </label>

        {/* Description */}
        <label className="mt-1 flex h-11 items-center gap-2 rounded-xl bg-subtle px-3 focus-within:bg-surface focus-within:shadow-[0_0_0_1px_var(--color-accent),0_0_0_4px_var(--color-accent-soft)]">
          <PenLine className="size-4 shrink-0 text-muted" aria-hidden />
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={onNoteKeyDown}
            maxLength={200}
            placeholder="Add a description (optional)"
            aria-label="Description"
            enterKeyHint="done"
            autoComplete="off"
            className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-muted focus-visible:outline-none"
          />
          {note ? (
            <button
              type="button"
              onClick={() => setNote("")}
              aria-label="Clear description"
              className="-mr-1.5 flex size-8 items-center justify-center rounded-lg text-muted hover:text-ink"
            >
              <X className="size-4" aria-hidden />
            </button>
          ) : null}
        </label>

        {/* Date + access to every tag */}
        <div className="mt-2.5 flex items-center gap-2">
          <div className="relative shrink-0">
            <input
              type="date"
              value={date}
              onChange={(e) => e.target.value && setDate(e.target.value)}
              onClick={(e) => {
                try {
                  e.currentTarget.showPicker();
                } catch {
                  /* not supported: native focus behaviour */
                }
              }}
              aria-label="Transaction date"
              className="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
            />
            <span className="pointer-events-none flex h-10 items-center gap-1.5 rounded-full bg-ink px-3.5 text-[14px] font-medium text-white peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-focus-visible:ring-offset-2">
              <CalendarDays className="size-4" aria-hidden />
              {relativeDayLabel(date, today)}
            </span>
          </div>
          <Chip onClick={() => setDate(isToday ? addDays(today, -1) : today)} className="text-muted">
            {isToday ? "Yesterday" : "Today"}
          </Chip>

          <span className="flex-1" />
          {/* Always visible: opens the full, searchable tag list */}
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            aria-label={allTags.length ? `All tags${selected.length ? `, ${selected.length} selected` : ""}` : "Create a tag"}
            className={cn(
              "press relative flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[14px] font-medium",
              selected.length ? "border-accent bg-accent-soft text-accent-ink" : "border-line bg-surface text-ink-2 hover:border-line-strong",
            )}
          >
            {allTags.length ? <Tags className="size-4" aria-hidden /> : <Plus className="size-4" aria-hidden />}
            {allTags.length ? "Tags" : "Tag"}
            {selected.length ? (
              <span className="flex size-5 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-white">
                {selected.length}
              </span>
            ) : null}
          </button>
        </div>

        {/* Most-used tags, one tap away */}
        {allTags.length ? (
          <div
            ref={tagRowRef}
            className="-mx-4 mt-2 flex items-center gap-2 overflow-x-auto px-4 pb-0.5 [mask-image:linear-gradient(to_right,black_90%,transparent)] [scrollbar-width:none] lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0 lg:[mask-image:none]"
          >
            {allTags.map((t) => (
              <Chip key={t.id} selected={selected.includes(t.id)} color={t.color} onClick={() => toggleTag(t.id)}>
                {t.name}
              </Chip>
            ))}
          </div>
        ) : null}

        {/* Actions */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Button variant="income" size="xl" onClick={() => save("income")} aria-label="Save as income">
            <ArrowDownLeft className="size-5 stroke-[2.5]" aria-hidden />
            Income
          </Button>
          <Button variant="expense" size="xl" onClick={() => save("expense")} aria-label="Save as expense">
            <ArrowUpRight className="size-5 stroke-[2.5]" aria-hidden />
            Expense
          </Button>
        </div>
        <p className="mt-3 hidden text-center text-[12px] text-muted lg:block">
          <kbd className="font-sans font-semibold text-ink-2">Enter</kbd> saves an expense ·{" "}
          <kbd className="font-sans font-semibold text-ink-2">Shift + Enter</kbd> saves income
        </p>
      </div>

      <TagPickerSheet
        open={pickerOpen}
        onClose={() => {
          setPickerOpen(false);
          amountRef.current?.focus({ preventScroll: true });
          // Bring the first selected tag into view so the choice made in the sheet is visible.
          requestAnimationFrame(() =>
            tagRowRef.current
              ?.querySelector('[aria-pressed="true"]')
              ?.scrollIntoView({ inline: "nearest", block: "nearest", behavior: "smooth" }),
          );
        }}
        tags={allTags}
        selected={selected}
        onToggle={toggleTag}
        onCreate={createTag}
        creating={savingTag}
      />
    </section>
  );
}
