import type { CategoryDoc } from "@/models/Category";
import type { TagDoc } from "@/models/Tag";
import type { TransactionDoc } from "@/models/Transaction";
import { toISODate } from "@/lib/dates";
import type { CategoryDTO, TagDTO, TransactionDTO } from "@/lib/types";

export function toCategoryDTO(c: CategoryDoc): CategoryDTO {
  return { id: c._id.toString(), name: c.name, icon: c.icon, color: c.color };
}

export function toTagDTO(t: TagDoc): TagDTO {
  return { id: t._id.toString(), categoryId: t.categoryId.toString(), name: t.name, color: t.color };
}

export function toTransactionDTO(t: TransactionDoc): TransactionDTO {
  return {
    id: t._id.toString(),
    categoryId: t.categoryId.toString(),
    type: t.type,
    amount: t.amount,
    date: toISODate(t.date),
    tagIds: (t.tagIds ?? []).map((id) => id.toString()),
    note: t.note ?? "",
  };
}
