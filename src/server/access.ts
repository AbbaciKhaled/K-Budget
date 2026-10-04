import "server-only";
import { Types } from "mongoose";
import { Category, type CategoryDoc } from "@/models/Category";
import { Tag } from "@/models/Tag";
import { User } from "@/models/User";

/**
 * Access rules
 * - A category is visible to its owner (`userId`) and to its members (`memberIds`).
 * - Everyone with access can read and write its transactions and tags.
 * - Only the owner can edit, delete or share the category itself.
 */
export function accessFilter(userId: Types.ObjectId) {
  return { $or: [{ userId }, { memberIds: userId }] };
}

/** The category if the user may use it, otherwise null. */
export async function accessibleCategory(userId: Types.ObjectId, categoryId: string | Types.ObjectId) {
  if (!Types.ObjectId.isValid(categoryId)) return null;
  return Category.findOne({ _id: categoryId, ...accessFilter(userId) }).lean<CategoryDoc>();
}

/** Keeps only tag ids that belong to the given category. */
export async function categoryTagIds(categoryId: Types.ObjectId, tagIds: string[]) {
  if (tagIds.length === 0) return [];
  const unique = [...new Set(tagIds)].filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id));
  const tags = await Tag.find({ _id: { $in: unique }, categoryId }).select("_id").lean();
  return tags.map((t) => t._id);
}

/** id → display name, for a set of user ids. */
export async function userNames(ids: Iterable<string>) {
  const unique = [...new Set(ids)].filter((id) => Types.ObjectId.isValid(id));
  if (unique.length === 0) return new Map<string, string>();
  const users = await User.find({ _id: { $in: unique } }).select("name").lean();
  return new Map(users.map((u) => [u._id.toString(), u.name]));
}
