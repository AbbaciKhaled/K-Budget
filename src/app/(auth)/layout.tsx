import { Logo } from "@/components/ui/Logo";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_minmax(0,560px)]">
      <main className="flex flex-col px-5 pb-10 pt-[max(env(safe-area-inset-top),24px)] sm:px-10">
        <Logo />
        <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center py-10">{children}</div>
      </main>
      <AuthShowcase />
    </div>
  );
}

/** Decorative panel on large screens — a quiet preview of the product. */
function AuthShowcase() {
  const bars = [38, 62, 45, 80, 54, 92, 70];
  return (
    <aside aria-hidden className="relative hidden overflow-hidden bg-ink lg:flex lg:flex-col lg:justify-between lg:p-12">
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)",
          backgroundSize: "22px 22px",
        }}
      />
      <div className="absolute -right-24 -top-24 size-[420px] rounded-full bg-accent/40 blur-[110px]" />

      <p className="relative max-w-xs text-[28px] font-semibold leading-[1.15] tracking-[-0.03em] text-white">
        Every euro, logged in under five seconds.
      </p>

      <div className="relative space-y-4">
        <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur">
          <p className="text-[13px] font-medium text-white/50">My son · October</p>
          <p className="tabular mt-2 text-[44px] font-semibold leading-none tracking-[-0.04em] text-white">
            €1,284<span className="text-white/40">.50</span>
          </p>
          <div className="mt-6 flex h-24 items-end gap-2">
            {bars.map((h, i) => (
              <div key={i} className="flex-1 rounded-md bg-white/15" style={{ height: `${h}%` }}>
                <div className="h-full rounded-md bg-accent" style={{ opacity: i === bars.length - 2 ? 1 : 0 }} />
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-1 rounded-2xl border border-white/10 bg-white/[0.06] p-4">
            <p className="text-[12px] text-white/50">Income</p>
            <p className="tabular mt-1 text-lg font-semibold text-[#4ade9b]">+€2,150.00</p>
          </div>
          <div className="flex-1 rounded-2xl border border-white/10 bg-white/[0.06] p-4">
            <p className="text-[12px] text-white/50">Expenses</p>
            <p className="tabular mt-1 text-lg font-semibold text-[#ff8a8e]">−€865.50</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
