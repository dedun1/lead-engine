import { Skeleton } from '@/components/ui/skeleton';

export function RouteLoading({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-4 p-6 md:p-8">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-4 w-96" />
      <div className="mt-8 space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}
