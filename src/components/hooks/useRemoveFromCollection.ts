import { useState, useCallback } from "react";
import { toast } from "sonner";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Options for initializing the useRemoveFromCollection hook
 */
export interface UseRemoveFromCollectionOptions {
  /**
   * Collection UUID
   */
  collectionId: string;

  /**
   * Callback to refresh collection data after removal
   */
  onRemoved: () => void;
}

/**
 * Return type for the useRemoveFromCollection hook
 */
export interface UseRemoveFromCollectionReturn {
  /**
   * Remove a recipe from the collection
   * Shows undo toast on success
   */
  removeRecipe: (recipeId: string, recipeTitle: string) => Promise<void>;

  /**
   * Check if a recipe is currently being removed
   */
  isRemoving: (recipeId: string) => boolean;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

/**
 * Custom hook for removing recipes from a collection with undo support
 *
 * This hook provides:
 * - Recipe removal from collection
 * - Undo functionality with toast action
 * - Per-recipe loading state tracking
 * - Automatic data refresh on success
 *
 * @example
 * ```tsx
 * const { removeRecipe, isRemoving } = useRemoveFromCollection({
 *   collectionId: 'collection-uuid',
 *   onRemoved: () => refreshCollection()
 * });
 *
 * const isLoading = isRemoving('recipe-uuid');
 *
 * <button
 *   onClick={() => removeRecipe('recipe-uuid', 'Recipe Title')}
 *   disabled={isLoading}
 * >
 *   Remove
 * </button>
 * ```
 */
export const useRemoveFromCollection = (options: UseRemoveFromCollectionOptions): UseRemoveFromCollectionReturn => {
  const { collectionId, onRemoved } = options;

  // State for tracking which recipes are currently being removed
  const [removingRecipes, setRemovingRecipes] = useState<Set<string>>(new Set());

  /**
   * Handle undo action - re-add recipe to collection
   */
  const handleUndo = useCallback(
    async (recipeId: string): Promise<void> => {
      try {
        // POST /api/collections/{collectionId}/recipes
        const response = await fetch(`/api/collections/${collectionId}/recipes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ recipeId }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Nie udało się przywrócić");
        }

        // Refresh collection data
        onRemoved();

        // Show success toast
        toast.success("Przywrócono do kolekcji");
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[useRemoveFromCollection] Undo error:", {
          collectionId,
          recipeId,
          error: error instanceof Error ? error.message : "Unknown error",
        });

        // Show error toast
        toast.error(error instanceof Error ? error.message : "Nie udało się przywrócić");
      }
    },
    [collectionId, onRemoved]
  );

  /**
   * Remove a recipe from the collection
   */
  const removeRecipe = useCallback(
    async (recipeId: string, recipeTitle: string): Promise<void> => {
      // Prevent double-removal
      if (removingRecipes.has(recipeId)) {
        return;
      }

      // Mark recipe as removing
      setRemovingRecipes((prev) => new Set(prev).add(recipeId));

      try {
        // DELETE /api/collections/{collectionId}/recipes/{recipeId}
        const response = await fetch(`/api/collections/${collectionId}/recipes/${recipeId}`, {
          method: "DELETE",
          credentials: "include",
        });

        // Handle error responses
        if (!response.ok) {
          if (response.status === 404) {
            // Recipe not in collection (already removed) - refresh anyway
            onRemoved();
            return;
          }

          if (response.status === 403) {
            toast.error("Nie masz dostępu do tej kolekcji");
            return;
          }

          // Generic error
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Nie udało się usunąć przepisu z kolekcji");
        }

        // Show undo toast (5 seconds)
        toast("Usunięto z kolekcji", {
          action: {
            label: "Cofnij",
            onClick: () => handleUndo(recipeId),
          },
          duration: 5000,
        });

        // Refresh collection data
        onRemoved();
      } catch (error) {
        // Log error
        // eslint-disable-next-line no-console
        console.error("[useRemoveFromCollection] Remove error:", {
          collectionId,
          recipeId,
          recipeTitle,
          error: error instanceof Error ? error.message : "Unknown error",
        });

        // Show error toast
        const errorMessage = error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd";
        toast.error(errorMessage);
      } finally {
        // Remove recipe from removing state
        setRemovingRecipes((prev) => {
          const next = new Set(prev);
          next.delete(recipeId);
          return next;
        });
      }
    },
    [collectionId, removingRecipes, onRemoved, handleUndo]
  );

  /**
   * Check if a recipe is currently being removed
   */
  const isRemoving = useCallback(
    (recipeId: string): boolean => {
      return removingRecipes.has(recipeId);
    },
    [removingRecipes]
  );

  return {
    removeRecipe,
    isRemoving,
  };
};
