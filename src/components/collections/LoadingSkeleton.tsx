import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

/**
 * LoadingSkeleton component - Displays loading state with skeleton cards
 *
 * Features:
 * - Responsive grid layout matching CollectionGrid
 * - 6 skeleton cards with shimmer animation
 * - Matches collection card structure
 *
 * @example
 * ```tsx
 * {isLoading && <LoadingSkeleton />}
 * ```
 */
const LoadingSkeleton = () => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {[...Array(6)].map((_, index) => (
        <Card key={index} className="overflow-hidden">
          <CardHeader className="space-y-2">
            {/* Collection name skeleton */}
            <Skeleton className="h-6 w-3/4" />
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Recipe count badge skeleton */}
            <Skeleton className="h-5 w-24" />

            {/* Thumbnail grid skeleton (2x2) */}
            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="aspect-square rounded-md" />
              <Skeleton className="aspect-square rounded-md" />
              <Skeleton className="aspect-square rounded-md" />
              <Skeleton className="aspect-square rounded-md" />
            </div>

            {/* Created date skeleton */}
            <Skeleton className="h-4 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default LoadingSkeleton;
