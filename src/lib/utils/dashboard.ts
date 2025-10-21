import type { RecipeListItemDTO, FavoriteDTO, NutritionDTO, TagDTO } from "../../types";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Unified recipe card data structure used across dashboard components
 */
export interface RecipeCardData {
  id: string;
  title: string;
  description: string | null;
  nutritionPerServing: NutritionDTO;
  prepTimeMinutes: number | null;
  primaryTag: TagDTO | null;
}

// ============================================================================
// ARRAY UTILITIES
// ============================================================================

/**
 * Shuffle an array using Fisher-Yates algorithm
 * Returns a new array without mutating the original
 *
 * @param array - Array to shuffle
 * @returns New shuffled array
 *
 * @example
 * ```ts
 * const numbers = [1, 2, 3, 4, 5];
 * const shuffled = shuffleArray(numbers);
 * // shuffled might be [3, 1, 5, 2, 4]
 * // numbers is still [1, 2, 3, 4, 5]
 * ```
 */
export function shuffleArray<T>(array: T[]): T[] {
  // Create a copy to avoid mutation
  const result = [...array];

  // Fisher-Yates shuffle
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

// ============================================================================
// DATA TRANSFORMATION
// ============================================================================

/**
 * Transform RecipeListItemDTO to RecipeCardData
 * Extracts the primary tag (first tag in array) for display
 *
 * @param recipe - Recipe list item DTO
 * @returns Transformed recipe card data
 */
export function transformRecipeToCardData(recipe: RecipeListItemDTO): RecipeCardData {
  return {
    id: recipe.id,
    title: recipe.title,
    description: recipe.description,
    nutritionPerServing: recipe.nutritionPerServing,
    prepTimeMinutes: recipe.prepTimeMinutes,
    primaryTag: recipe.tags.length > 0 ? recipe.tags[0] : null,
  };
}

/**
 * Transform FavoriteDTO to RecipeCardData
 * Extracts recipe data from nested structure
 * Note: Favorites don't include tags, so primaryTag is always null
 *
 * @param favorite - Favorite DTO with nested recipe
 * @returns Transformed recipe card data
 */
export function transformFavoriteToCardData(favorite: FavoriteDTO): RecipeCardData {
  return {
    id: favorite.recipe.id,
    title: favorite.recipe.title,
    description: favorite.recipe.description,
    nutritionPerServing: favorite.recipe.nutritionPerServing,
    prepTimeMinutes: favorite.recipe.prepTimeMinutes,
    primaryTag: null, // Favorites don't include tags in API response
  };
}

// ============================================================================
// UI HELPERS
// ============================================================================

/**
 * Get Tailwind color class for calorie badge based on value
 *
 * Color coding:
 * - Low (green): calories < 300
 * - Medium (yellow): 300 ≤ calories ≤ 600
 * - High (red): calories > 600
 *
 * @param calories - Calorie value
 * @returns Tailwind class string for badge variant
 */
export function getCalorieBadgeColor(calories: number): "default" | "secondary" | "destructive" {
  if (calories < 300) {
    return "default"; // Will be styled as green
  } else if (calories <= 600) {
    return "secondary"; // Will be styled as yellow/neutral
  } else {
    return "destructive"; // Will be styled as red
  }
}

/**
 * Extract first letter of recipe title for placeholder display
 *
 * @param title - Recipe title
 * @returns First character of title, uppercased
 *
 * @example
 * ```ts
 * getRecipeInitial("Sałatka grecka") // Returns "S"
 * getRecipeInitial("Łosoś z grilla") // Returns "Ł"
 * ```
 */
export function getRecipeInitial(title: string): string {
  if (!title || title.length === 0) {
    return "?";
  }
  return title.charAt(0).toUpperCase();
}

/**
 * Generate consistent background color for recipe placeholder based on title hash
 * Maps title to one of predefined colors for visual variety
 *
 * Uses simple hash function to ensure same title always gets same color
 *
 * @param title - Recipe title
 * @returns Tailwind background color class
 *
 * @example
 * ```ts
 * getRecipePlaceholderColor("Sałatka grecka") // Returns "bg-green-100"
 * getRecipePlaceholderColor("Sałatka grecka") // Always returns "bg-green-100"
 * ```
 */
export function getRecipePlaceholderColor(title: string): string {
  // Predefined color palette for recipe placeholders
  const colors = [
    "bg-green-100",
    "bg-blue-100",
    "bg-purple-100",
    "bg-yellow-100",
    "bg-pink-100",
    "bg-indigo-100",
    "bg-teal-100",
    "bg-orange-100",
  ];

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    const char = title.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Map hash to color index
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

/**
 * Get corresponding icon text color for recipe placeholder
 * Matches the placeholder background color
 *
 * @param backgroundColor - Tailwind background color class
 * @returns Tailwind text color class
 */
export function getRecipePlaceholderIconColor(backgroundColor: string): string {
  const colorMap: Record<string, string> = {
    "bg-green-100": "text-green-600",
    "bg-blue-100": "text-blue-600",
    "bg-purple-100": "text-purple-600",
    "bg-yellow-100": "text-yellow-600",
    "bg-pink-100": "text-pink-600",
    "bg-indigo-100": "text-indigo-600",
    "bg-teal-100": "text-teal-600",
    "bg-orange-100": "text-orange-600",
  };

  return colorMap[backgroundColor] || "text-gray-600";
}
