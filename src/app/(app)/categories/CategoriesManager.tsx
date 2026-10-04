"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ChevronRight, LogOut, Plus, Trash2, Users } from "lucide-react";
import { CategoryForm } from "@/components/categories/CategoryForm";
import { CategorySharing } from "@/components/categories/CategorySharing";
import { CategoryBadge } from "@/components/categories/CategorySwitcher";
import { PageHeader } from "@/components/layout/Page";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Sheet } from "@/components/ui/Sheet";
import { useToast } from "@/components/ui/Toast";
import {
  createCategoryAction,
  deleteCategoryAction,
  leaveCategoryAction,
  updateCategoryAction,
} from "@/server/actions/categories";
import type { CategoryWithStats } from "@/server/queries/categories";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
const peopleCount = (n: number) => `${n} ${n === 1 ? "person" : "people"}`;

export function CategoriesManager({
  categories,
  currentId,
  viewerId,
  openNew,
}: {
  categories: CategoryWithStats[];
  currentId: string | null;
  viewerId: string;
  openNew: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [creating, setCreating] = useState(openNew);
  const [editing, setEditing] = useState<CategoryWithStats | null>(null);
  const [deleting, setDeleting] = useState<CategoryWithStats | null>(null);
  const [pendingDelete, startDelete] = useTransition();
  const [leaving, setLeaving] = useState<CategoryWithStats | null>(null);
  const [pendingLeave, startLeave] = useTransition();

  function closeCreate() {
    setCreating(false);
    if (openNew) router.replace("/categories", { scroll: false });
  }

  function confirmDelete() {
    if (!deleting) return;
    const target = deleting;
    startDelete(async () => {
      const res = await deleteCategoryAction(target.id);
      setDeleting(null);
      if (res.ok) {
        setEditing(null);
        toast({ message: `“${target.name}” deleted` });
        if (categories.length === 1) router.replace("/onboarding");
      } else {
        toast({ message: res.message ?? "Couldn't delete category", tone: "error" });
      }
    });
  }

  function confirmLeave() {
    if (!leaving) return;
    const target = leaving;
    startLeave(async () => {
      const res = await leaveCategoryAction(target.id);
      setLeaving(null);
      if (res.ok) {
        setEditing(null);
        toast({ message: `You left “${target.name}”` });
        if (categories.length === 1) router.replace("/onboarding");
      } else {
        toast({ message: res.message ?? "Couldn't leave category", tone: "error" });
      }
    });
  }

  return (
    <>
      <PageHeader
        title="Categories"
        subtitle="Each category is a budget of its own."
        action={
          <Button onClick={() => setCreating(true)} size="md">
            <Plus className="size-4" aria-hidden /> New
          </Button>
        }
      />

      {categories.length === 0 ? (
        <Card>
          <EmptyState icon="🗂️" title="No categories yet" action={<Button onClick={() => setCreating(true)}>Create a category</Button>} />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-line/70">
            {categories.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setEditing(c)}
                  className="flex min-h-[72px] w-full items-center gap-3.5 px-4 py-3 text-left transition-colors hover:bg-subtle/70"
                >
                  <CategoryBadge category={c} size={44} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-[16px] font-semibold tracking-[-0.01em]">{c.name}</span>
                      {c.id === currentId ? (
                        <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent-ink">Current</span>
                      ) : null}
                    </span>
                    <span className="block truncate text-[13px] text-muted">
                      {plural(c.transactionCount, "transaction")} · {plural(c.tagCount, "tag")}
                    </span>
                    {c.shared ? (
                      <span className="mt-0.5 flex items-center gap-1 text-[12px] font-medium text-accent-ink">
                        <Users className="size-3.5" aria-hidden />
                        {c.isOwner ? `Shared with ${peopleCount(c.members.length - 1)}` : `Shared by ${c.ownerName}`}
                      </span>
                    ) : null}
                  </span>
                  <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: c.color }} aria-hidden />
                  <ChevronRight className="size-4 shrink-0 text-muted" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Sheet open={creating} onClose={closeCreate} title="New category">
        <CategoryForm
          action={createCategoryAction}
          submitLabel="Create category"
          autoFocus
          onSuccess={() => {
            closeCreate();
            toast({ message: "Category created and selected" });
          }}
        />
      </Sheet>

      <Sheet
        open={editing !== null && deleting === null && leaving === null}
        onClose={() => setEditing(null)}
        title={editing?.isOwner === false ? editing.name : "Edit category"}
        description={editing?.isOwner === false ? `Shared with you by ${editing.ownerName}` : undefined}
      >
        {editing ? (
          <div className="flex flex-col gap-6">
            {editing.isOwner ? (
              <CategoryForm
                key={editing.id}
                initial={editing}
                action={(fd) => updateCategoryAction(editing.id, fd)}
                submitLabel="Save changes"
                onSuccess={() => {
                  setEditing(null);
                  toast({ message: "Category updated" });
                }}
              />
            ) : null}

            <div className={editing.isOwner ? "border-t border-line pt-5" : undefined}>
              <CategorySharing
                key={editing.id}
                categoryId={editing.id}
                members={editing.members}
                canManage={editing.isOwner}
                viewerId={viewerId}
              />
            </div>

            {editing.isOwner ? (
              <Button
                variant="ghost"
                block
                className="text-expense hover:bg-expense-soft hover:text-expense"
                onClick={() => setDeleting(editing)}
              >
                <Trash2 className="size-4" aria-hidden /> Delete category
              </Button>
            ) : (
              <Button
                variant="ghost"
                block
                className="text-expense hover:bg-expense-soft hover:text-expense"
                onClick={() => setLeaving(editing)}
              >
                <LogOut className="size-4" aria-hidden /> Leave category
              </Button>
            )}
          </div>
        ) : null}
      </Sheet>

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        pending={pendingDelete}
        title={`Delete “${deleting?.name ?? ""}”?`}
        confirmLabel="Delete everything"
        description={
          deleting ? (
            <>
              This permanently deletes the category, <strong>{plural(deleting.tagCount, "tag")}</strong> and{" "}
              <strong>{plural(deleting.transactionCount, "transaction")}</strong>
              {deleting.shared ? <> for everyone it&apos;s shared with</> : null}. This can&apos;t be undone.
            </>
          ) : null
        }
      />

      <ConfirmDialog
        open={leaving !== null}
        onClose={() => setLeaving(null)}
        onConfirm={confirmLeave}
        pending={pendingLeave}
        title={`Leave “${leaving?.name ?? ""}”?`}
        confirmLabel="Leave"
        description={
          leaving
            ? `You'll lose access to this budget. Transactions you added stay in it. ${leaving.ownerName} can share it with you again.`
            : null
        }
      />
    </>
  );
}
