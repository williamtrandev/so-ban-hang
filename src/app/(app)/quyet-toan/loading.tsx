import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonTransition } from "@/components/page-transition";

export default function Loading() {
  return (
    <SkeletonTransition>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 md:gap-5">
        <header className="flex flex-col gap-2">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </header>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
          <Skeleton className="col-span-2 h-[4.75rem] rounded-xl sm:col-span-1" />
          <Skeleton className="h-[4.75rem] rounded-xl" />
          <Skeleton className="h-[4.75rem] rounded-xl" />
        </div>

        <div className="grid grid-cols-1 gap-4 md:gap-5 xl:grid-cols-12">
          <Card className="xl:col-span-7">
            <CardHeader>
              <Skeleton className="h-5 w-44" />
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-16 rounded-lg" />
                ))}
              </div>
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-36 w-full rounded-lg" />
              <Skeleton className="h-9 w-40 rounded-lg" />
            </CardContent>
          </Card>
          <Card className="xl:col-span-5">
            <CardHeader className="gap-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-64 max-w-full" />
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="size-9 rounded-xl" />
                  <div className="flex flex-1 flex-col gap-1.5">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </SkeletonTransition>
  );
}
