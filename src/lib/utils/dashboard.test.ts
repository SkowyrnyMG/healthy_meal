import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getCalorieBadgeColor,
  getRecipeInitial,
  getRecipePlaceholderColor,
  getRecipePlaceholderIconColor,
  shuffleArray,
  transformRecipeToCardData,
  transformFavoriteToCardData,
} from './dashboard';
import type { RecipeListItemDTO, FavoriteDTO } from '../../types';

// ============================================================================
// UI HELPERS TESTS
// ============================================================================

describe('getCalorieBadgeColor', () => {
  it('returns "default" for calories under 300', () => {
    // Arrange
    const lowCalories = 250;

    // Act
    const result = getCalorieBadgeColor(lowCalories);

    // Assert
    expect(result).toBe('default');
  });

  it('returns "secondary" for calories between 300 and 600', () => {
    // Arrange & Act
    const result300 = getCalorieBadgeColor(300);
    const result450 = getCalorieBadgeColor(450);
    const result600 = getCalorieBadgeColor(600);

    // Assert
    expect(result300).toBe('secondary');
    expect(result450).toBe('secondary');
    expect(result600).toBe('secondary');
  });

  it('returns "destructive" for calories over 600', () => {
    // Arrange
    const highCalories = 750;

    // Act
    const result = getCalorieBadgeColor(highCalories);

    // Assert
    expect(result).toBe('destructive');
  });

  it('handles edge case of exactly 299 calories', () => {
    expect(getCalorieBadgeColor(299)).toBe('default');
  });

  it('handles edge case of exactly 601 calories', () => {
    expect(getCalorieBadgeColor(601)).toBe('destructive');
  });
});

describe('getRecipeInitial', () => {
  it('returns first letter uppercased for regular title', () => {
    // Arrange
    const title = 'sałatka grecka';

    // Act
    const result = getRecipeInitial(title);

    // Assert
    expect(result).toBe('S');
  });

  it('returns uppercase letter for already capitalized title', () => {
    expect(getRecipeInitial('Pasta carbonara')).toBe('P');
  });

  it('returns "?" for empty string', () => {
    expect(getRecipeInitial('')).toBe('?');
  });

  it('handles Polish characters correctly', () => {
    expect(getRecipeInitial('łosoś z grilla')).toBe('Ł');
  });

  it('handles single character title', () => {
    expect(getRecipeInitial('a')).toBe('A');
  });
});

describe('getRecipePlaceholderColor', () => {
  it('returns a valid Tailwind color class', () => {
    // Arrange
    const title = 'Test Recipe';
    const validColors = [
      'bg-green-100',
      'bg-blue-100',
      'bg-purple-100',
      'bg-yellow-100',
      'bg-pink-100',
      'bg-indigo-100',
      'bg-teal-100',
      'bg-orange-100',
    ];

    // Act
    const result = getRecipePlaceholderColor(title);

    // Assert
    expect(validColors).toContain(result);
  });

  it('returns same color for same title (consistency)', () => {
    // Arrange
    const title = 'Consistent Recipe';

    // Act
    const result1 = getRecipePlaceholderColor(title);
    const result2 = getRecipePlaceholderColor(title);

    // Assert
    expect(result1).toBe(result2);
  });

  it('handles empty string', () => {
    const result = getRecipePlaceholderColor('');
    expect(typeof result).toBe('string');
    expect(result).toMatch(/^bg-\w+-100$/);
  });
});

describe('getRecipePlaceholderIconColor', () => {
  it('returns matching text color for background color', () => {
    expect(getRecipePlaceholderIconColor('bg-green-100')).toBe('text-green-600');
    expect(getRecipePlaceholderIconColor('bg-blue-100')).toBe('text-blue-600');
    expect(getRecipePlaceholderIconColor('bg-purple-100')).toBe('text-purple-600');
  });

  it('returns default gray color for unknown background', () => {
    expect(getRecipePlaceholderIconColor('bg-unknown-100')).toBe('text-gray-600');
  });
});

// ============================================================================
// ARRAY UTILITIES TESTS
// ============================================================================

describe('shuffleArray', () => {
  beforeEach(() => {
    // Reset random seed for predictable tests
    vi.spyOn(Math, 'random');
  });

  it('returns array with same length', () => {
    // Arrange
    const array = [1, 2, 3, 4, 5];

    // Act
    const result = shuffleArray(array);

    // Assert
    expect(result).toHaveLength(array.length);
  });

  it('does not mutate original array', () => {
    // Arrange
    const original = [1, 2, 3, 4, 5];
    const copy = [...original];

    // Act
    shuffleArray(original);

    // Assert
    expect(original).toEqual(copy);
  });

  it('returns array with same elements', () => {
    // Arrange
    const array = [1, 2, 3, 4, 5];

    // Act
    const result = shuffleArray(array);

    // Assert
    expect(result.sort()).toEqual(array.sort());
  });

  it('handles empty array', () => {
    expect(shuffleArray([])).toEqual([]);
  });

  it('handles single element array', () => {
    const singleElement = [42];
    expect(shuffleArray(singleElement)).toEqual(singleElement);
  });

  it('works with different data types', () => {
    // Arrange
    const stringArray = ['a', 'b', 'c'];
    const objectArray = [{ id: 1 }, { id: 2 }];

    // Act
    const shuffledStrings = shuffleArray(stringArray);
    const shuffledObjects = shuffleArray(objectArray);

    // Assert
    expect(shuffledStrings).toHaveLength(stringArray.length);
    expect(shuffledObjects).toHaveLength(objectArray.length);
  });
});

// ============================================================================
// DATA TRANSFORMATION TESTS
// ============================================================================

describe('transformRecipeToCardData', () => {
  it('transforms recipe with tags correctly', () => {
    // Arrange
    const recipe: RecipeListItemDTO = {
      id: 'recipe-1',
      title: 'Test Recipe',
      description: 'A test recipe',
      nutritionPerServing: {
        calories: 300,
        protein: 20,
        carbs: 30,
        fat: 10,
        fiber: 5,
      },
      prepTimeMinutes: 30,
      tags: [
        { id: 'tag-1', name: 'Italian', type: 'cuisine' },
        { id: 'tag-2', name: 'Dinner', type: 'meal_type' },
      ],
    };

    // Act
    const result = transformRecipeToCardData(recipe);

    // Assert
    expect(result).toEqual({
      id: 'recipe-1',
      title: 'Test Recipe',
      description: 'A test recipe',
      nutritionPerServing: recipe.nutritionPerServing,
      prepTimeMinutes: 30,
      primaryTag: { id: 'tag-1', name: 'Italian', type: 'cuisine' },
    });
  });

  it('sets primaryTag to null when no tags', () => {
    // Arrange
    const recipe: RecipeListItemDTO = {
      id: 'recipe-2',
      title: 'No Tags Recipe',
      description: null,
      nutritionPerServing: {
        calories: 200,
        protein: 10,
        carbs: 20,
        fat: 5,
        fiber: 3,
      },
      prepTimeMinutes: null,
      tags: [],
    };

    // Act
    const result = transformRecipeToCardData(recipe);

    // Assert
    expect(result.primaryTag).toBeNull();
  });
});

describe('transformFavoriteToCardData', () => {
  it('transforms favorite correctly', () => {
    // Arrange
    const favorite: FavoriteDTO = {
      id: 'fav-1',
      recipeId: 'recipe-1',
      userId: 'user-1',
      createdAt: '2024-01-01T00:00:00Z',
      recipe: {
        id: 'recipe-1',
        title: 'Favorite Recipe',
        description: 'A favorite recipe',
        nutritionPerServing: {
          calories: 400,
          protein: 25,
          carbs: 40,
          fat: 15,
          fiber: 8,
        },
        prepTimeMinutes: 45,
      },
    };

    // Act
    const result = transformFavoriteToCardData(favorite);

    // Assert
    expect(result).toEqual({
      id: 'recipe-1',
      title: 'Favorite Recipe',
      description: 'A favorite recipe',
      nutritionPerServing: favorite.recipe.nutritionPerServing,
      prepTimeMinutes: 45,
      primaryTag: null, // Favorites don't include tags
    });
  });

  it('handles null description', () => {
    // Arrange
    const favorite: FavoriteDTO = {
      id: 'fav-2',
      recipeId: 'recipe-2',
      userId: 'user-1',
      createdAt: '2024-01-01T00:00:00Z',
      recipe: {
        id: 'recipe-2',
        title: 'Simple Recipe',
        description: null,
        nutritionPerServing: {
          calories: 150,
          protein: 8,
          carbs: 15,
          fat: 5,
          fiber: 2,
        },
        prepTimeMinutes: null,
      },
    };

    // Act
    const result = transformFavoriteToCardData(favorite);

    // Assert
    expect(result.description).toBeNull();
    expect(result.prepTimeMinutes).toBeNull();
  });
});
