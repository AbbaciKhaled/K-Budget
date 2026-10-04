import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { BigMoney } from "@/components/ui/Money";
import { formatMoney } from "@/lib/money";

export function SummaryCard({
  income,
  expense,
  currency,
  monthLabel,
}: {
  income: number;
  expense: number;
  currency: string;
  monthLabel: string;
}) {
  const balance = income - expense;
  const total = income + expense;
  const incomeShare = total === 0 ? 50 : (income / total) * 100;

  return (
    <Card className="relative overflow-hidden p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-muted">{monthLabel} balance</p>
        <Link
          href="/kpis"
          className="-mr-2 inline-flex h-9 items-center gap-0.5 rounded-lg px-2 text-[13px] font-semibold text-accent hover:bg-accent-soft"
        >
          Insights <ChevronRight className="size-3.5" aria-hidden />
        </Link>
      </div>
      <p className="mt-1">
        <BigMoney
          cents={balance}
          currency={currency}
          sign="exceptZero"
          className={balance < 0 ? "text-[40px] leading-none text-expense sm:text-[46px]" : "text-[40px] leading-none sm:text-[46px]"}
        />
      </p>

      <div
        className="mt-5 flex h-1.5 gap-1 overflow-hidden rounded-full"
        role="img"
        aria-label={`Income ${Math.round(incomeShare)}% of money moved this month`}
      >
        {total === 0 ? (
          <div className="h-full flex-1 rounded-full bg-subtle" />
        ) : (
          <>
            <div className="h-full rounded-full bg-income transition-[width] duration-500" style={{ width: `${incomeShare}%` }} />
            <div className="h-full flex-1 rounded-full bg-expense" />
          </>
        )}
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-income-soft/70 px-3.5 py-3">
          <dt className="flex items-center gap-1.5 text-[12px] font-medium text-income">
            <ArrowDownLeft className="size-3.5 stroke-[2.5]" aria-hidden /> Income
          </dt>
          <dd className="tabular mt-0.5 truncate text-[17px] font-semibold tracking-[-0.02em]">{formatMoney(income, currency)}</dd>
        </div>
        <div className="rounded-2xl bg-expense-soft/70 px-3.5 py-3">
          <dt className="flex items-center gap-1.5 text-[12px] font-medium text-expense">
            <ArrowUpRight className="size-3.5 stroke-[2.5]" aria-hidden /> Expenses
          </dt>
          <dd className="tabular mt-0.5 truncate text-[17px] font-semibold tracking-[-0.02em]">{formatMoney(expense, currency)}</dd>
        </div>
      </dl>
    </Card>
  );
}
