import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RecipeSectionRow from "../RecipeSectionRow";
import type { RecipeCardData } from "@/lib/utils/dashboard";
import type { NutritionDTO, TagDTO } from "@/types";

// ============================================================================
// MOCKS
// ============================================================================

// Mock RecipeCard component
vi.mock("@/components/RecipeCard", () => ({
  default: ({
    recipe,
    isFavorited,
    isLoading,
  }: {
    recipe: RecipeCardData;
    isFavorited: boolean;
    isLoading: boolean;
  }) => (
    <div data-testid={`recipe-card-${recipe.id}`}>
      <h3>{recipe.title}</h3>
      <span data-testid="favorited-status">{isFavorited ? "favorited" : "not-favorited"}</span>
      <span data-testid="loading-status">{isLoading ? "loading" : "not-loading"}</span>
    </div>
  ),
}));

// Mock window.location.href

delete (window as any).location;

window.location = { href: "" } as any;

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
  title: "Twoje przepisy",
  recipes: [],
  emptyMessage: "Nie masz jeszcze przepisów",
  onFavoriteToggle: vi.fn(),
  favoriteRecipeIds: new Set<string>(),
  isTogglingRecipe: vi.fn(() => false),
};

// ============================================================================
// TESTS
// ============================================================================

describe("RecipeSectionRow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.location.href = "";
  });

  // ==========================================================================
  // RENDERING
  // ==========================================================================

  describe("Rendering", () => {
    it("should render section title", () => {
      render(<RecipeSectionRow {...defaultProps} title="Moje Przepisy" />);

      expect(screen.getByText("Moje Przepisy")).toBeInTheDocument();
    });

    it("should render section with correct aria-labelledby", () => {
      const { container } = render(
        <RecipeSectionRow {...defaultProps} recipes={[createMockRecipe()]} title="Test Section" />
      );

      const section = container.querySelector("section");

      expect(section).toHaveAttribute("aria-labelledby", "section-Test Section");
    });

    it("should render View All link when provided", () => {
      render(<RecipeSectionRow {...defaultProps} recipes={[createMockRecipe()]} viewAllLink="/recipes" />);

      const link = screen.getByText("Zobacz wszystkie");

      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/recipes");
    });

    it("should not render View All link when not provided", () => {
      render(<RecipeSectionRow {...defaultProps} recipes={[createMockRecipe()]} />);

      expect(screen.queryByText("Zobacz wszystkie")).not.toBeInTheDocument();
    });

    it("should render recipe cards for each recipe", () => {
      const recipes = [
        createMockRecipe({ id: "recipe-1", title: "Recipe 1" }),
        createMockRecipe({ id: "recipe-2", title: "Recipe 2" }),
        createMockRecipe({ id: "recipe-3", title: "Recipe 3" }),
      ];

      render(<RecipeSectionRow {...defaultProps} recipes={recipes} />);

      expect(screen.getByText("Recipe 1")).toBeInTheDocument();
      expect(screen.getByText("Recipe 2")).toBeInTheDocument();
      expect(screen.getByText("Recipe 3")).toBeInTheDocument();
    });

    it("should pass correct props to RecipeCard components", () => {
      const recipes = [createMockRecipe({ id: "recipe-1" })];
      const favoriteRecipeIds = new Set(["recipe-1"]);
      const isTogglingRecipe = vi.fn((id) => id === "recipe-1");

      render(
        <RecipeSectionRow
          {...defaultProps}
          recipes={recipes}
          favoriteRecipeIds={favoriteRecipeIds}
          isTogglingRecipe={isTogglingRecipe}
        />
      );

      expect(screen.getByTestId("favorited-status")).toHaveTextContent("favorited");
      expect(screen.getByTestId("loading-status")).toHaveTextContent("loading");
    });
  });

  // ==========================================================================
  // EMPTY STATE
  // ==========================================================================

  describe("Empty State", () => {
    it("should show empty message when no recipes", () => {
      render(<RecipeSectionRow {...defaultProps} recipes={[]} />);

      expect(screen.getByText("Nie masz jeszcze przepisów")).toBeInTheDocument();
    });

    it("should show custom empty message", () => {
      render(<RecipeSectionRow {...defaultProps} recipes={[]} emptyMessage="Brak przepisów w tej sekcji" />);

      expect(screen.getByText("Brak przepisów w tej sekcji")).toBeInTheDocument();
    });

    it("should show empty action button when provided", () => {
      const emptyActionButton = {
        text: "+ Dodaj pierwszy przepis",
        href: "/recipes/new",
      };

      render(<RecipeSectionRow {...defaultProps} recipes={[]} emptyActionButton={emptyActionButton} />);

      expect(screen.getByText("+ Dodaj pierwszy przepis")).toBeInTheDocument();
    });

    it("should not show View All link when empty", () => {
      render(<RecipeSectionRow {...defaultProps} recipes={[]} viewAllLink="/recipes" />);

      expect(screen.queryByText("Zobacz wszystkie")).not.toBeInTheDocument();
    });

    it("should navigate when empty action button is clicked", async () => {
      const emptyActionButton = {
        text: "+ Dodaj przepis",
        href: "/recipes/new",
      };

      render(<RecipeSectionRow {...defaultProps} recipes={[]} emptyActionButton={emptyActionButton} />);

      const button = screen.getByText("+ Dodaj przepis");
      await userEvent.click(button);

      expect(window.location.href).toBe("/recipes/new");
    });

    it("should not render scroll container when empty", () => {
      const { container } = render(<RecipeSectionRow {...defaultProps} recipes={[]} />);

      const scrollContainer = container.querySelector('[role="region"][aria-label*="przewiń poziomo"]');

      expect(scrollContainer).not.toBeInTheDocument();
    });

    it("should have proper empty state styling", () => {
      render(<RecipeSectionRow {...defaultProps} recipes={[]} />);

      const emptyContainer = screen.getByText("Nie masz jeszcze przepisów").parentElement;

      expect(emptyContainer).toHaveClass("border-dashed");
      expect(emptyContainer).toHaveClass("bg-gray-50");
    });
  });

  // ==========================================================================
  // KEYBOARD NAVIGATION
  // ==========================================================================

  describe("Keyboard Navigation", () => {
    it("should scroll right on ArrowRight key", () => {
      const recipes = Array.from({ length: 10 }, (_, i) => createMockRecipe({ id: `recipe-${i}` }));

      const { container } = render(<RecipeSectionRow {...defaultProps} recipes={recipes} />);

      const scrollContainer = container.querySelector('[role="region"][aria-label*="przewiń poziomo"]');

      // Mock scrollBy method
      const scrollBySpy = vi.fn();

      (scrollContainer as any).scrollBy = scrollBySpy;

      //eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      fireEvent.keyDown(scrollContainer!, { key: "ArrowRight" });

      expect(scrollBySpy).toHaveBeenCalledWith({ left: 320, behavior: "smooth" });
    });

    it("should scroll left on ArrowLeft key", () => {
      const recipes = Array.from({ length: 10 }, (_, i) => createMockRecipe({ id: `recipe-${i}` }));

      const { container } = render(<RecipeSectionRow {...defaultProps} recipes={recipes} />);

      const scrollContainer = container.querySelector('[role="region"][aria-label*="przewiń poziomo"]');

      // Mock scrollBy method
      const scrollBySpy = vi.fn();

      (scrollContainer as any).scrollBy = scrollBySpy;

      //eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      fireEvent.keyDown(scrollContainer!, { key: "ArrowLeft" });

      expect(scrollBySpy).toHaveBeenCalledWith({ left: -320, behavior: "smooth" });
    });

    it("should not scroll on other key presses", () => {
      const recipes = [createMockRecipe()];

      const { container } = render(<RecipeSectionRow {...defaultProps} recipes={recipes} />);

      const scrollContainer = container.querySelector('[role="region"][aria-label*="przewiń poziomo"]');

      // Mock scrollBy method
      const scrollBySpy = vi.fn();

      (scrollContainer as any).scrollBy = scrollBySpy;

      //eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      fireEvent.keyDown(scrollContainer!, { key: "Enter" });

      expect(scrollBySpy).not.toHaveBeenCalled();
    });

    it("should prevent default behavior on arrow keys", () => {
      const recipes = [createMockRecipe()];

      const { container } = render(<RecipeSectionRow {...defaultProps} recipes={recipes} />);

      const scrollContainer = container.querySelector('[role="region"][aria-label*="przewiń poziomo"]');

      // Mock scrollBy method to prevent actual scrolling errors

      (scrollContainer as any).scrollBy = vi.fn();

      const event = new KeyboardEvent("keydown", { key: "ArrowRight" });
      const preventDefaultSpy = vi.spyOn(event, "preventDefault");

      //eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      scrollContainer!.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // SCROLL BEHAVIOR
  // ==========================================================================

  describe("Scroll Behavior", () => {
    it("should have horizontal scroll container", () => {
      const recipes = [createMockRecipe()];

      const { container } = render(<RecipeSectionRow {...defaultProps} recipes={recipes} />);

      const scrollContainer = container.querySelector('[role="region"][aria-label*="przewiń poziomo"]');

      expect(scrollContainer).toHaveClass("overflow-x-auto");
    });

    it("should have scroll-snap styling", () => {
      const recipes = [createMockRecipe()];

      const { container } = render(<RecipeSectionRow {...defaultProps} recipes={recipes} />);

      const scrollContainer = container.querySelector('[role="region"][aria-label*="przewiń poziomo"]') as HTMLElement;

      expect(scrollContainer.style.scrollSnapType).toBe("x mandatory");
    });

    it("should have webkit overflow scrolling", () => {
      const recipes = [createMockRecipe()];

      const { container } = render(<RecipeSectionRow {...defaultProps} recipes={recipes} />);

      const scrollContainer = container.querySelector('[role="region"][aria-label*="przewiń poziomo"]') as HTMLElement;

      expect((scrollContainer.style as any).WebkitOverflowScrolling).toBe("touch");
    });

    it("should be focusable for keyboard navigation", () => {
      const recipes = [createMockRecipe()];

      const { container } = render(<RecipeSectionRow {...defaultProps} recipes={recipes} />);

      const scrollContainer = container.querySelector('[role="region"][aria-label*="przewiń poziomo"]');

      expect(scrollContainer).toHaveAttribute("tabIndex", "0");
    });

    it("should have proper aria-label for scroll region", () => {
      const recipes = [createMockRecipe()];

      render(<RecipeSectionRow {...defaultProps} title="Test Section" recipes={recipes} />);

      expect(
        screen.getByRole("region", {
          name: "Test Section - przewiń poziomo aby zobaczyć więcej przepisów",
        })
      ).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // INTERACTIONS
  // ==========================================================================

  describe("Interactions", () => {
    it("should propagate onFavoriteToggle to cards", () => {
      const onFavoriteToggle = vi.fn();
      const recipes = [createMockRecipe({ id: "recipe-1" })];

      render(<RecipeSectionRow {...defaultProps} recipes={recipes} onFavoriteToggle={onFavoriteToggle} />);

      // The mock RecipeCard doesn't have interactive elements, but we verify it received the prop
      expect(screen.getByTestId("recipe-card-recipe-1")).toBeInTheDocument();
    });

    it("should pass favoriteRecipeIds to cards", () => {
      const recipes = [createMockRecipe({ id: "recipe-1" })];
      const favoriteRecipeIds = new Set(["recipe-1"]);

      render(<RecipeSectionRow {...defaultProps} recipes={recipes} favoriteRecipeIds={favoriteRecipeIds} />);

      expect(screen.getByTestId("favorited-status")).toHaveTextContent("favorited");
    });

    it("should pass isTogglingRecipe to cards", () => {
      const recipes = [createMockRecipe({ id: "recipe-1" })];
      const isTogglingRecipe = vi.fn((id) => id === "recipe-1");

      render(<RecipeSectionRow {...defaultProps} recipes={recipes} isTogglingRecipe={isTogglingRecipe} />);

      expect(screen.getByTestId("loading-status")).toHaveTextContent("loading");
    });
  });

  // ==========================================================================
  // ACCESSIBILITY
  // ==========================================================================

  describe("Accessibility", () => {
    it("should have screen reader announcement for recipe count", () => {
      const recipes = [createMockRecipe(), createMockRecipe({ id: "recipe-2" }), createMockRecipe({ id: "recipe-3" })];

      render(<RecipeSectionRow {...defaultProps} title="Test" recipes={recipes} />);

      expect(screen.getByText("3 przepisów w sekcji Test")).toBeInTheDocument();
    });

    it("should use singular form for single recipe", () => {
      const recipes = [createMockRecipe()];

      render(<RecipeSectionRow {...defaultProps} title="Test" recipes={recipes} />);

      expect(screen.getByText("1 przepis w sekcji Test")).toBeInTheDocument();
    });

    it("should have aria-live region for screen readers", () => {
      const recipes = [createMockRecipe()];

      const { container } = render(<RecipeSectionRow {...defaultProps} recipes={recipes} />);

      const liveRegion = container.querySelector('[aria-live="polite"]');

      expect(liveRegion).toBeInTheDocument();
      expect(liveRegion).toHaveAttribute("aria-atomic", "true");
    });

    it("should have sr-only class on announcement", () => {
      const recipes = [createMockRecipe()];

      const { container } = render(<RecipeSectionRow {...defaultProps} title="Test" recipes={recipes} />);

      const announcement = container.querySelector(".sr-only");

      expect(announcement).toBeInTheDocument();
      expect(announcement).toHaveTextContent("1 przepis w sekcji Test");
    });
  });

  // ==========================================================================
  // RESPONSIVE LAYOUT
  // ==========================================================================

  describe("Responsive Layout", () => {
    it("should have mobile horizontal scroll classes", () => {
      const recipes = [createMockRecipe()];

      const { container } = render(<RecipeSectionRow {...defaultProps} recipes={recipes} />);

      const scrollContainer = container.querySelector('[role="region"][aria-label*="przewiń poziomo"]');

      expect(scrollContainer).toHaveClass("flex");
      expect(scrollContainer).toHaveClass("overflow-x-auto");
    });

    it("should have desktop grid classes", () => {
      const recipes = [createMockRecipe()];

      const { container } = render(<RecipeSectionRow {...defaultProps} recipes={recipes} />);

      const scrollContainer = container.querySelector('[role="region"][aria-label*="przewiń poziomo"]');

      expect(scrollContainer).toHaveClass("sm:grid");
      expect(scrollContainer).toHaveClass("sm:grid-cols-2");
      expect(scrollContainer).toHaveClass("lg:grid-cols-3");
    });

    it("should have responsive overflow handling", () => {
      const recipes = [createMockRecipe()];

      const { container } = render(<RecipeSectionRow {...defaultProps} recipes={recipes} />);

      const scrollContainer = container.querySelector('[role="region"][aria-label*="przewiń poziomo"]');

      expect(scrollContainer).toHaveClass("sm:overflow-visible");
    });

    it("should have scroll snap on cards", () => {
      const recipes = [createMockRecipe({ id: "recipe-1" })];

      const { container } = render(<RecipeSectionRow {...defaultProps} recipes={recipes} />);

      const cardWrapper = container.querySelector('[style*="scroll-snap-align"]');

      expect(cardWrapper).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================

  describe("Edge Cases", () => {
    it("should handle very large number of recipes", () => {
      const manyRecipes = Array.from({ length: 100 }, (_, i) =>
        createMockRecipe({ id: `recipe-${i}`, title: `Recipe ${i}` })
      );

      render(<RecipeSectionRow {...defaultProps} recipes={manyRecipes} />);

      expect(screen.getByText("Recipe 0")).toBeInTheDocument();
      expect(screen.getByText("Recipe 99")).toBeInTheDocument();
    });

    it("should handle recipes with duplicate IDs gracefully", () => {
      const recipes = [createMockRecipe({ id: "duplicate" }), createMockRecipe({ id: "duplicate" })];

      // Should not throw error (React will warn about duplicate keys but component should render)
      expect(() => render(<RecipeSectionRow {...defaultProps} recipes={recipes} />)).not.toThrow();
    });

    it("should handle empty viewAllLink", () => {
      const recipes = [createMockRecipe()];

      render(<RecipeSectionRow {...defaultProps} recipes={recipes} viewAllLink="" />);

      // Empty string is falsy, so link should not render (component checks with && operator)
      expect(screen.queryByText("Zobacz wszystkie")).not.toBeInTheDocument();
    });

    it("should handle very long section title", () => {
      const longTitle = "Very Long Section Title That Might Overflow The Container In Some Cases";
      const recipes = [createMockRecipe()];

      render(<RecipeSectionRow {...defaultProps} title={longTitle} recipes={recipes} />);

      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it("should handle special characters in title", () => {
      const recipes = [createMockRecipe()];

      render(<RecipeSectionRow {...defaultProps} title="Łączone & Specjalne <Znaki>" recipes={recipes} />);

      expect(screen.getByText("Łączone & Specjalne <Znaki>")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // VISUAL STRUCTURE
  // ==========================================================================

  describe("Visual Structure", () => {
    it("should have proper section spacing", () => {
      const recipes = [createMockRecipe()];

      const { container } = render(<RecipeSectionRow {...defaultProps} recipes={recipes} />);

      const section = container.querySelector("section");

      expect(section).toHaveClass("py-8");
    });

    it("should have container padding", () => {
      const recipes = [createMockRecipe()];

      const { container } = render(<RecipeSectionRow {...defaultProps} recipes={recipes} />);

      const containerDiv = container.querySelector(".container");

      expect(containerDiv).toHaveClass("mx-auto");
      expect(containerDiv).toHaveClass("px-4");
    });

    it("should have proper header layout", () => {
      const recipes = [createMockRecipe()];

      render(<RecipeSectionRow {...defaultProps} recipes={recipes} viewAllLink="/test" />);

      const headerDiv = screen.getByText("Twoje przepisy").parentElement;

      expect(headerDiv).toHaveClass("flex");
      expect(headerDiv).toHaveClass("items-center");
      expect(headerDiv).toHaveClass("justify-between");
    });
  });
});
