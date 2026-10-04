/** Plain, serializable shapes passed from the server to client components. */

export type CurrentUser = {
  id: string;
  username: string;
  name: string;
  email: string;
  currency: string;
  lastCategoryId: string | null;
};

export type CategoryDTO = {
  id: string;
  name: string;
  icon: string;
  color: string;
  ownerId: string;
  ownerName: string;
  /** The viewer owns this category (can edit, delete and share it). */
  isOwner: boolean;
  /** Shared with at least one other person. */
  shared: boolean;
  /** Amounts in a category use its owner's currency. */
  currency: string;
};

export type MemberDTO = { id: string; name: string; username: string; isOwner: boolean };

export type TagDTO = {
  id: string;
  categoryId: string;
  name: string;
  color: string;
};

export type TransactionType = "income" | "expense";

export type TransactionDTO = {
  id: string;
  categoryId: string;
  type: TransactionType;
  amount: number; // cents
  date: string; // ISO yyyy-mm-dd
  tagIds: string[];
  note: string;
  /** Who added it. */
  author: { id: string; name: string };
};
