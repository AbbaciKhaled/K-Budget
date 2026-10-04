"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { BarChart3, ChevronRight, Home, LayoutGrid, ListOrdered, LogOut, MoreHorizontal, Tags, UserRound } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Logo } from "@/components/ui/Logo";
import { Sheet } from "@/components/ui/Sheet";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/server/actions/auth";

const PRIMARY = [
  { href: "/", label: "Home", icon: Home },
  { href: "/transactions", label: "Transactions", icon: ListOrdered },
  { href: "/kpis", label: "KPIs", icon: BarChart3 },
] as const;

const SECONDARY = [
  { href: "/categories", label: "Categories", icon: LayoutGrid },
  { href: "/tags", label: "Tags", icon: Tags },
  { href: "/profile", label: "Profile", icon: UserRound },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function AppNav({ userName, username }: { userName: string; username: string }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [loggingOut, startLogout] = useTransition();
  const moreActive = SECONDARY.some((i) => isActive(pathname, i.href));

  const logout = () => startLogout(() => logoutAction());

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-surface/80 px-4 py-6 backdrop-blur lg:flex">
        <Link href="/" className="px-2">
          <Logo />
        </Link>
        <nav aria-label="Main" className="mt-10 flex flex-col gap-1">
          {[...PRIMARY, ...SECONDARY].map(({ href, label, icon: Icon }, i) => {
            const active = isActive(pathname, href);
            return (
              <div key={href}>
                {i === PRIMARY.length ? (
                  <p className="mb-2 mt-6 px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Manage</p>
                ) : null}
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-medium transition-colors",
                    active ? "bg-ink text-white" : "text-ink-2 hover:bg-subtle hover:text-ink",
                  )}
                >
                  <Icon className="size-[18px]" aria-hidden />
                  {label}
                </Link>
              </div>
            );
          })}
        </nav>
        <div className="mt-auto flex items-center gap-3 rounded-2xl border border-line bg-surface p-2.5">
          <Avatar name={userName} size={36} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-semibold">{userName}</p>
            <p className="truncate text-[12px] text-muted">@{username}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            disabled={loggingOut}
            aria-label="Log out"
            className="flex size-9 items-center justify-center rounded-lg text-muted hover:bg-subtle hover:text-expense"
          >
            <LogOut className="size-[18px]" />
          </button>
        </div>
      </aside>

      {/* Mobile bottom bar */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
      >
        <ul className="mx-auto grid h-16 max-w-lg grid-cols-4">
          {PRIMARY.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                    active ? "text-ink" : "text-muted",
                  )}
                >
                  <Icon className={cn("size-[22px]", active && "stroke-[2.4]")} aria-hidden />
                  {label}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className={cn(
                "flex h-full w-full flex-col items-center justify-center gap-1 text-[11px] font-medium",
                moreActive ? "text-ink" : "text-muted",
              )}
            >
              <MoreHorizontal className={cn("size-[22px]", moreActive && "stroke-[2.4]")} aria-hidden />
              More
            </button>
          </li>
        </ul>
      </nav>

      <Sheet open={moreOpen} onClose={() => setMoreOpen(false)} title="More">
        <ul className="flex flex-col gap-1">
          {SECONDARY.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                onClick={() => setMoreOpen(false)}
                className="flex h-14 items-center gap-3.5 rounded-2xl px-3 text-[16px] font-medium hover:bg-subtle"
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-subtle">
                  <Icon className="size-5 text-ink-2" aria-hidden />
                </span>
                <span className="flex-1">{label}</span>
                <ChevronRight className="size-4 text-muted" aria-hidden />
              </Link>
            </li>
          ))}
          <li className="mt-2 border-t border-line pt-2">
            <button
              type="button"
              onClick={logout}
              disabled={loggingOut}
              className="flex h-14 w-full items-center gap-3.5 rounded-2xl px-3 text-[16px] font-medium text-expense hover:bg-expense-soft"
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-expense-soft">
                <LogOut className="size-5" aria-hidden />
              </span>
              Log out
            </button>
          </li>
        </ul>
      </Sheet>
    </>
  );
}
