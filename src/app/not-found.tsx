import Link from "next/link";
import { LogoMark } from "@/components/ui/Logo";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <LogoMark className="size-10" />
      <p className="tabular mt-8 text-[64px] font-semibold leading-none tracking-[-0.05em]">404</p>
      <h1 className="mt-3 text-[20px] font-semibold tracking-[-0.02em]">This page doesn&apos;t exist</h1>
      <p className="mt-1 text-[15px] text-muted">The link may be broken, or the page may have moved.</p>
      <Link href="/" className="press mt-8 inline-flex h-12 items-center rounded-2xl bg-ink px-5 text-[15px] font-semibold text-white">
        Back to home
      </Link>
    </main>
  );
}
