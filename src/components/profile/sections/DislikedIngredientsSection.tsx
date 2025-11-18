import type { DislikedIngredientDTO } from "@/types";
import { IngredientItem } from "../IngredientItem";
import { AddIngredientForm } from "../AddIngredientForm";
import { XCircle } from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Props for DislikedIngredientsSection component
 */
interface DislikedIngredientsSectionProps {
  /**
   * List of disliked ingredients
   */
  ingredients: DislikedIngredientDTO[];

  /**
   * Add ingredient handler
   */
  onAdd: (name: string) => Promise<void>;

  /**
   * Remove ingredient handler
   */
  onRemove: (id: string) => Promise<void>;

  /**
   * Whether add is in progress
   */
  isAdding: boolean;

  /**
   * ID of ingredient being removed (null if none)
   */
  removingId: string | null;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Dynamic list section for managing disliked ingredients
 *
 * Features:
 * - List of ingredients with remove buttons
 * - Add ingredient form
 * - Optimistic UI updates
 * - Empty state message
 */
export const DislikedIngredientsSection = ({
  ingredients,
  onAdd,
  onRemove,
  isAdding,
  removingId,
}: DislikedIngredientsSectionProps) => {
  // ========================================
  // RENDER HELPERS
  // ========================================

  /**
   * Render empty state when no ingredients
   */
  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 py-12 text-center">
      <XCircle className="mb-4 h-12 w-12 text-gray-400" />
      <p className="text-gray-600">Nie masz jeszcze żadnych niechcianych składników.</p>
      <p className="mt-1 text-sm text-gray-500">Dodaj składniki, których nie lubisz lub chcesz unikać.</p>
    </div>
  );

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Niechciane składniki</h2>
        <p className="mt-1 text-sm text-gray-600">
          Dodaj składniki, które chcesz wykluczyć z przepisów. AI będzie proponować zamienniki.
        </p>
      </div>

      {/* Add Ingredient Form */}
      <AddIngredientForm onAdd={onAdd} isAdding={isAdding} />

      {/* Ingredients List or Empty State */}
      {ingredients.length === 0 ? (
        renderEmptyState()
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-gray-500">Liczba składników: {ingredients.length}</p>
          <div className="space-y-2">
            {ingredients.map((ingredient) => (
              <IngredientItem
                key={ingredient.id}
                ingredient={ingredient}
                onRemove={onRemove}
                isRemoving={removingId === ingredient.id}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
