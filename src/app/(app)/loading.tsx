import { Page } from "@/components/layout/Page";
import { ListSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function AppLoading() {
  return (
    <Page>
      <div role="status" aria-label="Loading" className="flex flex-col gap-5">
        <div className="flex items-end justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-11 w-32 rounded-full" />
        </div>
        <Skeleton className="h-40 w-full rounded-2xl" />
        <ListSkeleton rows={4} />
      </div>
    </Page>
  );
}
