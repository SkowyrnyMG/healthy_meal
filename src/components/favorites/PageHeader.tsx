import { Badge } from "@/components/ui/badge";

// ============================================================================
// TYPES
// ============================================================================

interface PageHeaderProps {
  /**
   * Total count of favorite recipes
   */
  count: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * PageHeader component for the Favorites Page
 *
 * Displays the page title "Ulubione przepisy" along with a badge showing
 * the total number of favorited recipes.
 *
 * Features:
 * - Responsive layout (column on mobile, row on desktop)
 * - Count badge with primary styling
 * - Optional description text
 * - Accessible heading structure
 *
 * @example
 * ```tsx
 * <PageHeader count={42} />
 * ```
 */
const PageHeader = ({ count }: PageHeaderProps) => {
  return (
    <div className="mb-6">
      {/* Title and Count Badge */}
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Ulubione przepisy</h1>

        <Badge variant="default" className="bg-green-600 text-white hover:bg-green-700">
          {count} {count === 1 ? "przepis" : count > 1 && count < 5 ? "przepisy" : "przepisów"}
        </Badge>
      </div>

      {/* Optional Description */}
      {count > 0 && (
        <p className="mt-2 text-sm text-gray-600">
          Twoje ulubione przepisy w jednym miejscu. Kliknij na przepis, aby zobaczyć szczegóły.
        </p>
      )}
    </div>
  );
};

export default PageHeader;
