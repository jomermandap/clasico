import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-3xl px-2 py-2 pb-24 md:px-4">
      <div className="mb-4">
        <Skeleton className="h-9 w-48 rounded-md" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 5 }).map((_, idx) => (
          <Skeleton key={idx} className="h-[100px] w-full rounded-xl" />
        ))}
      </div>

      <div className="mt-3">
        <Skeleton className="h-[180px] w-full rounded-xl" />
      </div>
    </div>
  );
}
