import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import TagFilterSection from "./TagFilterSection";
import CaloriesSlider from "./CaloriesSlider";
import PrepTimeSlider from "./PrepTimeSlider";
import SortDropdown from "./SortDropdown";
import type { RecipeFilters, TagDTO } from "@/types";

// ============================================================================
// TYPES
// ============================================================================

interface FilterPanelProps {
  /**
   * Current filter state
   */
  filters: RecipeFilters;

  /**
   * Available tags for selection
   */
  tags: TagDTO[];

  /**
   * Loading state for tags
   */
  isLoadingTags?: boolean;

  /**
   * Callback when filter values change
   */
  onFiltersChange: (filters: Partial<RecipeFilters>) => void;

  /**
   * Callback when apply button clicked (mobile)
   */
  onApply: () => void;

  /**
   * Callback when clear button clicked
   */
  onClear: () => void;

  /**
   * Sheet open state (mobile only)
   */
  isOpen: boolean;

  /**
   * Sheet toggle callback (mobile only)
   */
  onOpenChange: (open: boolean) => void;

  /**
   * Active filter count for badge
   */
  activeFilterCount: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * FilterPanel component with responsive layout
 *
 * Desktop: Sidebar on the left
 * Mobile: Sheet/drawer that opens from the bottom
 *
 * Contains:
 * - TagFilterSection (multi-select checkboxes)
 * - CaloriesSlider (max calories filter)
 * - PrepTimeSlider (max prep time filter)
 * - SortDropdown (sort options)
 * - Apply and Clear buttons
 *
 * @example
 * ```tsx
 * <FilterPanel
 *   filters={filters}
 *   tags={tags}
 *   onFiltersChange={(partial) => { ...update filters... }}
 *   onApply={toggleFilterPanel}
 *   onClear={clearFilters}
 *   isOpen={isFilterPanelOpen}
 *   onOpenChange={setIsFilterPanelOpen}
 *   activeFilterCount={activeFilterCount}
 * />
 * ```
 */
const FilterPanel = ({
  filters,
  tags,
  isLoadingTags = false,
  onFiltersChange,
  onApply,
  onClear,
  isOpen,
  onOpenChange,
  activeFilterCount,
}: FilterPanelProps) => {
  // Filter controls content (shared between desktop and mobile)
  const filterControls = (
    <div className="space-y-6">
      {/* Sort Dropdown */}
      <SortDropdown
        sortBy={filters.sortBy}
        sortOrder={filters.sortOrder}
        onChange={(sortBy, sortOrder) => onFiltersChange({ sortBy, sortOrder })}
      />

      <Separator />

      {/* Tag Filter */}
      <TagFilterSection
        tags={tags}
        selectedTagIds={filters.tagIds || []}
        onChange={(tagIds) => onFiltersChange({ tagIds })}
        isLoading={isLoadingTags}
      />

      <Separator />

      {/* Calories Slider */}
      <CaloriesSlider value={filters.maxCalories} onChange={(maxCalories) => onFiltersChange({ maxCalories })} />

      <Separator />

      {/* Prep Time Slider */}
      <PrepTimeSlider value={filters.maxPrepTime} onChange={(maxPrepTime) => onFiltersChange({ maxPrepTime })} />

      <Separator />

      {/* Action Buttons */}
      <div className="flex flex-col gap-2">
        <Button onClick={onClear} variant="outline" className="w-full">
          Wyczyść filtry
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile: Filter Button + Sheet */}
      <div className="lg:hidden">
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full gap-2">
              <Filter className="h-4 w-4" />
              Filtry
              {activeFilterCount > 0 && (
                <Badge variant="default" className="ml-1 bg-green-600">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto py-10 px-5">
            <SheetHeader>
              <SheetTitle>Filtry i sortowanie</SheetTitle>
            </SheetHeader>
            <div className="mt-6">{filterControls}</div>
            {/* Apply Button (closes sheet) */}
            <div className="mt-6">
              <Button onClick={onApply} className="w-full bg-green-600 hover:bg-green-700">
                Zastosuj
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop: Sidebar */}
      <aside className="hidden w-64 lg:block">
        <div className="sticky top-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Filtry i sortowanie</h2>
          {filterControls}
        </div>
      </aside>
    </>
  );
};

export default FilterPanel;
