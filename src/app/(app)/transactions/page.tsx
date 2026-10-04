import type { Metadata } from "next";
import { Page } from "@/components/layout/Page";
import { ISO_DATE_RE, todayISO } from "@/lib/dates";
import { getCategoryContext } from "@/server/queries/categories";
import { listTags } from "@/server/queries/tags";
import { listTransactions, type TransactionFilters } from "@/server/queries/transactions";
import { TransactionsView } from "./TransactionsView";

export const metadata: Metadata = { title: "Transactions" };

const PAGE_SIZE = 50;

function one(v: string | string[] | undefined) {
  return typeof v === "string" ? v : undefined;
}

export default async function TransactionsPage({ searchParams }: PageProps<"/transactions">) {
  const params = await searchParams;
  const { user, categories, current } = await getCategoryContext();
  const tags = await listTags(current.id);

  const type = one(params.type);
  const tag = one(params.tag);
  const from = one(params.from);
  const to = one(params.to);
  const limit = Math.min(Math.max(Number(one(params.limit)) || PAGE_SIZE, PAGE_SIZE), 1000);

  const filters: TransactionFilters = {
    type: type === "income" || type === "expense" ? type : undefined,
    // Only accept a tag that belongs to the current category.
    tagId: tags.some((t) => t.id === tag) ? tag : undefined,
    from: from && ISO_DATE_RE.test(from) ? from : undefined,
    to: to && ISO_DATE_RE.test(to) ? to : undefined,
    limit,
  };

  const result = await listTransactions(current.id, filters);

  return (
    <Page>
      <TransactionsView
        key={current.id}
        categories={categories}
        current={current}
        tags={tags}
        currency={current.currency}
        userId={user.id}
        today={todayISO()}
        filters={filters}
        pageSize={PAGE_SIZE}
        {...result}
      />
    </Page>
  );
}
