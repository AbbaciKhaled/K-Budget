import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { Types } from "mongoose";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import type { CurrentUser } from "@/lib/types";

/**
 * Loads the session's user once per request. Sessions are stateless JWTs, so this is
 * where they get revoked: unknown user or outdated session version → sign out.
 */
const loadSessionUser = cache(async () => {
  const session = await auth();
  const id = session?.user?.id;
  if (!id || !Types.ObjectId.isValid(id)) redirect("/login");
  await connectDB();
  const user = await User.findById(id).lean();
  if (!user || (user.sessionVersion ?? 0) !== (session.sessionVersion ?? 0)) redirect("/api/logout");
  return user;
});

/** Returns the logged-in user's id as an ObjectId, or redirects to login. */
export const requireUserId = cache(async (): Promise<Types.ObjectId> => (await loadSessionUser())._id);

/** Loads the logged-in user (deduplicated per request). */
export const requireUser = cache(async (): Promise<CurrentUser> => {
  const user = await loadSessionUser();
  return {
    id: user._id.toString(),
    username: user.username,
    name: user.name,
    email: user.email,
    currency: user.currency,
    lastCategoryId: user.lastCategoryId ? user.lastCategoryId.toString() : null,
  };
});
