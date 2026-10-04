import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";

const categorySchema = new Schema(
  {
    /** Owner. */
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    /** Users the owner shared this category with (same access to transactions and tags). */
    memberIds: { type: [{ type: Schema.Types.ObjectId, ref: "User" }], default: [] },
    name: { type: String, required: true, trim: true },
    icon: { type: String, required: true, default: "💰" },
    color: { type: String, required: true, default: "#3245ff" },
  },
  { timestamps: true },
);

categorySchema.index({ userId: 1, createdAt: 1 });
categorySchema.index({ memberIds: 1 });

export type CategoryDoc = InferSchemaType<typeof categorySchema> & { _id: Types.ObjectId };

// In dev, hot reload re-runs this file: drop the cached model so schema changes apply.
if (process.env.NODE_ENV !== "production") delete models.Category;

export const Category: Model<CategoryDoc> = (models.Category as Model<CategoryDoc>) ?? model<CategoryDoc>("Category", categorySchema);
