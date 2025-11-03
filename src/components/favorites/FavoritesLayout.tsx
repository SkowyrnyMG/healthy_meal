import React, { useMemo } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "./PageHeader";
import EmptyFavoritesState from "./EmptyFavoritesState";
import RecipeCard from "@/components/RecipeCard";
import Pagination from "@/components/recipes/Pagination";
import LoadingSkeletons from "@/components/recipes/LoadingSkeletons";
import { useFavorites } from "@/components/hooks/useFavorites";
import { transformFavoriteToCardData } from "@/lib/utils/dashboard";
import { toast } from "sonner";

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * FavoritesLayout component - Main container for the Favorites Page
 *
 * Features:
 * - Fetches and displays paginated favorite recipes
 * - Handles loading, error, and empty states
 * - Integrates favorite toggle with undo functionality
 * - Supports pagination with URL sync
 * - Responsive grid layout
 *
 * State management:
 * - useFavorites: Manages favorites list and pagination
 * - useFavoriteToggle: Manages favorite/unfavorite actions with undo
 *
 * @example
 * ```tsx
 * // In favorites.astro
 * <FavoritesLayout client:load />
 * ```
 */
const FavoritesLayout = () => {
  // ========================================
  // HOOKS
  // ========================================

  // Fetch favorites with pagination
  const { favorites, pagination, isLoading, error, refetch, goToPage } = useFavorites();

  // Track which recipes are currently being toggled
  const [togglingRecipes, setTogglingRecipes] = React.useState<Set<string>>(new Set());

  /**
   * Handle unfavorite action with undo
   * All recipes on this page are favorited, so we only handle removal
   */
  const handleUnfavorite = async (recipeId: string) => {
    // Prevent double-clicking
    if (togglingRecipes.has(recipeId)) {
      return;
    }

    // Mark as toggling
    setTogglingRecipes((prev) => new Set(prev).add(recipeId));

    try {
      // Call API to remove from favorites
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

      // Show undo toast
      toast("Usunięto z ulubionych", {
        action: {
          label: "Cofnij",
          onClick: () => handleUndo(recipeId),
        },
        duration: 5000,
      });

      // Refetch to update the list
      await refetch();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[FavoritesLayout] Error removing favorite:", err);
      toast.error(err instanceof Error ? err.message : "Nie udało się usunąć z ulubionych");
    } finally {
      // Remove from toggling state
      setTogglingRecipes((prev) => {
        const next = new Set(prev);
        next.delete(recipeId);
        return next;
      });
    }
  };

  /**
   * Handle undo action - re-add to favorites
   */
  const handleUndo = async (recipeId: string) => {
    try {
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

      toast.success("Przywrócono do ulubionych");

      // Refetch to update the list
      await refetch();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[FavoritesLayout] Error undoing unfavorite:", err);
      toast.error(err instanceof Error ? err.message : "Nie udało się przywrócić");
    }
  };

  /**
   * Check if a recipe is currently being toggled
   */
  const isTogglingRecipe = (recipeId: string): boolean => {
    return togglingRecipes.has(recipeId);
  };

  // ========================================
  // DATA TRANSFORMATION
  // ========================================

  // Transform FavoriteDTO to RecipeCardData for RecipeGrid
  const recipeCards = useMemo(() => {
    return favorites.map((favorite) => transformFavoriteToCardData(favorite));
  }, [favorites]);

  // ========================================
  // RENDER HELPERS
  // ========================================

  /**
   * Render error state with retry button
   */
  const renderErrorState = () => (
    <div className="flex min-h-[400px] flex-col items-center justify-center py-12 text-center">
      {/* Error Icon */}
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-red-50">
        <AlertCircle className="h-12 w-12 text-red-400" strokeWidth={1.5} />
      </div>

      {/* Error Heading */}
      <h2 className="mb-2 text-2xl font-semibold text-gray-900">Wystąpił błąd</h2>

      {/* Error Message */}
      <p className="mb-6 max-w-md text-gray-600">{error}</p>

      {/* Retry Button */}
      <Button onClick={refetch} className="bg-green-600 text-white hover:bg-green-700">
        Spróbuj ponownie
      </Button>
    </div>
  );

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="container mx-auto px-4 py-6 lg:px-6 lg:py-8">
      {/* Page Header */}
      <PageHeader count={pagination?.total ?? 0} />

      {/* Loading State */}
      {isLoading && !error && <LoadingSkeletons count={12} />}

      {/* Error State */}
      {error && renderErrorState()}

      {/* Empty State */}
      {!isLoading && !error && favorites.length === 0 && <EmptyFavoritesState />}

      {/* Recipe Grid and Pagination */}
      {!isLoading && !error && favorites.length > 0 && (
        <>
          {/* Recipe Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {recipeCards.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                isFavorited={true}
                onFavoriteToggle={handleUnfavorite}
                isLoading={isTogglingRecipe(recipe.id)}
                showAuthorBadge={false}
                isPublicView={false}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-8">
              <Pagination pagination={pagination} onPageChange={goToPage} />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FavoritesLayout;
