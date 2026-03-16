import { Skeleton } from "@/components/ui/skeleton";

export default function MerchantDetailLoading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-4 pb-24 space-y-4">
      <div className="flex items-center gap-2">
        <Skeleton className="h-7 w-9 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>

      <div className="space-y-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>

      <Skeleton className="h-px w-full" />

      <div className="space-y-3">
        <Skeleton className="h-5 w-40" />
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        ))}
      </div>
    </div>
  );
}

