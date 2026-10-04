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
import { accessibleCategory } from "@/server/access";
import { requireUserId } from "@/server/session";

function sameNameFilter(categoryId: Types.ObjectId, name: string) {
  return { categoryId, name: { $regex: `^${escapeRegex(name)}$`, $options: "i" } };
}

/** Loads a tag only if the user can access its category (owner or member). */
async function accessibleTag(userId: Types.ObjectId, id: string) {
  if (!objectIdSchema.safeParse(id).success) return null;
  const tag = await Tag.findById(id).lean();
  if (!tag) return null;
  return (await accessibleCategory(userId, tag.categoryId)) ? tag : null;
}

export async function createTagAction(input: TagInput): Promise<ActionResult<TagDTO>> {
  const userId = await requireUserId();
  const parsed = tagSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

  await connectDB();
  const category = await accessibleCategory(userId, parsed.data.categoryId);
  if (!category) return { ok: false, message: "Category not found." };

  const existing = await Tag.findOne(sameNameFilter(category._id, parsed.data.name)).lean();
  if (existing) return { ok: false, errors: { name: ["This tag already exists"] }, message: "This tag already exists" };

  const tag = await Tag.create({ ...parsed.data, categoryId: category._id, userId });
  revalidatePath("/", "layout");
  return { ok: true, data: toTagDTO(tag.toObject()), message: "Tag created" };
}

export async function updateTagAction(id: string, input: { name: string; color: string }): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = tagUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

  await connectDB();
  const tag = await accessibleTag(userId, id);
  if (!tag) return { ok: false, message: "Tag not found." };

  const clash = await Tag.exists({ ...sameNameFilter(tag.categoryId, parsed.data.name), _id: { $ne: tag._id } });
  if (clash) return { ok: false, errors: { name: ["Another tag already has this name"] } };

  await Tag.updateOne({ _id: tag._id }, { $set: parsed.data });
  revalidatePath("/", "layout");
  return { ok: true, message: "Tag updated" };
}

/** Deletes a tag and detaches it from its transactions (transactions are kept). */
export async function deleteTagAction(id: string): Promise<ActionResult> {
  const userId = await requireUserId();
  await connectDB();
  const tag = await accessibleTag(userId, id);
  if (!tag) return { ok: false, message: "Tag not found." };

  await Tag.deleteOne({ _id: tag._id });
  await Transaction.updateMany({ categoryId: tag.categoryId, tagIds: tag._id }, { $pull: { tagIds: tag._id } });
  revalidatePath("/", "layout");
  return { ok: true, message: "Tag deleted" };
}
