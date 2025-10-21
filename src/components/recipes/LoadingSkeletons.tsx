import { Skeleton } from "@/components/ui/skeleton";

// ============================================================================
// TYPES
// ============================================================================

interface LoadingSkeletonsProps {
  /**
   * Number of skeleton cards to display
   * @default 8
   */
  count?: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * LoadingSkeletons component displays placeholder skeleton cards while recipes are loading
 *
 * Features:
 * - Matches RecipeCard layout for seamless loading experience
 * - Responsive grid (1/2/3/4 columns based on screen size)
 * - Shimmer animation via Shadcn skeleton component
 * - Configurable skeleton count
 *
 * @example
 * ```tsx
 * {isLoading && <LoadingSkeletons count={12} />}
 * ```
 */
const LoadingSkeletons = ({ count = 8 }: LoadingSkeletonsProps) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex h-full min-h-[300px] flex-col overflow-hidden rounded-lg border-2 border-gray-200 bg-white"
        >
          {/* Image Placeholder Skeleton */}
          <Skeleton className="h-32 w-full rounded-none" />

          {/* Content Section */}
          <div className="flex flex-1 flex-col gap-3 p-4">
            {/* Title Skeleton */}
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-6 w-1/2" />

            {/* Nutrition Info Skeleton */}
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>

            {/* Prep Time and Tag Row Skeleton */}
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-6 w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LoadingSkeletons;
