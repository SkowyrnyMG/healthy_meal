import { Skeleton } from "@/components/ui/skeleton";

// ============================================================================
// TYPES
// ============================================================================

interface TagFilterSkeletonProps {
  /**
   * Number of skeleton tag items to display
   * @default 6
   */
  count?: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * TagFilterSkeleton component displays placeholder skeleton while tags are loading
 *
 * Features:
 * - Matches TagFilterSection layout for seamless loading experience
 * - Displays checkbox and label skeletons
 * - Shimmer animation via Shadcn skeleton component
 * - Scrollable container matching the actual tag filter section
 * - Configurable skeleton count
 *
 * @example
 * ```tsx
 * {isLoading ? (
 *   <TagFilterSkeleton count={6} />
 * ) : (
 *   <TagFilterSection tags={tags} />
 * )}
 * ```
 */
const TagFilterSkeleton = ({ count = 6 }: TagFilterSkeletonProps) => {
  return (
    <div className="space-y-2">
      {/* Label Skeleton */}
      <Skeleton className="h-5 w-24" />

      {/* Scrollable Tag List Container Skeleton */}
      <div className="max-h-64 space-y-2 overflow-y-auto rounded-md border border-gray-200 p-3">
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="flex items-center space-x-2">
            {/* Checkbox Skeleton */}
            <Skeleton className="h-4 w-4 shrink-0 rounded" />
            {/* Label Skeleton - varying widths for realistic look */}
            <Skeleton className="h-4" style={{ width: `${60 + Math.random() * 80}px` }} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TagFilterSkeleton;
