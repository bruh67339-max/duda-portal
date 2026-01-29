import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

/**
 * Base skeleton component with pulse animation.
 *
 * @example
 * <Skeleton className="h-8 w-32" />
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      aria-hidden="true"
    />
  );
}

/**
 * Full-page loading skeleton that mimics a typical page layout.
 * Used as the default loading state for ContentProvider.
 *
 * @example
 * <ContentProvider loadingFallback={<LoadingSkeleton />}>
 *   ...
 * </ContentProvider>
 */
export function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background" aria-label="Loading content">
      {/* Navbar skeleton */}
      <div className="h-16 border-b px-6 flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <div className="flex gap-4">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>

      {/* Hero skeleton */}
      <div className="container mx-auto px-6 py-16 space-y-6">
        <Skeleton className="h-16 w-3/4 max-w-2xl" />
        <Skeleton className="h-8 w-1/2 max-w-xl" />
        <Skeleton className="h-12 w-40" />
      </div>

      {/* Content grid skeleton */}
      <div className="container mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton for individual text elements.
 *
 * @example
 * {isLoading ? <TextSkeleton className="h-8 w-48" /> : <h1>{title}</h1>}
 */
export function TextSkeleton({ className }: SkeletonProps) {
  return <Skeleton className={cn('h-6 w-full', className)} />;
}

/**
 * Skeleton for images that maintains aspect ratio.
 *
 * @example
 * {isLoading ? <ImageSkeleton className="w-full" /> : <img src={url} />}
 */
export function ImageSkeleton({ className }: SkeletonProps) {
  return <Skeleton className={cn('w-full aspect-video', className)} />;
}

/**
 * Skeleton for card-style content blocks.
 *
 * @example
 * {isLoading ? <CardSkeleton /> : <ProductCard {...product} />}
 */
export function CardSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('p-4 border rounded-lg space-y-3', className)}>
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

/**
 * Skeleton for a list of items.
 *
 * @example
 * {isLoading ? <ListSkeleton count={5} /> : items.map(...)}
 */
export function ListSkeleton({
  count = 3,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
