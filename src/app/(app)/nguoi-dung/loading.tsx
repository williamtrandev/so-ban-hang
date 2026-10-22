import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonTransition } from "@/components/page-transition";

export default function Loading() {
  return (
    <SkeletonTransition>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <header className="flex flex-col gap-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </header>
        <div className="flex flex-col gap-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[4.25rem] w-full rounded-xl" />
          ))}
        </div>
      </div>
    </SkeletonTransition>
  );
}
