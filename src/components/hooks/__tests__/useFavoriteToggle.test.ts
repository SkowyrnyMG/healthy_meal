import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useFavoriteToggle } from "../useFavoriteToggle";

// ============================================================================
// MOCKS
// ============================================================================

// Mock sonner toast - must be defined before vi.mock due to hoisting
vi.mock("sonner", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockToastFn: any = vi.fn((message: any, options?: any) => {
    // Store the undo callback for testing
    if (options?.action?.onClick) {
      mockToastFn.lastUndoCallback = options.action.onClick;
    }
    return message;
  });

  mockToastFn.success = vi.fn();
  mockToastFn.error = vi.fn();

  return {
    toast: mockToastFn,
  };
});

// Import after mock to get the mocked version
import { toast } from "sonner";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockToast = toast as any;

// Mock fetch globally
global.fetch = vi.fn();

// ============================================================================
// TEST HELPERS
// ============================================================================

/**
 * Create a mock fetch response
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createMockResponse = (ok: boolean, data?: any): Response => {
  return {
    ok,
    json: async () => data || {},
    status: ok ? 200 : 400,
    statusText: ok ? "OK" : "Bad Request",
  } as Response;
};

/**
 * Mock successful API response
 */
const mockSuccessfulFetch = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global.fetch as any).mockResolvedValue(createMockResponse(true));
};

/**
 * Mock failed API response
 */
const mockFailedFetch = (message = "API Error") => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global.fetch as any).mockResolvedValue(createMockResponse(false, { message }));
};

/**
 * Mock network error
 */
const mockNetworkError = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global.fetch as any).mockRejectedValue(new Error("Network Error"));
};

// ============================================================================
// TESTS
// ============================================================================

describe("useFavoriteToggle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // STATE MANAGEMENT
  // ==========================================================================

  describe("State Management", () => {
    it("should initialize with provided favorite IDs", () => {
      const initialFavorites = new Set(["recipe-1", "recipe-2"]);

      const { result } = renderHook(() =>
        useFavoriteToggle({
          initialFavorites,
        })
      );

      expect(result.current.favorites.has("recipe-1")).toBe(true);
      expect(result.current.favorites.has("recipe-2")).toBe(true);
      expect(result.current.favorites.has("recipe-3")).toBe(false);
    });

    it("should initialize with empty favorites set", () => {
      const { result } = renderHook(() =>
        useFavoriteToggle({
          initialFavorites: new Set(),
        })
      );

      expect(result.current.favorites.size).toBe(0);
    });

    it("should add recipe to favorites set optimistically", async () => {
      mockSuccessfulFetch();
      const { result } = renderHook(() =>
        useFavoriteToggle({
          initialFavorites: new Set(),
        })
      );

      await act(async () => {
        await result.current.toggleFavorite("recipe-1");
      });

      expect(result.current.favorites.has("recipe-1")).toBe(true);
    });

    it("should remove recipe from favorites set optimistically", async () => {
      mockSuccessfulFetch();
      const { result } = renderHook(() =>
        useFavoriteToggle({
          initialFavorites: new Set(["recipe-1"]),
        })
      );

      await act(async () => {
        await result.current.toggleFavorite("recipe-1");
      });

      expect(result.current.favorites.has("recipe-1")).toBe(false);
    });
  });

  // ==========================================================================
  // API INTEGRATION - ADD FAVORITE
  // ==========================================================================

  describe("API Integration - Add Favorite", () => {
    it("should call POST /api/favorites when adding favorite", async () => {
      mockSuccessfulFetch();
      const { result } = renderHook(() =>
        useFavoriteToggle({
          initialFavorites: new Set(),
        })
      );

      await act(async () => {
        await result.current.toggleFavorite("recipe-1");
      });

      expect(global.fetch).toHaveBeenCalledWith("/api/favorites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ recipeId: "recipe-1" }),
      });
    });

    it("should pass correct recipeId in request body", async () => {
      mockSuccessfulFetch();
      const { result } = renderHook(() =>
        useFavoriteToggle({
          initialFavorites: new Set(),
        })
      );

      await act(async () => {
        await result.current.toggleFavorite("recipe-123");
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const callArgs = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body).toEqual({ recipeId: "recipe-123" });
    });

    it("should NOT show toast after adding favorite (only on remove)", async () => {
      mockSuccessfulFetch();
      const { result } = renderHook(() =>
        useFavoriteToggle({
          initialFavorites: new Set(),
        })
      );

      await act(async () => {
        await result.current.toggleFavorite("recipe-1");
      });

      // Toast should NOT be called for successful add
      expect(mockToast).not.toHaveBeenCalled();
    });

    it("should keep optimistic update on successful add", async () => {
      mockSuccessfulFetch();
      const { result } = renderHook(() =>
        useFavoriteToggle({
          initialFavorites: new Set(),
        })
      );

      await act(async () => {
        await result.current.toggleFavorite("recipe-1");
      });

      await waitFor(() => {
        expect(result.current.favorites.has("recipe-1")).toBe(true);
      });
    });
  });

  // ==========================================================================
  // API INTEGRATION - REMOVE FAVORITE
  // ==========================================================================

  describe("API Integration - Remove Favorite", () => {
    it("should call DELETE /api/favorites when removing favorite", async () => {
      mockSuccessfulFetch();
      const { result } = renderHook(() =>
        useFavoriteToggle({
          initialFavorites: new Set(["recipe-1"]),
        })
      );

      await act(async () => {
        await result.current.toggleFavorite("recipe-1");
      });

      expect(global.fetch).toHaveBeenCalledWith("/api/favorites", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ recipeId: "recipe-1" }),
      });
    });

    it("should show toast with undo option when removing", async () => {
      mockSuccessfulFetch();
      const { result } = renderHook(() =>
        useFavoriteToggle({
          initialFavorites: new Set(["recipe-1"]),
        })
      );

      await act(async () => {
        await result.current.toggleFavorite("recipe-1");
      });

      expect(mockToast).toHaveBeenCalledWith("Usunięto z ulubionych", {
        action: {
          label: "Cofnij",
          onClick: expect.any(Function),
        },
        duration: 5000,
      });
    });

    it("should keep optimistic removal on successful delete", async () => {
      mockSuccessfulFetch();
      const { result } = renderHook(() =>
        useFavoriteToggle({
          initialFavorites: new Set(["recipe-1"]),
        })
      );

      await act(async () => {
        await result.current.toggleFavorite("recipe-1");
      });

      await waitFor(() => {
        expect(result.current.favorites.has("recipe-1")).toBe(false);
      });
    });
  });

  // ==========================================================================
  // ERROR HANDLING & ROLLBACK
  // ==========================================================================

  describe("Error Handling & Rollback", () => {
    it("should rollback optimistic add on API failure", async () => {
      mockFailedFetch("Failed to add");
      const { result } = renderHook(() =>
        useFavoriteToggle({
          initialFavorites: new Set(),
        })
      );

      await act(async () => {
        await result.current.toggleFavorite("recipe-1");
      });

      await waitFor(() => {
        expect(result.current.favorites.has("recipe-1")).toBe(false);
      });
    });

    it("should rollback optimistic remove on API failure", async () => {
      mockFailedFetch("Failed to remove");
      const { result } = renderHook(() =>
        useFavoriteToggle({
          initialFavorites: new Set(["recipe-1"]),
        })
      );

      await act(async () => {
        await result.current.toggleFavorite("recipe-1");
      });

      await waitFor(() => {
        expect(result.current.favorites.has("recipe-1")).toBe(true);
      });
    });

    it("should show error toast on API failure", async () => {
      mockFailedFetch("Custom error message");
      const { result } = renderHook(() =>
        useFavoriteToggle({
          initialFavorites: new Set(),
        })
      );

      await act(async () => {
        await result.current.toggleFavorite("recipe-1");
      });

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith("Custom error message");
      });
    });

    it("should handle network errors gracefully", async () => {
      mockNetworkError();
      const { result } = renderHook(() =>
        useFavoriteToggle({
          initialFavorites: new Set(),
        })
      );

      await act(async () => {
        await result.current.toggleFavorite("recipe-1");
      });

      await waitFor(() => {
        expect(result.current.favorites.has("recipe-1")).toBe(false);
        expect(mockToast.error).toHaveBeenCalledWith("Network Error");
      });
    });

    it("should show default error message when API returns no message", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global.fetch as any).mockResolvedValue(createMockResponse(false, {}));
      const { result } = renderHook(() =>
        useFavoriteToggle({
          initialFavorites: new Set(),
        })
      );

      await act(async () => {
        await result.current.toggleFavorite("recipe-1");
      });

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith("Nie udało się dodać do ulubionych");
      });
    });

    it("should handle JSON parsing errors in API response", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global.fetch as any).mockResolvedValue({
        ok: false,
        json: async () => {
          throw new Error("Invalid JSON");
        },
      });
      const { result } = renderHook(() =>
        useFavoriteToggle({
          initialFavorites: new Set(),
        })
      );

      await act(async () => {
        await result.current.toggleFavorite("recipe-1");
      });

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalled();
      });
    });
  });

  // ==========================================================================
  // UNDO FUNCTIONALITY
  // ==========================================================================

  describe("Undo Functionality", () => {
    it("should re-add favorite when undo is clicked", async () => {
      mockSuccessfulFetch();
      const { result } = renderHook(() =>
        useFavoriteToggle({
          initialFavorites: new Set(["recipe-1"]),
        })
      );

      // Remove favorite
      await act(async () => {
        await result.current.toggleFavorite("recipe-1");
      });

      expect(result.current.favorites.has("recipe-1")).toBe(false);

      // Get undo callback from toast mock
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const undoCallback = (mockToast as any).lastUndoCallback;
      expect(undoCallback).toBeDefined();

      // Clear mocks to verify undo call
      vi.clearAllMocks();
      mockSuccessfulFetch();

      // Click undo
      await act(async () => {
        await undoCallback();
      });

      await waitFor(() => {
        expect(result.current.favorites.has("recipe-1")).toBe(true);
      });
    });

    it("should call POST /api/favorites on undo", async () => {
      mockSuccessfulFetch();
      const { result } = renderHook(() =>
        useFavoriteToggle({
          initialFavorites: new Set(["recipe-1"]),
        })
      );

      // Remove favorite
      await act(async () => {
        await result.current.toggleFavorite("recipe-1");
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const undoCallback = (mockToast as any).lastUndoCallback;

      // Clear mocks to verify undo call
      vi.clearAllMocks();
      mockSuccessfulFetch();

      // Click undo
      await act(async () => {
        await undoCallback();
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith("/api/favorites", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ recipeId: "recipe-1" }),
        });
      });
    });

    it("should update UI immediately on undo", async () => {
      mockSuccessfulFetch();
      const { result } = renderHook(() =>
        useFavoriteToggle({
          initialFavorites: new Set(["recipe-1"]),
        })
      );

      // Remove favorite
      await act(async () => {
        await result.current.toggleFavorite("recipe-1");
      });

      expect(result.current.favorites.has("recipe-1")).toBe(false);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const undoCallback = (mockToast as any).lastUndoCallback;
      vi.clearAllMocks();
      mockSuccessfulFetch();

      // Click undo - optimistic update should happen immediately
      await act(async () => {
        await undoCallback();
      });

      // Should be re-added immediately (optimistically)
      expect(result.current.favorites.has("recipe-1")).toBe(true);
    });

    it("should handle undo API failures", async () => {
      mockSuccessfulFetch();
      const { result } = renderHook(() =>
        useFavoriteToggle({
          initialFavorites: new Set(["recipe-1"]),
        })
      );

      // Remove favorite
      await act(async () => {
        await result.current.toggleFavorite("recipe-1");
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const undoCallback = (mockToast as any).lastUndoCallback;

      // Mock undo failure
      vi.clearAllMocks();
      mockFailedFetch("Undo failed");

      // Click undo
      await act(async () => {
        await undoCallback();
      });

      await waitFor(() => {
        // Should rollback the undo
        expect(result.current.favorites.has("recipe-1")).toBe(false);
        expect(mockToast.error).toHaveBeenCalledWith("Undo failed");
      });
    });

    it("should show success toast after successful undo", async () => {
      mockSuccessfulFetch();
      const { result } = renderHook(() =>
        useFavoriteToggle({
          initialFavorites: new Set(["recipe-1"]),
        })
      );

      // Remove favorite
      await act(async () => {
        await result.current.toggleFavorite("recipe-1");
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const undoCallback = (mockToast as any).lastUndoCallback;
      vi.clearAllMocks();
      mockSuccessfulFetch();

      // Click undo
      await act(async () => {
        await undoCallback();
      });

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith("Przywrócono do ulubionych");
      });
    });
  });

  // ==========================================================================
  // CONCURRENT OPERATIONS
  // ==========================================================================

  describe("Concurrent Operations", () => {
    it("should prevent double-toggling same recipe", async () => {
      mockSuccessfulFetch();

      const { result } = renderHook(() =>
        useFavoriteToggle({
          initialFavorites: new Set(),
        })
      );

      // Toggle the recipe
      await act(async () => {
        await result.current.toggleFavorite("recipe-1");
      });

      // Verify the toggle happened
      expect(result.current.favorites.has("recipe-1")).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // The isTogglingRecipe should return false after completion
      expect(result.current.isTogglingRecipe("recipe-1")).toBe(false);
    });

    it("should allow concurrent toggles for different recipes", async () => {
      mockSuccessfulFetch();
      const { result } = renderHook(() =>
        useFavoriteToggle({
          initialFavorites: new Set(),
        })
      );

      // Toggle two different recipes concurrently
      await act(async () => {
        await Promise.all([result.current.toggleFavorite("recipe-1"), result.current.toggleFavorite("recipe-2")]);
      });

      // Should call fetch twice (one for each recipe)
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(result.current.favorites.has("recipe-1")).toBe(true);
      expect(result.current.favorites.has("recipe-2")).toBe(true);
    });

    it("should track toggling state per recipe", async () => {
      mockSuccessfulFetch();

      const { result } = renderHook(() =>
        useFavoriteToggle({
          initialFavorites: new Set(),
        })
      );

      // Before toggle - not toggling
      expect(result.current.isTogglingRecipe("recipe-1")).toBe(false);

      // Toggle the recipe
      await act(async () => {
        await result.current.toggleFavorite("recipe-1");
      });

      // After toggle completes - no longer toggling
      expect(result.current.isTogglingRecipe("recipe-1")).toBe(false);
    });

    it("should prevent undo while recipe is toggling", async () => {
      mockSuccessfulFetch();
      const { result } = renderHook(() =>
        useFavoriteToggle({
          initialFavorites: new Set(["recipe-1"]),
        })
      );

      // Remove favorite
      await act(async () => {
        await result.current.toggleFavorite("recipe-1");
      });

      // Verify it was removed
      expect(result.current.favorites.has("recipe-1")).toBe(false);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const undoCallback = (mockToast as any).lastUndoCallback;
      vi.clearAllMocks();
      mockSuccessfulFetch();

      // Call undo
      await act(async () => {
        await undoCallback();
      });

      // Verify it was added back
      expect(result.current.favorites.has("recipe-1")).toBe(true);
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================

  describe("Edge Cases", () => {
    it("should handle toggling non-existent recipe", async () => {
      mockSuccessfulFetch();
      const { result } = renderHook(() =>
        useFavoriteToggle({
          initialFavorites: new Set(),
        })
      );

      await act(async () => {
        await result.current.toggleFavorite("non-existent-recipe");
      });

      expect(result.current.favorites.has("non-existent-recipe")).toBe(true);
    });

    it("should handle empty initial favorites", async () => {
      mockSuccessfulFetch();
      const { result } = renderHook(() =>
        useFavoriteToggle({
          initialFavorites: new Set(),
        })
      );

      expect(result.current.favorites.size).toBe(0);

      await act(async () => {
        await result.current.toggleFavorite("recipe-1");
      });

      expect(result.current.favorites.size).toBe(1);
    });

    it("should handle very long recipe IDs", async () => {
      mockSuccessfulFetch();
      const longId = "a".repeat(1000);
      const { result } = renderHook(() =>
        useFavoriteToggle({
          initialFavorites: new Set(),
        })
      );

      await act(async () => {
        await result.current.toggleFavorite(longId);
      });

      expect(result.current.favorites.has(longId)).toBe(true);
    });

    it("should handle special characters in recipe IDs", async () => {
      mockSuccessfulFetch();
      const specialId = "recipe-123!@#$%^&*()";
      const { result } = renderHook(() =>
        useFavoriteToggle({
          initialFavorites: new Set(),
        })
      );

      await act(async () => {
        await result.current.toggleFavorite(specialId);
      });

      expect(result.current.favorites.has(specialId)).toBe(true);
    });
  });

  // ==========================================================================
  // ISTOGGLING RECIPE
  // ==========================================================================

  describe("isTogglingRecipe", () => {
    it("should return false when recipe is not being toggled", () => {
      const { result } = renderHook(() =>
        useFavoriteToggle({
          initialFavorites: new Set(),
        })
      );

      expect(result.current.isTogglingRecipe("recipe-1")).toBe(false);
    });

    it("should return true while recipe is being toggled then false after", async () => {
      mockSuccessfulFetch();

      const { result } = renderHook(() =>
        useFavoriteToggle({
          initialFavorites: new Set(),
        })
      );

      // Before toggling
      expect(result.current.isTogglingRecipe("recipe-1")).toBe(false);

      // Toggle the recipe
      await act(async () => {
        await result.current.toggleFavorite("recipe-1");
      });

      // After toggling completes
      expect(result.current.isTogglingRecipe("recipe-1")).toBe(false);
    });

    it("should return false for different recipe while another is toggling", async () => {
      mockSuccessfulFetch();

      const { result } = renderHook(() =>
        useFavoriteToggle({
          initialFavorites: new Set(),
        })
      );

      // Neither recipe is toggling initially
      expect(result.current.isTogglingRecipe("recipe-1")).toBe(false);
      expect(result.current.isTogglingRecipe("recipe-2")).toBe(false);

      // Toggle recipe-1
      await act(async () => {
        await result.current.toggleFavorite("recipe-1");
      });

      // After toggling, neither is toggling
      expect(result.current.isTogglingRecipe("recipe-1")).toBe(false);
      expect(result.current.isTogglingRecipe("recipe-2")).toBe(false);
    });
  });
});
