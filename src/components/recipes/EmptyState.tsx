import { Search, FileX } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { EmptyStateType } from "@/types";

// ============================================================================
// TYPES
// ============================================================================

interface EmptyStateProps {
  /**
   * Type of empty state to display
   */
  type: EmptyStateType;

  /**
   * Callback to clear all filters (for "no-results" type)
   */
  onClearFilters?: () => void;

  /**
   * Callback to navigate to add recipe page (for "no-recipes" type)
   */
  onAddRecipe?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * EmptyState component displays appropriate message when no recipes are found
 *
 * Two variants:
 * - **no-recipes**: User has no recipes at all → Show "Add first recipe" CTA
 * - **no-results**: No recipes match current filters → Show "Clear filters" CTA
 *
 * Features:
 * - Contextual icon (search or empty box)
 * - Clear heading and description
 * - Action button with appropriate callback
 *
 * @example
 * ```tsx
 * {recipes.length === 0 && activeFilterCount === 0 && (
 *   <EmptyState
 *     type="no-recipes"
 *     onAddRecipe={() => window.location.href = '/recipes/new'}
 *   />
 * )}
 *
 * {recipes.length === 0 && activeFilterCount > 0 && (
 *   <EmptyState
 *     type="no-results"
 *     onClearFilters={clearFilters}
 *   />
 * )}
 * ```
 */
const EmptyState = ({ type, onClearFilters, onAddRecipe }: EmptyStateProps) => {
  // Determine content based on type
  const content = {
    "no-recipes": {
      icon: FileX,
      heading: "Nie masz jeszcze przepisów",
      description: "Dodaj swój pierwszy przepis, aby zacząć zarządzać swoją kolekcją.",
      buttonText: "+ Dodaj pierwszy przepis",
      onClick: onAddRecipe,
    },
    "no-results": {
      icon: Search,
      heading: "Nie znaleziono przepisów pasujących do kryteriów",
      description: "Spróbuj zmienić filtry lub wyczyść wszystkie, aby zobaczyć więcej przepisów.",
      buttonText: "Wyczyść filtry",
      onClick: onClearFilters,
    },
  };

  const { icon: Icon, heading, description, buttonText, onClick } = content[type];

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-6 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
      {/* Icon */}
      <div className="rounded-full bg-gray-100 p-6">
        <Icon className="h-12 w-12 text-gray-400" />
      </div>

      {/* Text Content */}
      <div className="max-w-md space-y-2">
        <h3 className="text-xl font-semibold text-gray-900">{heading}</h3>
        <p className="text-gray-600">{description}</p>
      </div>

      {/* Action Button */}
      {onClick && (
        <Button onClick={onClick} className="bg-green-600 hover:bg-green-700">
          {buttonText}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
