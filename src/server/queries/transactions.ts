import "server-only";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { addMonths, fromISODate, startOfYear } from "@/lib/dates";
import type { TransactionDTO } from "@/lib/types";
import { Transaction } from "@/models/Transaction";
import { toTransactionDTOs } from "@/server/mappers";
import { requireCategory } from "@/server/queries/categories";

export type Totals = { income: number; expense: number };

export async function getRecentTransactions(categoryId: string, limit = 5): Promise<TransactionDTO[]> {
  const category = await requireCategory(categoryId);
  await connectDB();
  const docs = await Transaction.find({ categoryId: category }).sort({ date: -1, _id: -1 }).limit(limit).lean();
  return toTransactionDTOs(docs);
}

/** Income/expense totals (cents) for [fromIso, toIsoExclusive). */
export async function getTotals(categoryId: string, fromIso: string, toIsoExclusive: string): Promise<Totals> {
  const category = await requireCategory(categoryId);
  await connectDB();
  const rows = await Transaction.aggregate<{ _id: "income" | "expense"; total: number }>([
    {
      $match: {
        categoryId: category,
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

/** Totals for the current calendar year (1 January → 31 December). */
export async function getYearTotals(categoryId: string, todayIso: string) {
  const from = startOfYear(todayIso);
  return getTotals(categoryId, from, addMonths(from, 12));
}

export type TransactionFilters = {
  type?: "income" | "expense";
  tagId?: string;
  from?: string;
  to?: string;
  limit: number;
};

/** Filtered history for a category, newest first, plus totals over the whole filtered set. */
export async function listTransactions(categoryId: string, filters: TransactionFilters) {
  const category = await requireCategory(categoryId);
  await connectDB();

  const match: Record<string, unknown> = { categoryId: category };
  if (filters.type) match.type = filters.type;
  if (filters.tagId) match.tagIds = new Types.ObjectId(filters.tagId);
  if (filters.from || filters.to) {
    match.date = {
      ...(filters.from ? { $gte: fromISODate(filters.from) } : {}),
      ...(filters.to ? { $lte: fromISODate(filters.to) } : {}),
    };
  }

  const [docs, totalsRows] = await Promise.all([
    Transaction.find(match).sort({ date: -1, _id: -1 }).limit(filters.limit + 1).lean(),
    Transaction.aggregate<{ _id: "income" | "expense"; total: number; count: number }>([
      { $match: match },
      { $group: { _id: "$type", total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
  ]);

  const income = totalsRows.find((r) => r._id === "income");
  const expense = totalsRows.find((r) => r._id === "expense");
  return {
    items: await toTransactionDTOs(docs.slice(0, filters.limit)),
    hasMore: docs.length > filters.limit,
    totals: { income: income?.total ?? 0, expense: expense?.total ?? 0 },
    count: (income?.count ?? 0) + (expense?.count ?? 0),
  };
}
