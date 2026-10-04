"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { connectDB } from "@/lib/db";
import { safeRedirectPath } from "@/lib/utils";
import { loginSchema, signupSchema } from "@/lib/validation/auth";
import { fieldErrors, formToObject, type ActionResult, type FieldErrors } from "@/lib/validation/form";
import { User } from "@/models/User";

function isDuplicateKeyError(error: unknown): error is { code: number; keyPattern?: Record<string, number> } {
  return typeof error === "object" && error !== null && (error as { code?: number }).code === 11000;
}

export async function signupAction(formData: FormData): Promise<ActionResult> {
  const parsed = signupSchema.safeParse(formToObject(formData));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

  const { username, name, email, password } = parsed.data;
  await connectDB();

  const taken = await User.find({ $or: [{ username }, { email }] }).select("username email").lean();
  const errors: FieldErrors = {};
  if (taken.some((u) => u.username === username)) errors.username = ["This username is already taken"];
  if (taken.some((u) => u.email === email)) errors.email = ["An account with this email already exists"];
  if (Object.keys(errors).length) return { ok: false, errors };

  try {
    await User.create({ username, name, email, passwordHash: await bcrypt.hash(password, 12) });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      const field = error.keyPattern?.email ? "email" : "username";
      return { ok: false, errors: { [field]: [`This ${field} is already in use`] } };
    }
    throw error;
  }

  await signIn("credentials", { identifier: username, password, redirectTo: "/" });
  return { ok: true };
}

export async function loginAction(formData: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(formToObject(formData));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

  try {
    await signIn("credentials", {
      ...parsed.data,
      redirectTo: safeRedirectPath(formData.get("callbackUrl")),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, message: "Incorrect username/email or password." };
    }
    throw error; // Let Next.js handle the redirect.
  }
  return { ok: true };
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
