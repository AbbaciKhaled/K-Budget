import { z } from "zod";
import { ISO_DATE_RE } from "@/lib/dates";

export const objectIdSchema = z.string().regex(/^[a-f0-9]{24}$/i, "Invalid id");

const colorSchema = z.string().regex(/^#[0-9a-f]{6}$/i, "Choose a color");

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Give your category a name").max(40, "At most 40 characters"),
  icon: z
    .string()
    .trim()
    .min(1, "Choose an icon")
    .refine((v) => [...new Intl.Segmenter().segment(v)].length === 1 && !/^[\w\s]$/.test(v), "Use a single emoji"),
  color: colorSchema,
});

export const tagSchema = z.object({
  categoryId: objectIdSchema,
  name: z.string().trim().min(1, "Give your tag a name").max(30, "At most 30 characters"),
  color: colorSchema,
});

export const tagUpdateSchema = tagSchema.omit({ categoryId: true });

export const MAX_AMOUNT_CENTS = 100_000_000_00; // 100M

export const transactionSchema = z.object({
  categoryId: objectIdSchema,
  type: z.enum(["income", "expense"]),
  amount: z
    .number({ message: "Enter an amount" })
    .int()
    .positive("Amount must be greater than zero")
    .max(MAX_AMOUNT_CENTS, "Amount is too large"),
  date: z.string().regex(ISO_DATE_RE, "Pick a valid date"),
  tagIds: z.array(objectIdSchema).max(20).default([]),
  note: z.string().trim().max(200, "At most 200 characters").default(""),
});

export const createTransactionSchema = transactionSchema.extend({ id: objectIdSchema.optional() });

export type CategoryInput = z.infer<typeof categorySchema>;
export type TagInput = z.infer<typeof tagSchema>;
export type TransactionInput = z.input<typeof transactionSchema>;
export type CreateTransactionInput = z.input<typeof createTransactionSchema>;
