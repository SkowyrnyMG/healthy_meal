import { useState, useEffect, useCallback } from "react";
import type { RecipeFilters, RecipeListItemDTO, PaginationDTO } from "@/types";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Return type for the useRecipeList hook
 */
export interface UseRecipeListReturn {
  /**
   * Array of recipe list items
   */
  recipes: RecipeListItemDTO[];

  /**
   * Pagination metadata
   */
  pagination: PaginationDTO | null;

  /**
   * Loading state
   */
  isLoading: boolean;

  /**
   * Error message if fetch failed
   */
  error: string | null;

  /**
   * Manually trigger a refetch
   */
  refetch: () => void;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Build query string from RecipeFilters
 * Converts RecipeFilters to RecipeQueryParams format
 */
function buildQueryString(filters: RecipeFilters): string {
  const params = new URLSearchParams();

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

  params.set("page", filters.page.toString());
  params.set("limit", "20"); // Fixed page size
  params.set("sortBy", filters.sortBy);
  params.set("sortOrder", filters.sortOrder);

  return params.toString();
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

/**
 * Custom hook for fetching and managing recipe list data based on filters
 *
 * Features:
 * - Automatic fetching when filters change
 * - Debouncing for search queries (500ms)
 * - Loading and error state management
 * - Manual refetch capability
 *
 * @param filters - Current filter state
 *
 * @example
 * ```tsx
 * const { recipes, pagination, isLoading, error } = useRecipeList(filters);
 *
 * if (isLoading) return <LoadingSkeletons />;
 * if (error) return <ErrorMessage message={error} />;
 * if (recipes.length === 0) return <EmptyState />;
 *
 * return <RecipeGrid recipes={recipes} />;
 * ```
 */
export const useRecipeList = (filters: RecipeFilters): UseRecipeListReturn => {
  const [recipes, setRecipes] = useState<RecipeListItemDTO[]>([]);
  const [pagination, setPagination] = useState<PaginationDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Minimum loading time threshold (300ms) to prevent flickering
  const MIN_LOADING_TIME = 300;

  /**
   * Fetch recipes from API
   * Implements minimum loading time to prevent skeleton flickering on fast responses
   */
  const fetchRecipes = useCallback(
    async (currentFilters: RecipeFilters) => {
      const startTime = Date.now();
      setIsLoading(true);
      setError(null);

      try {
        const queryString = buildQueryString(currentFilters);
        const response = await fetch(`/api/recipes?${queryString}`);

        // Handle authentication errors
        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }

        // Handle other errors
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Nie udało się pobrać przepisów");
        }

        // Parse successful response
        const data = await response.json();

        // Calculate elapsed time
        const elapsedTime = Date.now() - startTime;
        const remainingTime = MIN_LOADING_TIME - elapsedTime;

        // If response was faster than threshold, delay to prevent flickering
        if (remainingTime > 0) {
          await new Promise((resolve) => setTimeout(resolve, remainingTime));
        }

        setRecipes(data.recipes || []);
        setPagination(data.pagination || null);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("[useRecipeList] Error fetching recipes:", err);

        const errorMessage = err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd";
        setError(errorMessage);

        // Reset data on error
        setRecipes([]);
        setPagination(null);
      } finally {
        setIsLoading(false);
      }
    },
    [MIN_LOADING_TIME]
  );

  /**
   * Effect: Fetch recipes when filters change
   * Applies debouncing only for search queries
   */
  useEffect(() => {
    // Determine if this is a search-triggered update
    const isSearchUpdate = filters.search !== undefined;

    // Create a debounce timeout for search
    let debounceTimeout: ReturnType<typeof setTimeout> | null = null;

    if (isSearchUpdate) {
      // Debounce search queries (500ms)
      debounceTimeout = setTimeout(() => {
        fetchRecipes(filters);
      }, 500);
    } else {
      // Immediate fetch for other filter changes (including clearing search)
      fetchRecipes(filters);
    }

    // Cleanup: Cancel pending debounced calls when filters change or on unmount
    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [filters, fetchRecipes]);

  /**
   * Manual refetch method
   * Useful for retry after errors
   */
  const refetch = useCallback(() => {
    fetchRecipes(filters);
  }, [filters, fetchRecipes]);

  return {
    recipes,
    pagination,
    isLoading,
    error,
    refetch,
  };
};
