import { cn } from '@/lib/utils';

/** Shimmer block. Matches the layout footprint of the real data card. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('animate-pulse rounded-lg bg-slate-100', className)}
    />
  );
}

/** Dashboard stats + list skeleton used by dashboard/loading.tsx */
export function DashboardSkeleton() {
  return (
    <div className="flex-1 p-6 md:p-8 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </div>
    </div>
  );
}

export function ListPageSkeleton() {
  return (
    <div className="flex-1 p-6 md:p-8 space-y-5">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-10 w-28" />
      </div>
      <Skeleton className="h-14" />
      <Skeleton className="h-14" />
      <Skeleton className="h-14" />
      <Skeleton className="h-14" />
    </div>
  );
}

export function DetailPageSkeleton() {
  return (
    <div className="flex-1 p-6 md:p-8 space-y-8">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-32" />
      <div className="grid md:grid-cols-2 gap-6">
        <Skeleton className="h-56" />
        <Skeleton className="h-56" />
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}
