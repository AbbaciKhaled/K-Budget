import type { Metadata } from "next";
import { KpiDashboard } from "@/components/kpis/KpiDashboard";
import { Page } from "@/components/layout/Page";
import { todayISO } from "@/lib/dates";
import { resolvePeriod } from "@/lib/periods";
import { getCategoryContext } from "@/server/queries/categories";
import { getKpis } from "@/server/queries/kpis";
import { listTags } from "@/server/queries/tags";

export const metadata: Metadata = { title: "KPIs" };

const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);

export default async function KpisPage({ searchParams }: PageProps<"/kpis">) {
  const params = await searchParams;
  const today = todayISO();
  const period = resolvePeriod(
    { period: one(params.period), from: one(params.from), to: one(params.to), g: one(params.g) },
    today,
  );
  const { user, categories, current } = await getCategoryContext();
  const [tags, data] = await Promise.all([listTags(current.id), getKpis(current.id, period)]);

  return (
    <Page wide>
      <KpiDashboard
        categories={categories}
        current={current}
        tags={tags}
        currency={user.currency}
        today={today}
        period={period}
        data={data}
      />
    </Page>
  );
}
