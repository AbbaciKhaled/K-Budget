import type { Metadata } from "next";
import { Page } from "@/components/layout/Page";
import { getCategoryContext } from "@/server/queries/categories";
import { listTagsWithUsage } from "@/server/queries/tags";
import { TagsManager } from "./TagsManager";

export const metadata: Metadata = { title: "Tags" };

export default async function TagsPage() {
  const { user, categories, current } = await getCategoryContext();
  const tags = await listTagsWithUsage(current.id);
  return (
    <Page>
      <TagsManager key={current.id} categories={categories} current={current} tags={tags} currency={user.currency} />
    </Page>
  );
}
