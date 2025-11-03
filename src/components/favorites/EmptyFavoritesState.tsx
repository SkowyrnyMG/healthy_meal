import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * EmptyFavoritesState component displays a friendly empty state
 * when the user has no favorited recipes.
 *
 * Features:
 * - Large heart icon (outlined)
 * - Clear messaging
 * - Call-to-action button to explore public recipes
 * - Centered layout
 * - Accessible structure
 *
 * @example
 * ```tsx
 * {favorites.length === 0 && <EmptyFavoritesState />}
 * ```
 */
const EmptyFavoritesState = () => {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center py-12 text-center">
      {/* Icon */}
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
        <Heart className="h-12 w-12 text-gray-400" strokeWidth={1.5} />
      </div>

      {/* Heading */}
      <h2 className="mb-2 text-2xl font-semibold text-gray-900">Nie masz ulubionych przepisów</h2>

      {/* Description */}
      <p className="mb-6 max-w-md text-gray-600">
        Przeglądaj przepisy i dodaj do ulubionych, aby mieć do nich szybki dostęp w przyszłości.
      </p>

      {/* Call-to-Action Button */}
      <Button
        asChild
        className="bg-green-600 text-white hover:bg-green-700"
        onClick={() => {
          window.location.href = "/recipes/public";
        }}
      >
        <a href="/recipes/public">Przeglądaj przepisy</a>
      </Button>
    </div>
  );
};

export default EmptyFavoritesState;
