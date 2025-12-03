import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useFavorites } from "./useFavorites";
import type { FavoriteDTO, PaginationDTO } from "@/types";

// ============================================================================
// TEST DATA
// ============================================================================

const mockPagination: PaginationDTO = {
  page: 1,
  limit: 20,
  total: 50,
  totalPages: 3,
};

const mockFavorites: FavoriteDTO[] = [
  {
    recipeId: "recipe-1",
    recipe: {
      id: "recipe-1",
      title: "Sałatka grecka",
      description: "Pyszna sałatka",
      nutritionPerServing: {
        calories: 350,
        protein: 25,
        fat: 12,
        carbs: 40,
        fiber: 8,
        salt: 1.5,
      },
      prepTimeMinutes: 15,
    },
    createdAt: "2025-12-02T10:00:00Z",
  },
  {
    recipeId: "recipe-2",
    recipe: {
      id: "recipe-2",
      title: "Pizza margherita",
      description: "Klasyczna pizza",
      nutritionPerServing: {
        calories: 550,
        protein: 20,
        fat: 18,
        carbs: 65,
        fiber: 4,
        salt: 2.0,
      },
      prepTimeMinutes: 30,
    },
    createdAt: "2025-12-02T11:00:00Z",
  },
];

const mockApiResponse = {
  favorites: mockFavorites,
  pagination: mockPagination,
};

// ============================================================================
// SETUP & TEARDOWN
// ============================================================================

describe("useFavorites", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Mock fetch
    fetchMock = vi.fn();
    global.fetch = fetchMock;

    // Mock window.location
    delete (window as any).location;
    window.location = {
      href: "http://localhost:3000/favorites",
      search: "",
    } as any;

    // Mock window.history
    window.history.replaceState = vi.fn();

    // Mock console methods to avoid noise in tests
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ========================================
  // INITIAL STATE
  // ========================================

  it("should initialize with empty favorites and loading state", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    });

    const { result } = renderHook(() => useFavorites());

    // Initial state
    expect(result.current.isLoading).toBe(true);
    expect(result.current.favorites).toEqual([]);
    expect(result.current.pagination).toBeNull();
    expect(result.current.error).toBeNull();

    // Wait for fetch to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it("should initialize with page from URL query parameter", async () => {
    window.location.search = "?page=2";

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    });

    const { result } = renderHook(() => useFavorites());

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/favorites?page=2&limit=20", expect.any(Object));
    });
  });

  it("should default to page 1 if no query parameter exists", async () => {
    window.location.search = "";

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    });

    renderHook(() => useFavorites());

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/favorites?page=1&limit=20", expect.any(Object));
    });
  });

  it("should default to page 1 if query parameter is invalid", async () => {
    window.location.search = "?page=invalid";

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    });

    renderHook(() => useFavorites());

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/favorites?page=1&limit=20", expect.any(Object));
    });
  });

  it("should default to page 1 if query parameter is negative", async () => {
    window.location.search = "?page=-5";

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    });

    renderHook(() => useFavorites());

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/favorites?page=1&limit=20", expect.any(Object));
    });
  });

  // ========================================
  // DATA FETCHING
  // ========================================

  it("should fetch favorites on mount", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    });

    const { result } = renderHook(() => useFavorites());

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/favorites?page=1&limit=20",
        expect.objectContaining({
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })
      );
    });
  });

  it("should handle successful API response", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    });

    const { result } = renderHook(() => useFavorites());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.favorites).toEqual(mockFavorites);
    expect(result.current.pagination).toEqual(mockPagination);
    expect(result.current.error).toBeNull();
  });

  it("should parse pagination data correctly", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    });

    const { result } = renderHook(() => useFavorites());

    await waitFor(() => {
      expect(result.current.pagination).not.toBeNull();
    });

    expect(result.current.pagination?.page).toBe(1);
    expect(result.current.pagination?.limit).toBe(20);
    expect(result.current.pagination?.total).toBe(50);
    expect(result.current.pagination?.totalPages).toBe(3);
  });

  it("should update URL when fetching data", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    });

    renderHook(() => useFavorites());

    await waitFor(() => {
      expect(window.history.replaceState).toHaveBeenCalledWith({}, "", expect.stringContaining("page=1"));
    });
  });

  // ========================================
  // ERROR HANDLING
  // ========================================

  it("should set error state when API fails", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "Nie udało się pobrać ulubionych" }),
    });

    const { result } = renderHook(() => useFavorites());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe("Nie udało się pobrać ulubionych");
    expect(result.current.favorites).toEqual([]);
  });

  it("should handle network errors gracefully", async () => {
    fetchMock.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useFavorites());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe("Network error");
  });

  it("should handle malformed API responses", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => {
        throw new Error("Invalid JSON");
      },
    });

    const { result } = renderHook(() => useFavorites());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe("Nie udało się pobrać ulubionych przepisów");
  });

  it("should use default error message when error message is missing", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    });

    const { result } = renderHook(() => useFavorites());

    await waitFor(() => {
      expect(result.current.error).toBe("Nie udało się pobrać ulubionych przepisów");
    });
  });

  // ========================================
  // REFETCH FUNCTIONALITY
  // ========================================

  it("should refetch data when refetch() is called", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    });

    const { result } = renderHook(() => useFavorites());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Clear previous calls
    fetchMock.mockClear();

    // Call refetch
    await result.current.refetch();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("should clear previous error state on refetch", async () => {
    // First call fails
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "Error" }),
    });

    const { result } = renderHook(() => useFavorites());

    await waitFor(() => {
      expect(result.current.error).toBe("Error");
    });

    // Second call succeeds
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    });

    await result.current.refetch();

    await waitFor(() => {
      expect(result.current.error).toBeNull();
    });
  });

  // ========================================
  // LOADING STATES
  // ========================================

  it("should set loading to false after successful fetch", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    });

    const { result } = renderHook(() => useFavorites());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it("should set loading to false after error", async () => {
    fetchMock.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useFavorites());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  // ========================================
  // PAGE NAVIGATION
  // ========================================

  it("should fetch new data when goToPage is called", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    });

    const { result } = renderHook(() => useFavorites());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    fetchMock.mockClear();

    // Go to page 2
    result.current.goToPage(2);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/favorites?page=2&limit=20", expect.any(Object));
    });
  });

  it("should validate page number (minimum 1)", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    });

    const { result } = renderHook(() => useFavorites());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    fetchMock.mockClear();

    // Try to go to page 0
    result.current.goToPage(0);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/favorites?page=1&limit=20", expect.any(Object));
    });
  });

  it("should validate page number (maximum totalPages)", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    });

    const { result } = renderHook(() => useFavorites());

    await waitFor(() => {
      expect(result.current.pagination).not.toBeNull();
    });

    fetchMock.mockClear();

    // Try to go to page 10 (max is 3)
    result.current.goToPage(10);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/favorites?page=3&limit=20", expect.any(Object));
    });
  });

  it("should update URL when page changes", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    });

    const { result } = renderHook(() => useFavorites());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const replaceStateMock = vi.fn();
    window.history.replaceState = replaceStateMock;

    result.current.goToPage(2);

    await waitFor(() => {
      expect(replaceStateMock).toHaveBeenCalledWith({}, "", expect.stringContaining("page=2"));
    });
  });

  // ========================================
  // BROWSER NAVIGATION
  // ========================================

  it("should handle browser back/forward navigation", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    });

    renderHook(() => useFavorites());

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    fetchMock.mockClear();

    // Simulate browser back button
    window.location.search = "?page=2";
    window.dispatchEvent(new PopStateEvent("popstate"));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/favorites?page=2&limit=20", expect.any(Object));
    });
  });
});
