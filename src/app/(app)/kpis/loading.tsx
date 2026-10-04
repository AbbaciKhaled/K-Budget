import { Page } from "@/components/layout/Page";
import { Skeleton } from "@/components/ui/Skeleton";

export default function KpisLoading() {
  return (
    <Page wide>
      <div role="status" aria-label="Loading insights" className="flex flex-col gap-5">
        <div className="flex items-end justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-11 w-32 rounded-full" />
        </div>
        <Skeleton className="h-12 w-full sm:w-80" />
        <Skeleton className="h-36 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    </Page>
  );
}
