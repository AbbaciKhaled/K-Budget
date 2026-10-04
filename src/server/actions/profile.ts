"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { passwordChangeSchema, profileSchema } from "@/lib/validation/auth";
import { fieldErrors, formToObject, type ActionResult, type FieldErrors } from "@/lib/validation/form";
import { User } from "@/models/User";
import { requireUserId } from "@/server/session";

export async function updateProfileAction(formData: FormData): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = profileSchema.safeParse(formToObject(formData));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

  const { username, email } = parsed.data;
  await connectDB();

  const taken = await User.find({ _id: { $ne: userId }, $or: [{ username }, { email }] })
    .select("username email")
    .lean();
  const errors: FieldErrors = {};
  if (taken.some((u) => u.username === username)) errors.username = ["This username is already taken"];
  if (taken.some((u) => u.email === email)) errors.email = ["This email is already used by another account"];
  if (Object.keys(errors).length) return { ok: false, errors };

  await User.updateOne({ _id: userId }, { $set: parsed.data });
  revalidatePath("/", "layout");
  return { ok: true, message: "Profile updated" };
}

export async function changePasswordAction(formData: FormData): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = passwordChangeSchema.safeParse(formToObject(formData));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

  await connectDB();
  const user = await User.findById(userId).select("+passwordHash");
  if (!user) return { ok: false, message: "Account not found." };

  const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!valid) return { ok: false, errors: { currentPassword: ["Current password is incorrect"] } };

  user.passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await user.save();
  return { ok: true, message: "Password changed" };
}
