"use client";

import { useState, useTransition, type FormEvent } from "react";
import type { z } from "zod";
import { fieldErrors, formToObject, type ActionResult, type FieldErrors } from "@/lib/validation/form";

type Options<T> = {
  onSuccess?: (result: Extract<ActionResult<T>, { ok: true }>, form: HTMLFormElement) => void;
};

/**
 * Validates a form with a shared Zod schema on the client, then calls the server action
 * (which validates again). Keeps typed values in place on error — no form reset.
 */
export function useZodForm<T = undefined>(
  schema: z.ZodType,
  action: (formData: FormData) => Promise<ActionResult<T>>,
  options: Options<T> = {},
) {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<string>();
  const [pending, startTransition] = useTransition();

  function focusFirstError(form: HTMLFormElement, errs: FieldErrors) {
    const first = Object.keys(errs).find((k) => errs[k]?.length);
    if (first) (form.elements.namedItem(first) as HTMLElement | null)?.focus();
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const parsed = schema.safeParse(formToObject(formData));
    if (!parsed.success) {
      const errs = fieldErrors(parsed.error);
      setErrors(errs);
      setMessage(undefined);
      focusFirstError(form, errs);
      return;
    }
    setErrors({});
    setMessage(undefined);
    startTransition(async () => {
      const result = await action(formData);
      if (!result) return;
      if (result.ok) {
        options.onSuccess?.(result, form);
      } else {
        setErrors(result.errors ?? {});
        setMessage(result.message);
        if (result.errors) focusFirstError(form, result.errors);
      }
    });
  }

  /** Clear a field's error as soon as the user edits it. */
  function onChange(event: FormEvent<HTMLFormElement>) {
    const name = (event.target as HTMLInputElement).name;
    if (name && errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  }

  return {
    pending,
    message,
    error: (name: string) => errors[name]?.[0],
    formProps: { onSubmit, onChange, noValidate: true },
  };
}
