import { z } from "zod";

export type FieldErrors = Record<string, string[] | undefined>;

/** Result shape returned by every mutating server action. */
export type ActionResult<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; message?: string; errors?: FieldErrors };

export function fieldErrors(error: z.ZodError): FieldErrors {
  return z.flattenError(error).fieldErrors as FieldErrors;
}

export function formToObject(formData: FormData) {
  const out: Record<string, FormDataEntryValue> = {};
  formData.forEach((value, key) => {
    out[key] = value;
  });
  return out;
}
