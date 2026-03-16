import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function MerchantsLoading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-4 pb-24">
      <div className="mb-4">
        <div className="mb-2 flex items-center gap-2">
          <Skeleton className="h-7 w-9 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
      </div>

      <div className="mb-4">
        <Skeleton className="h-10 w-full" />
      </div>

      <div className="mb-4">
        <Skeleton className="h-9 w-56 rounded-full" />
      </div>

      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton
            key={index}
            className="h-[160px] w-full rounded-xl"
          />
        ))}
      </div>
    </div>
  );
}

