"use server";

import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { fromISODate } from "@/lib/dates";
import {
  createTransactionSchema,
  objectIdSchema,
  transactionSchema,
  type CreateTransactionInput,
  type TransactionInput,
} from "@/lib/validation/budget";
import { fieldErrors, type ActionResult } from "@/lib/validation/form";
import { Transaction } from "@/models/Transaction";
import { accessibleCategory, categoryTagIds } from "@/server/access";
import { requireUserId } from "@/server/session";

/** Loads a transaction only if the user can access its category (owner or member). */
async function accessibleTransaction(userId: Types.ObjectId, id: string) {
  if (!objectIdSchema.safeParse(id).success) return null;
  const tx = await Transaction.findById(id).select("categoryId").lean();
  if (!tx) return null;
  return (await accessibleCategory(userId, tx.categoryId)) ? tx : null;
}

export async function createTransactionAction(input: CreateTransactionInput): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  const parsed = createTransactionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error), message: "Please check the amount and date." };

  const { id, categoryId: rawCategoryId, tagIds, date, ...rest } = parsed.data;
  await connectDB();
  const category = await accessibleCategory(userId, rawCategoryId);
  if (!category) return { ok: false, message: "Category not found." };

  try {
    const tx = await Transaction.create({
      ...(id ? { _id: new Types.ObjectId(id) } : {}),
      ...rest,
      userId, // author
      categoryId: category._id,
      date: fromISODate(date),
      tagIds: await categoryTagIds(category._id, tagIds),
    });
    revalidatePath("/", "layout");
    return { ok: true, data: { id: tx._id.toString() } };
  } catch (error) {
    if ((error as { code?: number }).code === 11000) return { ok: false, message: "This transaction was already saved." };
    throw error;
  }
}

export async function updateTransactionAction(id: string, input: TransactionInput): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = transactionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

  await connectDB();
  const existing = await accessibleTransaction(userId, id);
  if (!existing) return { ok: false, message: "Transaction not found." };
  const category = await accessibleCategory(userId, parsed.data.categoryId);
  if (!category) return { ok: false, message: "Category not found." };

  await Transaction.updateOne(
    { _id: existing._id },
    {
      $set: {
        type: parsed.data.type,
        amount: parsed.data.amount,
        note: parsed.data.note,
        categoryId: category._id,
        date: fromISODate(parsed.data.date),
        tagIds: await categoryTagIds(category._id, parsed.data.tagIds),
      },
    },
  );
  revalidatePath("/", "layout");
  return { ok: true, message: "Transaction updated" };
}

export async function deleteTransactionAction(id: string): Promise<ActionResult> {
  const userId = await requireUserId();
  await connectDB();
  const existing = await accessibleTransaction(userId, id);
  if (!existing) return { ok: false, message: "Transaction not found." };
  await Transaction.deleteOne({ _id: existing._id });
  revalidatePath("/", "layout");
  return { ok: true, message: "Transaction deleted" };
}
