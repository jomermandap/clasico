import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-3xl px-2 py-2 pb-24 md:px-4">
      <div className="mb-4 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9 rounded-md" />
          <div className="flex-1">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="mt-1 h-4 w-56" />
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-5 w-28" />
      </div>

      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, idx) => (
          <Skeleton key={idx} className="h-[160px] w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
