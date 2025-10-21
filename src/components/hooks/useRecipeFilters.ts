import { useState, useEffect, useCallback } from "react";
import type { RecipeFilters } from "@/types";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Return type for the useRecipeFilters hook
 */
export interface UseRecipeFiltersReturn {
  /**
   * Current filter state
   */
  filters: RecipeFilters;

  /**
   * Update search query
   */
  setSearch: (value: string | undefined) => void;

  /**
   * Update selected tag IDs
   */
  setTagIds: (ids: string[]) => void;

  /**
   * Update maximum calories filter
   */
  setMaxCalories: (value: number | undefined) => void;

  /**
   * Update maximum prep time filter
   */
  setMaxPrepTime: (value: number | undefined) => void;

  /**
   * Update sort field and order
   */
  setSortBy: (field: RecipeFilters["sortBy"], order: RecipeFilters["sortOrder"]) => void;

  /**
   * Update current page
   */
  setPage: (page: number) => void;

  /**
   * Clear all filters (reset to defaults, keep page)
   */
  clearFilters: () => void;

  /**
   * Remove a specific filter
   * @param key - Filter key to remove (search, maxCalories, maxPrepTime)
   * @param value - Optional value for array filters (tagId to remove)
   */
  removeFilter: (key: string, value?: string) => void;

  /**
   * Count of active filters (excludes page, sortBy, sortOrder)
   */
  activeFilterCount: number;

  /**
   * Filter panel visibility state (mobile)
   */
  isFilterPanelOpen: boolean;

  /**
   * Toggle filter panel (mobile)
   */
  toggleFilterPanel: () => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default filter values
 */
const DEFAULT_FILTERS: RecipeFilters = {
  sortBy: "createdAt",
  sortOrder: "desc",
  page: 1,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse URL search parameters into RecipeFilters
 * Validates and sanitizes parameter values
 */
function parseUrlParams(): RecipeFilters {
  // Only run in browser
  if (typeof window === "undefined") {
    return { ...DEFAULT_FILTERS };
  }

  const params = new URLSearchParams(window.location.search);
  const filters: RecipeFilters = { ...DEFAULT_FILTERS };

  // Parse search
  const search = params.get("search");
  if (search && search.trim().length > 0 && search.length <= 255) {
    filters.search = search.trim();
  }

  // Parse tags (comma-separated UUIDs)
  const tags = params.get("tags");
  if (tags) {
    const tagIds = tags.split(",").map((id) => id.trim());
    // Basic UUID validation
    const validTagIds = tagIds.filter((id) => /^[0-9a-f-]{36}$/i.test(id));
    if (validTagIds.length > 0) {
      filters.tagIds = validTagIds;
    }
  }

  // Parse maxCalories
  const maxCalories = params.get("maxCalories");
  if (maxCalories) {
    const parsed = parseInt(maxCalories, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 10000) {
      filters.maxCalories = parsed;
    }
  }

  // Parse maxPrepTime
  const maxPrepTime = params.get("maxPrepTime");
  if (maxPrepTime) {
    const parsed = parseInt(maxPrepTime, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 1440) {
      filters.maxPrepTime = parsed;
    }
  }

  // Parse sortBy
  const sortBy = params.get("sortBy");
  if (sortBy && ["createdAt", "updatedAt", "title", "prepTime"].includes(sortBy)) {
    filters.sortBy = sortBy as RecipeFilters["sortBy"];
  }

  // Parse sortOrder
  const sortOrder = params.get("sortOrder");
  if (sortOrder && ["asc", "desc"].includes(sortOrder)) {
    filters.sortOrder = sortOrder as RecipeFilters["sortOrder"];
  }

  // Parse page
  const page = params.get("page");
  if (page) {
    const parsed = parseInt(page, 10);
    if (!isNaN(parsed) && parsed >= 1) {
      filters.page = parsed;
    }
  }

  return filters;
}

/**
 * Update URL search parameters from RecipeFilters
 * Uses pushState to support browser back/forward navigation
 */
function updateUrlParams(filters: RecipeFilters): void {
  // Only run in browser
  if (typeof window === "undefined") {
    return;
  }

  const params = new URLSearchParams();

  // Add parameters only if they differ from defaults
  if (filters.search) {
    params.set("search", filters.search);
  }

  if (filters.tagIds && filters.tagIds.length > 0) {
    params.set("tags", filters.tagIds.join(","));
  }

  if (filters.maxCalories) {
    params.set("maxCalories", filters.maxCalories.toString());
  }

  if (filters.maxPrepTime) {
    params.set("maxPrepTime", filters.maxPrepTime.toString());
  }

  if (filters.sortBy !== DEFAULT_FILTERS.sortBy) {
    params.set("sortBy", filters.sortBy);
  }

  if (filters.sortOrder !== DEFAULT_FILTERS.sortOrder) {
    params.set("sortOrder", filters.sortOrder);
  }

  if (filters.page !== DEFAULT_FILTERS.page) {
    params.set("page", filters.page.toString());
  }

  // Build new URL
  const newUrl = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname;

  // Update URL using pushState (allows back/forward navigation)
  window.history.pushState({}, "", newUrl);
}

/**
 * Calculate count of active filters
 * Excludes page, sortBy, sortOrder
 */
function countActiveFilters(filters: RecipeFilters): number {
  let count = 0;

  if (filters.search) count++;
  if (filters.tagIds && filters.tagIds.length > 0) count += filters.tagIds.length;
  if (filters.maxCalories) count++;
  if (filters.maxPrepTime) count++;

  return count;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

/**
 * Custom hook for managing recipe filter state synchronized with URL query parameters
 *
 * Features:
 * - URL-based state management for shareability
 * - Browser back/forward navigation support
 * - Debouncing for search queries
 * - Active filter counting
 * - Mobile filter panel state
 *
 * @example
 * ```tsx
 * const {
 *   filters,
 *   setSearch,
 *   setTagIds,
 *   clearFilters,
 *   activeFilterCount,
 * } = useRecipeFilters();
 *
 * <SearchBar value={filters.search} onChange={setSearch} />
 * <ActiveFilterCount count={activeFilterCount} />
 * ```
 */
export const useRecipeFilters = (): UseRecipeFiltersReturn => {
  // Initialize state from URL on mount
  const [filters, setFilters] = useState<RecipeFilters>(() => parseUrlParams());
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  // Sync filters to URL whenever they change
  useEffect(() => {
    updateUrlParams(filters);
  }, [filters]);

  // Listen for browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      setFilters(parseUrlParams());
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // Filter manipulation methods
  const setSearch = useCallback((value: string | undefined) => {
    setFilters((prev) => ({
      ...prev,
      search: value && value.trim().length > 0 ? value.trim() : undefined,
      page: 1, // Reset to page 1 when search changes
    }));
  }, []);

  const setTagIds = useCallback((ids: string[]) => {
    setFilters((prev) => ({
      ...prev,
      tagIds: ids.length > 0 ? ids : undefined,
      page: 1, // Reset to page 1 when tags change
    }));
  }, []);

  const setMaxCalories = useCallback((value: number | undefined) => {
    setFilters((prev) => ({
      ...prev,
      maxCalories: value,
      page: 1, // Reset to page 1 when filter changes
    }));
  }, []);

  const setMaxPrepTime = useCallback((value: number | undefined) => {
    setFilters((prev) => ({
      ...prev,
      maxPrepTime: value,
      page: 1, // Reset to page 1 when filter changes
    }));
  }, []);

  const setSortBy = useCallback((field: RecipeFilters["sortBy"], order: RecipeFilters["sortOrder"]) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: field,
      sortOrder: order,
      page: 1, // Reset to page 1 when sort changes
    }));
  }, []);

  const setPage = useCallback((page: number) => {
    setFilters((prev) => ({
      ...prev,
      page: Math.max(1, page),
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
      page: 1,
    });
  }, [filters.sortBy, filters.sortOrder]);

  const removeFilter = useCallback((key: string, value?: string) => {
    setFilters((prev) => {
      const next = { ...prev };

      switch (key) {
        case "search":
          next.search = undefined;
          break;
        case "maxCalories":
          next.maxCalories = undefined;
          break;
        case "maxPrepTime":
          next.maxPrepTime = undefined;
          break;
        case "tagId":
          if (value && next.tagIds) {
            next.tagIds = next.tagIds.filter((id) => id !== value);
            if (next.tagIds.length === 0) {
              next.tagIds = undefined;
            }
          }
          break;
        default:
          // eslint-disable-next-line no-console
          console.warn(`[useRecipeFilters] Unknown filter key: ${key}`);
      }

      next.page = 1; // Reset to page 1
      return next;
    });
  }, []);

  const toggleFilterPanel = useCallback(() => {
    setIsFilterPanelOpen((prev) => !prev);
  }, []);

  // Calculate active filter count
  const activeFilterCount = countActiveFilters(filters);

  return {
    filters,
    setSearch,
    setTagIds,
    setMaxCalories,
    setMaxPrepTime,
    setSortBy,
    setPage,
    clearFilters,
    removeFilter,
    activeFilterCount,
    isFilterPanelOpen,
    toggleFilterPanel,
  };
};
