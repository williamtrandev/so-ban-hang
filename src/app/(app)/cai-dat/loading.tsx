import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonTransition } from "@/components/page-transition";

export default function Loading() {
  return (
    <SkeletonTransition>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-7">
        <header className="flex items-start gap-3">
          <Skeleton className="size-10 shrink-0 rounded-xl" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-full max-w-md" />
          </div>
        </header>
        <div className="grid gap-6 md:grid-cols-[1fr_300px] md:items-start">
          <div className="flex flex-col gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-11 w-full rounded-xl" />
              </div>
            ))}
            <Skeleton className="ml-auto h-10 w-28 rounded-xl" />
          </div>
          <Skeleton className="h-[26rem] rounded-2xl" />
        </div>
      </div>
    </SkeletonTransition>
  );
}
