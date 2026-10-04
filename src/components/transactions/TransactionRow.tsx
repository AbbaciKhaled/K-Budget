import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { relativeDayLabel } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import type { TagDTO, TransactionDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

export function transactionTitle(tx: TransactionDTO, tagsById: Map<string, TagDTO>) {
  const tagNames = tx.tagIds.map((id) => tagsById.get(id)?.name).filter(Boolean);
  if (tagNames.length) return { title: tagNames.join(", "), noteInSubtitle: true };
  if (tx.note) return { title: tx.note, noteInSubtitle: false };
  return { title: tx.type === "income" ? "Income" : "Expense", noteInSubtitle: false };
}

export function TransactionRow({
  tx,
  tagsById,
  currency,
  today,
  showDate = true,
  onClick,
  highlight,
  viewerId,
}: {
  tx: TransactionDTO;
  tagsById: Map<string, TagDTO>;
  currency: string;
  today: string;
  showDate?: boolean;
  onClick?: () => void;
  highlight?: boolean;
  /** Set in shared categories: shows who added the transaction ("You" for the viewer). */
  viewerId?: string;
}) {
  const income = tx.type === "income";
  const { title, noteInSubtitle } = transactionTitle(tx, tagsById);
  const author = viewerId ? (tx.author.id === viewerId ? "by you" : `by ${tx.author.name.split(" ")[0]}`) : null;
  const subtitle = [showDate ? relativeDayLabel(tx.date, today) : null, author, noteInSubtitle && tx.note ? tx.note : null]
    .filter(Boolean)
    .join(" · ");
  const firstTag = tx.tagIds.map((id) => tagsById.get(id)).find(Boolean);

  const content = (
    <>
      <span
        aria-hidden
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-full",
          income ? "bg-income-soft text-income" : "bg-subtle text-ink-2",
        )}
      >
        {income ? <ArrowDownLeft className="size-[18px] stroke-[2.25]" /> : <ArrowUpRight className="size-[18px] stroke-[2.25]" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          {firstTag ? <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: firstTag.color }} aria-hidden /> : null}
          <span className="truncate text-[15px] font-medium text-ink">{title}</span>
        </span>
        {subtitle ? <span className="block truncate text-[13px] text-muted">{subtitle}</span> : null}
      </span>
      <span className={cn("tabular shrink-0 text-[15px] font-semibold tracking-[-0.01em]", income ? "text-income" : "text-ink")}>
        {formatMoney(income ? tx.amount : -tx.amount, currency, { sign: "always" })}
      </span>
    </>
  );

  const className = cn(
    "flex min-h-16 w-full items-center gap-3 px-4 py-2.5 text-left",
    highlight && "animate-pop",
    onClick && "transition-colors hover:bg-subtle/70",
  );

  return onClick ? (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  ) : (
    <div className={className}>{content}</div>
  );
}
