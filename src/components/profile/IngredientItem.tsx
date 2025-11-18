import type { DislikedIngredientDTO } from "@/types";
import { Button } from "@/components/ui/button";
import { X, Loader2 } from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Props for IngredientItem component
 */
interface IngredientItemProps {
  /**
   * The ingredient data
   */
  ingredient: DislikedIngredientDTO;

  /**
   * Remove handler
   */
  onRemove: (id: string) => void;

  /**
   * Whether this item is being removed
   */
  isRemoving: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Single ingredient item in the disliked ingredients list
 *
 * Features:
 * - Displays ingredient name
 * - Remove button with loading state
 */
export const IngredientItem = ({ ingredient, onRemove, isRemoving }: IngredientItemProps) => {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3">
      <span className="text-sm text-gray-900">{ingredient.ingredientName}</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRemove(ingredient.id)}
        disabled={isRemoving}
        className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
        aria-label={`Usuń ${ingredient.ingredientName}`}
      >
        {isRemoving ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
      </Button>
    </div>
  );
};
