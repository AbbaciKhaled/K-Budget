import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import type { CategoryDTO, CurrentUser } from "@/lib/types";
import { Category } from "@/models/Category";
import { Tag } from "@/models/Tag";
import { Transaction } from "@/models/Transaction";
import { toCategoryDTO } from "@/server/mappers";
import { requireUser, requireUserId } from "@/server/session";

export const listCategories = cache(async (): Promise<CategoryDTO[]> => {
  const userId = await requireUserId();
  await connectDB();
  const categories = await Category.find({ userId }).sort({ createdAt: 1 }).lean();
  return categories.map(toCategoryDTO);
});

export type CategoryContext = {
  user: CurrentUser;
  categories: CategoryDTO[];
  current: CategoryDTO;
};

/**
 * Everything a category-scoped screen needs: the user, their categories and the
 * current one (last used, or the first). Sends users without categories to onboarding.
 */
export const getCategoryContext = cache(async (): Promise<CategoryContext> => {
  const [user, categories] = await Promise.all([requireUser(), listCategories()]);
  if (categories.length === 0) redirect("/onboarding");
  const current = categories.find((c) => c.id === user.lastCategoryId) ?? categories[0];
  return { user, categories, current };
});

export async function listCategoriesWithStats() {
  const userId = await requireUserId();
  const categories = await listCategories();
  const [txCounts, tagCounts] = await Promise.all([
    Transaction.aggregate<{ _id: unknown; count: number }>([
      { $match: { userId } },
      { $group: { _id: "$categoryId", count: { $sum: 1 } } },
    ]),
    Tag.aggregate<{ _id: unknown; count: number }>([
      { $match: { userId } },
      { $group: { _id: "$categoryId", count: { $sum: 1 } } },
    ]),
  ]);
  const tx = new Map(txCounts.map((r) => [String(r._id), r.count]));
  const tags = new Map(tagCounts.map((r) => [String(r._id), r.count]));
  return categories.map((c) => ({ ...c, transactionCount: tx.get(c.id) ?? 0, tagCount: tags.get(c.id) ?? 0 }));
}
