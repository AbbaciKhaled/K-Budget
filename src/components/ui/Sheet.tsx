"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type SheetProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

/**
 * Native <dialog> (focus trap, Esc, inert background for free).
 * Bottom sheet on mobile, centered modal from `sm` up.
 */
export function Sheet({ open, onClose, title, description, children, className }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      // React propagates `close`/`cancel` through the component tree, so a sheet opened
      // inside this one (e.g. the tag picker in the edit form) would close it too.
      onClose={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onCancel={(e) => {
        if (e.target !== e.currentTarget) return;
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      aria-label={title}
      className={cn(
        "mx-0 mb-0 mt-auto max-h-[88dvh] w-full max-w-none overflow-hidden rounded-t-[28px] bg-surface p-0 text-ink shadow-pop open:animate-sheet-in",
        "sm:m-auto sm:max-w-md sm:rounded-3xl",
        className,
      )}
    >
      {open ? (
        <div className="flex max-h-[88dvh] flex-col">
          <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-line-strong sm:hidden" aria-hidden />
          <div className="flex items-start justify-between gap-4 px-5 pb-2 pt-4 sm:px-6 sm:pt-6">
            <div>
              <h2 className="text-[19px] font-semibold tracking-[-0.02em]">{title}</h2>
              {description ? <p className="mt-1 text-[14px] text-muted">{description}</p> : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="-mr-2 -mt-1 flex size-11 shrink-0 items-center justify-center rounded-xl text-muted hover:bg-subtle hover:text-ink"
            >
              <X className="size-5" />
            </button>
          </div>
          <div className="overflow-y-auto px-5 pb-[max(env(safe-area-inset-bottom),20px)] pt-2 sm:px-6 sm:pb-6">{children}</div>
        </div>
      ) : null}
    </dialog>
  );
}
