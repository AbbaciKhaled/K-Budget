import { signOut } from "@/auth";

/** Clears a session whose user no longer exists (e.g. deleted account) and goes back to login. */
export async function GET() {
  await signOut({ redirectTo: "/login" });
}
