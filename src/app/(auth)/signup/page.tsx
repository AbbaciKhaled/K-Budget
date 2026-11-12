import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { isSignupEnabled } from "@/server/config";
import { SignupForm } from "./SignupForm";

export const metadata: Metadata = { title: "Create account" };

export default async function SignupPage() {
  await connection(); // read SIGNUP_ENABLED at request time
  const open = isSignupEnabled();

  return (
    <div className="animate-fade-up">
      <h1 className="text-[32px] font-semibold leading-tight tracking-[-0.035em]">
        {open ? "Create your account" : "Sign-ups are closed"}
      </h1>
      <p className="mt-2 text-[15px] text-muted">
        {open
          ? "Takes less than a minute. No card required."
          : "This K-Budget instance is private. Ask its owner for an account, or host your own copy — it's open source."}
      </p>
      {open ? <SignupForm /> : null}
      <p className="mt-8 text-center text-[14px] text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-accent hover:text-accent-hover">
          Log in
        </Link>
      </p>
    </div>
  );
}
