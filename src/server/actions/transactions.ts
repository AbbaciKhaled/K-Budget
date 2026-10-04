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
import { ownedCategoryId, ownedTagIds } from "@/server/ownership";
import { requireUserId } from "@/server/session";

export async function createTransactionAction(input: CreateTransactionInput): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  const parsed = createTransactionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error), message: "Please check the amount and date." };

  const { id, categoryId: rawCategoryId, tagIds, date, ...rest } = parsed.data;
  await connectDB();
  const categoryId = await ownedCategoryId(userId, rawCategoryId);
  if (!categoryId) return { ok: false, message: "Category not found." };

  try {
    const tx = await Transaction.create({
      ...(id ? { _id: new Types.ObjectId(id) } : {}),
      ...rest,
      userId,
      categoryId,
      date: fromISODate(date),
      tagIds: await ownedTagIds(userId, categoryId, tagIds),
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
  if (!objectIdSchema.safeParse(id).success) return { ok: false, message: "Transaction not found." };
  const parsed = transactionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

  await connectDB();
  const categoryId = await ownedCategoryId(userId, parsed.data.categoryId);
  if (!categoryId) return { ok: false, message: "Category not found." };

  const res = await Transaction.updateOne(
    { _id: id, userId },
    {
      $set: {
        type: parsed.data.type,
        amount: parsed.data.amount,
        note: parsed.data.note,
        categoryId,
        date: fromISODate(parsed.data.date),
        tagIds: await ownedTagIds(userId, categoryId, parsed.data.tagIds),
      },
    },
  );
  if (res.matchedCount === 0) return { ok: false, message: "Transaction not found." };
  revalidatePath("/", "layout");
  return { ok: true, message: "Transaction updated" };
}

export async function deleteTransactionAction(id: string): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!objectIdSchema.safeParse(id).success) return { ok: false, message: "Transaction not found." };
  await connectDB();
  const res = await Transaction.deleteOne({ _id: id, userId });
  if (res.deletedCount === 0) return { ok: false, message: "Transaction not found." };
  revalidatePath("/", "layout");
  return { ok: true, message: "Transaction deleted" };
}
