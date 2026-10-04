"use client";

import { cn } from "@/lib/utils";

type Option<T extends string> = { value: T; label: string };

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
  size = "md",
}: {
  options: ReadonlyArray<Option<T>>;
  value: T;
  onChange: (value: T) => void;
  label: string;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("inline-flex rounded-xl bg-subtle p-1", className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "flex-1 whitespace-nowrap rounded-[9px] px-3 font-medium transition-[background-color,color,box-shadow] duration-150",
              size === "sm" ? "h-9 text-[13px]" : "h-10 text-[14px]",
              active ? "bg-surface text-ink shadow-[0_1px_3px_rgb(16_24_40/0.1)]" : "text-muted hover:text-ink",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
