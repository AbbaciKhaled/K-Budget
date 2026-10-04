"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastTone = "success" | "error" | "info";

type ToastInput = {
  message: string;
  tone?: ToastTone;
  action?: { label: string; onClick: () => void };
  duration?: number;
};

type ToastItem = ToastInput & { id: number };

const ToastContext = createContext<((t: ToastInput) => void) | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastItem | null>(null);
  const counter = useRef(0);

  const show = useCallback((t: ToastInput) => {
    counter.current += 1;
    setToast({ ...t, id: counter.current });
  }, []);

  const value = useMemo(() => show, [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex justify-center px-4 pt-[max(env(safe-area-inset-top),12px)] lg:pl-64"
      >
        {toast ? <ToastView key={toast.id} toast={toast} onClose={() => setToast(null)} /> : null}
      </div>
    </ToastContext.Provider>
  );
}

function ToastView({ toast, onClose }: { toast: ToastItem; onClose: () => void }) {
  const { tone = "success", duration = toast.action ? 5000 : 2800 } = toast;

  useEffect(() => {
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [duration, onClose]);

  return (
    <div
      role="status"
      className="pointer-events-auto flex min-h-12 w-full max-w-sm animate-toast-in items-center gap-3 rounded-2xl bg-ink py-2 pl-4 pr-2 text-[14px] text-white shadow-pop"
    >
      {tone === "error" ? (
        <AlertCircle className="size-[18px] shrink-0 text-[#ff8a8e]" aria-hidden />
      ) : (
        <CheckCircle2 className={cn("size-[18px] shrink-0", tone === "success" ? "text-[#4ade9b]" : "text-white/70")} aria-hidden />
      )}
      <span className="flex-1 font-medium">{toast.message}</span>
      {toast.action ? (
        <button
          type="button"
          onClick={() => {
            toast.action?.onClick();
            onClose();
          }}
          className="press h-9 rounded-xl px-3 text-[14px] font-semibold text-[#a9b2ff] hover:bg-white/10"
        >
          {toast.action.label}
        </button>
      ) : (
        <button type="button" onClick={onClose} aria-label="Dismiss" className="flex size-9 items-center justify-center rounded-xl text-white/60 hover:bg-white/10 hover:text-white">
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
