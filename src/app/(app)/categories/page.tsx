import type { Metadata } from "next";
import { Page } from "@/components/layout/Page";
import { listCategoriesWithStats } from "@/server/queries/categories";
import { requireUser } from "@/server/session";
import { CategoriesManager } from "./CategoriesManager";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage({ searchParams }: PageProps<"/categories">) {
  const [{ new: openNew }, user, categories] = await Promise.all([searchParams, requireUser(), listCategoriesWithStats()]);
  return (
    <Page>
      <CategoriesManager categories={categories} currentId={user.lastCategoryId} openNew={openNew === "1"} />
    </Page>
  );
}
