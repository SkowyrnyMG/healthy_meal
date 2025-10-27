import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

/**
 * LoadingState component displays skeleton loader while recipe data is being fetched
 * Mimics the layout of the actual content
 */
const LoadingState = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Content Column (Left) */}
        <div className="md:col-span-2 space-y-8">
          {/* Header Skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-5/6" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-20" />
            </div>
            <Skeleton className="h-5 w-32" />
          </div>

          {/* Servings Adjuster Skeleton */}
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>

          {/* Ingredients Skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-8 w-40" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </div>

          {/* Steps Skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-8 w-40" />
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-7 w-7 rounded-full flex-shrink-0" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Column (Right) */}
        <div className="space-y-6">
          {/* Nutrition Card Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center p-4">
                <Skeleton className="h-12 w-32 mx-auto" />
              </div>
              <Skeleton className="h-48 w-full" />
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons Skeleton */}
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingState;
