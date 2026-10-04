import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-10 text-center", className)}>
      <div className="flex size-14 items-center justify-center rounded-2xl bg-subtle text-[26px] text-muted">{icon}</div>
      <p className="mt-4 text-[16px] font-semibold tracking-[-0.01em]">{title}</p>
      {description ? <p className="mt-1 max-w-xs text-[14px] text-muted">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
