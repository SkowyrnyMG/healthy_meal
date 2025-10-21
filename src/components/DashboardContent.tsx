import { useMemo } from "react";
import RecipeSectionRow from "@/components/RecipeSectionRow";
import { useFavoriteToggle } from "@/components/hooks/useFavoriteToggle";
import type { RecipeCardData } from "@/lib/utils/dashboard";

// ============================================================================
// TYPES
// ============================================================================

interface DashboardContentProps {
  /**
   * User's recipe cards
   */
  userRecipes: RecipeCardData[];

  /**
   * Favorite recipe cards (initial server-side data)
   */
  favoriteRecipes: RecipeCardData[];

  /**
   * Public recipe cards (shuffled)
   */
  publicRecipes: RecipeCardData[];

  /**
   * Initial set of favorite recipe IDs
   */
  initialFavoriteIds: string[];
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * DashboardContent wraps the recipe sections with favorite toggle logic
 * This component needs to be a React component to use the useFavoriteToggle hook
 */
const DashboardContent = ({
  userRecipes,
  favoriteRecipes,
  publicRecipes,
  initialFavoriteIds,
}: DashboardContentProps) => {
  // Initialize favorite toggle hook
  const { favorites, toggleFavorite, isTogglingRecipe } = useFavoriteToggle({
    initialFavorites: new Set(initialFavoriteIds),
  });

  // Create a combined map of all recipes (keyed by ID) for quick lookup
  const allRecipesMap = useMemo(() => {
    const map = new Map<string, RecipeCardData>();

    // Add all recipes to the map
    [...userRecipes, ...favoriteRecipes, ...publicRecipes].forEach((recipe) => {
      // Avoid duplicates - keep first occurrence
      if (!map.has(recipe.id)) {
        map.set(recipe.id, recipe);
      }
    });

    return map;
  }, [userRecipes, favoriteRecipes, publicRecipes]);

  // Dynamically compute current favorite recipes based on favorite IDs
  const currentFavoriteRecipes = useMemo(() => {
    return Array.from(favorites)
      .map((id) => allRecipesMap.get(id))
      .filter((recipe): recipe is RecipeCardData => recipe !== undefined);
  }, [favorites, allRecipesMap]);

  return (
    <main className="pb-16">
      {/* User's Recipes Section */}
      <RecipeSectionRow
        title="Twoje przepisy"
        recipes={userRecipes}
        viewAllLink="/recipes"
        emptyMessage="Nie masz jeszcze przepisów"
        emptyActionButton={{
          text: "+ Dodaj pierwszy przepis",
          href: "/recipes/new",
        }}
        onFavoriteToggle={toggleFavorite}
        favoriteRecipeIds={favorites}
        isTogglingRecipe={isTogglingRecipe}
      />

      {/* Favorite Recipes Section - Uses dynamically computed favorites */}
      <RecipeSectionRow
        title="Ulubione"
        recipes={currentFavoriteRecipes}
        viewAllLink="/favorites"
        emptyMessage="Nie masz ulubionych przepisów"
        onFavoriteToggle={toggleFavorite}
        favoriteRecipeIds={favorites}
        isTogglingRecipe={isTogglingRecipe}
      />

      {/* Public Recipes Section (Inspirations) */}
      <RecipeSectionRow
        title="Inspiracje"
        recipes={publicRecipes}
        viewAllLink="/recipes/public"
        emptyMessage="Brak dostępnych przepisów publicznych"
        onFavoriteToggle={toggleFavorite}
        favoriteRecipeIds={favorites}
        isTogglingRecipe={isTogglingRecipe}
      />
    </main>
  );
};

export default DashboardContent;
