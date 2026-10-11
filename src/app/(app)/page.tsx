import { HomeView } from "@/components/home/HomeView";
import { Page } from "@/components/layout/Page";
import { todayISO } from "@/lib/dates";
import { getCategoryContext } from "@/server/queries/categories";
import { listTagsByRecentUsage } from "@/server/queries/tags";
import { getRecentTransactions, getYearTotals } from "@/server/queries/transactions";

export default async function HomePage() {
  const { user, categories, current } = await getCategoryContext();
  const today = todayISO();
  const [tags, totals, recent] = await Promise.all([
    listTagsByRecentUsage(current.id),
    getYearTotals(current.id, today),
    getRecentTransactions(current.id, 5),
  ]);

  return (
    <Page wide withQuickAdd>
      <HomeView
        userId={user.id}
        userName={user.name}
        currency={current.currency}
        today={today}
        periodLabel={today.slice(0, 4)}
        categories={categories}
        current={current}
        tags={tags}
        totals={totals}
        recent={recent}
      />
    </Page>
  );
}
