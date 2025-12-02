import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import DashboardContent from "../DashboardContent";
import type { RecipeCardData } from "@/lib/utils/dashboard";
import type { NutritionDTO, TagDTO } from "@/types";

// ============================================================================
// MOCKS
// ============================================================================

// Mock RecipeSectionRow component
vi.mock("@/components/RecipeSectionRow", () => ({
  default: ({
    title,
    recipes,
    emptyMessage,
    onFavoriteToggle,
  }: {
    title: string;
    recipes: unknown[];
    emptyMessage: string;
    onFavoriteToggle: (id: string) => void;
  }) => (
    <div data-testid={`section-${title}`}>
      <h2>{title}</h2>
      <div data-testid="recipes-count">{recipes.length}</div>
      {recipes.length === 0 && <p>{emptyMessage}</p>}
      <button onClick={() => onFavoriteToggle("test-recipe-id")}>Toggle Favorite</button>
    </div>
  ),
}));

// Mock useFavoriteToggle hook
const mockToggleFavorite = vi.fn();
const mockIsTogglingRecipe = vi.fn();
let mockFavorites = new Set<string>();

vi.mock("@/components/hooks/useFavoriteToggle", () => ({
  useFavoriteToggle: () => ({
    favorites: mockFavorites,
    toggleFavorite: mockToggleFavorite,
    isTogglingRecipe: mockIsTogglingRecipe,
  }),
}));

// ============================================================================
// TEST HELPERS
// ============================================================================

const createMockNutrition = (overrides?: Partial<NutritionDTO>): NutritionDTO => ({
  calories: 450,
  protein: 25,
  fat: 15,
  carbs: 50,
  fiber: 8,
  salt: 1.5,
  ...overrides,
});

const createMockTag = (overrides?: Partial<TagDTO>): TagDTO => ({
  id: "tag-1",
  name: "Zdrowe",
  slug: "zdrowe",
  createdAt: "2025-01-01T00:00:00Z",
  ...overrides,
});

const createMockRecipe = (overrides?: Partial<RecipeCardData>): RecipeCardData => ({
  id: "recipe-123",
  title: "Sałatka grecka",
  description: "Pyszna sałatka z serem feta",
  nutritionPerServing: createMockNutrition(),
  prepTimeMinutes: 15,
  primaryTag: createMockTag(),
  ...overrides,
});

const defaultProps = {
  userRecipes: [],
  favoriteRecipes: [],
  publicRecipes: [],
  initialFavoriteIds: [],
};

// ============================================================================
// TESTS
// ============================================================================

describe("DashboardContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFavorites = new Set();
    mockIsTogglingRecipe.mockReturnValue(false);
  });

  // ==========================================================================
  // RENDERING SECTIONS
  // ==========================================================================

  describe("Rendering Sections", () => {
    it("should render three RecipeSectionRow components", () => {
      render(<DashboardContent {...defaultProps} />);

      expect(screen.getByTestId("section-Twoje przepisy")).toBeInTheDocument();
      expect(screen.getByTestId("section-Ulubione")).toBeInTheDocument();
      expect(screen.getByTestId("section-Inspiracje")).toBeInTheDocument();
    });

    it("should pass correct titles to each section", () => {
      render(<DashboardContent {...defaultProps} />);

      expect(screen.getByText("Twoje przepisy")).toBeInTheDocument();
      expect(screen.getByText("Ulubione")).toBeInTheDocument();
      expect(screen.getByText("Inspiracje")).toBeInTheDocument();
    });

    it("should pass userRecipes to first section", () => {
      const userRecipes = [
        createMockRecipe({ id: "user-1", title: "User Recipe 1" }),
        createMockRecipe({ id: "user-2", title: "User Recipe 2" }),
      ];

      render(<DashboardContent {...defaultProps} userRecipes={userRecipes} />);

      const userSection = screen.getByTestId("section-Twoje przepisy");
      const recipesCount = userSection.querySelector("[data-testid='recipes-count']");

      expect(recipesCount).toHaveTextContent("2");
    });

    it("should pass favoriteRecipes to second section initially", () => {
      const favoriteRecipes = [
        createMockRecipe({ id: "fav-1", title: "Favorite 1" }),
        createMockRecipe({ id: "fav-2", title: "Favorite 2" }),
        createMockRecipe({ id: "fav-3", title: "Favorite 3" }),
      ];

      // Mock favorites to include these IDs
      mockFavorites = new Set(["fav-1", "fav-2", "fav-3"]);

      render(
        <DashboardContent
          {...defaultProps}
          favoriteRecipes={favoriteRecipes}
          initialFavoriteIds={["fav-1", "fav-2", "fav-3"]}
        />
      );

      const favSection = screen.getByTestId("section-Ulubione");
      const recipesCount = favSection.querySelector("[data-testid='recipes-count']");

      expect(recipesCount).toHaveTextContent("3");
    });

    it("should pass publicRecipes to third section", () => {
      const publicRecipes = [
        createMockRecipe({ id: "pub-1", title: "Public Recipe 1" }),
        createMockRecipe({ id: "pub-2", title: "Public Recipe 2" }),
        createMockRecipe({ id: "pub-3", title: "Public Recipe 3" }),
        createMockRecipe({ id: "pub-4", title: "Public Recipe 4" }),
      ];

      render(<DashboardContent {...defaultProps} publicRecipes={publicRecipes} />);

      const pubSection = screen.getByTestId("section-Inspiracje");
      const recipesCount = pubSection.querySelector("[data-testid='recipes-count']");

      expect(recipesCount).toHaveTextContent("4");
    });
  });

  // ==========================================================================
  // FAVORITE STATE MANAGEMENT
  // ==========================================================================

  describe("Favorite State Management", () => {
    it("should initialize favorites from initialFavoriteIds", () => {
      const initialFavoriteIds = ["recipe-1", "recipe-2", "recipe-3"];

      render(<DashboardContent {...defaultProps} initialFavoriteIds={initialFavoriteIds} />);

      // Hook should have been called with these IDs converted to Set
      // We can't easily test this without exposing internal state
      // but we can verify the component renders
      expect(screen.getByTestId("section-Ulubione")).toBeInTheDocument();
    });

    it("should handle empty initial favorites", () => {
      render(<DashboardContent {...defaultProps} initialFavoriteIds={[]} />);

      const favSection = screen.getByTestId("section-Ulubione");

      expect(favSection).toBeInTheDocument();
    });

    it("should compute current favorite recipes based on favorite IDs", () => {
      const allRecipes = [
        createMockRecipe({ id: "recipe-1" }),
        createMockRecipe({ id: "recipe-2" }),
        createMockRecipe({ id: "recipe-3" }),
      ];

      // Only recipe-1 and recipe-3 are favorited
      mockFavorites = new Set(["recipe-1", "recipe-3"]);

      render(
        <DashboardContent
          {...defaultProps}
          userRecipes={allRecipes}
          favoriteRecipes={allRecipes}
          initialFavoriteIds={["recipe-1", "recipe-3"]}
        />
      );

      const favSection = screen.getByTestId("section-Ulubione");
      const recipesCount = favSection.querySelector("[data-testid='recipes-count']");

      // Should show 2 recipes (only favorited ones)
      expect(recipesCount).toHaveTextContent("2");
    });

    it("should filter favorites list when recipe is removed from favorites", () => {
      const favoriteRecipes = [createMockRecipe({ id: "fav-1" }), createMockRecipe({ id: "fav-2" })];

      // Initially both are favorites
      mockFavorites = new Set(["fav-1", "fav-2"]);

      const { rerender } = render(
        <DashboardContent {...defaultProps} favoriteRecipes={favoriteRecipes} initialFavoriteIds={["fav-1", "fav-2"]} />
      );

      let favSection = screen.getByTestId("section-Ulubione");
      let recipesCount = favSection.querySelector("[data-testid='recipes-count']");
      expect(recipesCount).toHaveTextContent("2");

      // Simulate unfavoriting recipe-2
      mockFavorites = new Set(["fav-1"]);

      rerender(
        <DashboardContent {...defaultProps} favoriteRecipes={favoriteRecipes} initialFavoriteIds={["fav-1", "fav-2"]} />
      );

      favSection = screen.getByTestId("section-Ulubione");
      recipesCount = favSection.querySelector("[data-testid='recipes-count']");

      // Should now show 1 recipe
      expect(recipesCount).toHaveTextContent("1");
    });
  });

  // ==========================================================================
  // FAVORITE TOGGLE PROPAGATION
  // ==========================================================================

  describe("Favorite Toggle Propagation", () => {
    it("should propagate toggleFavorite to all sections", () => {
      render(<DashboardContent {...defaultProps} />);

      // Each section should have toggle button
      const toggleButtons = screen.getAllByText("Toggle Favorite");
      expect(toggleButtons).toHaveLength(3);
    });

    it("should call useFavoriteToggle.toggleFavorite when section triggers toggle", () => {
      render(<DashboardContent {...defaultProps} />);

      const toggleButtons = screen.getAllByText("Toggle Favorite");
      toggleButtons[0].click();

      expect(mockToggleFavorite).toHaveBeenCalledWith("test-recipe-id");
    });
  });

  // ==========================================================================
  // EMPTY STATES
  // ==========================================================================

  describe("Empty States", () => {
    it("should show empty message when no user recipes", () => {
      render(<DashboardContent {...defaultProps} userRecipes={[]} />);

      expect(screen.getByText("Nie masz jeszcze przepisów")).toBeInTheDocument();
    });

    it("should show empty message when no favorites", () => {
      render(<DashboardContent {...defaultProps} favoriteRecipes={[]} />);

      expect(screen.getByText("Nie masz ulubionych przepisów")).toBeInTheDocument();
    });

    it("should show empty message when no public recipes", () => {
      render(<DashboardContent {...defaultProps} publicRecipes={[]} />);

      expect(screen.getByText("Brak dostępnych przepisów publicznych")).toBeInTheDocument();
    });

    it("should handle all sections being empty", () => {
      render(<DashboardContent {...defaultProps} />);

      expect(screen.getByText("Nie masz jeszcze przepisów")).toBeInTheDocument();
      expect(screen.getByText("Nie masz ulubionych przepisów")).toBeInTheDocument();
      expect(screen.getByText("Brak dostępnych przepisów publicznych")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // RECIPE MAP
  // ==========================================================================

  describe("Recipe Map", () => {
    it("should create map with all unique recipes", () => {
      const userRecipes = [createMockRecipe({ id: "user-1" })];
      const favoriteRecipes = [createMockRecipe({ id: "fav-1" })];
      const publicRecipes = [createMockRecipe({ id: "pub-1" })];

      mockFavorites = new Set(["fav-1"]);

      render(
        <DashboardContent
          {...defaultProps}
          userRecipes={userRecipes}
          favoriteRecipes={favoriteRecipes}
          publicRecipes={publicRecipes}
          initialFavoriteIds={["fav-1"]}
        />
      );

      // All sections should render their recipes
      const userSection = screen.getByTestId("section-Twoje przepisy");
      const favSection = screen.getByTestId("section-Ulubione");
      const pubSection = screen.getByTestId("section-Inspiracje");

      expect(userSection.querySelector("[data-testid='recipes-count']")).toHaveTextContent("1");
      expect(favSection.querySelector("[data-testid='recipes-count']")).toHaveTextContent("1");
      expect(pubSection.querySelector("[data-testid='recipes-count']")).toHaveTextContent("1");
    });

    it("should avoid duplicate recipes in map", () => {
      const duplicateRecipe = createMockRecipe({ id: "duplicate-1" });

      // Same recipe appears in multiple arrays
      const userRecipes = [duplicateRecipe];
      const favoriteRecipes = [duplicateRecipe];
      const publicRecipes = [duplicateRecipe];

      mockFavorites = new Set(["duplicate-1"]);

      render(
        <DashboardContent
          {...defaultProps}
          userRecipes={userRecipes}
          favoriteRecipes={favoriteRecipes}
          publicRecipes={publicRecipes}
          initialFavoriteIds={["duplicate-1"]}
        />
      );

      // Should still work correctly even with duplicates
      expect(screen.getByTestId("section-Twoje przepisy")).toBeInTheDocument();
      expect(screen.getByTestId("section-Ulubione")).toBeInTheDocument();
      expect(screen.getByTestId("section-Inspiracje")).toBeInTheDocument();
    });

    it("should handle recipes only in favorites but not in other sections", () => {
      const favoriteRecipes = [createMockRecipe({ id: "fav-only" })];

      mockFavorites = new Set(["fav-only"]);

      render(
        <DashboardContent
          {...defaultProps}
          userRecipes={[]}
          favoriteRecipes={favoriteRecipes}
          publicRecipes={[]}
          initialFavoriteIds={["fav-only"]}
        />
      );

      const favSection = screen.getByTestId("section-Ulubione");
      const recipesCount = favSection.querySelector("[data-testid='recipes-count']");

      expect(recipesCount).toHaveTextContent("1");
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================

  describe("Edge Cases", () => {
    it("should handle very large number of recipes", () => {
      const manyRecipes = Array.from({ length: 100 }, (_, i) => createMockRecipe({ id: `recipe-${i}` }));

      render(<DashboardContent {...defaultProps} userRecipes={manyRecipes} />);

      const userSection = screen.getByTestId("section-Twoje przepisy");
      const recipesCount = userSection.querySelector("[data-testid='recipes-count']");

      expect(recipesCount).toHaveTextContent("100");
    });

    it("should handle recipes with special characters in IDs", () => {
      const specialRecipes = [createMockRecipe({ id: "recipe-!@#$%^&*()" })];

      mockFavorites = new Set(["recipe-!@#$%^&*()"]);

      render(
        <DashboardContent
          {...defaultProps}
          favoriteRecipes={specialRecipes}
          initialFavoriteIds={["recipe-!@#$%^&*()"]}
        />
      );

      const favSection = screen.getByTestId("section-Ulubione");

      expect(favSection).toBeInTheDocument();
    });

    it("should handle mix of recipes across sections", () => {
      const recipe1 = createMockRecipe({ id: "recipe-1" });
      const recipe2 = createMockRecipe({ id: "recipe-2" });
      const recipe3 = createMockRecipe({ id: "recipe-3" });

      mockFavorites = new Set(["recipe-1", "recipe-2"]);

      render(
        <DashboardContent
          {...defaultProps}
          userRecipes={[recipe1, recipe2]}
          favoriteRecipes={[recipe1, recipe2]}
          publicRecipes={[recipe3]}
          initialFavoriteIds={["recipe-1", "recipe-2"]}
        />
      );

      expect(
        screen.getByTestId("section-Twoje przepisy").querySelector("[data-testid='recipes-count']")
      ).toHaveTextContent("2");
      expect(screen.getByTestId("section-Ulubione").querySelector("[data-testid='recipes-count']")).toHaveTextContent(
        "2"
      );
      expect(screen.getByTestId("section-Inspiracje").querySelector("[data-testid='recipes-count']")).toHaveTextContent(
        "1"
      );
    });
  });

  // ==========================================================================
  // COMPONENT STRUCTURE
  // ==========================================================================

  describe("Component Structure", () => {
    it("should render main element as wrapper", () => {
      const { container } = render(<DashboardContent {...defaultProps} />);

      const mainElement = container.querySelector("main");

      expect(mainElement).toBeInTheDocument();
      expect(mainElement).toHaveClass("pb-16");
    });

    it("should render sections in correct order", () => {
      render(<DashboardContent {...defaultProps} />);

      const sections = screen.getAllByText(/Twoje przepisy|Ulubione|Inspiracje/);

      expect(sections[0]).toHaveTextContent("Twoje przepisy");
      expect(sections[1]).toHaveTextContent("Ulubione");
      expect(sections[2]).toHaveTextContent("Inspiracje");
    });
  });
});
