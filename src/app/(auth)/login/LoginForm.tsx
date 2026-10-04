"use client";

import { Button } from "@/components/ui/Button";
import { InputField } from "@/components/ui/Field";
import { FormAlert } from "@/components/ui/FormAlert";
import { useZodForm } from "@/hooks/useZodForm";
import { safeRedirectPath } from "@/lib/utils";
import { loginSchema } from "@/lib/validation/auth";
import { loginAction } from "@/server/actions/auth";

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const { formProps, error, message, pending } = useZodForm(loginSchema, loginAction);

  return (
    <form {...formProps} className="mt-8 flex flex-col gap-4">
      <input type="hidden" name="callbackUrl" value={safeRedirectPath(callbackUrl)} />
      {message ? <FormAlert>{message}</FormAlert> : null}
      <InputField
        label="Username or email"
        name="identifier"
        autoComplete="username"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        autoFocus
        error={error("identifier")}
      />
      <InputField label="Password" name="password" type="password" autoComplete="current-password" error={error("password")} />
      <Button type="submit" size="lg" block loading={pending} className="mt-2">
        Log in
      </Button>
    </form>
  );
}
