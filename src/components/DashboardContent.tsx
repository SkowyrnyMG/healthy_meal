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
   * Favorite recipe cards
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

      {/* Favorite Recipes Section */}
      <RecipeSectionRow
        title="Ulubione"
        recipes={favoriteRecipes}
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
