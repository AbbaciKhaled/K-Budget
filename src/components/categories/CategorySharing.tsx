"use client";

import { useState, useTransition, type FormEvent } from "react";
import { UserPlus, X } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { InputField } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import type { MemberDTO } from "@/lib/types";
import { removeMemberAction, shareCategoryAction } from "@/server/actions/categories";

/** People with access to a category; the owner can add (by username/email) and remove members. */
export function CategorySharing({
  categoryId,
  members: initialMembers,
  canManage,
  viewerId,
}: {
  categoryId: string;
  members: MemberDTO[];
  canManage: boolean;
  viewerId: string;
}) {
  const toast = useToast();
  const [members, setMembers] = useState(initialMembers);
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const [removingId, setRemovingId] = useState<string | null>(null);

  function share(e: FormEvent) {
    e.preventDefault();
    if (!identifier.trim()) {
      setError("Enter a username or email");
      return;
    }
    startTransition(async () => {
      const res = await shareCategoryAction(categoryId, identifier);
      if (res.ok && res.data) {
        const added = res.data;
        setMembers((m) => [...m, added]);
        setIdentifier("");
        setError(undefined);
        toast({ message: res.message ?? "Shared" });
      } else if (!res.ok) {
        setError(res.errors?.identifier?.[0] ?? res.message ?? "Couldn't share");
      }
    });
  }

  function remove(member: MemberDTO) {
    setRemovingId(member.id);
    startTransition(async () => {
      const res = await removeMemberAction(categoryId, member.id);
      setRemovingId(null);
      if (res.ok) {
        setMembers((m) => m.filter((x) => x.id !== member.id));
        toast({ message: `${member.name} no longer has access` });
      } else {
        toast({ message: res.message ?? "Couldn't remove access", tone: "error" });
      }
    });
  }

  return (
    <section aria-labelledby="sharing-title" className="flex flex-col gap-3">
      <div>
        <h3 id="sharing-title" className="text-[15px] font-semibold tracking-[-0.01em]">
          Shared with
        </h3>
        <p className="mt-0.5 text-[13px] text-muted">
          Everyone here can add, edit and delete transactions and tags in this category.
        </p>
      </div>

      <ul className="flex flex-col gap-1">
        {members.map((m) => (
          <li key={m.id} className="flex min-h-12 items-center gap-3 rounded-xl px-1">
            <Avatar name={m.name} size={36} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-medium">
                {m.name}
                {m.id === viewerId ? <span className="text-muted"> (you)</span> : null}
              </span>
              <span className="block truncate text-[12px] text-muted">@{m.username}</span>
            </span>
            {m.isOwner ? (
              <span className="rounded-full bg-subtle px-2 py-0.5 text-[11px] font-semibold text-ink-2">Owner</span>
            ) : canManage ? (
              <button
                type="button"
                onClick={() => remove(m)}
                disabled={pending}
                aria-label={`Remove ${m.name}`}
                className="flex size-9 items-center justify-center rounded-lg text-muted hover:bg-expense-soft hover:text-expense disabled:opacity-50"
              >
                {removingId === m.id ? <span className="size-4 animate-pulse rounded-full bg-line-strong" /> : <X className="size-4" />}
              </button>
            ) : null}
          </li>
        ))}
      </ul>

      {canManage ? (
        <form onSubmit={share} noValidate className="flex items-start gap-2">
          <InputField
            label="Add someone"
            value={identifier}
            onChange={(e) => {
              setIdentifier(e.target.value);
              setError(undefined);
            }}
            placeholder="Username or email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            error={error}
            wrapperClassName="flex-1 [&>label]:sr-only"
          />
          <Button type="submit" size="lg" className="h-12" loading={pending && !removingId} aria-label="Share">
            {!(pending && !removingId) ? <UserPlus className="size-4" aria-hidden /> : null}
            Share
          </Button>
        </form>
      ) : null}
    </section>
  );
}
