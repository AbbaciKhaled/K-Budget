import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "./SignupForm";

export const metadata: Metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <div className="animate-fade-up">
      <h1 className="text-[32px] font-semibold leading-tight tracking-[-0.035em]">Create your account</h1>
      <p className="mt-2 text-[15px] text-muted">Takes less than a minute. No card required.</p>
      <SignupForm />
      <p className="mt-8 text-center text-[14px] text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-accent hover:text-accent-hover">
          Log in
        </Link>
      </p>
    </div>
  );
}
