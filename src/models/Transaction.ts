import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";

const transactionSchema = new Schema(
  {
    /** Author — who added the transaction (categories can be shared). */
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    type: { type: String, enum: ["income", "expense"], required: true },
    /** Positive integer, in cents. */
    amount: {
      type: Number,
      required: true,
      min: 1,
      validate: { validator: Number.isInteger, message: "Amount must be an integer number of cents" },
    },
    date: { type: Date, required: true },
    tagIds: { type: [{ type: Schema.Types.ObjectId, ref: "Tag" }], default: [] },
    note: { type: String, trim: true, default: "" },
  },
  { timestamps: true },
);

transactionSchema.index({ userId: 1, categoryId: 1, date: -1 });
// Shared categories are read by category, whoever the author is.
transactionSchema.index({ categoryId: 1, date: -1 });

export type TransactionDoc = InferSchemaType<typeof transactionSchema> & { _id: Types.ObjectId };

// In dev, hot reload re-runs this file: drop the cached model so schema changes apply.
if (process.env.NODE_ENV !== "production") delete models.Transaction;

export const Transaction: Model<TransactionDoc> = (models.Transaction as Model<TransactionDoc>) ?? model<TransactionDoc>("Transaction", transactionSchema);
