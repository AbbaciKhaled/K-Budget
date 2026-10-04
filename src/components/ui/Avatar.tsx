import { cn, initials } from "@/lib/utils";

export function Avatar({ name, size = 40, className }: { name: string; size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-accent-soft font-semibold tracking-tight text-accent-ink ring-1 ring-accent/10",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
