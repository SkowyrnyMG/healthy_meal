import { useState, useCallback } from "react";
import { toast } from "sonner";
import type { CollectionDetailDTO } from "@/types";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Options for initializing the useCollectionDetail hook
 */
export interface UseCollectionDetailOptions {
  /**
   * Collection UUID to fetch
   */
  collectionId: string;

  /**
   * Initial collection data from server-side fetch
   */
  initialCollection: CollectionDetailDTO | null;

  /**
   * Initial page number (default: 1)
   */
  initialPage?: number;
}

/**
 * Return type for the useCollectionDetail hook
 */
export interface UseCollectionDetailReturn {
  /**
   * Current collection data (null if loading or error)
   */
  collection: CollectionDetailDTO | null;

  /**
   * Loading state for page changes
   */
  isLoading: boolean;

  /**
   * Error state
   */
  error: Error | null;

  /**
   * Current page number
   */
  currentPage: number;

  /**
   * Navigate to a specific page
   */
  goToPage: (page: number) => Promise<void>;

  /**
   * Refresh current page data
   */
  refreshCollection: () => Promise<void>;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

/**
 * Custom hook for managing collection detail data with pagination
 *
 * This hook provides:
 * - Collection data fetching with pagination
 * - Page navigation
 * - Data refresh after mutations
 * - Error handling with redirects for 404/403
 * - Loading states
 *
 * @example
 * ```tsx
 * const { collection, isLoading, currentPage, goToPage, refreshCollection } = useCollectionDetail({
 *   collectionId: '123e4567-e89b-12d3-a456-426614174000',
 *   initialCollection: serverData,
 *   initialPage: 1
 * });
 *
 * // Navigate to next page
 * await goToPage(currentPage + 1);
 *
 * // Refresh after mutation
 * await refreshCollection();
 * ```
 */
export const useCollectionDetail = (options: UseCollectionDetailOptions): UseCollectionDetailReturn => {
  const { collectionId, initialCollection, initialPage = 1 } = options;

  // State for collection data
  const [collection, setCollection] = useState<CollectionDetailDTO | null>(initialCollection);

  // State for loading (page changes)
  const [isLoading, setIsLoading] = useState(false);

  // State for errors
  const [error, setError] = useState<Error | null>(null);

  // State for current page
  const [currentPage, setCurrentPage] = useState(initialPage);

  /**
   * Fetch collection data from API
   * @param page - Page number to fetch
   */
  const fetchCollection = useCallback(
    async (page: number): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        // GET /api/collections/{id}?page={page}&limit=20
        const response = await fetch(`/api/collections/${collectionId}?page=${page}&limit=20`, {
          method: "GET",
          credentials: "include",
        });

        // Handle error responses
        if (!response.ok) {
          if (response.status === 404) {
            // Collection not found
            toast.error("Kolekcja nie została znaleziona");
            window.location.href = "/collections";
            return;
          }

          if (response.status === 403) {
            // Unauthorized access
            toast.error("Nie masz dostępu do tej kolekcji");
            window.location.href = "/collections";
            return;
          }

          if (response.status === 400) {
            // Invalid page parameter - reset to page 1
            await fetchCollection(1);
            return;
          }

          // Generic error
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Nie udało się pobrać kolekcji");
        }

        // Parse response
        const data: CollectionDetailDTO = await response.json();

        // Update state
        setCollection(data);
        setCurrentPage(page);
      } catch (err) {
        // Log error
        // eslint-disable-next-line no-console
        console.error("[useCollectionDetail] Fetch error:", {
          collectionId,
          page,
          error: err instanceof Error ? err.message : "Unknown error",
        });

        // Set error state
        const errorObj = err instanceof Error ? err : new Error("Wystąpił błąd podczas pobierania kolekcji");
        setError(errorObj);

        // Show error toast
        toast.error(errorObj.message);
      } finally {
        setIsLoading(false);
      }
    },
    [collectionId]
  );

  /**
   * Navigate to a specific page
   */
  const goToPage = useCallback(
    async (page: number): Promise<void> => {
      // Validate page number
      if (page < 1) {
        page = 1;
      }

      if (collection && page > collection.pagination.totalPages) {
        page = collection.pagination.totalPages;
      }

      // Fetch new page
      await fetchCollection(page);
    },
    [collection, fetchCollection]
  );

  /**
   * Refresh current page data
   */
  const refreshCollection = useCallback(async (): Promise<void> => {
    await fetchCollection(currentPage);
  }, [currentPage, fetchCollection]);

  return {
    collection,
    isLoading,
    error,
    currentPage,
    goToPage,
    refreshCollection,
  };
};
