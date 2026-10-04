import "server-only";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import type { TagDTO } from "@/lib/types";
import { Tag } from "@/models/Tag";
import { Transaction } from "@/models/Transaction";
import { toTagDTO } from "@/server/mappers";
import { requireUserId } from "@/server/session";

export async function listTags(categoryId: string): Promise<TagDTO[]> {
  const userId = await requireUserId();
  await connectDB();
  const tags = await Tag.find({ userId, categoryId: new Types.ObjectId(categoryId) })
    .collation({ locale: "en", strength: 2 })
    .sort({ name: 1 })
    .lean();
  return tags.map(toTagDTO);
}

/** Tags with all-time usage and money in / out (multi-tag transactions are split evenly, as in KPIs). */
export async function listTagsWithUsage(categoryId: string) {
  const userId = await requireUserId();
  const [tags, usage] = await Promise.all([
    listTags(categoryId),
    Transaction.aggregate<{ _id: Types.ObjectId; count: number; income: number; expense: number }>([
      { $match: { userId, categoryId: new Types.ObjectId(categoryId), "tagIds.0": { $exists: true } } },
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
