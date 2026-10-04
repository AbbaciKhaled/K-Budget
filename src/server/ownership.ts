import "server-only";
import { Types } from "mongoose";
import { Category } from "@/models/Category";
import { Tag } from "@/models/Tag";

/** Returns the category's ObjectId if it belongs to the user, otherwise null. */
export async function ownedCategoryId(userId: Types.ObjectId, categoryId: string) {
  const found = await Category.exists({ _id: categoryId, userId });
  return found ? new Types.ObjectId(categoryId) : null;
}

/** Keeps only tag ids that belong to the user AND to the given category. */
export async function ownedTagIds(userId: Types.ObjectId, categoryId: Types.ObjectId, tagIds: string[]) {
  if (tagIds.length === 0) return [];
  const unique = [...new Set(tagIds)].map((id) => new Types.ObjectId(id));
  const tags = await Tag.find({ _id: { $in: unique }, userId, categoryId }).select("_id").lean();
  return tags.map((t) => t._id);
}
