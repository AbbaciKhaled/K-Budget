import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import type { CategoryDTO, CurrentUser, MemberDTO } from "@/lib/types";
import { Category } from "@/models/Category";
import { Tag } from "@/models/Tag";
import { Transaction } from "@/models/Transaction";
import { User } from "@/models/User";
import { accessFilter } from "@/server/access";
import { requireUser, requireUserId } from "@/server/session";

type CategoryRow = CategoryDTO & { memberIds: string[] };

/** Every category the user owns or that was shared with them (deduplicated per request). */
const loadCategories = cache(async (): Promise<CategoryRow[]> => {
  const userId = await requireUserId();
  await connectDB();
  const docs = await Category.find(accessFilter(userId)).sort({ createdAt: 1 }).lean();

  const ownerIds = [...new Set(docs.map((d) => d.userId.toString()))];
  const owners = await User.find({ _id: { $in: ownerIds } }).select("name currency").lean();
  const ownersById = new Map(owners.map((o) => [o._id.toString(), o]));
  const me = userId.toString();

  return docs.map((d) => {
    const ownerId = d.userId.toString();
    const owner = ownersById.get(ownerId);
    const memberIds = (d.memberIds ?? []).map((m) => m.toString());
    return {
      id: d._id.toString(),
      name: d.name,
      icon: d.icon,
      color: d.color,
      ownerId,
      ownerName: owner?.name ?? "Unknown",
      isOwner: ownerId === me,
      shared: memberIds.length > 0,
      currency: owner?.currency ?? "EUR",
      memberIds,
    };
  });
});

function toDTO(row: CategoryRow): CategoryDTO {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    ownerId: row.ownerId,
    ownerName: row.ownerName,
    isOwner: row.isOwner,
    shared: row.shared,
    currency: row.currency,
  };
}

export const listCategories = cache(async (): Promise<CategoryDTO[]> => (await loadCategories()).map(toDTO));

/**
 * Guard for every category-scoped query: returns the category as an ObjectId if
 * the current user can access it, otherwise 404. Uses the per-request cached list.
 */
export async function requireCategory(categoryId: string) {
  const found = (await loadCategories()).find((c) => c.id === categoryId);
  if (!found) notFound();
  return new Types.ObjectId(found.id);
}

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

export type CategoryWithStats = CategoryDTO & { transactionCount: number; tagCount: number; members: MemberDTO[] };

export async function listCategoriesWithStats(): Promise<CategoryWithStats[]> {
  const rows = await loadCategories();
  const ids = rows.map((r) => new Types.ObjectId(r.id));
  const peopleIds = [...new Set(rows.flatMap((r) => [r.ownerId, ...r.memberIds]))];

  const [txCounts, tagCounts, people] = await Promise.all([
    Transaction.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $match: { categoryId: { $in: ids } } },
      { $group: { _id: "$categoryId", count: { $sum: 1 } } },
    ]),
    Tag.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $match: { categoryId: { $in: ids } } },
      { $group: { _id: "$categoryId", count: { $sum: 1 } } },
    ]),
    User.find({ _id: { $in: peopleIds } }).select("name username").lean(),
  ]);
  const tx = new Map(txCounts.map((r) => [r._id.toString(), r.count]));
  const tags = new Map(tagCounts.map((r) => [r._id.toString(), r.count]));
  const peopleById = new Map(people.map((p) => [p._id.toString(), p]));

  return rows.map((row) => ({
    ...toDTO(row),
    transactionCount: tx.get(row.id) ?? 0,
    tagCount: tags.get(row.id) ?? 0,
    members: [row.ownerId, ...row.memberIds].flatMap((id) => {
      const p = peopleById.get(id);
      return p ? [{ id, name: p.name, username: p.username, isOwner: id === row.ownerId }] : [];
    }),
  }));
}
