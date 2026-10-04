import type { Metadata } from "next";
import { Page, PageHeader } from "@/components/layout/Page";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { requireUser } from "@/server/session";
import { PasswordForm, ProfileForm } from "./ProfileForms";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await requireUser();

  return (
    <Page>
      <PageHeader title="Profile" />

      <div className="mb-6 flex items-center gap-4">
        <Avatar name={user.name} size={64} />
        <div className="min-w-0">
          <p className="truncate text-[20px] font-semibold tracking-[-0.02em]">{user.name}</p>
          <p className="truncate text-[14px] text-muted">
            @{user.username} · {user.email}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        <Card className="p-5 sm:p-6">
          <h2 className="text-[17px] font-semibold tracking-[-0.01em]">Personal details</h2>
          <p className="mt-1 text-[14px] text-muted">Your name, login and display currency.</p>
          <ProfileForm user={user} />
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="text-[17px] font-semibold tracking-[-0.01em]">Password</h2>
          <p className="mt-1 text-[14px] text-muted">You&apos;ll need your current password to set a new one.</p>
          <PasswordForm />
        </Card>
      </div>
    </Page>
  );
}
