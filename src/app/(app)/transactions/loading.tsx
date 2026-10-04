import { Page } from "@/components/layout/Page";
import { ListSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function TransactionsLoading() {
  return (
    <Page>
      <div role="status" aria-label="Loading transactions" className="flex flex-col gap-5">
        <div className="flex items-end justify-between">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-11 w-32 rounded-full" />
        </div>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-3.5 w-32" />
        <ListSkeleton rows={3} />
        <ListSkeleton rows={2} />
      </div>
    </Page>
  );
}
