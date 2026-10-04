import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "./Spinner";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "income" | "expense" | "soft";
type Size = "sm" | "md" | "lg" | "xl" | "icon";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-white hover:bg-ink-2 shadow-sm",
  secondary: "bg-surface text-ink border border-line hover:border-line-strong hover:bg-subtle",
  soft: "bg-accent-soft text-accent-ink hover:bg-[#e2e5ff]",
  ghost: "text-ink-2 hover:bg-subtle hover:text-ink",
  danger: "bg-expense text-white hover:bg-expense-hover shadow-sm",
  income: "bg-income text-white hover:bg-income-hover shadow-[0_6px_16px_-6px_rgb(7_135_90/0.55)]",
  expense: "bg-expense text-white hover:bg-expense-hover shadow-[0_6px_16px_-6px_rgb(222_63_69/0.55)]",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm rounded-xl gap-1.5",
  md: "h-11 px-4 text-[15px] rounded-xl gap-2",
  lg: "h-12 px-5 text-base rounded-2xl gap-2",
  xl: "h-14 px-6 text-[17px] rounded-2xl gap-2.5",
  icon: "h-11 w-11 rounded-xl",
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  block?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading, block, className, children, disabled, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "press inline-flex shrink-0 select-none items-center justify-center font-semibold tracking-[-0.01em] disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        sizes[size],
        block && "w-full",
        className,
      )}
      {...props}
    >
      {loading ? <Spinner className="size-4" /> : null}
      {children}
    </button>
  );
});
