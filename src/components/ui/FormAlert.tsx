import { AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function FormAlert({ children, tone = "error" }: { children: React.ReactNode; tone?: "error" | "success" }) {
  const Icon = tone === "error" ? AlertCircle : CheckCircle2;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 rounded-xl px-3.5 py-3 text-[14px] font-medium",
        tone === "error" ? "bg-expense-soft text-[#a8262c]" : "bg-income-soft text-income-hover",
      )}
    >
      <Icon className="mt-px size-[18px] shrink-0" aria-hidden />
      <span>{children}</span>
    </div>
  );
}
