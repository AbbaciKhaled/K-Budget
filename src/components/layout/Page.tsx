import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/** Standard page container: mobile gutters, bottom-nav clearance, centered max width on desktop. */
export function Page({
  children,
  wide,
  withQuickAdd,
  className,
}: {
  children: React.ReactNode;
  wide?: boolean;
  /** Leaves room for the fixed quick-add panel on mobile. */
  withQuickAdd?: boolean;
  className?: string;
}) {
  return (
    <main
      className={cn(
        "mx-auto w-full px-4 pt-[max(env(safe-area-inset-top),16px)] sm:px-6 lg:px-10 lg:pb-12 lg:pt-10",
        withQuickAdd ? "pb-[calc(env(safe-area-inset-bottom)+390px)]" : "pb-[calc(env(safe-area-inset-bottom)+96px)]",
        wide ? "max-w-5xl" : "max-w-2xl",
        className,
      )}
    >
      {children}
    </main>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
  backHref,
}: {
  title: string;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  backHref?: string;
}) {
  return (
    <header className="mb-6 flex items-end justify-between gap-4">
      <div className="min-w-0">
        {backHref ? (
          <Link
            href={backHref}
            className="-ml-2 mb-2 inline-flex h-9 items-center gap-1 rounded-lg px-2 text-[14px] font-medium text-muted hover:text-ink"
          >
            <ChevronLeft className="size-4" aria-hidden /> Back
          </Link>
        ) : null}
        <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.035em] sm:text-[32px]">{title}</h1>
        {subtitle ? <div className="mt-1 text-[15px] text-muted">{subtitle}</div> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
