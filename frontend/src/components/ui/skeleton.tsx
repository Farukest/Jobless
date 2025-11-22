import { cn } from '@/lib/utils'

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('skeleton rounded-md bg-muted', className)}
      {...props}
    />
  )
}

export function CardSkeleton() {
  return (
    <div className="bg-card rounded-lg border border-border p-6">
      {/* Header: Avatar + Author Info + Badges */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </div>

      {/* Title */}
      <Skeleton className="h-6 w-3/4 mb-2" />

      {/* Description (2 lines) */}
      <Skeleton className="h-4 w-full mb-1" />
      <Skeleton className="h-4 w-5/6 mb-4" />

      {/* Tags (3 pills) */}
      <div className="flex gap-2 mb-4">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>

      {/* Hashtags */}
      <div className="flex gap-2 mb-4">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-14" />
      </div>

      {/* Engagement Bar */}
      <div className="flex items-center gap-4 pt-4 border-t border-border">
        <div className="flex items-center gap-1">
          <Skeleton className="w-4 h-4" />
          <Skeleton className="w-6 h-4" />
        </div>
        <div className="flex items-center gap-1">
          <Skeleton className="w-4 h-4" />
          <Skeleton className="w-6 h-4" />
        </div>
        <div className="flex items-center gap-1">
          <Skeleton className="w-4 h-4" />
          <Skeleton className="w-6 h-4" />
        </div>
      </div>
    </div>
  )
}

export function ProfileSkeleton() {
  return (
    <div className="flex items-center space-x-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  )
}

export function TwitterFeedSkeleton() {
  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-3">
      {/* Header: Avatar + User Info */}
      <div className="flex gap-3 mb-3">
        <Skeleton className="w-12 h-12 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>

      {/* Tags */}
      <div className="flex gap-2 mb-3">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>

      {/* Title */}
      <Skeleton className="h-6 w-3/4 mb-2" />

      {/* Description */}
      <Skeleton className="h-4 w-full mb-1" />
      <Skeleton className="h-4 w-5/6 mb-3" />

      {/* Content Preview - 3 blocks */}
      <Skeleton className="h-4 w-full mb-1" />
      <Skeleton className="h-4 w-full mb-1" />
      <Skeleton className="h-4 w-4/5 mb-3" />

      {/* Hashtags */}
      <div className="flex gap-2 mb-3">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-14" />
      </div>

      {/* Engagement Bar (2 blocks) */}
      <div className="flex items-center gap-6 pt-3 border-t border-border">
        <div className="flex items-center gap-1.5">
          <Skeleton className="w-4 h-4" />
          <Skeleton className="w-6 h-4" />
        </div>
        <div className="flex items-center gap-1.5">
          <Skeleton className="w-4 h-4" />
          <Skeleton className="w-6 h-4" />
        </div>
        <div className="flex items-center gap-1.5">
          <Skeleton className="w-4 h-4" />
          <Skeleton className="w-6 h-4" />
        </div>
        <div className="flex items-center gap-1.5">
          <Skeleton className="w-4 h-4" />
          <Skeleton className="w-6 h-4" />
        </div>
      </div>
    </div>
  )
}
