import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-3xl px-2 py-2 pb-24 md:px-4">
      <div className="mb-4 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9 rounded-md" />
          <div className="flex-1">
            <Skeleton className="h-6 w-44" />
            <Skeleton className="mt-1 h-4 w-56" />
          </div>
        </div>
      </div>

      <div className="mb-4">
        <Skeleton className="h-11 w-full rounded-xl" />
      </div>

      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, idx) => (
          <Skeleton key={idx} className="h-[92px] w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
