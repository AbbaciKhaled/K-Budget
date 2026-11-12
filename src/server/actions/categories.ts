"use server";

import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import type { MemberDTO } from "@/lib/types";
import { escapeRegex } from "@/lib/utils";
import { categorySchema, objectIdSchema } from "@/lib/validation/budget";
import { fieldErrors, formToObject, type ActionResult } from "@/lib/validation/form";
import { Category } from "@/models/Category";
import { Tag } from "@/models/Tag";
import { Transaction } from "@/models/Transaction";
import { User } from "@/models/User";
import { accessibleCategory } from "@/server/access";
import { isRateLimited, LIMITS, recordAttempt } from "@/server/rateLimit";
import { requireUserId } from "@/server/session";

async function nameTaken(userId: Types.ObjectId, name: string, exceptId?: string) {
  return Category.exists({
    userId,
    name: { $regex: `^${escapeRegex(name)}$`, $options: "i" },
    ...(exceptId ? { _id: { $ne: exceptId } } : {}),
  });
}

/** Loads a category only if the current user OWNS it (edit, delete, share). */
async function ownedCategory(userId: Types.ObjectId, id: string) {
  if (!objectIdSchema.safeParse(id).success) return null;
  return Category.findOne({ _id: id, userId }).lean();
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
  const parsed = categorySchema.safeParse(formToObject(formData));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

  await connectDB();
  const category = await ownedCategory(userId, id);
  if (!category) return { ok: false, message: "Only the owner can edit this category." };
  if (await nameTaken(userId, parsed.data.name, id)) {
    return { ok: false, errors: { name: ["You already have a category with this name"] } };
  }
  await Category.updateOne({ _id: category._id }, { $set: parsed.data });
  revalidatePath("/", "layout");
  return { ok: true, message: "Category updated" };
}

/** Deletes a category together with all its tags and transactions — for every member. Owner only. */
export async function deleteCategoryAction(id: string): Promise<ActionResult> {
  const userId = await requireUserId();
  await connectDB();
  const category = await ownedCategory(userId, id);
  if (!category) return { ok: false, message: "Only the owner can delete this category." };

  const categoryId = category._id;
  await Category.deleteOne({ _id: categoryId });
  await Promise.all([
    Transaction.deleteMany({ categoryId }),
    Tag.deleteMany({ categoryId }),
    User.updateMany({ lastCategoryId: categoryId }, { $set: { lastCategoryId: null } }),
  ]);
  revalidatePath("/", "layout");
  return { ok: true, message: "Category deleted" };
}

/** Switch the current category (remembered across sessions). */
export async function selectCategoryAction(id: string): Promise<ActionResult> {
  const userId = await requireUserId();
  await connectDB();
  const category = await accessibleCategory(userId, id);
  if (!category) return { ok: false, message: "Category not found." };
  await User.updateOne({ _id: userId }, { $set: { lastCategoryId: category._id } });
  revalidatePath("/", "layout");
  return { ok: true };
}

/* ───────────── Sharing ───────────── */

const identifierSchema = z.string().trim().toLowerCase().min(1, "Enter a username or email").max(254);

/** Owner shares the category with another user, found by exact username or email. */
export async function shareCategoryAction(id: string, identifier: string): Promise<ActionResult<MemberDTO>> {
  const userId = await requireUserId();
  const parsed = identifierSchema.safeParse(identifier);
  if (!parsed.success) return { ok: false, errors: { identifier: [parsed.error.issues[0].message] } };

  await connectDB();
  const category = await ownedCategory(userId, id);
  if (!category) return { ok: false, message: "Only the owner can share this category." };

  const shareKey = `share:${userId.toString()}`;
  if (await isRateLimited(shareKey, LIMITS.share)) {
    return { ok: false, message: "Too many share attempts. Please try again in an hour." };
  }
  await recordAttempt(shareKey, LIMITS.share);

  const value = parsed.data.replace(/^@/, "");
  const member = await User.findOne(value.includes("@") ? { email: value } : { username: value })
    .select("name username")
    .lean();
  if (!member) return { ok: false, errors: { identifier: ["No K-Budget user with this username or email"] } };
  if (member._id.equals(userId)) return { ok: false, errors: { identifier: ["That's you — you already own this category"] } };
  if ((category.memberIds ?? []).some((m) => m.equals(member._id))) {
    return { ok: false, errors: { identifier: [`@${member.username} already has access`] } };
  }

  const res = await Category.updateOne({ _id: category._id }, { $addToSet: { memberIds: member._id } });
  if (res.modifiedCount === 0) return { ok: false, message: "Couldn't share the category. Please try again." };
  revalidatePath("/", "layout");
  return {
    ok: true,
    message: `Shared with ${member.name}`,
    data: { id: member._id.toString(), name: member.name, username: member.username, isOwner: false },
  };
}

/** Owner removes someone's access. Their past transactions stay in the category. */
export async function removeMemberAction(id: string, memberId: string): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!objectIdSchema.safeParse(memberId).success) return { ok: false, message: "Member not found." };
  await connectDB();
  const category = await ownedCategory(userId, id);
  if (!category) return { ok: false, message: "Only the owner can manage access." };

  const memberObjectId = new Types.ObjectId(memberId);
  await Category.updateOne({ _id: category._id }, { $pull: { memberIds: memberObjectId } });
  await User.updateOne({ _id: memberObjectId, lastCategoryId: category._id }, { $set: { lastCategoryId: null } });
  revalidatePath("/", "layout");
  return { ok: true, message: "Access removed" };
}

/** A member leaves a category that was shared with them. */
export async function leaveCategoryAction(id: string): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!objectIdSchema.safeParse(id).success) return { ok: false, message: "Category not found." };
  await connectDB();
  const res = await Category.updateOne({ _id: id, memberIds: userId }, { $pull: { memberIds: userId } });
  if (res.matchedCount === 0) return { ok: false, message: "Category not found." };
  await User.updateOne({ _id: userId, lastCategoryId: new Types.ObjectId(id) }, { $set: { lastCategoryId: null } });
  revalidatePath("/", "layout");
  return { ok: true, message: "You left the category" };
}
