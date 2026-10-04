import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { Types } from "mongoose";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import type { CurrentUser } from "@/lib/types";

/** Returns the logged-in user's id as an ObjectId, or redirects to login. */
export const requireUserId = cache(async (): Promise<Types.ObjectId> => {
  const session = await auth();
  const id = session?.user?.id;
  if (!id || !Types.ObjectId.isValid(id)) redirect("/login");
  return new Types.ObjectId(id);
});

/** Loads the logged-in user (deduplicated per request). */
export const requireUser = cache(async (): Promise<CurrentUser> => {
  const userId = await requireUserId();
  await connectDB();
  const user = await User.findById(userId).lean();
  if (!user) redirect("/api/logout");
  return {
    id: user._id.toString(),
    username: user.username,
    name: user.name,
    email: user.email,
    currency: user.currency,
    lastCategoryId: user.lastCategoryId ? user.lastCategoryId.toString() : null,
  };
});
