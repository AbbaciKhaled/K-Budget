import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type ChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean;
  color?: string;
};

export const Chip = forwardRef<HTMLButtonElement, ChipProps>(function Chip(
  { selected, color, className, children, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-pressed={selected}
      className={cn(
        "press inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[14px] font-medium",
        selected ? "border-accent bg-accent text-white shadow-sm" : "border-line bg-surface text-ink-2 hover:border-line-strong",
        className,
      )}
      {...props}
    >
      {selected ? <Check className="size-3.5 stroke-[3]" aria-hidden /> : null}
      {color ? (
        <span className={cn("size-2 rounded-full", selected && "ring-2 ring-white")} style={{ backgroundColor: color }} aria-hidden />
      ) : null}
      {children}
    </button>
  );
});
