"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "./Button";
import { Sheet } from "./Sheet";

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Delete",
  pending,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  pending?: boolean;
}) {
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <div className="flex gap-3 rounded-2xl bg-expense-soft p-4 text-[14px] leading-relaxed text-[#8f1f24]">
        <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden />
        <div>{description}</div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Button variant="secondary" size="lg" onClick={onClose} disabled={pending}>
          Cancel
        </Button>
        <Button variant="danger" size="lg" onClick={onConfirm} loading={pending}>
          {confirmLabel}
        </Button>
      </div>
    </Sheet>
  );
}
