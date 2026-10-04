import type { TagDoc } from "@/models/Tag";
import type { TransactionDoc } from "@/models/Transaction";
import { toISODate } from "@/lib/dates";
import type { TagDTO, TransactionDTO } from "@/lib/types";
import { userNames } from "@/server/access";

export function toTagDTO(t: TagDoc): TagDTO {
  return { id: t._id.toString(), categoryId: t.categoryId.toString(), name: t.name, color: t.color };
}

export function toTransactionDTO(t: TransactionDoc, names: Map<string, string>): TransactionDTO {
  const authorId = t.userId.toString();
  return {
    id: t._id.toString(),
    categoryId: t.categoryId.toString(),
    type: t.type,
    amount: t.amount,
    date: toISODate(t.date),
    tagIds: (t.tagIds ?? []).map((id) => id.toString()),
    note: t.note ?? "",
    author: { id: authorId, name: names.get(authorId) ?? "Former member" },
  };
}

/** Maps transactions to DTOs, resolving author names in one query. */
export async function toTransactionDTOs(docs: TransactionDoc[]) {
  const names = await userNames(docs.map((d) => d.userId.toString()));
  return docs.map((d) => toTransactionDTO(d, names));
}
