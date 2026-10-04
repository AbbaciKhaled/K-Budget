import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden>
      <rect width="32" height="32" rx="9" fill="#0c0f14" />
      <path d="M10 8.5v15" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M21.5 8.5 13.6 16l7.9 7.5" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="23.5" cy="16" r="2.4" fill="#3245ff" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="text-[17px] font-semibold tracking-[-0.02em] text-ink">K-Budget</span>
    </span>
  );
}
