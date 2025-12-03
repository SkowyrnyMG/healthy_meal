import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRecipeFilters } from "../useRecipeFilters";

// ============================================================================
// MOCKS
// ============================================================================

// Mock window.history
const mockPushState = vi.fn();
const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();

// Store original window properties
const originalLocation = window.location;
const originalHistory = window.history;

// ============================================================================
// TEST HELPERS
// ============================================================================

/**
 * Set up window.location with query parameters
 */
const setWindowLocation = (search: string) => {
  delete (window as { location?: Location }).location;
  window.location = {
    ...originalLocation,
    search,
    pathname: "/recipes",
  };
};

/**
 * Reset window mocks to initial state
 */
const resetWindowMocks = () => {
  window.history = originalHistory;
  window.location = originalLocation;
  mockPushState.mockClear();
  mockAddEventListener.mockClear();
  mockRemoveEventListener.mockClear();
};

// ============================================================================
// TESTS
// ============================================================================

describe("useRecipeFilters", () => {
  beforeEach(() => {
    // Set up mocks
    setWindowLocation("");
    window.history.pushState = mockPushState;
    window.addEventListener = mockAddEventListener;
    window.removeEventListener = mockRemoveEventListener;
    vi.clearAllMocks();
  });

  afterEach(() => {
    resetWindowMocks();
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // INITIALIZATION & URL STATE MANAGEMENT
  // ==========================================================================

  describe("Initialization & URL State Management", () => {
    it("should initialize with default filters when no URL params", () => {
      setWindowLocation("");

      const { result } = renderHook(() => useRecipeFilters());

      expect(result.current.filters).toEqual({
        sortBy: "createdAt",
        sortOrder: "desc",
        page: 1,
      });
    });

    it("should parse search query from URL", () => {
      setWindowLocation("?search=pasta");

      const { result } = renderHook(() => useRecipeFilters());

      expect(result.current.filters.search).toBe("pasta");
    });

    it("should parse tag IDs from URL", () => {
      const tagId1 = "123e4567-e89b-12d3-a456-426614174000";
      const tagId2 = "123e4567-e89b-12d3-a456-426614174001";
      setWindowLocation(`?tags=${tagId1},${tagId2}`);

      const { result } = renderHook(() => useRecipeFilters());

      expect(result.current.filters.tagIds).toEqual([tagId1, tagId2]);
    });

    it("should parse maxCalories from URL", () => {
      setWindowLocation("?maxCalories=500");

      const { result } = renderHook(() => useRecipeFilters());

      expect(result.current.filters.maxCalories).toBe(500);
    });

    it("should parse maxPrepTime from URL", () => {
      setWindowLocation("?maxPrepTime=30");

      const { result } = renderHook(() => useRecipeFilters());

      expect(result.current.filters.maxPrepTime).toBe(30);
    });

    it("should parse sortBy and sortOrder from URL", () => {
      setWindowLocation("?sortBy=title&sortOrder=asc");

      const { result } = renderHook(() => useRecipeFilters());

      expect(result.current.filters.sortBy).toBe("title");
      expect(result.current.filters.sortOrder).toBe("asc");
    });

    it("should parse page number from URL", () => {
      setWindowLocation("?page=3");

      const { result } = renderHook(() => useRecipeFilters());

      expect(result.current.filters.page).toBe(3);
    });

    it("should update URL when filters change", () => {
      const { result } = renderHook(() => useRecipeFilters());

      act(() => {
        result.current.setSearch("pasta");
      });

      expect(mockPushState).toHaveBeenCalledWith({}, "", expect.stringContaining("search=pasta"));
    });

    it("should handle invalid URL parameters gracefully", () => {
      setWindowLocation("?maxCalories=invalid&page=abc");

      const { result } = renderHook(() => useRecipeFilters());

      expect(result.current.filters.maxCalories).toBeUndefined();
      expect(result.current.filters.page).toBe(1); // Default value
    });

    it("should sanitize search query (trim whitespace)", () => {
      setWindowLocation("?search=  pasta  ");

      const { result } = renderHook(() => useRecipeFilters());

      expect(result.current.filters.search).toBe("pasta");
    });

    it("should filter out invalid tag IDs from URL", () => {
      const validId = "123e4567-e89b-12d3-a456-426614174000";
      setWindowLocation(`?tags=${validId},invalid-id,another-bad`);

      const { result } = renderHook(() => useRecipeFilters());

      expect(result.current.filters.tagIds).toEqual([validId]);
    });
  });

  // ==========================================================================
  // BROWSER NAVIGATION (POPSTATE)
  // ==========================================================================

  describe("Browser Navigation", () => {
    it("should listen to popstate events on mount", () => {
      renderHook(() => useRecipeFilters());

      expect(mockAddEventListener).toHaveBeenCalledWith("popstate", expect.any(Function));
    });

    it("should clean up popstate listener on unmount", () => {
      const { unmount } = renderHook(() => useRecipeFilters());

      unmount();

      expect(mockRemoveEventListener).toHaveBeenCalledWith("popstate", expect.any(Function));
    });

    it("should update filters when popstate event fires", () => {
      const { result } = renderHook(() => useRecipeFilters());

      // Capture the popstate handler
      const popstateHandler = mockAddEventListener.mock.calls.find((call) => call[0] === "popstate")?.[1];

      // Simulate browser back button - change URL
      setWindowLocation("?search=pasta&page=2");

      // Trigger popstate event
      act(() => {
        if (popstateHandler) {
          popstateHandler();
        }
      });

      expect(result.current.filters.search).toBe("pasta");
      expect(result.current.filters.page).toBe(2);
    });
  });

  // ==========================================================================
  // FILTER OPERATIONS
  // ==========================================================================

  describe("Filter Operations", () => {
    it("should update search filter and URL", () => {
      const { result } = renderHook(() => useRecipeFilters());

      act(() => {
        result.current.setSearch("pizza");
      });

      expect(result.current.filters.search).toBe("pizza");
      expect(mockPushState).toHaveBeenCalled();
    });

    it("should update tagIds filter and URL", () => {
      const tagId = "123e4567-e89b-12d3-a456-426614174000";
      const { result } = renderHook(() => useRecipeFilters());

      act(() => {
        result.current.setTagIds([tagId]);
      });

      expect(result.current.filters.tagIds).toEqual([tagId]);
      expect(mockPushState).toHaveBeenCalled();
    });

    it("should update maxCalories filter and URL", () => {
      const { result } = renderHook(() => useRecipeFilters());

      act(() => {
        result.current.setMaxCalories(600);
      });

      expect(result.current.filters.maxCalories).toBe(600);
      expect(mockPushState).toHaveBeenCalled();
    });

    it("should update maxPrepTime filter and URL", () => {
      const { result } = renderHook(() => useRecipeFilters());

      act(() => {
        result.current.setMaxPrepTime(45);
      });

      expect(result.current.filters.maxPrepTime).toBe(45);
      expect(mockPushState).toHaveBeenCalled();
    });

    it("should update sortBy and sortOrder together", () => {
      const { result } = renderHook(() => useRecipeFilters());

      act(() => {
        result.current.setSortBy("title", "asc");
      });

      expect(result.current.filters.sortBy).toBe("title");
      expect(result.current.filters.sortOrder).toBe("asc");
      expect(mockPushState).toHaveBeenCalled();
    });

    it("should update page number", () => {
      const { result } = renderHook(() => useRecipeFilters());

      act(() => {
        result.current.setPage(3);
      });

      expect(result.current.filters.page).toBe(3);
      expect(mockPushState).toHaveBeenCalled();
    });

    it("should reset page to 1 when search changes", () => {
      setWindowLocation("?page=5");
      const { result } = renderHook(() => useRecipeFilters());

      act(() => {
        result.current.setSearch("pasta");
      });

      expect(result.current.filters.page).toBe(1);
    });

    it("should reset page to 1 when tags change", () => {
      setWindowLocation("?page=5");
      const { result } = renderHook(() => useRecipeFilters());

      act(() => {
        result.current.setTagIds(["123e4567-e89b-12d3-a456-426614174000"]);
      });

      expect(result.current.filters.page).toBe(1);
    });

    it("should reset page to 1 when maxCalories changes", () => {
      setWindowLocation("?page=5");
      const { result } = renderHook(() => useRecipeFilters());

      act(() => {
        result.current.setMaxCalories(500);
      });

      expect(result.current.filters.page).toBe(1);
    });

    it("should reset page to 1 when maxPrepTime changes", () => {
      setWindowLocation("?page=5");
      const { result } = renderHook(() => useRecipeFilters());

      act(() => {
        result.current.setMaxPrepTime(30);
      });

      expect(result.current.filters.page).toBe(1);
    });

    it("should reset page to 1 when sort changes", () => {
      setWindowLocation("?page=5");
      const { result } = renderHook(() => useRecipeFilters());

      act(() => {
        result.current.setSortBy("title", "asc");
      });

      expect(result.current.filters.page).toBe(1);
    });
  });

  // ==========================================================================
  // CLEAR & REMOVE FILTERS
  // ==========================================================================

  describe("Clear & Remove Filters", () => {
    it("should clear all filters except sort", () => {
      setWindowLocation(
        "?search=pasta&tags=123e4567-e89b-12d3-a456-426614174000&maxCalories=500&maxPrepTime=30&sortBy=title&sortOrder=asc"
      );
      const { result } = renderHook(() => useRecipeFilters());

      act(() => {
        result.current.clearFilters();
      });

      expect(result.current.filters).toEqual({
        sortBy: "title",
        sortOrder: "asc",
        page: 1,
      });
    });

    it("should remove search filter", () => {
      setWindowLocation("?search=pasta");
      const { result } = renderHook(() => useRecipeFilters());

      act(() => {
        result.current.removeFilter("search");
      });

      expect(result.current.filters.search).toBeUndefined();
    });

    it("should remove maxCalories filter", () => {
      setWindowLocation("?maxCalories=500");
      const { result } = renderHook(() => useRecipeFilters());

      act(() => {
        result.current.removeFilter("maxCalories");
      });

      expect(result.current.filters.maxCalories).toBeUndefined();
    });

    it("should remove maxPrepTime filter", () => {
      setWindowLocation("?maxPrepTime=30");
      const { result } = renderHook(() => useRecipeFilters());

      act(() => {
        result.current.removeFilter("maxPrepTime");
      });

      expect(result.current.filters.maxPrepTime).toBeUndefined();
    });

    it("should remove specific tag from tagIds", () => {
      const tagId1 = "123e4567-e89b-12d3-a456-426614174000";
      const tagId2 = "123e4567-e89b-12d3-a456-426614174001";
      setWindowLocation(`?tags=${tagId1},${tagId2}`);
      const { result } = renderHook(() => useRecipeFilters());

      act(() => {
        result.current.removeFilter("tagId", tagId1);
      });

      expect(result.current.filters.tagIds).toEqual([tagId2]);
    });

    it("should remove tagIds entirely when last tag is removed", () => {
      const tagId = "123e4567-e89b-12d3-a456-426614174000";
      setWindowLocation(`?tags=${tagId}`);
      const { result } = renderHook(() => useRecipeFilters());

      act(() => {
        result.current.removeFilter("tagId", tagId);
      });

      expect(result.current.filters.tagIds).toBeUndefined();
    });

    it("should reset page to 1 when filter is removed", () => {
      setWindowLocation("?search=pasta&page=5");
      const { result } = renderHook(() => useRecipeFilters());

      act(() => {
        result.current.removeFilter("search");
      });

      expect(result.current.filters.page).toBe(1);
    });
  });

  // ==========================================================================
  // ACTIVE FILTER COUNTING
  // ==========================================================================

  describe("Active Filter Counting", () => {
    it("should return 0 when no filters active", () => {
      const { result } = renderHook(() => useRecipeFilters());

      expect(result.current.activeFilterCount).toBe(0);
    });

    it("should count search query as 1 filter", () => {
      setWindowLocation("?search=pasta");
      const { result } = renderHook(() => useRecipeFilters());

      expect(result.current.activeFilterCount).toBe(1);
    });

    it("should count each tag as 1 filter", () => {
      const tagId1 = "123e4567-e89b-12d3-a456-426614174000";
      const tagId2 = "123e4567-e89b-12d3-a456-426614174001";
      setWindowLocation(`?tags=${tagId1},${tagId2}`);
      const { result } = renderHook(() => useRecipeFilters());

      expect(result.current.activeFilterCount).toBe(2);
    });

    it("should count maxCalories as 1 filter when set", () => {
      setWindowLocation("?maxCalories=500");
      const { result } = renderHook(() => useRecipeFilters());

      expect(result.current.activeFilterCount).toBe(1);
    });

    it("should count maxPrepTime as 1 filter when set", () => {
      setWindowLocation("?maxPrepTime=30");
      const { result } = renderHook(() => useRecipeFilters());

      expect(result.current.activeFilterCount).toBe(1);
    });

    it("should not count sortBy/sortOrder as active filters", () => {
      setWindowLocation("?sortBy=title&sortOrder=asc");
      const { result } = renderHook(() => useRecipeFilters());

      expect(result.current.activeFilterCount).toBe(0);
    });

    it("should not count page as active filter", () => {
      setWindowLocation("?page=3");
      const { result } = renderHook(() => useRecipeFilters());

      expect(result.current.activeFilterCount).toBe(0);
    });

    it("should count multiple active filters correctly", () => {
      const tagId = "123e4567-e89b-12d3-a456-426614174000";
      setWindowLocation(`?search=pasta&tags=${tagId}&maxCalories=500&maxPrepTime=30`);
      const { result } = renderHook(() => useRecipeFilters());

      // search (1) + tags (1) + maxCalories (1) + maxPrepTime (1) = 4
      expect(result.current.activeFilterCount).toBe(4);
    });
  });

  // ==========================================================================
  // MOBILE PANEL STATE
  // ==========================================================================

  describe("Mobile Panel State", () => {
    it("should initialize isFilterPanelOpen as false", () => {
      const { result } = renderHook(() => useRecipeFilters());

      expect(result.current.isFilterPanelOpen).toBe(false);
    });

    it("should toggle filter panel state", () => {
      const { result } = renderHook(() => useRecipeFilters());

      act(() => {
        result.current.toggleFilterPanel();
      });

      expect(result.current.isFilterPanelOpen).toBe(true);

      act(() => {
        result.current.toggleFilterPanel();
      });

      expect(result.current.isFilterPanelOpen).toBe(false);
    });

    it("should toggle panel multiple times correctly", () => {
      const { result } = renderHook(() => useRecipeFilters());

      // Toggle 3 times
      act(() => {
        result.current.toggleFilterPanel();
        result.current.toggleFilterPanel();
        result.current.toggleFilterPanel();
      });

      expect(result.current.isFilterPanelOpen).toBe(true);
    });
  });

  // ==========================================================================
  // SPECIAL BEHAVIORS
  // ==========================================================================

  describe("Special Behaviors", () => {
    it("should handle empty string search as undefined", () => {
      const { result } = renderHook(() => useRecipeFilters());

      act(() => {
        result.current.setSearch("");
      });

      expect(result.current.filters.search).toBeUndefined();
    });

    it("should handle whitespace-only search as undefined", () => {
      const { result } = renderHook(() => useRecipeFilters());

      act(() => {
        result.current.setSearch("   ");
      });

      expect(result.current.filters.search).toBeUndefined();
    });

    it("should trim search query before setting", () => {
      const { result } = renderHook(() => useRecipeFilters());

      act(() => {
        result.current.setSearch("  pasta  ");
      });

      expect(result.current.filters.search).toBe("pasta");
    });

    it("should handle empty tagIds array as undefined", () => {
      const { result } = renderHook(() => useRecipeFilters());

      act(() => {
        result.current.setTagIds([]);
      });

      expect(result.current.filters.tagIds).toBeUndefined();
    });

    it("should clamp negative page numbers to 1", () => {
      const { result } = renderHook(() => useRecipeFilters());

      act(() => {
        result.current.setPage(-5);
      });

      expect(result.current.filters.page).toBe(1);
    });

    it("should clamp zero page number to 1", () => {
      const { result } = renderHook(() => useRecipeFilters());

      act(() => {
        result.current.setPage(0);
      });

      expect(result.current.filters.page).toBe(1);
    });
  });
});
