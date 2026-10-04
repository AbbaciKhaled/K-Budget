"use server";

import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { escapeRegex } from "@/lib/utils";
import { categorySchema, objectIdSchema } from "@/lib/validation/budget";
import { fieldErrors, formToObject, type ActionResult } from "@/lib/validation/form";
import { Category } from "@/models/Category";
import { Tag } from "@/models/Tag";
import { Transaction } from "@/models/Transaction";
import { User } from "@/models/User";
import { requireUserId } from "@/server/session";

async function nameTaken(userId: Types.ObjectId, name: string, exceptId?: string) {
  return Category.exists({
    userId,
    name: { $regex: `^${escapeRegex(name)}$`, $options: "i" },
    ...(exceptId ? { _id: { $ne: exceptId } } : {}),
  });
}

export async function createCategoryAction(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  const parsed = categorySchema.safeParse(formToObject(formData));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

  await connectDB();
  if (await nameTaken(userId, parsed.data.name)) {
    return { ok: false, errors: { name: ["You already have a category with this name"] } };
  }
  const category = await Category.create({ ...parsed.data, userId });
  // A newly created category becomes the current one.
  await User.updateOne({ _id: userId }, { $set: { lastCategoryId: category._id } });
  revalidatePath("/", "layout");
  return { ok: true, data: { id: category._id.toString() }, message: "Category created" };
}

export async function updateCategoryAction(id: string, formData: FormData): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!objectIdSchema.safeParse(id).success) return { ok: false, message: "Category not found." };
  const parsed = categorySchema.safeParse(formToObject(formData));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

  await connectDB();
  if (await nameTaken(userId, parsed.data.name, id)) {
    return { ok: false, errors: { name: ["You already have a category with this name"] } };
  }
  const res = await Category.updateOne({ _id: id, userId }, { $set: parsed.data });
  if (res.matchedCount === 0) return { ok: false, message: "Category not found." };
  revalidatePath("/", "layout");
  return { ok: true, message: "Category updated" };
}

/** Deletes a category together with all its tags and transactions. */
export async function deleteCategoryAction(id: string): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!objectIdSchema.safeParse(id).success) return { ok: false, message: "Category not found." };

  await connectDB();
  const categoryId = new Types.ObjectId(id);
  const res = await Category.deleteOne({ _id: categoryId, userId });
  if (res.deletedCount === 0) return { ok: false, message: "Category not found." };
  await Promise.all([
    Transaction.deleteMany({ userId, categoryId }),
    Tag.deleteMany({ userId, categoryId }),
    User.updateOne({ _id: userId, lastCategoryId: categoryId }, { $set: { lastCategoryId: null } }),
  ]);
  revalidatePath("/", "layout");
  return { ok: true, message: "Category deleted" };
}

/** Switch the current category (remembered across sessions). */
export async function selectCategoryAction(id: string): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!objectIdSchema.safeParse(id).success) return { ok: false, message: "Category not found." };
  await connectDB();
  if (!(await Category.exists({ _id: id, userId }))) return { ok: false, message: "Category not found." };
  await User.updateOne({ _id: userId }, { $set: { lastCategoryId: new Types.ObjectId(id) } });
  revalidatePath("/", "layout");
  return { ok: true };
}
