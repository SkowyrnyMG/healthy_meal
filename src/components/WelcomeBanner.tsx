import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

// ============================================================================
// TYPES
// ============================================================================

interface WelcomeBannerProps {
  /**
   * User's name from profile or auth metadata
   * If null, shows generic greeting
   */
  userName: string | null;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * WelcomeBanner displays a personalized greeting and quick action button
 *
 * Features:
 * - Personalized greeting with user's name (or generic if name is null)
 * - Welcome message
 * - Call-to-action button for adding new recipes
 * - Responsive design
 *
 * @example
 * ```tsx
 * <WelcomeBanner userName="Jan" />
 * // Displays: "Witaj, Jan!"
 *
 * <WelcomeBanner userName={null} />
 * // Displays: "Witaj!"
 * ```
 */
const WelcomeBanner = ({ userName }: WelcomeBannerProps) => {
  // Handle button click - navigate to recipe creation
  const handleAddRecipe = () => {
    window.location.href = "/recipes/new";
  };

  return (
    <div className="bg-gradient-to-r from-green-50 to-white">
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          {/* Greeting Section */}
          <div className="flex-1">
            <h1 className="mb-2 text-3xl font-bold text-gray-900 sm:text-4xl">
              {userName ? `Witaj, ${userName}!` : "Witaj!"}
            </h1>
            <p className="text-lg text-gray-600">
              Gotowy na nowe kulinarne wyzwania? Przeglądaj swoje przepisy lub stwórz coś nowego.
            </p>
          </div>

          {/* Action Button */}
          <div className="flex-shrink-0">
            <Button
              onClick={handleAddRecipe}
              size="lg"
              className="bg-green-600 text-white shadow-md hover:bg-green-700 hover:shadow-lg"
            >
              <Plus className="h-5 w-5" />
              Dodaj przepis
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeBanner;
