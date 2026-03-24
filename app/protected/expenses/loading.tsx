import { Skeleton } from "@/components/ui/skeleton";

function GroupSkeleton() {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-[124px] w-full rounded-xl" />
      <Skeleton className="h-[124px] w-full rounded-xl" />
    </section>
  );
}

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

      <div className="mb-4 mt-3 space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-48" />
      </div>

      <div className="space-y-6">
        <GroupSkeleton />
        <GroupSkeleton />
        <GroupSkeleton />
      </div>
    </div>
  );
}
