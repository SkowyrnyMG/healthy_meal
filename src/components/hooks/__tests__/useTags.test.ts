import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useTags } from "../useTags";
import type { TagDTO } from "@/types";

// ============================================================================
// MOCKS
// ============================================================================

// Mock fetch globally
global.fetch = vi.fn();

// ============================================================================
// TEST HELPERS
// ============================================================================

/**
 * Create a mock tag
 */
const createMockTag = (id: string, name: string): TagDTO => ({
  id,
  name,
});

/**
 * Mock successful API response
 */
const mockSuccessfulFetch = (tags: TagDTO[]) => {
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ tags }),
  } as Response);
};

/**
 * Mock failed API response
 */
const mockFailedFetch = (status: number, message = "API Error") => {
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
    ok: false,
    status,
    json: async () => ({ message }),
  } as Response);
};

/**
 * Mock network error
 */
const mockNetworkError = () => {
  (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Network Error"));
};

// ============================================================================
// TESTS
// ============================================================================

describe("useTags", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // INITIAL STATE
  // ==========================================================================

  describe("Initial State", () => {
    it("should initialize with empty tags array", () => {
      mockSuccessfulFetch([createMockTag("1", "Tag 1")]);

      const { result } = renderHook(() => useTags());

      expect(result.current.tags).toEqual([]);
    });

    it("should initialize with isLoading = true", () => {
      mockSuccessfulFetch([createMockTag("1", "Tag 1")]);

      const { result } = renderHook(() => useTags());

      expect(result.current.isLoading).toBe(true);
    });

    it("should initialize with error = null", () => {
      mockSuccessfulFetch([createMockTag("1", "Tag 1")]);

      const { result } = renderHook(() => useTags());

      expect(result.current.error).toBeNull();
    });
  });

  // ==========================================================================
  // DATA FETCHING
  // ==========================================================================

  describe("Data Fetching", () => {
    it("should fetch tags on mount", async () => {
      const mockTags = [createMockTag("1", "Breakfast"), createMockTag("2", "Lunch")];
      mockSuccessfulFetch(mockTags);

      const { result } = renderHook(() => useTags());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.tags).toEqual(mockTags);
    });

    it("should call GET /api/tags", async () => {
      mockSuccessfulFetch([createMockTag("1", "Tag 1")]);

      renderHook(() => useTags());

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith("/api/tags");
      });
    });

    it("should parse successful response", async () => {
      const mockTags = [
        createMockTag("1", "Vegetarian"),
        createMockTag("2", "Vegan"),
        createMockTag("3", "Gluten-Free"),
      ];
      mockSuccessfulFetch(mockTags);

      const { result } = renderHook(() => useTags());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.tags).toHaveLength(3);
      expect(result.current.tags).toEqual(mockTags);
    });

    it("should set isLoading to false after fetch", async () => {
      mockSuccessfulFetch([createMockTag("1", "Tag 1")]);

      const { result } = renderHook(() => useTags());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("should cache results (not refetch on re-render)", async () => {
      mockSuccessfulFetch([createMockTag("1", "Tag 1")]);

      const { rerender } = renderHook(() => useTags());

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });

      // Force re-render
      rerender();

      // Should still have been called only once
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================================================
  // ERROR HANDLING
  // ==========================================================================

  describe("Error Handling", () => {
    it("should set error state on API failure", async () => {
      mockFailedFetch(500, "Server Error");

      const { result } = renderHook(() => useTags());

      await waitFor(() => {
        expect(result.current.error).toBe("Server Error");
      });
    });

    it("should extract error message from response", async () => {
      mockFailedFetch(400, "Bad Request");

      const { result } = renderHook(() => useTags());

      await waitFor(() => {
        expect(result.current.error).toBe("Bad Request");
      });
    });

    it("should default to generic error message when none provided", async () => {
      // Mock response without message
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({}),
      } as Response);

      const { result } = renderHook(() => useTags());

      await waitFor(() => {
        expect(result.current.error).toBe("Nie udało się pobrać kategorii");
      });
    });

    it("should handle network errors", async () => {
      mockNetworkError();

      const { result } = renderHook(() => useTags());

      await waitFor(() => {
        expect(result.current.error).toBe("Network Error");
      });
    });

    it("should set isLoading to false on error", async () => {
      mockFailedFetch(500, "Server Error");

      const { result } = renderHook(() => useTags());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("should keep empty array on error", async () => {
      mockFailedFetch(500, "Server Error");

      const { result } = renderHook(() => useTags());

      await waitFor(() => {
        expect(result.current.tags).toEqual([]);
      });
    });
  });

  // ==========================================================================
  // COMPONENT UNMOUNT
  // ==========================================================================

  describe("Component Unmount", () => {
    it("should not update state if component unmounts during fetch", async () => {
      mockSuccessfulFetch([createMockTag("1", "Tag 1")]);

      const { result, unmount } = renderHook(() => useTags());

      // Unmount immediately
      unmount();

      // Wait a bit to see if state would have been updated
      await new Promise((resolve) => setTimeout(resolve, 100));

      // State should still be initial values
      expect(result.current.tags).toEqual([]);
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBeNull();
    });
  });

  // ==========================================================================
  // EMPTY RESPONSE
  // ==========================================================================

  describe("Empty Response", () => {
    it("should handle empty tags array", async () => {
      mockSuccessfulFetch([]);

      const { result } = renderHook(() => useTags());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.tags).toEqual([]);
      expect(result.current.error).toBeNull();
    });
  });
});
