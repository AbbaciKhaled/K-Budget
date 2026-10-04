import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { listCategories } from "@/server/queries/categories";
import { requireUser } from "@/server/session";
import { OnboardingForm } from "./OnboardingForm";

export const metadata: Metadata = { title: "Welcome" };

export default async function OnboardingPage() {
  const [user, categories] = await Promise.all([requireUser(), listCategories()]);
  if (categories.length > 0) redirect("/");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-10 pt-[max(env(safe-area-inset-top),24px)]">
      <Logo />
      <div className="mt-10 animate-fade-up">
        <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-accent">Getting started</p>
        <h1 className="mt-2 text-[30px] font-semibold leading-tight tracking-[-0.035em]">
          Welcome, {user.name.split(" ")[0]}. Create your first category.
        </h1>
        <p className="mt-2 text-[15px] text-muted">
          A category is a budget you track on its own — your household, your kid, a side business… You can add more anytime.
        </p>
        <div className="mt-8">
          <OnboardingForm />
        </div>
      </div>
    </main>
  );
}
