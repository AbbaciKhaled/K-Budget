import "server-only";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import type { TagDTO } from "@/lib/types";
import { Tag } from "@/models/Tag";
import { Transaction } from "@/models/Transaction";
import { toTagDTO } from "@/server/mappers";
import { requireCategory } from "@/server/queries/categories";

export async function listTags(categoryId: string): Promise<TagDTO[]> {
  const category = await requireCategory(categoryId);
  await connectDB();
  const tags = await Tag.find({ categoryId: category }).collation({ locale: "en", strength: 2 }).sort({ name: 1 }).lean();
  return tags.map(toTagDTO);
}

/** Tags with all-time usage and money in / out (multi-tag transactions are split evenly, as in KPIs). */
export async function listTagsWithUsage(categoryId: string) {
  const category = await requireCategory(categoryId);
  const [tags, usage] = await Promise.all([
    listTags(categoryId),
    Transaction.aggregate<{ _id: Types.ObjectId; count: number; income: number; expense: number }>([
      { $match: { categoryId: category, "tagIds.0": { $exists: true } } },
      { $addFields: { share: { $divide: ["$amount", { $size: "$tagIds" }] } } },
      { $unwind: "$tagIds" },
      {
        $group: {
          _id: "$tagIds",
          count: { $sum: 1 },
          income: { $sum: { $cond: [{ $eq: ["$type", "income"] }, "$share", 0] } },
          expense: { $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$share", 0] } },
        },
      },
    ]),
  ]);
  const byId = new Map(usage.map((u) => [u._id.toString(), u]));
  return tags.map((t) => {
    const u = byId.get(t.id);
    return { ...t, usage: u?.count ?? 0, income: Math.round(u?.income ?? 0), expense: Math.round(u?.expense ?? 0) };
  });
}

/** Tags ordered by how often they were used in the last 90 days (then by name) — for quick-add. */
export async function listTagsByRecentUsage(categoryId: string): Promise<TagDTO[]> {
  const category = await requireCategory(categoryId);
  const since = new Date(Date.now() - 90 * 86_400_000);
  const [tags, usage] = await Promise.all([
    listTags(categoryId),
    Transaction.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $match: { categoryId: category, date: { $gte: since }, "tagIds.0": { $exists: true } } },
      { $unwind: "$tagIds" },
      { $group: { _id: "$tagIds", count: { $sum: 1 } } },
    ]),
  ]);
  const counts = new Map(usage.map((u) => [u._id.toString(), u.count]));
  // listTags is already alphabetical, and Array.sort is stable.
  return [...tags].sort((a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0));
}
