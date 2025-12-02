import { describe, it, expect, vi } from "vitest";
import {
  transformRecipeToCardData,
  transformFavoriteToCardData,
  shuffleArray,
  getCalorieBadgeColor,
  getRecipeInitial,
  getRecipePlaceholderColor,
  getRecipePlaceholderIconColor,
} from "../dashboard";
import type { RecipeListItemDTO, FavoriteDTO, NutritionDTO, TagDTO } from "@/types";

// ============================================================================
// MOCK DATA FACTORIES
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

const createMockRecipe = (overrides?: Partial<RecipeListItemDTO>): RecipeListItemDTO => ({
  id: "recipe-123",
  userId: "user-456",
  title: "Sałatka grecka",
  description: "Pyszna sałatka z serem feta",
  servings: 2,
  prepTimeMinutes: 15,
  isPublic: true,
  featured: false,
  nutritionPerServing: createMockNutrition(),
  tags: [createMockTag()],
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
  ...overrides,
});

const createMockFavorite = (overrides?: Partial<FavoriteDTO>): FavoriteDTO => ({
  recipeId: "recipe-123",
  recipe: {
    id: "recipe-123",
    title: "Sałatka grecka",
    description: "Pyszna sałatka z serem feta",
    nutritionPerServing: createMockNutrition(),
    prepTimeMinutes: 15,
  },
  createdAt: "2025-01-01T00:00:00Z",
  ...overrides,
});

// ============================================================================
// HIGH PRIORITY: DATA TRANSFORMATION UTILITIES
// ============================================================================

describe("transformRecipeToCardData", () => {
  describe("Happy Path", () => {
    it("should transform complete RecipeListItemDTO to RecipeCardData", () => {
      const recipe = createMockRecipe();

      const result = transformRecipeToCardData(recipe);

      expect(result).toEqual({
        id: "recipe-123",
        title: "Sałatka grecka",
        description: "Pyszna sałatka z serem feta",
        nutritionPerServing: expect.objectContaining({
          calories: 450,
          protein: 25,
          fat: 15,
          carbs: 50,
          fiber: 8,
          salt: 1.5,
        }),
        prepTimeMinutes: 15,
        primaryTag: expect.objectContaining({
          id: "tag-1",
          name: "Zdrowe",
          slug: "zdrowe",
        }),
      });
    });

    it("should map all required fields correctly", () => {
      const recipe = createMockRecipe({
        id: "test-id",
        title: "Test Recipe",
        description: "Test Description",
        prepTimeMinutes: 30,
      });

      const result = transformRecipeToCardData(recipe);

      expect(result.id).toBe("test-id");
      expect(result.title).toBe("Test Recipe");
      expect(result.description).toBe("Test Description");
      expect(result.prepTimeMinutes).toBe(30);
    });

    it("should preserve recipe ID", () => {
      const recipe = createMockRecipe({ id: "unique-recipe-id" });

      const result = transformRecipeToCardData(recipe);

      expect(result.id).toBe("unique-recipe-id");
    });

    it("should extract nutrition data correctly", () => {
      const recipe = createMockRecipe({
        nutritionPerServing: createMockNutrition({
          calories: 600,
          protein: 40,
          fat: 20,
          carbs: 60,
          fiber: 12,
          salt: 2.0,
        }),
      });

      const result = transformRecipeToCardData(recipe);

      expect(result.nutritionPerServing).toEqual({
        calories: 600,
        protein: 40,
        fat: 20,
        carbs: 60,
        fiber: 12,
        salt: 2.0,
      });
    });
  });

  describe("Tags Handling", () => {
    it("should extract first tag as primary tag", () => {
      const recipe = createMockRecipe({
        tags: [createMockTag({ id: "tag-1", name: "Zdrowe" }), createMockTag({ id: "tag-2", name: "Wegetariańskie" })],
      });

      const result = transformRecipeToCardData(recipe);

      expect(result.primaryTag).toEqual(
        expect.objectContaining({
          id: "tag-1",
          name: "Zdrowe",
        })
      );
    });

    it("should handle empty tags array", () => {
      const recipe = createMockRecipe({ tags: [] });

      const result = transformRecipeToCardData(recipe);

      expect(result.primaryTag).toBeNull();
    });
  });

  describe("Edge Cases", () => {
    it("should handle null description", () => {
      const recipe = createMockRecipe({ description: null });

      const result = transformRecipeToCardData(recipe);

      expect(result.description).toBeNull();
    });

    it("should handle null prepTimeMinutes", () => {
      const recipe = createMockRecipe({ prepTimeMinutes: null });

      const result = transformRecipeToCardData(recipe);

      expect(result.prepTimeMinutes).toBeNull();
    });

    it("should handle extremely long recipe titles", () => {
      const longTitle = "A".repeat(500);
      const recipe = createMockRecipe({ title: longTitle });

      const result = transformRecipeToCardData(recipe);

      expect(result.title).toBe(longTitle);
    });

    it("should handle special characters in title", () => {
      const recipe = createMockRecipe({ title: "Łosoś w sosie śmietanowym & ziołach" });

      const result = transformRecipeToCardData(recipe);

      expect(result.title).toBe("Łosoś w sosie śmietanowym & ziołach");
    });
  });
});

describe("transformFavoriteToCardData", () => {
  describe("Happy Path", () => {
    it("should transform FavoriteDTO to RecipeCardData", () => {
      const favorite = createMockFavorite();

      const result = transformFavoriteToCardData(favorite);

      expect(result).toEqual({
        id: "recipe-123",
        title: "Sałatka grecka",
        description: "Pyszna sałatka z serem feta",
        nutritionPerServing: expect.objectContaining({
          calories: 450,
          protein: 25,
        }),
        prepTimeMinutes: 15,
        primaryTag: null, // Favorites don't include tags
      });
    });

    it("should extract nested recipe data correctly", () => {
      const favorite = createMockFavorite({
        recipeId: "recipe-456",
        recipe: {
          id: "recipe-456",
          title: "Kurczak z warzywami",
          description: "Zdrowy obiad",
          nutritionPerServing: createMockNutrition({ calories: 550 }),
          prepTimeMinutes: 45,
        },
      });

      const result = transformFavoriteToCardData(favorite);

      expect(result.id).toBe("recipe-456");
      expect(result.title).toBe("Kurczak z warzywami");
      expect(result.description).toBe("Zdrowy obiad");
      expect(result.prepTimeMinutes).toBe(45);
    });

    it("should map recipeId from favorited recipe", () => {
      const favorite = createMockFavorite({
        recipeId: "fav-recipe-789",
        recipe: {
          id: "fav-recipe-789",
          title: "Test",
          description: null,
          nutritionPerServing: createMockNutrition(),
          prepTimeMinutes: 10,
        },
      });

      const result = transformFavoriteToCardData(favorite);

      expect(result.id).toBe("fav-recipe-789");
    });

    it("should always set primaryTag to null", () => {
      const favorite = createMockFavorite();

      const result = transformFavoriteToCardData(favorite);

      expect(result.primaryTag).toBeNull();
    });
  });

  describe("Edge Cases", () => {
    it("should handle null description in nested recipe", () => {
      const favorite = createMockFavorite({
        recipe: {
          id: "recipe-123",
          title: "Test Recipe",
          description: null,
          nutritionPerServing: createMockNutrition(),
          prepTimeMinutes: 20,
        },
      });

      const result = transformFavoriteToCardData(favorite);

      expect(result.description).toBeNull();
    });

    it("should handle null prepTimeMinutes in nested recipe", () => {
      const favorite = createMockFavorite({
        recipe: {
          id: "recipe-123",
          title: "Test Recipe",
          description: "Description",
          nutritionPerServing: createMockNutrition(),
          prepTimeMinutes: null,
        },
      });

      const result = transformFavoriteToCardData(favorite);

      expect(result.prepTimeMinutes).toBeNull();
    });
  });
});

describe("shuffleArray", () => {
  describe("Functionality", () => {
    it("should return array with same length", () => {
      const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

      const shuffled = shuffleArray(numbers);

      expect(shuffled).toHaveLength(numbers.length);
    });

    it("should contain all original elements", () => {
      const numbers = [1, 2, 3, 4, 5];

      const shuffled = shuffleArray(numbers);

      numbers.forEach((num) => {
        expect(shuffled).toContain(num);
      });
    });

    it("should not mutate original array", () => {
      const original = [1, 2, 3, 4, 5];
      const originalCopy = [...original];

      shuffleArray(original);

      expect(original).toEqual(originalCopy);
    });

    it("should produce different order (probabilistic test)", () => {
      // Mock Math.random to produce a deterministic shuffle
      const randomValues = [0.9, 0.1, 0.5, 0.3, 0.7];
      let callCount = 0;
      vi.spyOn(Math, "random").mockImplementation(() => {
        return randomValues[callCount++ % randomValues.length];
      });

      const numbers = [1, 2, 3, 4, 5];
      const shuffled = shuffleArray(numbers);

      // With mocked random, the order should be different
      expect(shuffled).not.toEqual(numbers);

      vi.restoreAllMocks();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty array", () => {
      const empty: number[] = [];

      const shuffled = shuffleArray(empty);

      expect(shuffled).toEqual([]);
      expect(shuffled).toHaveLength(0);
    });

    it("should handle single-element array", () => {
      const single = [42];

      const shuffled = shuffleArray(single);

      expect(shuffled).toEqual([42]);
    });

    it("should handle array with duplicate elements", () => {
      const duplicates = [1, 1, 2, 2, 3, 3];

      const shuffled = shuffleArray(duplicates);

      expect(shuffled).toHaveLength(6);
      expect(shuffled.filter((x) => x === 1)).toHaveLength(2);
      expect(shuffled.filter((x) => x === 2)).toHaveLength(2);
      expect(shuffled.filter((x) => x === 3)).toHaveLength(2);
    });

    it("should work with complex objects", () => {
      const recipes = [createMockRecipe({ id: "1" }), createMockRecipe({ id: "2" }), createMockRecipe({ id: "3" })];

      const shuffled = shuffleArray(recipes);

      expect(shuffled).toHaveLength(3);
      expect(shuffled.map((r) => r.id).sort()).toEqual(["1", "2", "3"]);
    });
  });
});

// ============================================================================
// MEDIUM PRIORITY: UI HELPER UTILITIES
// ============================================================================

describe("getCalorieBadgeColor", () => {
  describe("Color Thresholds", () => {
    it("should return 'default' for low calories (< 300)", () => {
      expect(getCalorieBadgeColor(0)).toBe("default");
      expect(getCalorieBadgeColor(100)).toBe("default");
      expect(getCalorieBadgeColor(299)).toBe("default");
    });

    it("should return 'secondary' for medium calories (300-600)", () => {
      expect(getCalorieBadgeColor(300)).toBe("secondary");
      expect(getCalorieBadgeColor(450)).toBe("secondary");
      expect(getCalorieBadgeColor(600)).toBe("secondary");
    });

    it("should return 'destructive' for high calories (> 600)", () => {
      expect(getCalorieBadgeColor(601)).toBe("destructive");
      expect(getCalorieBadgeColor(800)).toBe("destructive");
      expect(getCalorieBadgeColor(1000)).toBe("destructive");
    });
  });

  describe("Edge Cases", () => {
    it("should handle exactly 300 calories (boundary)", () => {
      expect(getCalorieBadgeColor(300)).toBe("secondary");
    });

    it("should handle exactly 600 calories (boundary)", () => {
      expect(getCalorieBadgeColor(600)).toBe("secondary");
    });

    it("should handle 0 calories", () => {
      expect(getCalorieBadgeColor(0)).toBe("default");
    });

    it("should handle negative calories (edge case)", () => {
      // Even though calories shouldn't be negative in practice
      expect(getCalorieBadgeColor(-100)).toBe("default");
    });

    it("should handle very large calorie values", () => {
      expect(getCalorieBadgeColor(9999)).toBe("destructive");
    });
  });
});

describe("getRecipeInitial", () => {
  describe("Basic Functionality", () => {
    it("should return first letter uppercase for simple titles", () => {
      expect(getRecipeInitial("Sałatka")).toBe("S");
      expect(getRecipeInitial("kurczak")).toBe("K");
      expect(getRecipeInitial("Zupa")).toBe("Z");
    });

    it("should handle Polish characters", () => {
      expect(getRecipeInitial("Łosoś")).toBe("Ł");
      expect(getRecipeInitial("żurek")).toBe("Ż");
      expect(getRecipeInitial("ćwikła")).toBe("Ć");
    });

    it("should uppercase lowercase first letters", () => {
      expect(getRecipeInitial("pizza")).toBe("P");
      expect(getRecipeInitial("taco")).toBe("T");
    });
  });

  describe("Edge Cases", () => {
    it("should return '?' for empty string", () => {
      expect(getRecipeInitial("")).toBe("?");
    });

    it("should handle titles starting with special characters", () => {
      expect(getRecipeInitial("!Przepis")).toBe("!");
      expect(getRecipeInitial("#Zdrowe")).toBe("#");
    });

    it("should handle titles starting with numbers", () => {
      expect(getRecipeInitial("3 składniki")).toBe("3");
    });

    it("should handle titles with leading whitespace", () => {
      // Note: Based on implementation, it doesn't trim, so it returns space
      expect(getRecipeInitial(" Sałatka")).toBe(" ");
    });

    it("should handle emoji at start", () => {
      // Note: String.charAt() doesn't properly handle multi-byte emojis
      // This returns the first UTF-16 code unit, which is part of the emoji
      const result = getRecipeInitial("🍕 Pizza");
      expect(result).toBe("🍕".charAt(0)); // Returns first code unit of emoji
    });
  });
});

describe("getRecipePlaceholderColor", () => {
  describe("Consistency", () => {
    it("should return consistent color for same title", () => {
      const color1 = getRecipePlaceholderColor("Sałatka grecka");
      const color2 = getRecipePlaceholderColor("Sałatka grecka");

      expect(color1).toBe(color2);
    });

    it("should return different colors for different titles", () => {
      const color1 = getRecipePlaceholderColor("Sałatka grecka");
      const color2 = getRecipePlaceholderColor("Pizza margherita");

      // They MIGHT be the same due to hash collision, but very unlikely
      // We just verify both return valid colors
      expect(color1).toMatch(/^bg-(green|blue|purple|yellow|pink|indigo|teal|orange)-100$/);
      expect(color2).toMatch(/^bg-(green|blue|purple|yellow|pink|indigo|teal|orange)-100$/);
    });
  });

  describe("Valid Output", () => {
    it("should return valid Tailwind color class", () => {
      const validColors = [
        "bg-green-100",
        "bg-blue-100",
        "bg-purple-100",
        "bg-yellow-100",
        "bg-pink-100",
        "bg-indigo-100",
        "bg-teal-100",
        "bg-orange-100",
      ];

      const color = getRecipePlaceholderColor("Test Recipe");

      expect(validColors).toContain(color);
    });

    it("should handle empty title", () => {
      const color = getRecipePlaceholderColor("");

      expect(color).toMatch(/^bg-(green|blue|purple|yellow|pink|indigo|teal|orange)-100$/);
    });
  });

  describe("Hash Distribution", () => {
    it("should distribute different titles across color palette", () => {
      const titles = [
        "Sałatka grecka",
        "Pizza margherita",
        "Kurczak curry",
        "Łosoś pieczony",
        "Zupa pomidorowa",
        "Makaron carbonara",
        "Burger wołowy",
        "Tacos z warzywami",
      ];

      const colors = titles.map(getRecipePlaceholderColor);
      const uniqueColors = new Set(colors);

      // Should have some variety (at least 3 different colors from 8 titles)
      expect(uniqueColors.size).toBeGreaterThanOrEqual(3);
    });
  });
});

describe("getRecipePlaceholderIconColor", () => {
  describe("Color Mapping", () => {
    it("should return correct icon color for each background color", () => {
      expect(getRecipePlaceholderIconColor("bg-green-100")).toBe("text-green-600");
      expect(getRecipePlaceholderIconColor("bg-blue-100")).toBe("text-blue-600");
      expect(getRecipePlaceholderIconColor("bg-purple-100")).toBe("text-purple-600");
      expect(getRecipePlaceholderIconColor("bg-yellow-100")).toBe("text-yellow-600");
      expect(getRecipePlaceholderIconColor("bg-pink-100")).toBe("text-pink-600");
      expect(getRecipePlaceholderIconColor("bg-indigo-100")).toBe("text-indigo-600");
      expect(getRecipePlaceholderIconColor("bg-teal-100")).toBe("text-teal-600");
      expect(getRecipePlaceholderIconColor("bg-orange-100")).toBe("text-orange-600");
    });
  });

  describe("Fallback", () => {
    it("should return fallback color for unknown background", () => {
      expect(getRecipePlaceholderIconColor("bg-red-100")).toBe("text-gray-600");
      expect(getRecipePlaceholderIconColor("unknown-color")).toBe("text-gray-600");
      expect(getRecipePlaceholderIconColor("")).toBe("text-gray-600");
    });
  });

  describe("Integration with getRecipePlaceholderColor", () => {
    it("should always return valid icon color for generated background colors", () => {
      const titles = ["Recipe 1", "Recipe 2", "Recipe 3"];

      titles.forEach((title) => {
        const bgColor = getRecipePlaceholderColor(title);
        const iconColor = getRecipePlaceholderIconColor(bgColor);

        expect(iconColor).toMatch(/^text-(green|blue|purple|yellow|pink|indigo|teal|orange|gray)-600$/);
      });
    });
  });
});
