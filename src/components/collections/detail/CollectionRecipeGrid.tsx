import RecipeCard from "@/components/RecipeCard";
import Pagination from "@/components/recipes/Pagination";
import type { CollectionRecipeDTO, PaginationDTO } from "@/types";
import type { RecipeCardData } from "@/lib/utils/dashboard";

// ============================================================================
// TYPES
// ============================================================================

interface CollectionRecipeGridProps {
  /**
   * Collection UUID
   */
  collectionId: string;

  /**
   * Collection name (for remove dialog)
   */
  collectionName: string;

  /**
   * Array of recipes in the collection
   */
  recipes: CollectionRecipeDTO[];

  /**
   * Pagination metadata
   */
  pagination: PaginationDTO;

  /**
   * Set of favorited recipe IDs
   */
  favorites: Set<string>;

  /**
   * Callback when page changes
   */
  onPageChange: (page: number) => void;

  /**
   * Callback to toggle favorite status
   */
  onFavoriteToggle: (recipeId: string) => Promise<void>;

  /**
   * Callback when recipe is removed from collection
   */
  onRecipeRemoved: () => void;

  /**
   * Whether page is currently loading
   */
  isLoadingPage: boolean;

  /**
   * Check if a recipe is currently being toggled
   */
  isTogglingRecipe: (recipeId: string) => boolean;

  /**
   * Check if a recipe is currently being removed
   */
  isRemovingRecipe: (recipeId: string) => boolean;

  /**
   * Remove recipe from collection function
   */
  removeRecipe: (recipeId: string, recipeTitle: string) => Promise<void>;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Transform CollectionRecipeDTO to RecipeCardData
 * Note: prepTimeMinutes and primaryTag are not available in CollectionRecipeDTO
 */
const toRecipeCardData = (collectionRecipe: CollectionRecipeDTO): RecipeCardData => ({
  id: collectionRecipe.recipe.id,
  title: collectionRecipe.recipe.title,
  nutritionPerServing: collectionRecipe.recipe.nutritionPerServing,
  prepTimeMinutes: null, // Not available in CollectionRecipeDTO
  primaryTag: null, // Not available in CollectionRecipeDTO
});

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * CollectionRecipeGrid - Grid of recipe cards with pagination
 *
 * Features:
 * - Responsive grid layout (1-4 columns based on screen size)
 * - Recipe cards with favorite toggle
 * - Collection-specific "Remove from collection" action
 * - Loading skeletons during page changes
 * - Pagination controls at bottom
 * - Proper spacing and alignment
 *
 * Grid Layout:
 * - Mobile (< 640px): 1 column
 * - Tablet (640px - 1024px): 2 columns
 * - Desktop (1024px - 1280px): 3 columns
 * - Large Desktop (> 1280px): 4 columns
 *
 * @example
 * ```tsx
 * <CollectionRecipeGrid
 *   collectionId="uuid"
 *   collectionName="Szybkie kolacje"
 *   recipes={collection.recipes}
 *   pagination={collection.pagination}
 *   favorites={favorites}
 *   onPageChange={goToPage}
 *   onFavoriteToggle={toggleFavorite}
 *   onRecipeRemoved={refreshCollection}
 *   isLoadingPage={isLoading}
 *   isTogglingRecipe={isTogglingRecipe}
 *   isRemovingRecipe={isRemoving}
 *   removeRecipe={removeRecipe}
 * />
 * ```
 */
const CollectionRecipeGrid = ({
  collectionId,
  collectionName,
  recipes,
  pagination,
  favorites,
  onPageChange,
  onFavoriteToggle,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onRecipeRemoved,
  isLoadingPage,
  isTogglingRecipe,
  isRemovingRecipe,
  removeRecipe,
}: CollectionRecipeGridProps) => {
  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="space-y-8">
      {/* Recipe Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoadingPage
          ? // Loading skeletons
            Array.from({ length: pagination.limit }).map((_, index) => (
              <div
                key={`skeleton-${index}`}
                className="h-[300px] animate-pulse rounded-lg border-2 border-gray-200 bg-gray-100"
              />
            ))
          : // Recipe cards
            recipes.map((collectionRecipe) => {
              const recipeData = toRecipeCardData(collectionRecipe);
              const isFavorited = favorites.has(recipeData.id);
              const isLoading = isTogglingRecipe(recipeData.id) || isRemovingRecipe(recipeData.id);

              return (
                <RecipeCard
                  key={collectionRecipe.recipeId}
                  recipe={recipeData}
                  isFavorited={isFavorited}
                  onFavoriteToggle={onFavoriteToggle}
                  isLoading={isLoading}
                  showAuthorBadge={false}
                  isPublicView={false}
                  // Collection-specific props
                  isCollectionView={true}
                  collectionId={collectionId}
                  collectionName={collectionName}
                  onRemoveFromCollection={() => removeRecipe(recipeData.id, recipeData.title)}
                />
              );
            })}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination pagination={pagination} onPageChange={onPageChange} />
        </div>
      )}
    </div>
  );
};

export default CollectionRecipeGrid;
