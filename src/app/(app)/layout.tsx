import { AppNav } from "@/components/layout/AppNav";
import { ToastProvider } from "@/components/ui/Toast";
import { requireUser } from "@/server/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <ToastProvider>
      <AppNav userName={user.name} username={user.username} />
      <div className="min-h-dvh lg:pl-64">{children}</div>
    </ToastProvider>
  );
}
