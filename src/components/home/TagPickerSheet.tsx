"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Sheet } from "@/components/ui/Sheet";
import type { TagDTO } from "@/lib/types";

/** Full tag list with search, multi-select and "create from search". */
export function TagPickerSheet({
  open,
  onClose,
  tags,
  selected,
  onToggle,
  onCreate,
  creating,
}: {
  open: boolean;
  onClose: () => void;
  tags: TagDTO[];
  selected: string[];
  onToggle: (id: string) => void;
  onCreate: (name: string) => Promise<boolean>;
  creating: boolean;
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const visible = q ? tags.filter((t) => t.name.toLowerCase().includes(q)) : tags;
  const exact = tags.find((t) => t.name.toLowerCase() === q);
  const canCreate = q.length > 0 && !exact;

  async function create() {
    if (await onCreate(query.trim())) setQuery("");
  }

  /** Toggle a tag; when it came from a search, clear the search to chain the next one. */
  function pick(id: string) {
    if (!q || !selected.includes(id)) onToggle(id);
    if (q) setQuery("");
  }

  function close() {
    setQuery("");
    onClose();
  }

  return (
    <Sheet open={open} onClose={close} title="Tags" description="Pick one or more tags for this transaction.">
      <div className="flex flex-col gap-4">
        <label className="relative block">
          <span className="sr-only">Search or create a tag</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              e.preventDefault();
              // Enter picks the obvious match; it only creates a tag when nothing matches.
              const match = exact ?? (visible.length === 1 ? visible[0] : undefined);
              if (match) pick(match.id);
              else if (q && visible.length === 0) void create();
            }}
            maxLength={30}
            placeholder={tags.length ? "Search or create a tag" : "Name your first tag"}
            enterKeyHint="done"
            className="h-12 w-full rounded-xl border border-line bg-surface pl-10 pr-3.5 text-[15px] outline-none focus:border-accent focus:shadow-[0_0_0_4px_var(--color-accent-soft)] focus-visible:outline-none"
          />
        </label>

        <div className="flex max-h-[40dvh] flex-wrap content-start gap-2 overflow-y-auto">
          {visible.map((t) => (
            <Chip key={t.id} color={t.color} selected={selected.includes(t.id)} onClick={() => pick(t.id)}>
              {t.name}
            </Chip>
          ))}
          {canCreate ? (
            <Chip onClick={create} disabled={creating} className="border-dashed border-accent text-accent-ink">
              <Plus className="size-4" aria-hidden />
              Create “{query.trim()}”
            </Chip>
          ) : null}
          {visible.length === 0 && !canCreate ? <p className="py-4 text-[14px] text-muted">No tags yet.</p> : null}
        </div>

        <Button size="lg" block onClick={close}>
          {selected.length ? `Done · ${selected.length} selected` : "Done"}
        </Button>
      </div>
    </Sheet>
  );
}
