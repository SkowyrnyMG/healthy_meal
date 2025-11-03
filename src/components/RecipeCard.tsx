import { Heart, Clock, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getCalorieBadgeColor,
  getRecipeInitial,
  getRecipePlaceholderColor,
  getRecipePlaceholderIconColor,
  type RecipeCardData,
} from "@/lib/utils/dashboard";

// ============================================================================
// TYPES
// ============================================================================

interface RecipeCardProps {
  /**
   * Recipe data to display
   */
  recipe: RecipeCardData;

  /**
   * Whether this recipe is currently favorited
   */
  isFavorited: boolean;

  /**
   * Callback when favorite button is clicked
   */
  onFavoriteToggle: (recipeId: string) => Promise<void>;

  /**
   * Whether the favorite toggle is in progress
   */
  isLoading?: boolean;

  /**
   * Whether to show the author badge ("Publiczny")
   * Used to distinguish public recipes from user's own recipes
   */
  showAuthorBadge?: boolean;

  /**
   * Whether this is a public view (hides Edit/Delete actions)
   * In public view, users can only View and Favorite recipes
   */
  isPublicView?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * RecipeCard component displays a recipe with key information and interactions
 *
 * Features:
 * - Colored placeholder with recipe initial and icon
 * - Calorie badge with color coding (green/yellow/red)
 * - Protein amount and prep time
 * - Primary tag badge (if available)
 * - Optional author badge for public recipes
 * - Favorite heart button with loading state
 * - Click navigation to recipe detail
 * - Conditional Edit/Delete actions based on isPublicView
 *
 * @example
 * ```tsx
 * // My Recipes (default)
 * <RecipeCard
 *   recipe={recipeData}
 *   isFavorited={favorites.has(recipeData.id)}
 *   onFavoriteToggle={toggleFavorite}
 *   isLoading={isTogglingRecipe(recipeData.id)}
 * />
 *
 * // Public Recipes
 * <RecipeCard
 *   recipe={recipeData}
 *   isFavorited={favorites.has(recipeData.id)}
 *   onFavoriteToggle={toggleFavorite}
 *   isLoading={isTogglingRecipe(recipeData.id)}
 *   showAuthorBadge={true}
 *   isPublicView={true}
 * />
 * ```
 */
const RecipeCard = ({
  recipe,
  isFavorited,
  onFavoriteToggle,
  isLoading = false,
  showAuthorBadge = false,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isPublicView = false, // Reserved for future Edit/Delete menu implementation
}: RecipeCardProps) => {
  // Note: isPublicView is currently unused but reserved for when Edit/Delete actions are added
  // When implemented, it will control visibility of Edit/Delete menu items
  // Generate placeholder colors
  const placeholderBgColor = getRecipePlaceholderColor(recipe.title);
  const placeholderIconColor = getRecipePlaceholderIconColor(placeholderBgColor);

  // Get calorie badge variant
  const calorieBadgeVariant = getCalorieBadgeColor(recipe.nutritionPerServing.calories);

  // Handle card click - navigate to recipe detail
  const handleCardClick = () => {
    window.location.href = `/recipes/${recipe.id}`;
  };

  // Handle favorite toggle - prevent event bubbling
  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await onFavoriteToggle(recipe.id);
  };

  return (
    <div
      className="group relative flex h-full min-h-[300px] min-w-[280px] cursor-pointer flex-col overflow-hidden rounded-lg border-2 border-gray-200 bg-white shadow-sm transition-all hover:border-green-600 hover:shadow-md sm:min-w-[320px]"
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleCardClick();
        }
      }}
      aria-label={`Przejdź do przepisu: ${recipe.title}`}
    >
      {/* Colored Placeholder */}
      <div className={`relative flex h-32 items-center justify-center ${placeholderBgColor}`}>
        {/* Recipe Initial */}
        <div className="absolute left-4 top-4 text-4xl font-bold text-gray-700 opacity-20">
          {getRecipeInitial(recipe.title)}
        </div>

        {/* Recipe Icon */}
        <Utensils className={`h-16 w-16 ${placeholderIconColor}`} />
      </div>

      {/* Content Section */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Recipe Title */}
        <h3 className="line-clamp-2 text-lg font-semibold text-gray-900" title={recipe.title}>
          {recipe.title}
        </h3>

        {/* Nutrition Info */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Calorie Badge */}
          <Badge variant={calorieBadgeVariant} className="font-medium">
            {Math.round(recipe.nutritionPerServing.calories)} kcal
          </Badge>

          {/* Protein */}
          <span className="flex items-center gap-1 text-sm text-gray-600">
            <span className="font-medium">Białko:</span>
            {Math.round(recipe.nutritionPerServing.protein)}g
          </span>
        </div>

        {/* Prep Time and Tag Row - Fixed height to maintain card consistency */}
        <div className="flex min-h-[24px] items-center justify-between gap-2">
          {/* Prep Time */}
          <div className="flex items-center tet-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>{recipe.prepTimeMinutes !== null ? `${recipe.prepTimeMinutes} min` : "nie podano"}</span>
          </div>

          {/* Primary Tag */}
          {recipe.primaryTag ? (
            <Badge variant="outline" className="text-xs">
              {recipe.primaryTag.name}
            </Badge>
          ) : (
            <div className="h-4" />
          )}
        </div>

        {/* Author Badge (Public Recipes Only) */}
        {showAuthorBadge && (
          <div className="mt-2 flex items-center">
            <Badge variant="outline" className="text-xs text-green-600 border-green-600">
              Publiczny
            </Badge>
          </div>
        )}
      </div>

      {/* Actions Section - Favorite Button */}
      <div className="absolute right-2 top-2">
        <Button
          variant="ghost"
          size="icon"
          className={`h-9 w-9 rounded-full bg-white/90 shadow-sm backdrop-blur-sm transition-all hover:bg-white hover:scale-110 ${
            isFavorited ? "text-red-500 hover:text-red-600" : "text-gray-400 hover:text-red-500"
          }`}
          onClick={handleFavoriteClick}
          disabled={isLoading}
          aria-label={isFavorited ? "Usuń z ulubionych" : "Dodaj do ulubionych"}
        >
          {isLoading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-green-600" />
          ) : (
            <Heart className={`h-5 w-5 ${isFavorited ? "fill-current" : ""}`} />
          )}
        </Button>
      </div>
    </div>
  );
};

export default RecipeCard;
