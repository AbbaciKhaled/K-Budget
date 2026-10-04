import { formatMoney, formatMoneyParts } from "@/lib/money";
import { cn } from "@/lib/utils";

/** Large display amount with de-emphasised decimals. */
export function BigMoney({
  cents,
  currency,
  className,
  sign = "auto",
}: {
  cents: number;
  currency: string;
  className?: string;
  sign?: Intl.NumberFormatOptions["signDisplay"];
}) {
  const { main, fraction } = formatMoneyParts(cents, currency, sign);
  return (
    <span className={cn("tabular font-semibold tracking-[-0.045em]", className)} aria-label={formatMoney(cents, currency, { sign })}>
      <span aria-hidden>{main}</span>
      <span aria-hidden className="opacity-40">
        {fraction}
      </span>
    </span>
  );
}
