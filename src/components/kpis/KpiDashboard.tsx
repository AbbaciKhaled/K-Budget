"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { CategorySwitcher } from "@/components/categories/CategorySwitcher";
import { PageHeader } from "@/components/layout/Page";
import { Button } from "@/components/ui/Button";
import { Card, SectionTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { InputField } from "@/components/ui/Field";
import { Segmented } from "@/components/ui/Segmented";
import { GRANULARITY_OPTIONS, PERIOD_OPTIONS, periodTitle, type Granularity, type Period, type PeriodKind } from "@/lib/periods";
import type { CategoryDTO, TagDTO } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { KpiData } from "@/server/queries/kpis";
import { BalanceChart, CHART_COLORS, IncomeExpenseChart, Legend, SeriesTable } from "./charts";
import { KpiCards } from "./KpiCards";
import { LargestTransactions } from "./LargestTransactions";
import { TagBreakdown } from "./TagBreakdown";
import { TagInOut } from "./TagInOut";

type Props = {
  userId: string;
  categories: CategoryDTO[];
  current: CategoryDTO;
  tags: TagDTO[];
  currency: string;
  today: string;
  period: Period;
  data: KpiData;
};

const VS_LABEL: Record<PeriodKind, string> = {
  week: "vs last week",
  month: "vs last month",
  year: "vs last year",
  custom: "vs previous period",
};

export function KpiDashboard({ userId, categories, current, tags, currency, today, period, data }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [customOpen, setCustomOpen] = useState(period.kind === "custom");
  const [from, setFrom] = useState(period.from);
  const [to, setTo] = useState(period.to);
  const tagsById = useMemo(() => new Map(tags.map((t) => [t.id, t])), [tags]);
  const { title, range } = periodTitle(period, today);

  function navigate(params: Record<string, string | undefined>) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) qs.set(k, v);
    startTransition(() => router.replace(`${pathname}?${qs}`, { scroll: false }));
  }

  function onPeriod(kind: PeriodKind) {
    if (kind === "custom") {
      setCustomOpen(true);
      return;
    }
    setCustomOpen(false);
    navigate({ period: kind });
  }

  function onGranularity(g: Granularity) {
    navigate({
      period: period.kind,
      ...(period.kind === "custom" ? { from: period.from, to: period.to } : {}),
      g,
    });
  }

  const empty = data.current.count === 0;

  return (
    <>
      <PageHeader
        title="KPIs"
        subtitle={
          <span>
            {title} · <span className="tabular">{range}</span>
          </span>
        }
        action={<CategorySwitcher categories={categories} current={current} />}
      />

      {/* Filters: one row above the charts */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented
          label="Period"
          options={PERIOD_OPTIONS}
          value={customOpen ? "custom" : period.kind}
          onChange={onPeriod}
          className="w-full sm:w-auto"
        />
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium text-muted">Group by</span>
          <Segmented size="sm" label="Granularity" options={GRANULARITY_OPTIONS} value={period.granularity} onChange={onGranularity} />
        </div>
      </div>

      {customOpen ? (
        <Card className="mb-5 p-4">
          <form
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              if (from && to) navigate({ period: "custom", from, to });
            }}
          >
            <InputField label="From" type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} wrapperClassName="flex-1" />
            <InputField label="To" type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} wrapperClassName="flex-1" />
            <Button type="submit" size="lg" className="h-12" disabled={!from || !to || from > to} loading={pending}>
              Apply
            </Button>
          </form>
        </Card>
      ) : null}

      <div className={cn("flex flex-col gap-5 transition-opacity", pending && "opacity-50")} aria-busy={pending}>
        {!data.hasAnyTransactions ? (
          <Card>
            <EmptyState
              icon="📊"
              title={`No data for ${current.name} yet`}
              description="Add a few transactions and your insights will show up here."
              action={
                <Link href="/" className="press inline-flex h-11 items-center rounded-xl bg-ink px-4 text-[15px] font-semibold text-white">
                  Add a transaction
                </Link>
              }
            />
          </Card>
        ) : (
          <>
            <KpiCards
              current={data.current}
              previous={data.previous}
              currency={currency}
              vsLabel={VS_LABEL[period.kind]}
              periodLabel={title.toLowerCase()}
            />

            {empty ? (
              <Card>
                <EmptyState
                  icon="🗓️"
                  title="Nothing in this period"
                  description="Try a longer period, or add a transaction for these dates."
                  action={
                    <Button variant="secondary" onClick={() => onPeriod("year")}>
                      Show this year
                    </Button>
                  }
                />
              </Card>
            ) : (
              <>
                <div className="grid gap-5 lg:grid-cols-2">
                  <Card className="p-5 sm:p-6">
                    <SectionTitle>Income vs expenses</SectionTitle>
                    <div className="mb-3 mt-2">
                      <Legend
                        items={[
                          { label: "Income", color: CHART_COLORS.income },
                          { label: "Expenses", color: CHART_COLORS.expense },
                        ]}
                      />
                    </div>
                    <IncomeExpenseChart data={data.series} currency={currency} />
                    <SeriesTable data={data.series} currency={currency} />
                  </Card>
                  <Card className="p-5 sm:p-6">
                    <SectionTitle>Cumulative balance</SectionTitle>
                    <p className="mb-3 mt-1 text-[13px] text-muted">Running net since {range.split(" – ")[0]}</p>
                    <BalanceChart data={data.series} currency={currency} />
                  </Card>
                </div>

                <TagBreakdown byTag={data.byTag} tags={tags} currency={currency} />
                <TagInOut byTag={data.byTag} tags={tags} currency={currency} />
                <LargestTransactions
                  largest={data.largest}
                  tagsById={tagsById}
                  currency={currency}
                  today={today}
                  viewerId={current.shared ? userId : undefined}
                />
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}
