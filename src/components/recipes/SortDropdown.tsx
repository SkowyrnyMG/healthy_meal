import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { RecipeFilters } from "@/types";

// ============================================================================
// TYPES
// ============================================================================

interface SortDropdownProps {
  /**
   * Current sort field
   */
  sortBy: RecipeFilters["sortBy"];

  /**
   * Current sort order
   */
  sortOrder: RecipeFilters["sortOrder"];

  /**
   * Callback when sort changes
   */
  onChange: (sortBy: RecipeFilters["sortBy"], sortOrder: RecipeFilters["sortOrder"]) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Sort options with Polish labels
 * Each option combines sortBy field and sortOrder direction
 */
const SORT_OPTIONS = [
  { value: "createdAt-desc", label: "Najnowsze", sortBy: "createdAt" as const, sortOrder: "desc" as const },
  { value: "createdAt-asc", label: "Najstarsze", sortBy: "createdAt" as const, sortOrder: "asc" as const },
  { value: "title-asc", label: "Tytuł A-Z", sortBy: "title" as const, sortOrder: "asc" as const },
  { value: "title-desc", label: "Tytuł Z-A", sortBy: "title" as const, sortOrder: "desc" as const },
  {
    value: "prepTime-asc",
    label: "Czas przygotowania rosnąco",
    sortBy: "prepTime" as const,
    sortOrder: "asc" as const,
  },
  {
    value: "prepTime-desc",
    label: "Czas przygotowania malejąco",
    sortBy: "prepTime" as const,
    sortOrder: "desc" as const,
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * SortDropdown component for selecting recipe sort order
 *
 * Features:
 * - Dropdown with predefined sort options
 * - Polish labels for better UX
 * - Combines sortBy field and sortOrder direction
 *
 * Sort options:
 * - Najnowsze (createdAt, desc)
 * - Najstarsze (createdAt, asc)
 * - Tytuł A-Z (title, asc)
 * - Tytuł Z-A (title, desc)
 * - Czas przygotowania rosnąco (prepTime, asc)
 * - Czas przygotowania malejąco (prepTime, desc)
 *
 * @example
 * ```tsx
 * <SortDropdown
 *   sortBy={filters.sortBy}
 *   sortOrder={filters.sortOrder}
 *   onChange={setSortBy}
 * />
 * ```
 */
const SortDropdown = ({ sortBy, sortOrder, onChange }: SortDropdownProps) => {
  // Build current value from sortBy and sortOrder
  const currentValue = `${sortBy}-${sortOrder}`;

  // Handle selection change
  const handleChange = (value: string) => {
    const option = SORT_OPTIONS.find((opt) => opt.value === value);
    if (option) {
      onChange(option.sortBy, option.sortOrder);
    }
  };

  return (
    <div className="space-y-2">
      <label htmlFor="sort-select" className="text-sm font-medium text-gray-900">
        Sortowanie
      </label>
      <Select value={currentValue} onValueChange={handleChange}>
        <SelectTrigger id="sort-select" className="w-full">
          <SelectValue placeholder="Wybierz sortowanie" />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default SortDropdown;
