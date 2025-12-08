import { useState, useEffect, useCallback } from "react";
import type { FavoriteDTO, PaginationDTO } from "@/types";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Return type for the useFavorites hook
 */
export interface UseFavoritesReturn {
  /**
   * Array of favorite recipes
   */
  favorites: FavoriteDTO[];

  /**
   * Pagination metadata (null during initial load)
   */
  pagination: PaginationDTO | null;

  /**
   * Loading state indicator
   */
  isLoading: boolean;

  /**
   * Error message (null if no error)
   */
  error: string | null;

  /**
   * Manually refetch favorites (useful after errors)
   */
  refetch: () => Promise<void>;

  /**
   * Navigate to a specific page
   */
  goToPage: (page: number) => void;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

/**
 * Custom hook for managing favorite recipes with pagination
 *
 * Features:
 * - Fetches paginated favorites from API
 * - Syncs current page with URL query parameters
 * - Handles loading and error states
 * - Supports manual refetch for error recovery
 * - Browser back/forward navigation support
 *
 * @example
 * ```tsx
 * const { favorites, pagination, isLoading, error, refetch, goToPage } = useFavorites();
 *
 * if (isLoading) return <LoadingSkeletons />;
 * if (error) return <ErrorState error={error} onRetry={refetch} />;
 * if (favorites.length === 0) return <EmptyState />;
 *
 * return (
 *   <>
 *     <RecipeGrid recipes={favorites} ... />
 *     <Pagination pagination={pagination} onPageChange={goToPage} />
 *   </>
 * );
 * ```
 */
export const useFavorites = (): UseFavoritesReturn => {
  // ========================================
  // STATE
  // ========================================

  const [favorites, setFavorites] = useState<FavoriteDTO[]>([]);
  const [pagination, setPagination] = useState<PaginationDTO | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // ========================================
  // HELPER FUNCTIONS
  // ========================================

  /**
   * Get current page from URL query parameters
   * Falls back to page 1 if not present or invalid
   */
  const getPageFromURL = useCallback((): number => {
    if (typeof window === "undefined") {
      return 1;
    }

    const searchParams = new URLSearchParams(window.location.search);
    const pageParam = searchParams.get("page");

    if (!pageParam) {
      return 1;
    }

    const page = parseInt(pageParam, 10);

    // Validate page number
    if (isNaN(page) || page < 1) {
      return 1;
    }

    return page;
  }, []);

  /**
   * Update URL with current page (without triggering navigation)
   */
  const updateURL = useCallback((page: number): void => {
    if (typeof window === "undefined") {
      return;
    }

    const url = new URL(window.location.href);
    url.searchParams.set("page", page.toString());

    // Update URL without triggering navigation
    window.history.replaceState({}, "", url.toString());
  }, []);

  /**
   * Fetch favorites from API for a specific page
   */
  const fetchFavorites = useCallback(
    async (page: number): Promise<void> => {
      // Set loading state
      setIsLoading(true);
      setError(null);

      try {
        // Make API request
        const response = await fetch(`/api/favorites?page=${page}&limit=20`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        // Handle non-OK responses
        if (!response.ok) {
          // Try to extract error message from response
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.message || "Nie udało się pobrać ulubionych przepisów";

          throw new Error(errorMessage);
        }

        // Parse response
        const data: { favorites: FavoriteDTO[]; pagination: PaginationDTO } = await response.json();

        // eslint-disable-next-line no-console
        console.log("[useFavorites] Fetched data:", {
          favoritesCount: data.favorites.length,
          pagination: data.pagination,
        });

        // Update state with fetched data
        setFavorites(data.favorites);
        setPagination(data.pagination);

        // Update current page
        setCurrentPage(page);

        // Update URL
        updateURL(page);

        // Clear any previous errors
        setError(null);
      } catch (err) {
        // Handle errors
        const errorMessage = err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd";

        setError(errorMessage);

        // Log error for debugging
        // eslint-disable-next-line no-console
        console.error("[useFavorites] Error fetching favorites:", {
          page,
          error: errorMessage,
          stack: err instanceof Error ? err.stack : undefined,
        });
      } finally {
        // Always clear loading state
        setIsLoading(false);
      }
    },
    [updateURL]
  );

  // ========================================
  // PUBLIC METHODS
  // ========================================

  /**
   * Navigate to a specific page
   * Validates page number and fetches new data
   */
  const goToPage = useCallback(
    (page: number): void => {
      // Validate page number
      if (page < 1) {
        page = 1;
      }

      // If we have pagination data, ensure page doesn't exceed total pages
      if (pagination && page > pagination.totalPages) {
        page = pagination.totalPages;
      }

      // Fetch new page
      fetchFavorites(page);
    },
    [pagination, fetchFavorites]
  );

  /**
   * Manually refetch current page
   * Useful for error recovery
   */
  const refetch = useCallback(async (): Promise<void> => {
    await fetchFavorites(currentPage);
  }, [currentPage, fetchFavorites]);

  // ========================================
  // EFFECTS
  // ========================================

  /**
   * Initial data fetch on component mount
   * Reads page from URL and fetches data
   */
  useEffect(() => {
    const initialPage = getPageFromURL();
    fetchFavorites(initialPage);
  }, []); // Only run once on mount - intentionally excludes getPageFromURL and fetchFavorites

  /**
   * Handle browser back/forward navigation
   * Syncs with URL changes
   */
  useEffect(() => {
    const handlePopState = () => {
      const newPage = getPageFromURL();
      if (newPage !== currentPage) {
        fetchFavorites(newPage);
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [currentPage, fetchFavorites, getPageFromURL]);

  // ========================================
  // RETURN
  // ========================================

  return {
    favorites,
    pagination,
    isLoading,
    error,
    refetch,
    goToPage,
  };
};
