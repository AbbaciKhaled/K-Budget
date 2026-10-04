"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { InputField } from "@/components/ui/Field";
import { FormAlert } from "@/components/ui/FormAlert";
import { ColorPicker, EmojiPicker } from "@/components/ui/Pickers";
import { useZodForm } from "@/hooks/useZodForm";
import { COLORS } from "@/lib/palette";
import type { CategoryDTO } from "@/lib/types";
import { categorySchema } from "@/lib/validation/budget";
import type { ActionResult } from "@/lib/validation/form";

type Props = {
  initial?: Partial<Pick<CategoryDTO, "name" | "icon" | "color">>;
  action: (formData: FormData) => Promise<ActionResult<{ id: string }> | ActionResult>;
  submitLabel: string;
  onSuccess?: () => void;
  autoFocus?: boolean;
  /** Optional name suggestions shown as quick picks (onboarding). */
  suggestions?: ReadonlyArray<{ name: string; icon: string }>;
};

export function CategoryForm({ initial, action, submitLabel, onSuccess, autoFocus, suggestions }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [icon, setIcon] = useState(initial?.icon ?? "💰");
  const [color, setColor] = useState(initial?.color ?? COLORS[0]);
  const { formProps, error, message, pending } = useZodForm(categorySchema, action, { onSuccess });

  return (
    <form {...formProps} className="flex flex-col gap-5">
      {message ? <FormAlert>{message}</FormAlert> : null}

      <div className="flex items-end gap-3">
        <span
          aria-hidden
          className="flex size-12 shrink-0 items-center justify-center rounded-2xl text-[24px]"
          style={{ backgroundColor: `${color}1a` }}
        >
          {icon || "·"}
        </span>
        <InputField
          label="Name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. My son, Vinted, Household"
          autoFocus={autoFocus}
          maxLength={40}
          error={error("name")}
          wrapperClassName="flex-1"
        />
      </div>

      {suggestions?.length ? (
        <div className="-mt-2 flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s.name}
              type="button"
              onClick={() => {
                setName(s.name);
                setIcon(s.icon);
              }}
              className="press inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-[13px] font-medium text-ink-2 hover:border-line-strong"
            >
              <span aria-hidden>{s.icon}</span>
              {s.name}
            </button>
          ))}
        </div>
      ) : null}

      <EmojiPicker value={icon} onChange={setIcon} name="icon" error={error("icon")} />
      <ColorPicker value={color} onChange={setColor} name="color" />

      <Button type="submit" size="lg" block loading={pending}>
        {submitLabel}
      </Button>
    </form>
  );
}
