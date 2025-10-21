import type { Tables, TablesInsert, TablesUpdate } from "./db/database.types";

// ============================================================================
// BASE ENTITY TYPES
// ============================================================================

/**
 * User profile DTO representing user's dietary preferences and physical data
 * Mapped from profiles table
 */
export interface ProfileDTO {
  userId: string;
  weight: number | null;
  age: number | null;
  gender: string | null;
  activityLevel: string | null;
  dietType: string | null;
  targetGoal: string | null;
  targetValue: number | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Allergen DTO
 * Mapped from allergens table
 */
export interface AllergenDTO {
  id: string;
  name: string;
  createdAt: string;
}

/**
 * User allergen DTO combining allergen data with user assignment timestamp
 * Joined from user_allergens and allergens tables
 */
export interface UserAllergenDTO {
  id: string;
  name: string;
  createdAt: string;
}

/**
 * Disliked ingredient DTO
 * Mapped from user_disliked_ingredients table
 */
export interface DislikedIngredientDTO {
  id: string;
  ingredientName: string;
  createdAt: string;
}

/**
 * Tag DTO for recipe categorization
 * Mapped from tags table
 */
export interface TagDTO {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

// ============================================================================
// RECIPE TYPES
// ============================================================================

/**
 * Recipe ingredient structure extracted from recipes.ingredients JSON field
 */
export interface RecipeIngredientDTO {
  name: string;
  amount: number;
  unit: string;
}

/**
 * Recipe step structure extracted from recipes.steps JSON field
 */
export interface RecipeStepDTO {
  stepNumber: number;
  instruction: string;
}

/**
 * Nutrition information per serving extracted from recipes.nutrition_per_serving JSON field
 */
export interface NutritionDTO {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  salt: number;
}

/**
 * Recipe list item DTO for displaying recipes in lists
 * Includes basic recipe information with tags
 */
export interface RecipeListItemDTO {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  servings: number;
  prepTimeMinutes: number | null;
  isPublic: boolean;
  featured: boolean;
  nutritionPerServing: NutritionDTO;
  tags: TagDTO[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Full recipe detail DTO including ingredients, steps, and nutrition
 * Mapped from recipes table with expanded JSON fields
 */
export interface RecipeDetailDTO {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  ingredients: RecipeIngredientDTO[];
  steps: RecipeStepDTO[];
  servings: number;
  nutritionPerServing: NutritionDTO;
  prepTimeMinutes: number | null;
  isPublic: boolean;
  featured: boolean;
  tags: TagDTO[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Query parameters for recipe search and filtering
 */
export interface RecipeQueryParams {
  search?: string;
  tags?: string;
  maxCalories?: number;
  maxPrepTime?: number;
  isPublic?: boolean;
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "updatedAt" | "title" | "prepTime";
  sortOrder?: "asc" | "desc";
}

// ============================================================================
// RECIPE MODIFICATION TYPES
// ============================================================================

/**
 * Parameters for AI-powered recipe modifications
 * Different modification types require different parameter sets
 */
export interface ModificationParameters {
  targetCalories?: number;
  reductionPercentage?: number;
  increasePercentage?: number;
  targetProtein?: number;
  targetFiber?: number;
  newServings?: number;
  originalIngredient?: string;
  preferredSubstitute?: string;
}

/**
 * Modified recipe data structure stored in recipe_modifications.modified_data JSON field
 */
export interface ModificationDataDTO {
  ingredients?: RecipeIngredientDTO[];
  steps?: RecipeStepDTO[];
  nutritionPerServing?: NutritionDTO;
  servings?: number;
  modificationNotes?: string;
}

/**
 * Recipe modification DTO
 * Mapped from recipe_modifications table
 */
export interface ModificationDTO {
  id: string;
  originalRecipeId: string;
  userId: string;
  modificationType: string;
  modifiedData: ModificationDataDTO;
  createdAt: string;
}

/**
 * Detailed modification DTO including original recipe information
 * Extended from recipe_modifications with recipe join
 */
export interface ModificationDetailDTO {
  id: string;
  originalRecipeId: string;
  modificationType: string;
  modifiedData: ModificationDataDTO;
  originalRecipe: {
    id: string;
    title: string;
    nutritionPerServing: NutritionDTO;
  };
  createdAt: string;
}

// ============================================================================
// INGREDIENT SUBSTITUTION TYPES
// ============================================================================

/**
 * Ingredient substitution DTO from knowledge base
 * Mapped from ingredient_substitutions table
 */
export interface IngredientSubstitutionDTO {
  id: string;
  originalIngredient: string;
  substituteIngredient: string;
  nutritionComparison: {
    original: {
      calories: number;
      protein: number;
      fat: number;
      carbs: number;
    };
    substitute: {
      calories: number;
      protein: number;
      fat: number;
      carbs: number;
    };
  };
  healthier: boolean;
  createdAt: string;
}

/**
 * Query parameters for ingredient substitution search
 */
export interface SubstitutionQueryParams {
  ingredient: string;
  healthierOnly?: boolean;
}

// ============================================================================
// FAVORITES TYPES
// ============================================================================

/**
 * Favorite recipe DTO with embedded recipe information
 * Joined from favorites and recipes tables
 */
export interface FavoriteDTO {
  recipeId: string;
  recipe: {
    id: string;
    title: string;
    description: string | null;
    nutritionPerServing: NutritionDTO;
    prepTimeMinutes: number | null;
  };
  createdAt: string;
}

// ============================================================================
// COLLECTION TYPES
// ============================================================================

/**
 * Recipe collection DTO with recipe count
 * Mapped from collections table with aggregation
 */
export interface CollectionDTO {
  id: string;
  userId: string;
  name: string;
  recipeCount: number;
  createdAt: string;
}

/**
 * Recipe within a collection with metadata
 * Joined from collection_recipes and recipes tables
 */
export interface CollectionRecipeDTO {
  recipeId: string;
  recipe: {
    id: string;
    title: string;
    description: string | null;
    nutritionPerServing: NutritionDTO;
  };
  createdAt: string;
}

/**
 * Detailed collection DTO including recipes
 * Extended from collections with recipe joins and pagination
 */
export interface CollectionDetailDTO {
  id: string;
  userId: string;
  name: string;
  recipes: CollectionRecipeDTO[];
  pagination: PaginationDTO;
  createdAt: string;
}

// ============================================================================
// RATING TYPES
// ============================================================================

/**
 * Recipe rating DTO
 * Mapped from recipe_ratings table
 */
export interface RatingDTO {
  id: string;
  userId: string;
  recipeId: string;
  rating: number;
  didCook: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Aggregated rating statistics for a recipe
 */
export interface RatingStatsDTO {
  recipeId: string;
  totalRatings: number;
  averageRating: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  cookCount: number;
  cookPercentage: number;
}

// ============================================================================
// MEAL PLAN TYPES
// ============================================================================

/**
 * Meal plan DTO with embedded recipe information
 * Mapped from meal_plans table with recipe join
 */
export interface MealPlanDTO {
  id: string;
  userId: string;
  recipeId: string;
  recipe: {
    id: string;
    title: string;
    nutritionPerServing: NutritionDTO;
  };
  plannedDate: string;
  mealType: string;
  createdAt: string;
}

/**
 * Query parameters for meal plan filtering
 */
export interface MealPlanQueryParams {
  startDate?: string;
  endDate?: string;
  mealType?: "breakfast" | "lunch" | "dinner" | "snack";
}

// ============================================================================
// ADMIN DASHBOARD TYPES
// ============================================================================

/**
 * User statistics DTO from materialized view mv_user_statistics
 */
export interface UserStatsDTO {
  totalUsers: number;
  usersWithPreferences: number;
  preferenceCompletionRate: number;
  newUsersLast7Days: number;
  newUsersLast30Days: number;
  lastUpdated: string;
}

/**
 * Modification type count for statistics
 */
export interface ModificationTypeCount {
  modificationType: string;
  count: number;
}

/**
 * Recipe statistics DTO from materialized view mv_recipe_statistics
 */
export interface RecipeStatsDTO {
  totalRecipes: number;
  publicRecipes: number;
  totalModifications: number;
  avgModificationsPerRecipe: number;
  modificationsByType: ModificationTypeCount[];
  lastUpdated: string;
}

/**
 * Rating statistics DTO from materialized view mv_rating_statistics
 */
export interface RatingStatsAdminDTO {
  totalRatings: number;
  averageRating: number;
  recipesCooked: number;
  cookPercentage: number;
  positiveRatings: number;
  negativeRatings: number;
  lastUpdated: string;
}

// ============================================================================
// PAGINATION TYPES
// ============================================================================

/**
 * Pagination metadata
 */
export interface PaginationDTO {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Generic paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationDTO;
}

// ============================================================================
// COMMAND MODELS (Request Payloads)
// ============================================================================

/**
 * Command to update user profile
 * Based on TablesUpdate<'profiles'>
 */
export interface UpdateProfileCommand {
  weight?: number;
  age?: number;
  gender?: string;
  activityLevel?: string;
  dietType?: string;
  targetGoal?: string;
  targetValue?: number;
}

/**
 * Command to add allergen to user profile
 */
export interface AddAllergenCommand {
  allergenId: string;
}

/**
 * Command to add disliked ingredient
 */
export interface AddDislikedIngredientCommand {
  ingredientName: string;
}

/**
 * Command to create a new recipe
 * Based on TablesInsert<'recipes'>
 */
export interface CreateRecipeCommand {
  title: string;
  description?: string;
  ingredients: RecipeIngredientDTO[];
  steps: RecipeStepDTO[];
  servings: number;
  nutritionPerServing: NutritionDTO;
  prepTimeMinutes?: number;
  isPublic?: boolean;
  tagIds?: string[];
}

/**
 * Command to update an existing recipe
 * Same structure as CreateRecipeCommand
 */
export type UpdateRecipeCommand = CreateRecipeCommand;

/**
 * Command to create AI-powered recipe modification
 */
export interface CreateModificationCommand {
  modificationType:
    | "reduce_calories"
    | "increase_calories"
    | "increase_protein"
    | "increase_fiber"
    | "portion_size"
    | "ingredient_substitution";
  parameters: ModificationParameters;
}

/**
 * Command to add recipe to favorites
 */
export interface AddFavoriteCommand {
  recipeId: string;
}

/**
 * Command to create a new collection
 */
export interface CreateCollectionCommand {
  name: string;
}

/**
 * Command to update collection name
 */
export interface UpdateCollectionCommand {
  name: string;
}

/**
 * Command to add recipe to collection
 */
export interface AddRecipeToCollectionCommand {
  recipeId: string;
}

/**
 * Command to create or update recipe rating (upsert)
 */
export interface CreateOrUpdateRatingCommand {
  rating: number;
  didCook: boolean;
}

/**
 * Meal plan type
 */
export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

/**
 * Command to add recipe to meal plan
 */
export interface CreateMealPlanCommand {
  recipeId: string;
  plannedDate: string;
  mealType: MealType;
}

/**
 * Command to update meal plan entry
 */
export interface UpdateMealPlanCommand {
  plannedDate: string;
  mealType: MealType;
}

// ============================================================================
// UTILITY TYPES FOR DATABASE ENTITY MAPPING
// ============================================================================

/**
 * Database entity types for direct access when needed
 * These provide the bridge between DTOs and database operations
 */
export type DbProfile = Tables<"profiles">;
export type DbProfileInsert = TablesInsert<"profiles">;
export type DbProfileUpdate = TablesUpdate<"profiles">;

export type DbAllergen = Tables<"allergens">;
export type DbUserAllergen = Tables<"user_allergens">;
export type DbUserAllergenInsert = TablesInsert<"user_allergens">;

export type DbDislikedIngredient = Tables<"user_disliked_ingredients">;
export type DbDislikedIngredientInsert = TablesInsert<"user_disliked_ingredients">;

export type DbTag = Tables<"tags">;
export type DbRecipe = Tables<"recipes">;
export type DbRecipeInsert = TablesInsert<"recipes">;
export type DbRecipeUpdate = TablesUpdate<"recipes">;

export type DbRecipeTag = Tables<"recipe_tags">;
export type DbRecipeTagInsert = TablesInsert<"recipe_tags">;

export type DbModification = Tables<"recipe_modifications">;
export type DbModificationInsert = TablesInsert<"recipe_modifications">;

export type DbFavorite = Tables<"favorites">;
export type DbFavoriteInsert = TablesInsert<"favorites">;

export type DbCollection = Tables<"collections">;
export type DbCollectionInsert = TablesInsert<"collections">;
export type DbCollectionUpdate = TablesUpdate<"collections">;

export type DbCollectionRecipe = Tables<"collection_recipes">;
export type DbCollectionRecipeInsert = TablesInsert<"collection_recipes">;

export type DbRating = Tables<"recipe_ratings">;
export type DbRatingInsert = TablesInsert<"recipe_ratings">;
export type DbRatingUpdate = TablesUpdate<"recipe_ratings">;

export type DbMealPlan = Tables<"meal_plans">;
export type DbMealPlanInsert = TablesInsert<"meal_plans">;
export type DbMealPlanUpdate = TablesUpdate<"meal_plans">;

export type DbIngredientSubstitution = Tables<"ingredient_substitutions">;

// Materialized views for admin statistics
export type DbUserStatistics = Tables<"mv_user_statistics">;
export type DbRecipeStatistics = Tables<"mv_recipe_statistics">;
export type DbRatingStatistics = Tables<"mv_rating_statistics">;

// ============================================================================
// VIEW MODELS (Frontend-specific types)
// ============================================================================

/**
 * Recipe filter state managed in the view
 * Maps to RecipeQueryParams for API calls
 */
export interface RecipeFilters {
  search?: string; // Search query (1-255 chars, trimmed)
  tagIds?: string[]; // Selected tag UUIDs
  maxCalories?: number; // Max calories per serving (1-10000)
  maxPrepTime?: number; // Max prep time in minutes (1-1440)
  sortBy: "createdAt" | "updatedAt" | "title" | "prepTime";
  sortOrder: "asc" | "desc";
  page: number; // Current page (min: 1)
}

/**
 * Combined sort option for dropdown
 */
export interface SortOption {
  label: string; // Display label in Polish
  sortBy: "createdAt" | "updatedAt" | "title" | "prepTime";
  sortOrder: "asc" | "desc";
}

/**
 * Empty state type
 */
export type EmptyStateType = "no-recipes" | "no-results";

/**
 * Filter chip item for active filters display
 */
export interface FilterChip {
  key: string; // Unique identifier for the filter
  label: string; // Display label
  value?: string; // Optional value (for tag removal)
  onRemove: () => void; // Callback to remove this filter
}
