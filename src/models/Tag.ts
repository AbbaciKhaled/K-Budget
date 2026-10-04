import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";

const tagSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    name: { type: String, required: true, trim: true },
    color: { type: String, required: true, default: "#646b78" },
  },
  { timestamps: true },
);

tagSchema.index({ userId: 1, categoryId: 1, name: 1 });

export type TagDoc = InferSchemaType<typeof tagSchema> & { _id: Types.ObjectId };

// In dev, hot reload re-runs this file: drop the cached model so schema changes apply.
if (process.env.NODE_ENV !== "production") delete models.Tag;

export const Tag: Model<TagDoc> = (models.Tag as Model<TagDoc>) ?? model<TagDoc>("Tag", tagSchema);
