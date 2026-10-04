import "server-only";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { addMonths, fromISODate, startOfMonth } from "@/lib/dates";
import type { TransactionDTO } from "@/lib/types";
import { Transaction } from "@/models/Transaction";
import { toTransactionDTO } from "@/server/mappers";
import { requireUserId } from "@/server/session";

export type Totals = { income: number; expense: number };

export async function getRecentTransactions(categoryId: string, limit = 5): Promise<TransactionDTO[]> {
  const userId = await requireUserId();
  await connectDB();
  const docs = await Transaction.find({ userId, categoryId: new Types.ObjectId(categoryId) })
    .sort({ date: -1, _id: -1 })
    .limit(limit)
    .lean();
  return docs.map(toTransactionDTO);
}

/** Income/expense totals (cents) for [fromIso, toIsoExclusive). */
export async function getTotals(categoryId: string, fromIso: string, toIsoExclusive: string): Promise<Totals> {
  const userId = await requireUserId();
  await connectDB();
  const rows = await Transaction.aggregate<{ _id: "income" | "expense"; total: number }>([
    {
      $match: {
        userId,
        categoryId: new Types.ObjectId(categoryId),
        date: { $gte: fromISODate(fromIso), $lt: fromISODate(toIsoExclusive) },
      },
    },
    { $group: { _id: "$type", total: { $sum: "$amount" } } },
  ]);
  return {
    income: rows.find((r) => r._id === "income")?.total ?? 0,
    expense: rows.find((r) => r._id === "expense")?.total ?? 0,
  };
}

export async function getMonthTotals(categoryId: string, todayIso: string) {
  const from = startOfMonth(todayIso);
  return getTotals(categoryId, from, addMonths(from, 1));
}
