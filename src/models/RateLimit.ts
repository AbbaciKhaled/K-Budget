import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";

/** Fixed-window counters for rate limiting (works across serverless instances). */
const rateLimitSchema = new Schema({
  key: { type: String, required: true, unique: true },
  count: { type: Number, required: true, default: 0 },
  expiresAt: { type: Date, required: true },
});

// MongoDB removes a window once it has expired.
rateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type RateLimitDoc = InferSchemaType<typeof rateLimitSchema> & { _id: Types.ObjectId };

// In dev, hot reload re-runs this file: drop the cached model so schema changes apply.
if (process.env.NODE_ENV !== "production") delete models.RateLimit;

export const RateLimit: Model<RateLimitDoc> =
  (models.RateLimit as Model<RateLimitDoc>) ?? model<RateLimitDoc>("RateLimit", rateLimitSchema);
