import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-3xl px-2 py-2 pb-24 md:px-4">
      <div className="sticky top-0 z-10 bg-background pb-2">
        <div className="flex w-full items-center justify-between gap-2">
          <Skeleton className="h-11 w-11 rounded-md" />
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-11 w-11 rounded-md" />
        </div>
      </div>

      <div className="space-y-3 mt-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <Skeleton key={idx} className="h-[140px] w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
