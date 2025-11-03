import RecipeCard from "@/components/RecipeCard";
import { transformRecipeToCardData } from "@/lib/utils/dashboard";
import type { RecipeListItemDTO } from "@/types";

// ============================================================================
// TYPES
// ============================================================================

interface RecipeGridProps {
  /**
   * Array of recipes to display
   */
  recipes: RecipeListItemDTO[];

  /**
   * Set of favorite recipe IDs
   */
  favoriteRecipeIds: Set<string>;

  /**
   * Callback when favorite button is toggled
   */
  onFavoriteToggle: (recipeId: string) => Promise<void>;

  /**
   * Function to check if a recipe is currently being toggled
   */
  isTogglingRecipe: (recipeId: string) => boolean;

  /**
   * Whether to show the author badge on recipe cards
   * Used for public recipe views to distinguish community content
   */
  showAuthorBadge?: boolean;

  /**
   * Whether this is a public view (affects card actions)
   * In public view, Edit/Delete actions are hidden
   */
  isPublicView?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * RecipeGrid component displays recipes in a responsive grid layout
 *
 * Features:
 * - Responsive grid (1 column mobile, 2-3 tablet, 3-4 desktop)
 * - Uses existing RecipeCard component
 * - Transforms RecipeListItemDTO to RecipeCardData format
 * - Handles favorite toggle and loading states
 * - Supports both user recipes and public recipes display
 *
 * Grid breakpoints:
 * - Mobile: 1 column
 * - SM (640px+): 2 columns
 * - LG (1024px+): 3 columns
 * - XL (1280px+): 4 columns
 *
 * @example
 * ```tsx
 * // My Recipes
 * <RecipeGrid
 *   recipes={recipes}
 *   favoriteRecipeIds={favorites}
 *   onFavoriteToggle={toggleFavorite}
 *   isTogglingRecipe={isTogglingRecipe}
 * />
 *
 * // Public Recipes
 * <RecipeGrid
 *   recipes={recipes}
 *   favoriteRecipeIds={favorites}
 *   onFavoriteToggle={toggleFavorite}
 *   isTogglingRecipe={isTogglingRecipe}
 *   showAuthorBadge={true}
 *   isPublicView={true}
 * />
 * ```
 */
const RecipeGrid = ({
  recipes,
  favoriteRecipeIds,
  onFavoriteToggle,
  isTogglingRecipe,
  showAuthorBadge = false,
  isPublicView = false,
}: RecipeGridProps) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {recipes.map((recipe) => {
        // Transform to RecipeCardData format
        const cardData = transformRecipeToCardData(recipe);

        return (
          <RecipeCard
            key={recipe.id}
            recipe={cardData}
            isFavorited={favoriteRecipeIds.has(recipe.id)}
            onFavoriteToggle={onFavoriteToggle}
            isLoading={isTogglingRecipe(recipe.id)}
            showAuthorBadge={showAuthorBadge}
            isPublicView={isPublicView}
          />
        );
      })}
    </div>
  );
};

export default RecipeGrid;
