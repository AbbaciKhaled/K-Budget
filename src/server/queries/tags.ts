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

export async function listTagsWithUsage(categoryId: string) {
  const userId = await requireUserId();
  const [tags, usage] = await Promise.all([
    listTags(categoryId),
    Transaction.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $match: { userId, categoryId: new Types.ObjectId(categoryId), "tagIds.0": { $exists: true } } },
      { $unwind: "$tagIds" },
      { $group: { _id: "$tagIds", count: { $sum: 1 } } },
    ]),
  ]);
  const counts = new Map(usage.map((u) => [u._id.toString(), u.count]));
  return tags.map((t) => ({ ...t, usage: counts.get(t.id) ?? 0 }));
}
