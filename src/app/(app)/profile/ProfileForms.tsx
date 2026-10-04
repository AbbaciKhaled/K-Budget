"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { InputField, SelectField } from "@/components/ui/Field";
import { FormAlert } from "@/components/ui/FormAlert";
import { useToast } from "@/components/ui/Toast";
import { useZodForm } from "@/hooks/useZodForm";
import { CURRENCIES } from "@/lib/money";
import type { CurrentUser } from "@/lib/types";
import { passwordChangeSchema, profileSchema } from "@/lib/validation/auth";
import { changePasswordAction, updateProfileAction } from "@/server/actions/profile";

export function ProfileForm({ user }: { user: CurrentUser }) {
  const toast = useToast();
  const router = useRouter();
  const { formProps, error, message, pending } = useZodForm(profileSchema, updateProfileAction, {
    onSuccess: (res) => {
      toast({ message: res.message ?? "Saved" });
      router.refresh();
    },
  });

  return (
    <form {...formProps} className="mt-5 grid gap-4 sm:grid-cols-2">
      {message ? (
        <div className="sm:col-span-2">
          <FormAlert>{message}</FormAlert>
        </div>
      ) : null}
      <InputField label="Full name" name="name" defaultValue={user.name} autoComplete="name" error={error("name")} />
      <InputField
        label="Username"
        name="username"
        defaultValue={user.username}
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        error={error("username")}
      />
      <InputField
        label="Email"
        name="email"
        type="email"
        defaultValue={user.email}
        autoComplete="email"
        error={error("email")}
      />
      <SelectField label="Currency" name="currency" defaultValue={user.currency} error={error("currency")}>
        {CURRENCIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.code} — {c.label}
          </option>
        ))}
      </SelectField>
      <div className="flex justify-end sm:col-span-2">
        <Button type="submit" loading={pending} className="w-full sm:w-auto">
          Save changes
        </Button>
      </div>
    </form>
  );
}

export function PasswordForm() {
  const toast = useToast();
  const { formProps, error, message, pending } = useZodForm(passwordChangeSchema, changePasswordAction, {
    onSuccess: (res, form) => {
      form.reset();
      toast({ message: res.message ?? "Password changed" });
    },
  });

  return (
    <form {...formProps} className="mt-5 grid gap-4 sm:grid-cols-2">
      {message ? (
        <div className="sm:col-span-2">
          <FormAlert>{message}</FormAlert>
        </div>
      ) : null}
      <InputField
        label="Current password"
        name="currentPassword"
        type="password"
        autoComplete="current-password"
        error={error("currentPassword")}
        wrapperClassName="sm:col-span-2"
      />
      <InputField
        label="New password"
        name="newPassword"
        type="password"
        autoComplete="new-password"
        hint="At least 8 characters, with a letter and a number."
        error={error("newPassword")}
      />
      <InputField
        label="Confirm new password"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        error={error("confirmPassword")}
      />
      <div className="flex justify-end sm:col-span-2">
        <Button type="submit" variant="secondary" loading={pending} className="w-full sm:w-auto">
          Update password
        </Button>
      </div>
    </form>
  );
}
