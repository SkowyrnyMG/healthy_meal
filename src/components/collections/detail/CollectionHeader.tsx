import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// ============================================================================
// TYPES
// ============================================================================

interface CollectionHeaderProps {
  /**
   * Collection UUID
   */
  collectionId: string;

  /**
   * Current collection name
   */
  collectionName: string;

  /**
   * Total number of recipes in collection
   */
  recipeCount: number;

  /**
   * Callback when edit name button is clicked
   */
  onEditClick: () => void;

  /**
   * Callback when delete collection button is clicked
   */
  onDeleteClick: () => void;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format recipe count with proper Polish pluralization
 * @param count - Number of recipes
 * @returns Formatted string (e.g., "5 przepisów w kolekcji")
 */
const formatRecipeCount = (count: number): string => {
  if (count === 0) return "Brak przepisów w kolekcji";
  if (count === 1) return "1 przepis w kolekcji";
  if (count >= 2 && count <= 4) return `${count} przepisy w kolekcji`;
  return `${count} przepisów w kolekcji`;
};

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * CollectionHeader - Header section for collection detail view
 *
 * Features:
 * - Collection name display (H1)
 * - Recipe count with Polish pluralization
 * - Edit name button with Pencil icon
 * - Delete collection button with Trash2 icon (destructive styling)
 * - Responsive layout (stacked on mobile, row on desktop)
 * - Proper ARIA labels for accessibility
 *
 * @example
 * ```tsx
 * <CollectionHeader
 *   collectionId="uuid"
 *   collectionName="Szybkie kolacje"
 *   recipeCount={8}
 *   onEditClick={() => setEditDialogOpen(true)}
 *   onDeleteClick={() => setDeleteDialogOpen(true)}
 * />
 * ```
 */
const CollectionHeader = ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  collectionId,
  collectionName,
  recipeCount,
  onEditClick,
  onDeleteClick,
}: CollectionHeaderProps) => {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Collection Info */}
      <div className="flex-1">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{collectionName}</h1>
        <p className="mt-2 text-sm text-gray-600 sm:text-base">{formatRecipeCount(recipeCount)}</p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-2 sm:flex-row">
        {/* Edit Name Button */}
        <Button
          variant="outline"
          size="default"
          onClick={onEditClick}
          className="w-full justify-center gap-2 sm:w-auto"
          aria-label="Edytuj nazwę kolekcji"
        >
          <Pencil className="h-4 w-4" />
          <span className="sm:inline">Edytuj nazwę</span>
        </Button>

        {/* Delete Collection Button */}
        <Button
          variant="destructive"
          size="default"
          onClick={onDeleteClick}
          className="w-full justify-center gap-2 sm:w-auto"
          aria-label="Usuń kolekcję"
        >
          <Trash2 className="h-4 w-4" />
          <span className="sm:inline">Usuń kolekcję</span>
        </Button>
      </div>
    </div>
  );
};

export default CollectionHeader;
