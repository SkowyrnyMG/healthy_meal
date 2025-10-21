import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { RecipeFilters, TagDTO } from "@/types";

// ============================================================================
// TYPES
// ============================================================================

interface ActiveFilterChipsProps {
  /**
   * Current filter state
   */
  filters: RecipeFilters;

  /**
   * All available tags (for displaying tag names)
   */
  tags: TagDTO[];

  /**
   * Callback to remove a specific filter
   * @param key - Filter key (search, maxCalories, maxPrepTime, tagId)
   * @param value - Optional value for tag removal (tag ID)
   */
  onRemoveFilter: (key: string, value?: string) => void;

  /**
   * Callback to clear all filters
   */
  onClearAll: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * ActiveFilterChips component displays active filters as removable chips
 *
 * Features:
 * - Shows chip for each active filter
 * - Displays tag names (not IDs)
 * - Formats numeric values (calories, prep time)
 * - X button to remove individual filters
 * - "Wyczyść wszystko" button when multiple filters active
 *
 * @example
 * ```tsx
 * <ActiveFilterChips
 *   filters={filters}
 *   tags={tags}
 *   onRemoveFilter={removeFilter}
 *   onClearAll={clearFilters}
 * />
 * ```
 */
const ActiveFilterChips = ({ filters, tags, onRemoveFilter, onClearAll }: ActiveFilterChipsProps) => {
  const chips: { key: string; label: string; value?: string }[] = [];

  // Add search chip
  if (filters.search) {
    chips.push({
      key: "search",
      label: `Szukaj: "${filters.search}"`,
    });
  }

  // Add tag chips
  if (filters.tagIds && filters.tagIds.length > 0) {
    filters.tagIds.forEach((tagId) => {
      const tag = tags.find((t) => t.id === tagId);
      if (tag) {
        chips.push({
          key: "tagId",
          label: tag.name,
          value: tagId,
        });
      }
    });
  }

  // Add max calories chip
  if (filters.maxCalories) {
    chips.push({
      key: "maxCalories",
      label: `Max ${filters.maxCalories} kcal`,
    });
  }

  // Add max prep time chip
  if (filters.maxPrepTime) {
    chips.push({
      key: "maxPrepTime",
      label: `Max ${filters.maxPrepTime} min`,
    });
  }

  // Don't render if no active filters
  if (chips.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Filter Chips */}
      {chips.map((chip, index) => (
        <Badge key={`${chip.key}-${chip.value || index}`} variant="secondary" className="gap-1 pr-1">
          {chip.label}
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 rounded-full p-0 hover:bg-gray-300"
            onClick={() => onRemoveFilter(chip.key, chip.value)}
            aria-label={`Usuń filtr: ${chip.label}`}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      ))}

      {/* Clear All Button */}
      {chips.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="h-7 text-sm text-gray-600 hover:text-gray-900"
        >
          Wyczyść wszystko
        </Button>
      )}
    </div>
  );
};

export default ActiveFilterChips;
