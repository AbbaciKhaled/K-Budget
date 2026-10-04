import { HomeView } from "@/components/home/HomeView";
import { Page } from "@/components/layout/Page";
import { monthName, todayISO } from "@/lib/dates";
import { getCategoryContext } from "@/server/queries/categories";
import { listTagsByRecentUsage } from "@/server/queries/tags";
import { getMonthTotals, getRecentTransactions } from "@/server/queries/transactions";

export default async function HomePage() {
  const { user, categories, current } = await getCategoryContext();
  const today = todayISO();
  const [tags, totals, recent] = await Promise.all([
    listTagsByRecentUsage(current.id),
    getMonthTotals(current.id, today),
    getRecentTransactions(current.id, 5),
  ]);

  return (
    <Page wide withQuickAdd>
      <HomeView
        userName={user.name}
        currency={user.currency}
        today={today}
        monthLabel={monthName(today)}
        categories={categories}
        current={current}
        tags={tags}
        totals={totals}
        recent={recent}
      />
    </Page>
  );
}
