"use client";

import { Button } from "@/components/ui/Button";
import { InputField } from "@/components/ui/Field";
import { FormAlert } from "@/components/ui/FormAlert";
import { useZodForm } from "@/hooks/useZodForm";
import { signupSchema } from "@/lib/validation/auth";
import { signupAction } from "@/server/actions/auth";

export function SignupForm() {
  const { formProps, error, message, pending } = useZodForm(signupSchema, signupAction);

  return (
    <form {...formProps} className="mt-8 flex flex-col gap-4">
      {message ? <FormAlert>{message}</FormAlert> : null}
      <InputField label="Full name" name="name" autoComplete="name" autoFocus error={error("name")} />
      <InputField
        label="Username"
        name="username"
        autoComplete="username"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        hint="3–20 characters: letters, numbers, dots or underscores."
        error={error("username")}
      />
      <InputField label="Email" name="email" type="email" inputMode="email" autoComplete="email" error={error("email")} />
      <InputField
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        hint="At least 8 characters, with a letter and a number."
        error={error("password")}
      />
      <InputField
        label="Confirm password"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        error={error("confirmPassword")}
      />
      <Button type="submit" size="lg" block loading={pending} className="mt-2">
        Create account
      </Button>
    </form>
  );
}
