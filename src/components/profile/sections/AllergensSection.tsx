import { useState, useEffect } from "react";
import type { AllergenDTO } from "@/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, AlertTriangle } from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Props for AllergensSection component
 */
interface AllergensSectionProps {
  /**
   * All available allergens
   */
  allAllergens: AllergenDTO[];

  /**
   * Currently selected allergen IDs
   */
  selectedAllergenIds: Set<string>;

  /**
   * Save handler
   */
  onSave: (selectedIds: Set<string>) => Promise<void>;

  /**
   * Whether save is in progress
   */
  isSaving: boolean;

  /**
   * Whether allergens are loading
   */
  isLoading: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Multi-select section for allergens
 *
 * Features:
 * - Responsive grid of checkboxes (3 cols desktop, 2 tablet, 1 mobile)
 * - Empty state message
 * - Loading skeleton
 * - Save button with loading state
 */
export const AllergensSection = ({
  allAllergens,
  selectedAllergenIds,
  onSave,
  isSaving,
  isLoading,
}: AllergensSectionProps) => {
  // ========================================
  // STATE
  // ========================================

  const [localSelected, setLocalSelected] = useState<Set<string>>(selectedAllergenIds);

  // Sync local state with props
  useEffect(() => {
    setLocalSelected(new Set(selectedAllergenIds));
  }, [selectedAllergenIds]);

  // ========================================
  // HANDLERS
  // ========================================

  const handleToggle = (allergenId: string) => {
    setLocalSelected((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(allergenId)) {
        newSet.delete(allergenId);
      } else {
        newSet.add(allergenId);
      }
      return newSet;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await onSave(localSelected);
    } catch {
      // Error is handled by the hook with toast
    }
  };

  // ========================================
  // RENDER HELPERS
  // ========================================

  /**
   * Render loading skeleton
   */
  const renderLoadingSkeleton = () => (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 9 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );

  /**
   * Render empty state when no allergens available
   */
  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <AlertTriangle className="mb-4 h-12 w-12 text-gray-400" />
      <p className="text-gray-600">Brak dostępnych alergenów do wyboru.</p>
    </div>
  );

  // ========================================
  // RENDER
  // ========================================

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Alergeny</h2>
        <p className="mt-1 text-sm text-gray-600">
          Zaznacz alergeny, które chcesz wykluczyć z przepisów. AI będzie unikać tych składników.
        </p>
      </div>

      {/* Loading State */}
      {isLoading && renderLoadingSkeleton()}

      {/* Empty State */}
      {!isLoading && allAllergens.length === 0 && renderEmptyState()}

      {/* Allergen Grid */}
      {!isLoading && allAllergens.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {allAllergens.map((allergen) => {
            const isChecked = localSelected.has(allergen.id);

            return (
              <div key={allergen.id} className="flex items-center space-x-3">
                <Checkbox
                  id={`allergen-${allergen.id}`}
                  checked={isChecked}
                  onCheckedChange={() => handleToggle(allergen.id)}
                  disabled={isSaving}
                  aria-label={`Alergen: ${allergen.name}`}
                />
                <Label
                  htmlFor={`allergen-${allergen.id}`}
                  className="cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {allergen.name}
                </Label>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Count */}
      {!isLoading && allAllergens.length > 0 && (
        <p className="text-sm text-gray-500">
          Wybrano: {localSelected.size} z {allAllergens.length} alergenów
        </p>
      )}

      {/* Save Button */}
      {!isLoading && allAllergens.length > 0 && (
        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving} className="bg-green-600 hover:bg-green-700">
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Zapisywanie...
              </>
            ) : (
              "Zapisz"
            )}
          </Button>
        </div>
      )}
    </form>
  );
};
