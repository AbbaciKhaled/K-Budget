"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { Check, ChevronDown, Plus, Settings2, Users } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import type { CategoryDTO } from "@/lib/types";
import { cn } from "@/lib/utils";
import { selectCategoryAction } from "@/server/actions/categories";

export function CategoryBadge({ category, size = 36 }: { category: Pick<CategoryDTO, "icon" | "color">; size?: number }) {
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-xl"
      style={{ width: size, height: size, fontSize: size * 0.5, backgroundColor: `${category.color}1a` }}
    >
      {category.icon}
    </span>
  );
}

export function CategorySwitcher({
  categories,
  current,
  className,
}: {
  categories: CategoryDTO[];
  current: CategoryDTO;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [optimisticId, setOptimisticId] = useOptimistic(current.id);
  const toast = useToast();
  const shown = categories.find((c) => c.id === optimisticId) ?? current;

  function select(id: string) {
    setOpen(false);
    if (id === current.id) return;
    startTransition(async () => {
      setOptimisticId(id);
      const res = await selectCategoryAction(id);
      if (!res.ok) toast({ message: res.message ?? "Couldn't switch category", tone: "error" });
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={`Current category: ${shown.name}. Change category`}
        className={cn(
          "press flex h-11 max-w-[60vw] items-center gap-2 rounded-full border border-line bg-surface pl-1.5 pr-3 shadow-sm hover:border-line-strong sm:max-w-xs",
          className,
        )}
      >
        <CategoryBadge category={shown} size={32} />
        <span className="truncate text-[15px] font-semibold tracking-[-0.01em]">{shown.name}</span>
        {pending ? <Spinner className="size-4 text-muted" /> : <ChevronDown className="size-4 shrink-0 text-muted" aria-hidden />}
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Switch category">
        <ul className="flex flex-col gap-1" role="listbox" aria-label="Categories">
          {categories.map((c) => {
            const selected = c.id === shown.id;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => select(c.id)}
                  className={cn(
                    "flex h-14 w-full items-center gap-3 rounded-2xl px-2.5 text-left text-[16px] font-medium transition-colors",
                    selected ? "bg-subtle" : "hover:bg-subtle",
                  )}
                >
                  <CategoryBadge category={c} size={40} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{c.name}</span>
                    {c.shared ? (
                      <span className="flex items-center gap-1 text-[12px] font-medium text-muted">
                        <Users className="size-3.5" aria-hidden />
                        {c.isOwner ? "Shared" : `Shared by ${c.ownerName}`}
                      </span>
                    ) : null}
                  </span>
                  {selected ? <Check className="size-5 text-accent" aria-hidden /> : null}
                </button>
              </li>
            );
          })}
        </ul>
        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-3">
          <Link
            href="/categories?new=1"
            onClick={() => setOpen(false)}
            className="press flex h-12 items-center justify-center gap-2 rounded-xl bg-subtle text-[14px] font-semibold hover:bg-line"
          >
            <Plus className="size-4" aria-hidden /> New category
          </Link>
          <Link
            href="/categories"
            onClick={() => setOpen(false)}
            className="press flex h-12 items-center justify-center gap-2 rounded-xl bg-subtle text-[14px] font-semibold hover:bg-line"
          >
            <Settings2 className="size-4" aria-hidden /> Manage
          </Link>
        </div>
      </Sheet>
    </>
  );
}
