import { useState, useCallback } from "react";
import { toast } from "sonner";

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
   * Handle undo action for unfavorite
   * Re-adds the recipe to favorites with optimistic update
   */
  const handleUndo = useCallback(
    async (recipeId: string): Promise<void> => {
      // Prevent double-toggling
      if (togglingRecipes.has(recipeId)) {
        return;
      }

      // Mark recipe as toggling
      setTogglingRecipes((prev) => new Set(prev).add(recipeId));

      // Optimistic update - add back to favorites
      setFavorites((prev) => {
        const next = new Set(prev);
        next.add(recipeId);
        return next;
      });

      try {
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
          throw new Error(errorData.message || "Nie udało się przywrócić");
        }

        // Show success toast
        toast.success("Przywrócono do ulubionych");
      } catch (error) {
        // Rollback optimistic update - remove from favorites again
        setFavorites((prev) => {
          const next = new Set(prev);
          next.delete(recipeId);
          return next;
        });

        // Log error
        // eslint-disable-next-line no-console
        console.error("[useFavoriteToggle] Undo error:", {
          recipeId,
          error: error instanceof Error ? error.message : "Unknown error",
        });

        // Show error toast
        toast.error(error instanceof Error ? error.message : "Nie udało się przywrócić");
      } finally {
        // Remove recipe from toggling state
        setTogglingRecipes((prev) => {
          const next = new Set(prev);
          next.delete(recipeId);
          return next;
        });
      }
    },
    [togglingRecipes]
  );

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
          // DELETE /api/favorites
          const response = await fetch("/api/favorites", {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ recipeId }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Nie udało się usunąć z ulubionych");
          }

          // Show undo toast for unfavorite action
          toast("Usunięto z ulubionych", {
            action: {
              label: "Cofnij",
              onClick: () => handleUndo(recipeId),
            },
            duration: 5000,
          });
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
        // eslint-disable-next-line no-console
        console.error("[useFavoriteToggle] Error:", {
          recipeId,
          action,
          error: error instanceof Error ? error.message : "Unknown error",
        });

        // Show error toast notification
        const errorMessage = error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd";
        toast.error(errorMessage);
      } finally {
        // Remove recipe from toggling state
        setTogglingRecipes((prev) => {
          const next = new Set(prev);
          next.delete(recipeId);
          return next;
        });
      }
    },
    [favorites, togglingRecipes, handleUndo]
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
