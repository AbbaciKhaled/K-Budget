import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { FormAlert } from "@/components/ui/FormAlert";
import { isSignupEnabled } from "@/server/config";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { callbackUrl, reason } = await searchParams;
  await connection(); // read SIGNUP_ENABLED at request time
  const signupOpen = isSignupEnabled();
  return (
    <div className="animate-fade-up">
      <h1 className="text-[32px] font-semibold leading-tight tracking-[-0.035em]">Welcome back</h1>
      <p className="mt-2 text-[15px] text-muted">Log in to keep your budget on track.</p>
      {reason === "password-changed" ? (
        <div className="mt-6">
          <FormAlert tone="success">Password changed. Please log in again on each of your devices.</FormAlert>
        </div>
      ) : null}
      <LoginForm callbackUrl={typeof callbackUrl === "string" ? callbackUrl : undefined} />
      {signupOpen ? (
        <p className="mt-8 text-center text-[14px] text-muted">
          New to K-Budget?{" "}
          <Link href="/signup" className="font-semibold text-accent hover:text-accent-hover">
            Create an account
          </Link>
        </p>
      ) : null}
    </div>
  );
}
