import { Page, PageHeader } from "@/components/layout/Page";
import { requireUser } from "@/server/session";

export default async function HomePage() {
  const user = await requireUser();
  return (
    <Page>
      <PageHeader title={`Hi, ${user.name.split(" ")[0]}`} subtitle="Home screen arrives in phase 2." />
    </Page>
  );
}
