import "server-only";
import { createHash } from "node:crypto";
import { connectDB } from "@/lib/db";
import { RateLimit } from "@/models/RateLimit";

export const LIMITS = {
  /** Failed logins for one username/email. */
  loginAccount: { max: 5, windowMs: 15 * 60_000 },
  /** Failed logins from one IP address. */
  loginIp: { max: 20, windowMs: 15 * 60_000 },
  /** Accounts created from one IP address. */
  signupIp: { max: 5, windowMs: 60 * 60_000 },
  /** Share attempts by one user (limits probing which usernames/emails exist). */
  share: { max: 20, windowMs: 60 * 60_000 },
} as const;

type Limit = (typeof LIMITS)[keyof typeof LIMITS];

/** Keys are hashed so identifiers and IPs are never stored in clear. */
function hashKey(key: string) {
  return createHash("sha256").update(key).digest("hex");
}

export async function isRateLimited(key: string, limit: Limit) {
  await connectDB();
  const doc = await RateLimit.findOne({ key: hashKey(key), expiresAt: { $gt: new Date() } }).lean();
  return (doc?.count ?? 0) >= limit.max;
}

export async function recordAttempt(key: string, limit: Limit) {
  await connectDB();
  const hashed = hashKey(key);
  const now = new Date();
  const res = await RateLimit.updateOne({ key: hashed, expiresAt: { $gt: now } }, { $inc: { count: 1 } });
  if (res.matchedCount === 0) {
    // No live window: start a new one (replaces an expired window not yet purged by the TTL monitor).
    await RateLimit.updateOne(
      { key: hashed },
      { $set: { count: 1, expiresAt: new Date(now.getTime() + limit.windowMs) } },
      { upsert: true },
    );
  }
}

export async function clearAttempts(key: string) {
  await connectDB();
  await RateLimit.deleteOne({ key: hashKey(key) });
}

/** Best-effort client IP (Netlify, then standard proxy headers). */
export function clientIp(headers: Headers) {
  return (
    headers.get("x-nf-client-connection-ip") ??
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-real-ip") ??
    "unknown"
  );
}
