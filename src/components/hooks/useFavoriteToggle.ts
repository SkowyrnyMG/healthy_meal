import { useState, useCallback } from "react";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Options for initializing the useFavoriteToggle hook
 */
export interface UseFavoriteToggleOptions {
  /**
   * Set of recipe IDs that are initially favorited
   */
  initialFavorites: Set<string>;
}

/**
 * Return type for the useFavoriteToggle hook
 */
export interface UseFavoriteToggleReturn {
  /**
   * Current set of favorited recipe IDs
   */
  favorites: Set<string>;

  /**
   * Toggle favorite status for a recipe
   * Performs optimistic UI update and API call
   * Rolls back on error
   */
  toggleFavorite: (recipeId: string) => Promise<void>;

  /**
   * Check if a recipe is currently being toggled
   */
  isTogglingRecipe: (recipeId: string) => boolean;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

/**
 * Custom hook for managing favorite recipe toggles with optimistic UI updates
 *
 * This hook provides:
 * - Optimistic UI updates for immediate visual feedback
 * - API calls to persist changes to the backend
 * - Automatic rollback on API errors
 * - Per-recipe loading state tracking
 *
 * @example
 * ```tsx
 * const { favorites, toggleFavorite, isTogglingRecipe } = useFavoriteToggle({
 *   initialFavorites: new Set(['recipe-id-1', 'recipe-id-2'])
 * });
 *
 * const isFavorited = favorites.has('recipe-id-1');
 * const isLoading = isTogglingRecipe('recipe-id-1');
 *
 * <button
 *   onClick={() => toggleFavorite('recipe-id-1')}
 *   disabled={isLoading}
 * >
 *   {isFavorited ? 'Unfavorite' : 'Favorite'}
 * </button>
 * ```
 */
export const useFavoriteToggle = (options: UseFavoriteToggleOptions): UseFavoriteToggleReturn => {
  const { initialFavorites } = options;

  // State for favorite recipe IDs
  const [favorites, setFavorites] = useState<Set<string>>(initialFavorites);

  // State for tracking which recipes are currently being toggled
  const [togglingRecipes, setTogglingRecipes] = useState<Set<string>>(new Set());

  /**
   * Toggle favorite status for a recipe
   * Implements optimistic UI pattern with rollback on error
   */
  const toggleFavorite = useCallback(
    async (recipeId: string): Promise<void> => {
      // Prevent double-toggling
      if (togglingRecipes.has(recipeId)) {
        return;
      }

      // Determine action based on current state
      const isFavorited = favorites.has(recipeId);
      const action = isFavorited ? "remove" : "add";

      // Mark recipe as toggling
      setTogglingRecipes((prev) => new Set(prev).add(recipeId));

      // Optimistic update
      setFavorites((prev) => {
        const next = new Set(prev);
        if (action === "add") {
          next.add(recipeId);
        } else {
          next.delete(recipeId);
        }
        return next;
      });

      try {
        // Make API call
        if (action === "add") {
          // POST /api/favorites
          const response = await fetch("/api/favorites", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ recipeId }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Nie udało się dodać do ulubionych");
          }
        } else {
          // DELETE /api/favorites/{recipeId}
          const response = await fetch(`/api/favorites/${recipeId}`, {
            method: "DELETE",
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Nie udało się usunąć z ulubionych");
          }
        }

        // Success - keep optimistic update
      } catch (error) {
        // Rollback optimistic update
        setFavorites((prev) => {
          const next = new Set(prev);
          if (action === "add") {
            next.delete(recipeId);
          } else {
            next.add(recipeId);
          }
          return next;
        });

        // Log error
        console.error("[useFavoriteToggle] Error:", {
          recipeId,
          action,
          error: error instanceof Error ? error.message : "Unknown error",
        });

        // TODO: Show error toast notification
        // For now, we'll just log the error
        // In production, integrate with a toast library (e.g., sonner)
      } finally {
        // Remove recipe from toggling state
        setTogglingRecipes((prev) => {
          const next = new Set(prev);
          next.delete(recipeId);
          return next;
        });
      }
    },
    [favorites, togglingRecipes]
  );

  /**
   * Check if a recipe is currently being toggled
   */
  const isTogglingRecipe = useCallback(
    (recipeId: string): boolean => {
      return togglingRecipes.has(recipeId);
    },
    [togglingRecipes]
  );

  return {
    favorites,
    toggleFavorite,
    isTogglingRecipe,
  };
};
