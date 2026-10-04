import "server-only";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { addDays, daysBetween, fromISODate } from "@/lib/dates";
import { bucketKeys, bucketLabel, type Period } from "@/lib/periods";
import type { TransactionDTO, TransactionType } from "@/lib/types";
import { Transaction } from "@/models/Transaction";
import { toTransactionDTOs } from "@/server/mappers";
import { requireCategory } from "@/server/queries/categories";

export type KpiValues = {
  income: number;
  expense: number;
  net: number;
  /** net / income, as a fraction; null when there is no income. */
  savingsRate: number | null;
  /** cents per day */
  avgDailySpending: number;
  count: number;
};

export type SeriesPoint = { key: string; label: string; income: number; expense: number; balance: number };
export type TagSlice = { tagId: string | null; total: number };

export type KpiData = {
  current: KpiValues;
  previous: KpiValues;
  series: SeriesPoint[];
  byTag: Record<TransactionType, TagSlice[]>;
  largest: Record<TransactionType, TransactionDTO[]>;
  hasAnyTransactions: boolean;
};

function range(from: string, to: string) {
  return { $gte: fromISODate(from), $lt: fromISODate(addDays(to, 1)) };
}

function toValues(rows: { _id: TransactionType; total: number; count: number }[], days: number): KpiValues {
  const income = rows.find((r) => r._id === "income")?.total ?? 0;
  const expense = rows.find((r) => r._id === "expense")?.total ?? 0;
  const net = income - expense;
  return {
    income,
    expense,
    net,
    savingsRate: income > 0 ? net / income : null,
    avgDailySpending: Math.round(expense / Math.max(days, 1)),
    count: rows.reduce((s, r) => s + r.count, 0),
  };
}

export async function getKpis(categoryId: string, period: Period): Promise<KpiData> {
  const category = await requireCategory(categoryId);
  await connectDB();
  const base = { categoryId: category };
  const current = { ...base, date: range(period.from, period.to) };
  const dateFormat = period.granularity === "day" ? "%Y-%m-%d" : period.granularity === "month" ? "%Y-%m" : "%Y";

  type TotalsRow = { _id: TransactionType; total: number; count: number };
  const [curRows, prevRows, bucketRows, tagRows, largestExpenses, largestIncome, anyTx] = await Promise.all([
    Transaction.aggregate<TotalsRow>([
      { $match: current },
      { $group: { _id: "$type", total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
    Transaction.aggregate<TotalsRow>([
      { $match: { ...base, date: range(period.previous.from, period.previous.to) } },
      { $group: { _id: "$type", total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
    Transaction.aggregate<{ _id: { k: string; t: TransactionType }; total: number }>([
      { $match: current },
      {
        $group: {
          _id: { k: { $dateToString: { date: "$date", format: dateFormat, timezone: "UTC" } }, t: "$type" },
          total: { $sum: "$amount" },
        },
      },
    ]),
    // A transaction with several tags is split evenly between them, so slices add up to the total.
    Transaction.aggregate<{ _id: { tag: Types.ObjectId | null; t: TransactionType }; total: number }>([
      { $match: current },
      { $addFields: { n: { $size: "$tagIds" } } },
      { $unwind: { path: "$tagIds", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { tag: { $ifNull: ["$tagIds", null] }, t: "$type" },
          total: { $sum: { $divide: ["$amount", { $max: ["$n", 1] }] } },
        },
      },
    ]),
    Transaction.find({ ...current, type: "expense" }).sort({ amount: -1, date: -1 }).limit(5).lean(),
    Transaction.find({ ...current, type: "income" }).sort({ amount: -1, date: -1 }).limit(5).lean(),
    Transaction.exists(base),
  ]);

  // Zero-filled buckets with a running balance.
  const keys = bucketKeys(period.from, period.to, period.granularity);
  const spansYears = period.from.slice(0, 4) !== period.to.slice(0, 4);
  const byKey = new Map(keys.map((k) => [k, { income: 0, expense: 0 }]));
  for (const r of bucketRows) {
    const b = byKey.get(r._id.k);
    if (b) b[r._id.t] += r.total;
  }
  let running = 0;
  const series = keys.map((key) => {
    const b = byKey.get(key)!;
    running += b.income - b.expense;
    return { key, label: bucketLabel(key, period.granularity, spansYears), ...b, balance: running };
  });

  const byTag: KpiData["byTag"] = { income: [], expense: [] };
  for (const r of tagRows) {
    byTag[r._id.t].push({ tagId: r._id.tag ? r._id.tag.toString() : null, total: Math.round(r.total) });
  }
  byTag.income.sort((a, b) => b.total - a.total);
  byTag.expense.sort((a, b) => b.total - a.total);

  return {
    current: toValues(curRows, daysBetween(period.from, period.to)),
    previous: toValues(prevRows, daysBetween(period.previous.from, period.previous.to)),
    series,
    byTag,
    largest: { expense: await toTransactionDTOs(largestExpenses), income: await toTransactionDTOs(largestIncome) },
    hasAnyTransactions: Boolean(anyTx),
  };
}
