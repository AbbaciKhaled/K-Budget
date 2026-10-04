"use server";

import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { escapeRegex } from "@/lib/utils";
import type { TagDTO } from "@/lib/types";
import { objectIdSchema, tagSchema, tagUpdateSchema, type TagInput } from "@/lib/validation/budget";
import { fieldErrors, type ActionResult } from "@/lib/validation/form";
import { Tag } from "@/models/Tag";
import { Transaction } from "@/models/Transaction";
import { toTagDTO } from "@/server/mappers";
import { ownedCategoryId } from "@/server/ownership";
import { requireUserId } from "@/server/session";

function sameNameFilter(userId: Types.ObjectId, categoryId: Types.ObjectId, name: string) {
  return { userId, categoryId, name: { $regex: `^${escapeRegex(name)}$`, $options: "i" } };
}

export async function createTagAction(input: TagInput): Promise<ActionResult<TagDTO>> {
  const userId = await requireUserId();
  const parsed = tagSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

  await connectDB();
  const categoryId = await ownedCategoryId(userId, parsed.data.categoryId);
  if (!categoryId) return { ok: false, message: "Category not found." };

  const existing = await Tag.findOne(sameNameFilter(userId, categoryId, parsed.data.name)).lean();
  if (existing) return { ok: false, errors: { name: ["This tag already exists"] }, message: "This tag already exists" };

  const tag = await Tag.create({ ...parsed.data, categoryId, userId });
  revalidatePath("/", "layout");
  return { ok: true, data: toTagDTO(tag.toObject()), message: "Tag created" };
}

export async function updateTagAction(id: string, input: { name: string; color: string }): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!objectIdSchema.safeParse(id).success) return { ok: false, message: "Tag not found." };
  const parsed = tagUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

  await connectDB();
  const tag = await Tag.findOne({ _id: id, userId }).lean();
  if (!tag) return { ok: false, message: "Tag not found." };

  const clash = await Tag.exists({ ...sameNameFilter(userId, tag.categoryId, parsed.data.name), _id: { $ne: tag._id } });
  if (clash) return { ok: false, errors: { name: ["Another tag already has this name"] } };

  await Tag.updateOne({ _id: tag._id, userId }, { $set: parsed.data });
  revalidatePath("/", "layout");
  return { ok: true, message: "Tag updated" };
}

/** Deletes a tag and detaches it from its transactions (transactions are kept). */
export async function deleteTagAction(id: string): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!objectIdSchema.safeParse(id).success) return { ok: false, message: "Tag not found." };

  await connectDB();
  const tagId = new Types.ObjectId(id);
  const res = await Tag.deleteOne({ _id: tagId, userId });
  if (res.deletedCount === 0) return { ok: false, message: "Tag not found." };
  await Transaction.updateMany({ userId, tagIds: tagId }, { $pull: { tagIds: tagId } });
  revalidatePath("/", "layout");
  return { ok: true, message: "Tag deleted" };
}
