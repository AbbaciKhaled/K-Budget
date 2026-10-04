"use client";

import { useRouter } from "next/navigation";
import { CategoryForm } from "@/components/categories/CategoryForm";
import { CATEGORY_SUGGESTIONS } from "@/lib/palette";
import { createCategoryAction } from "@/server/actions/categories";

export function OnboardingForm() {
  const router = useRouter();
  return (
    <CategoryForm
      action={createCategoryAction}
      submitLabel="Create category & start"
      suggestions={CATEGORY_SUGGESTIONS}
      autoFocus
      onSuccess={() => router.replace("/")}
    />
  );
}
