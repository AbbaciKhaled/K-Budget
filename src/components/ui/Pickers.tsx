"use client";

import { Check } from "lucide-react";
import { COLORS, CATEGORY_EMOJIS } from "@/lib/palette";
import { cn } from "@/lib/utils";

export function ColorPicker({
  value,
  onChange,
  name,
  label = "Color",
}: {
  value: string;
  onChange: (color: string) => void;
  name?: string;
  label?: string;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-[13px] font-medium text-ink-2">{label}</legend>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <div className="flex flex-wrap gap-2.5">
        {COLORS.map((c) => {
          const selected = c.toLowerCase() === value.toLowerCase();
          return (
            <button
              key={c}
              type="button"
              onClick={() => onChange(c)}
              aria-label={`Color ${c}`}
              aria-pressed={selected}
              className={cn(
                "press flex size-11 items-center justify-center rounded-full ring-offset-2 ring-offset-surface",
                selected && "ring-2",
              )}
              style={{ backgroundColor: c, ["--tw-ring-color" as string]: c }}
            >
              {selected ? <Check className="size-4 stroke-[3] text-white" aria-hidden /> : null}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function EmojiPicker({
  value,
  onChange,
  name,
  error,
}: {
  value: string;
  onChange: (emoji: string) => void;
  name?: string;
  error?: string;
}) {
  const isCustom = value !== "" && !CATEGORY_EMOJIS.includes(value as (typeof CATEGORY_EMOJIS)[number]);
  return (
    <fieldset>
      <legend className="mb-2 text-[13px] font-medium text-ink-2">Icon</legend>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <div className="grid grid-cols-8 gap-1.5">
        {CATEGORY_EMOJIS.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => onChange(e)}
            aria-label={`Icon ${e}`}
            aria-pressed={value === e}
            className={cn(
              "press flex aspect-square min-h-11 items-center justify-center rounded-xl text-[22px]",
              value === e ? "bg-accent-soft ring-2 ring-accent" : "hover:bg-subtle",
            )}
          >
            {e}
          </button>
        ))}
      </div>
      <label className="mt-3 flex items-center gap-3 text-[13px] text-muted">
        Or type any emoji
        <input
          value={isCustom ? value : ""}
          onChange={(e) => {
            const seg = [...new Intl.Segmenter().segment(e.target.value)].map((s) => s.segment);
            onChange(seg[seg.length - 1] ?? "");
          }}
          placeholder="🙂"
          aria-label="Custom emoji"
          className={cn(
            "h-11 w-16 rounded-xl border bg-surface text-center text-[20px] outline-none focus:border-accent",
            isCustom ? "border-accent" : "border-line",
          )}
        />
      </label>
      {error ? (
        <p role="alert" className="mt-1.5 text-[13px] font-medium text-expense">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
