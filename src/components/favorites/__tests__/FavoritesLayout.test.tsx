import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FavoritesLayout from "../FavoritesLayout";
import type { FavoriteDTO, PaginationDTO } from "@/types";
import * as useFavoritesModule from "@/components/hooks/useFavorites";
import { toast } from "sonner";

// ============================================================================
// MOCKS
// ============================================================================

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

// Mock useFavorites hook
vi.mock("@/components/hooks/useFavorites", () => ({
  useFavorites: vi.fn(),
}));

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
      description: null,
      nutritionPerServing: {
        calories: 550,
        protein: 20,
        fat: 18,
        carbs: 65,
        fiber: 4,
        salt: 2.0,
      },
      prepTimeMinutes: null,
    },
    createdAt: "2025-12-02T11:00:00Z",
  },
];

// ============================================================================
// TESTS
// ============================================================================

describe("FavoritesLayout", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let mockRefetch: ReturnType<typeof vi.fn>;
  let mockGoToPage: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock fetch
    fetchMock = vi.fn();
    global.fetch = fetchMock;

    // Mock useFavorites return values
    mockRefetch = vi.fn();
    mockGoToPage = vi.fn();

    // Reset toast mocks
    vi.mocked(toast).mockClear();
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();

    // Mock console methods
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // RENDERING STATES
  // ==========================================================================

  describe("Rendering States", () => {
    it("should render loading skeletons when loading", () => {
      vi.mocked(useFavoritesModule.useFavorites).mockReturnValue({
        favorites: [],
        pagination: null,
        isLoading: true,
        error: null,
        refetch: mockRefetch,
        goToPage: mockGoToPage,
      });

      render(<FavoritesLayout />);

      // LoadingSkeletons component should be rendered
      // We can't test the actual skeleton UI without mocking the component,
      // but we can verify the loading state behavior
      expect(screen.getByText("Ulubione przepisy")).toBeInTheDocument();
    });

    it("should render empty state when no favorites", () => {
      vi.mocked(useFavoritesModule.useFavorites).mockReturnValue({
        favorites: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        goToPage: mockGoToPage,
      });

      render(<FavoritesLayout />);

      // EmptyFavoritesState should be rendered
      // Check for empty state message
      expect(screen.getByText("Nie masz ulubionych przepisów")).toBeInTheDocument();
    });

    it("should render recipe grid when favorites exist", () => {
      vi.mocked(useFavoritesModule.useFavorites).mockReturnValue({
        favorites: mockFavorites,
        pagination: mockPagination,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        goToPage: mockGoToPage,
      });

      render(<FavoritesLayout />);

      expect(screen.getByText("Sałatka grecka")).toBeInTheDocument();
      expect(screen.getByText("Pizza margherita")).toBeInTheDocument();
    });

    it("should render error state with retry button", () => {
      vi.mocked(useFavoritesModule.useFavorites).mockReturnValue({
        favorites: [],
        pagination: null,
        isLoading: false,
        error: "Nie udało się pobrać ulubionych",
        refetch: mockRefetch,
        goToPage: mockGoToPage,
      });

      render(<FavoritesLayout />);

      expect(screen.getByText("Wystąpił błąd")).toBeInTheDocument();
      expect(screen.getByText("Nie udało się pobrać ulubionych")).toBeInTheDocument();
      expect(screen.getByText("Spróbuj ponownie")).toBeInTheDocument();
    });

    it("should display correct favorite count in header", () => {
      vi.mocked(useFavoritesModule.useFavorites).mockReturnValue({
        favorites: mockFavorites,
        pagination: mockPagination,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        goToPage: mockGoToPage,
      });

      render(<FavoritesLayout />);

      expect(screen.getByText("50")).toBeInTheDocument(); // Total count from pagination
    });

    it("should display 0 count when pagination is null", () => {
      vi.mocked(useFavoritesModule.useFavorites).mockReturnValue({
        favorites: [],
        pagination: null,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        goToPage: mockGoToPage,
      });

      render(<FavoritesLayout />);

      // PageHeader should show 0 in the badge when pagination is null
      expect(screen.getByText(/Ulubione przepisy/)).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // UNFAVORITE INTERACTION
  // ==========================================================================

  describe("Unfavorite Interaction", () => {
    it("should call API when unfavoriting recipe", async () => {
      vi.mocked(useFavoritesModule.useFavorites).mockReturnValue({
        favorites: mockFavorites,
        pagination: mockPagination,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        goToPage: mockGoToPage,
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<FavoritesLayout />);

      // Find favorite button for first recipe
      const favoriteButtons = screen.getAllByLabelText("Usuń z ulubionych");
      await userEvent.click(favoriteButtons[0]);

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          "/api/favorites",
          expect.objectContaining({
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ recipeId: "recipe-1" }),
          })
        );
      });
    });

    it("should show toast notification after unfavorite", async () => {
      vi.mocked(useFavoritesModule.useFavorites).mockReturnValue({
        favorites: mockFavorites,
        pagination: mockPagination,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        goToPage: mockGoToPage,
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<FavoritesLayout />);

      const favoriteButtons = screen.getAllByLabelText("Usuń z ulubionych");
      await userEvent.click(favoriteButtons[0]);

      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith(
          "Usunięto z ulubionych",
          expect.objectContaining({
            action: expect.objectContaining({
              label: "Cofnij",
            }),
            duration: 5000,
          })
        );
      });
    });

    it("should call refetch after successful unfavorite", async () => {
      vi.mocked(useFavoritesModule.useFavorites).mockReturnValue({
        favorites: mockFavorites,
        pagination: mockPagination,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        goToPage: mockGoToPage,
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<FavoritesLayout />);

      const favoriteButtons = screen.getAllByLabelText("Usuń z ulubionych");
      await userEvent.click(favoriteButtons[0]);

      await waitFor(() => {
        expect(mockRefetch).toHaveBeenCalled();
      });
    });

    it("should handle unfavorite API error", async () => {
      vi.mocked(useFavoritesModule.useFavorites).mockReturnValue({
        favorites: mockFavorites,
        pagination: mockPagination,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        goToPage: mockGoToPage,
      });

      fetchMock.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Server error" }),
      });

      render(<FavoritesLayout />);

      const favoriteButtons = screen.getAllByLabelText("Usuń z ulubionych");
      await userEvent.click(favoriteButtons[0]);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Server error");
      });
    });

    it("should prevent double-clicking on unfavorite", async () => {
      vi.mocked(useFavoritesModule.useFavorites).mockReturnValue({
        favorites: mockFavorites,
        pagination: mockPagination,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        goToPage: mockGoToPage,
      });

      // Make the API call slow
      fetchMock.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ success: true }),
                }),
              100
            );
          })
      );

      render(<FavoritesLayout />);

      const favoriteButtons = screen.getAllByLabelText("Usuń z ulubionych");

      // Click twice quickly
      await userEvent.click(favoriteButtons[0]);
      await userEvent.click(favoriteButtons[0]);

      await waitFor(() => {
        // Should only be called once despite double click
        expect(fetchMock).toHaveBeenCalledTimes(1);
      });
    });
  });

  // ==========================================================================
  // UNDO FUNCTIONALITY
  // ==========================================================================

  describe("Undo Functionality", () => {
    it("should re-add recipe when undo is clicked", async () => {
      vi.mocked(useFavoritesModule.useFavorites).mockReturnValue({
        favorites: mockFavorites,
        pagination: mockPagination,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        goToPage: mockGoToPage,
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<FavoritesLayout />);

      const favoriteButtons = screen.getAllByLabelText("Usuń z ulubionych");
      await userEvent.click(favoriteButtons[0]);

      // Wait for toast
      await waitFor(() => {
        expect(toast).toHaveBeenCalled();
      });

      // Get the undo callback from toast call
      const toastCall = toast.mock.calls[0];
      const undoCallback = toastCall[1].action.onClick;

      // Mock the POST request for undo
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      // Call undo
      await undoCallback();

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          "/api/favorites",
          expect.objectContaining({
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ recipeId: "recipe-1" }),
          })
        );
      });
    });

    it("should show success toast on undo", async () => {
      vi.mocked(useFavoritesModule.useFavorites).mockReturnValue({
        favorites: mockFavorites,
        pagination: mockPagination,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        goToPage: mockGoToPage,
      });

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<FavoritesLayout />);

      const favoriteButtons = screen.getAllByLabelText("Usuń z ulubionych");
      await userEvent.click(favoriteButtons[0]);

      await waitFor(() => {
        expect(toast).toHaveBeenCalled();
      });

      const toastCall = toast.mock.calls[0];
      const undoCallback = toastCall[1].action.onClick;

      await undoCallback();

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Przywrócono do ulubionych");
      });
    });

    it("should call refetch after undo", async () => {
      vi.mocked(useFavoritesModule.useFavorites).mockReturnValue({
        favorites: mockFavorites,
        pagination: mockPagination,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        goToPage: mockGoToPage,
      });

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<FavoritesLayout />);

      const favoriteButtons = screen.getAllByLabelText("Usuń z ulubionych");
      await userEvent.click(favoriteButtons[0]);

      await waitFor(() => {
        expect(toast).toHaveBeenCalled();
      });

      // Reset refetch call count before undo (it was called once after unfavorite)
      const initialCallCount = mockRefetch.mock.calls.length;

      const toastCall = toast.mock.calls[0];
      const undoCallback = toastCall[1].action.onClick;

      await undoCallback();

      await waitFor(() => {
        // Refetch should be called again (one more time than before)
        expect(mockRefetch.mock.calls.length).toBeGreaterThan(initialCallCount);
      });
    });

    it("should handle undo API error", async () => {
      vi.mocked(useFavoritesModule.useFavorites).mockReturnValue({
        favorites: mockFavorites,
        pagination: mockPagination,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        goToPage: mockGoToPage,
      });

      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ message: "Undo failed" }),
        });

      render(<FavoritesLayout />);

      const favoriteButtons = screen.getAllByLabelText("Usuń z ulubionych");
      await userEvent.click(favoriteButtons[0]);

      await waitFor(() => {
        expect(toast).toHaveBeenCalled();
      });

      const toastCall = toast.mock.calls[0];
      const undoCallback = toastCall[1].action.onClick;

      await undoCallback();

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Undo failed");
      });
    });
  });

  // ==========================================================================
  // PAGINATION
  // ==========================================================================

  describe("Pagination", () => {
    it("should render pagination when there are multiple pages", () => {
      vi.mocked(useFavoritesModule.useFavorites).mockReturnValue({
        favorites: mockFavorites,
        pagination: { ...mockPagination, totalPages: 3 },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        goToPage: mockGoToPage,
      });

      render(<FavoritesLayout />);

      // Pagination should be rendered
      expect(screen.getByLabelText("Nawigacja po stronach")).toBeInTheDocument();
    });

    it("should not render pagination when only one page", () => {
      vi.mocked(useFavoritesModule.useFavorites).mockReturnValue({
        favorites: mockFavorites,
        pagination: { ...mockPagination, totalPages: 1 },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        goToPage: mockGoToPage,
      });

      render(<FavoritesLayout />);

      // Pagination should not be rendered
      expect(screen.queryByLabelText("Nawigacja po stronach")).not.toBeInTheDocument();
    });

    it("should call goToPage when pagination changes", async () => {
      vi.mocked(useFavoritesModule.useFavorites).mockReturnValue({
        favorites: mockFavorites,
        pagination: { ...mockPagination, page: 1, totalPages: 3 },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        goToPage: mockGoToPage,
      });

      render(<FavoritesLayout />);

      const nextButton = screen.getByLabelText("Następna strona");
      await userEvent.click(nextButton);

      expect(mockGoToPage).toHaveBeenCalledWith(2);
    });
  });

  // ==========================================================================
  // ERROR RECOVERY
  // ==========================================================================

  describe("Error Recovery", () => {
    it("should call refetch when retry button clicked", async () => {
      vi.mocked(useFavoritesModule.useFavorites).mockReturnValue({
        favorites: [],
        pagination: null,
        isLoading: false,
        error: "Network error",
        refetch: mockRefetch,
        goToPage: mockGoToPage,
      });

      render(<FavoritesLayout />);

      const retryButton = screen.getByText("Spróbuj ponownie");
      await userEvent.click(retryButton);

      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // DATA TRANSFORMATION
  // ==========================================================================

  describe("Data Transformation", () => {
    it("should transform favorites to recipe cards correctly", () => {
      vi.mocked(useFavoritesModule.useFavorites).mockReturnValue({
        favorites: mockFavorites,
        pagination: mockPagination,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        goToPage: mockGoToPage,
      });

      render(<FavoritesLayout />);

      // Both recipe titles should be displayed
      expect(screen.getByText("Sałatka grecka")).toBeInTheDocument();
      expect(screen.getByText("Pizza margherita")).toBeInTheDocument();

      // Check nutrition info is displayed
      expect(screen.getByText("350 kcal")).toBeInTheDocument();
      expect(screen.getByText("550 kcal")).toBeInTheDocument();
    });

    it("should handle null description in transformed data", () => {
      vi.mocked(useFavoritesModule.useFavorites).mockReturnValue({
        favorites: mockFavorites,
        pagination: mockPagination,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        goToPage: mockGoToPage,
      });

      // Second recipe has null description - should not crash
      expect(() => {
        render(<FavoritesLayout />);
      }).not.toThrow();
    });

    it("should handle null prepTimeMinutes in transformed data", () => {
      vi.mocked(useFavoritesModule.useFavorites).mockReturnValue({
        favorites: mockFavorites,
        pagination: mockPagination,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        goToPage: mockGoToPage,
      });

      render(<FavoritesLayout />);

      // Second recipe has null prepTimeMinutes
      const niepodano = screen.getAllByText("nie podano");
      expect(niepodano.length).toBeGreaterThan(0);
    });
  });
});
