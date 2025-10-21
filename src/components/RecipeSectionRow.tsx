import { useRef, useEffect } from "react";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import RecipeCard from "@/components/RecipeCard";
import type { RecipeCardData } from "@/lib/utils/dashboard";

// ============================================================================
// TYPES
// ============================================================================

interface RecipeSectionRowProps {
  /**
   * Section heading text
   */
  title: string;

  /**
   * Array of recipe data to display
   */
  recipes: RecipeCardData[];

  /**
   * Optional URL for "Zobacz wszystkie" link
   * If not provided, link won't be shown
   */
  viewAllLink?: string;

  /**
   * Message to display when no recipes are available
   */
  emptyMessage: string;

  /**
   * Optional button configuration for empty state
   */
  emptyActionButton?: {
    text: string;
    href: string;
  };

  /**
   * Callback for favorite toggle
   */
  onFavoriteToggle: (recipeId: string) => Promise<void>;

  /**
   * Set of recipe IDs that are currently favorited
   */
  favoriteRecipeIds: Set<string>;

  /**
   * Function to check if a recipe is currently being toggled
   */
  isTogglingRecipe: (recipeId: string) => boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * RecipeSectionRow displays a horizontal scrolling row of recipe cards
 *
 * Features:
 * - Section header with title and optional "Zobacz wszystkie" link
 * - Horizontal scroll container with scroll-snap on mobile
 * - Grid layout on desktop (responsive)
 * - Empty state with custom message and optional action button
 * - Keyboard navigation support (arrow keys)
 *
 * @example
 * ```tsx
 * <RecipeSectionRow
 *   title="Twoje przepisy"
 *   recipes={userRecipes}
 *   viewAllLink="/recipes"
 *   emptyMessage="Nie masz jeszcze przepisów"
 *   emptyActionButton={{ text: "+ Dodaj pierwszy przepis", href: "/recipes/new" }}
 *   onFavoriteToggle={toggleFavorite}
 *   favoriteRecipeIds={favorites}
 *   isTogglingRecipe={isTogglingRecipe}
 * />
 * ```
 */
const RecipeSectionRow = ({
  title,
  recipes,
  viewAllLink,
  emptyMessage,
  emptyActionButton,
  onFavoriteToggle,
  favoriteRecipeIds,
  isTogglingRecipe,
}: RecipeSectionRowProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation for horizontal scrolling
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        container.scrollBy({ left: -320, behavior: "smooth" });
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        container.scrollBy({ left: 320, behavior: "smooth" });
      }
    };

    container.addEventListener("keydown", handleKeyDown);
    return () => container.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Show empty state if no recipes
  if (recipes.length === 0) {
    return (
      <section className="py-8" aria-labelledby={`section-${title}`}>
        <div className="container mx-auto px-4">
          {/* Section Header */}
          <div className="mb-6 flex items-center justify-between">
            <h2 id={`section-${title}`} className="text-2xl font-bold text-gray-900">
              {title}
            </h2>
          </div>

          {/* Empty State */}
          <div className="flex min-h-[200px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
            <p className="mb-4 text-lg text-gray-600">{emptyMessage}</p>
            {emptyActionButton && (
              <Button
                onClick={() => (window.location.href = emptyActionButton.href)}
                className="bg-green-600 hover:bg-green-700"
              >
                {emptyActionButton.text}
              </Button>
            )}
          </div>
        </div>
      </section>
    );
  }

  // Render recipe cards
  return (
    <section className="py-8" aria-labelledby={`section-${title}`}>
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 id={`section-${title}`} className="text-2xl font-bold text-gray-900">
            {title}
          </h2>

          {/* View All Link */}
          {viewAllLink && (
            <a
              href={viewAllLink}
              className="group flex items-center gap-1 text-sm font-medium text-green-600 transition-colors hover:text-green-700"
            >
              Zobacz wszystkie
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
          )}
        </div>

        {/* Recipe Cards Container - Mobile: Horizontal Scroll, Desktop: Grid */}
        <div
          ref={scrollContainerRef}
          className="scrollbar-hide -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3"
          style={{
            scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch",
          }}
          role="region"
          aria-label={`${title} - przewiń poziomo aby zobaczyć więcej przepisów`}
          tabIndex={0}
        >
          {recipes.map((recipe) => (
            <div key={recipe.id} style={{ scrollSnapAlign: "start" }} className="flex-shrink-0 sm:flex-shrink">
              <RecipeCard
                recipe={recipe}
                isFavorited={favoriteRecipeIds.has(recipe.id)}
                onFavoriteToggle={onFavoriteToggle}
                isLoading={isTogglingRecipe(recipe.id)}
              />
            </div>
          ))}
        </div>

        {/* Screen reader announcement */}
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {recipes.length} {recipes.length === 1 ? "przepis" : "przepisów"} w sekcji {title}
        </div>
      </div>
    </section>
  );
};

export default RecipeSectionRow;
