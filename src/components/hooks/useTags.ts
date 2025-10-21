import { useState, useEffect } from "react";
import type { TagDTO } from "@/types";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Return type for the useTags hook
 */
export interface UseTagsReturn {
  /**
   * Array of available tags
   */
  tags: TagDTO[];

  /**
   * Loading state
   */
  isLoading: boolean;

  /**
   * Error message if fetch failed
   */
  error: string | null;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

/**
 * Custom hook for fetching and caching available recipe tags
 *
 * Features:
 * - Fetches tags once on mount
 * - Caches tags in component state
 * - Loading and error state management
 * - Graceful error handling (returns empty array on failure)
 *
 * @example
 * ```tsx
 * const { tags, isLoading, error } = useTags();
 *
 * if (error) {
 *   console.error("Failed to load tags:", error);
 *   // Continue with empty tags array
 * }
 *
 * return <TagFilterSection tags={tags} />;
 * ```
 */
export const useTags = (): UseTagsReturn => {
  const [tags, setTags] = useState<TagDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    /**
     * Fetch tags from API
     */
    const fetchTags = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/tags");

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Nie udało się pobrać kategorii");
        }

        const data = await response.json();

        // Only update state if component is still mounted
        if (isMounted) {
          setTags(data.tags || []);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("[useTags] Error fetching tags:", err);

        const errorMessage = err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd";

        // Only update state if component is still mounted
        if (isMounted) {
          setError(errorMessage);
          // Keep empty array on error - allow other filters to work
          setTags([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchTags();

    // Cleanup: Prevent state updates on unmounted component
    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array - fetch once on mount

  return {
    tags,
    isLoading,
    error,
  };
};
