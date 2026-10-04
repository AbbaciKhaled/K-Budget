"use client";

import { useState, useTransition, type FormEvent } from "react";
import { ChevronRight, Plus, Trash2 } from "lucide-react";
import { CategorySwitcher } from "@/components/categories/CategorySwitcher";
import { PageHeader } from "@/components/layout/Page";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { InputField } from "@/components/ui/Field";
import { ColorPicker } from "@/components/ui/Pickers";
import { Sheet } from "@/components/ui/Sheet";
import { useToast } from "@/components/ui/Toast";
import { formatMoney } from "@/lib/money";
import { pickColor } from "@/lib/palette";
import type { CategoryDTO, TagDTO } from "@/lib/types";
import { tagUpdateSchema } from "@/lib/validation/budget";
import { createTagAction, deleteTagAction, updateTagAction } from "@/server/actions/tags";

type TagWithUsage = TagDTO & { usage: number; income: number; expense: number };

export function TagsManager({
  categories,
  current,
  tags,
  currency,
}: {
  categories: CategoryDTO[];
  current: CategoryDTO;
  tags: TagWithUsage[];
  currency: string;
}) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [createError, setCreateError] = useState<string>();
  const [creating, startCreate] = useTransition();
  const [editing, setEditing] = useState<TagWithUsage | null>(null);
  const [deleting, setDeleting] = useState<TagWithUsage | null>(null);
  const [pendingDelete, startDelete] = useTransition();

  function create(e: FormEvent) {
    e.preventDefault();
    const parsed = tagUpdateSchema.shape.name.safeParse(name);
    if (!parsed.success) {
      setCreateError(parsed.error.issues[0]?.message);
      return;
    }
    startCreate(async () => {
      const res = await createTagAction({ categoryId: current.id, name: parsed.data, color: pickColor(tags.length) });
      if (res.ok) {
        setName("");
        setCreateError(undefined);
        toast({ message: `Tag “${parsed.data}” created` });
      } else {
        setCreateError(res.errors?.name?.[0] ?? res.message ?? "Couldn't create tag");
      }
    });
  }

  function confirmDelete() {
    if (!deleting) return;
    const target = deleting;
    startDelete(async () => {
      const res = await deleteTagAction(target.id);
      setDeleting(null);
      setEditing(null);
      toast(res.ok ? { message: `Tag “${target.name}” deleted` } : { message: res.message ?? "Couldn't delete tag", tone: "error" });
    });
  }

  return (
    <>
      <PageHeader title="Tags" subtitle="Tags belong to a single category. Amounts are all-time in / out." />

      <div className="mb-5 flex items-center justify-between gap-3">
        <span className="text-[13px] font-medium text-muted">Category</span>
        <CategorySwitcher categories={categories} current={current} />
      </div>

      <form onSubmit={create} noValidate className="mb-5 flex items-start gap-2">
        <InputField
          label="New tag"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setCreateError(undefined);
          }}
          placeholder={`Add a tag to ${current.name}`}
          maxLength={30}
          error={createError}
          wrapperClassName="flex-1 [&>label]:sr-only"
        />
        <Button type="submit" size="lg" loading={creating} aria-label="Add tag" className="h-12">
          {!creating ? <Plus className="size-5" aria-hidden /> : null}
          <span className="hidden sm:inline">Add</span>
        </Button>
      </form>

      {tags.length === 0 ? (
        <Card>
          <EmptyState
            icon="🏷️"
            title={`No tags in ${current.name} yet`}
            description="Tags help you split spending — e.g. “Diapers”, “Clothes”, “Flea market”."
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-line/70">
            {tags.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => setEditing(t)}
                  className="flex min-h-14 w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-subtle/70"
                >
                  <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: t.color }} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-medium">{t.name}</span>
                    <span className="block text-[13px] text-muted">
                      {t.usage} {t.usage === 1 ? "use" : "uses"}
                    </span>
                  </span>
                  <span className="tabular flex flex-col items-end text-[13px] leading-snug">
                    <span className={t.income ? "font-semibold text-income" : "text-muted"}>
                      <span className="sr-only">In </span>
                      {formatMoney(t.income, currency, { sign: "exceptZero" })}
                    </span>
                    <span className={t.expense ? "font-semibold text-ink" : "text-muted"}>
                      <span className="sr-only">Out </span>
                      {formatMoney(-t.expense, currency, { sign: "exceptZero" })}
                    </span>
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-muted" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Sheet open={editing !== null && deleting === null} onClose={() => setEditing(null)} title="Edit tag">
        {editing ? (
          <TagEditForm
            key={editing.id}
            tag={editing}
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
        title={`Delete tag “${deleting?.name ?? ""}”?`}
        description={
          deleting?.usage
            ? `It will be removed from ${deleting.usage} transaction${deleting.usage === 1 ? "" : "s"}. The transactions themselves are kept.`
            : "This tag isn't used by any transaction."
        }
      />
    </>
  );
}

function TagEditForm({ tag, onSaved, onDelete }: { tag: TagWithUsage; onSaved: () => void; onDelete: () => void }) {
  const toast = useToast();
  const [name, setName] = useState(tag.name);
  const [color, setColor] = useState(tag.color);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function submit(e: FormEvent) {
    e.preventDefault();
    const parsed = tagUpdateSchema.safeParse({ name, color });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message);
      return;
    }
    startTransition(async () => {
      const res = await updateTagAction(tag.id, parsed.data);
      if (res.ok) {
        toast({ message: "Tag updated" });
        onSaved();
      } else {
        setError(res.errors?.name?.[0] ?? res.message);
      }
    });
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <InputField
        label="Name"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          setError(undefined);
        }}
        maxLength={30}
        error={error}
        autoFocus
      />
      <ColorPicker value={color} onChange={setColor} />
      <Button type="submit" size="lg" block loading={pending}>
        Save changes
      </Button>
      <Button variant="ghost" block className="-mt-2 text-expense hover:bg-expense-soft hover:text-expense" onClick={onDelete}>
        <Trash2 className="size-4" aria-hidden /> Delete tag
      </Button>
    </form>
  );
}
