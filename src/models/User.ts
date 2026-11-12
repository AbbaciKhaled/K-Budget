import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";

const userSchema = new Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true, select: false },
    currency: { type: String, required: true, default: "EUR" },
    lastCategoryId: { type: Schema.Types.ObjectId, ref: "Category", default: null },
    /** Incremented on password change: sessions carrying an older value are rejected. */
    sessionVersion: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export type UserDoc = InferSchemaType<typeof userSchema> & { _id: Types.ObjectId };

// In dev, hot reload re-runs this file: drop the cached model so schema changes apply.
if (process.env.NODE_ENV !== "production") delete models.User;

export const User: Model<UserDoc> = (models.User as Model<UserDoc>) ?? model<UserDoc>("User", userSchema);
