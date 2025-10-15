import type { SupabaseClient } from "../../db/supabase.client";
import type { FavoriteDTO, PaginationDTO, NutritionDTO } from "../../types";

// ============================================================================
// CUSTOM ERROR CLASSES
// ============================================================================

/**
 * Error thrown when recipe is not found in the recipes table
 */
export class RecipeNotFoundError extends Error {
  constructor(recipeId: string) {
    super(`Recipe not found: ${recipeId}`);
    this.name = "RecipeNotFoundError";
  }
}

/**
 * Error thrown when recipe is private and belongs to another user
 */
export class RecipeNotAccessibleError extends Error {
  constructor(recipeId: string) {
    super(`Recipe not accessible: ${recipeId}`);
    this.name = "RecipeNotAccessibleError";
  }
}

/**
 * Error thrown when recipe is already in user's favorites
 */
export class RecipeAlreadyFavoritedError extends Error {
  constructor(recipeId: string) {
    super(`Recipe already favorited: ${recipeId}`);
    this.name = "RecipeAlreadyFavoritedError";
  }
}

// ============================================================================
// TYPES
// ============================================================================

/**
 * Database query result interface for favorites with recipe join
 */
interface FavoriteQueryResult {
  recipe_id: string;
  created_at: string;
  recipes: {
    id: string;
    title: string;
    description: string | null;
    nutrition_per_serving: NutritionDTO;
    prep_time_minutes: number | null;
  } | null;
}

// ============================================================================
// PUBLIC FUNCTIONS
// ============================================================================

/**
 * Get paginated list of user's favorite recipes with embedded recipe details
 * @param supabase - Supabase client instance from context.locals
 * @param userId - ID of the authenticated user
 * @param page - Page number (1-indexed, default: 1)
 * @param limit - Number of results per page (default: 20, max: 100)
 * @returns Object containing array of FavoriteDTO and pagination metadata
 * @throws Error if database query fails
 */
export async function getUserFavorites(
  supabase: SupabaseClient,
  userId: string,
  page = 1,
  limit = 20
): Promise<{ favorites: FavoriteDTO[]; pagination: PaginationDTO }> {
  // ========================================
  // BUILD QUERIES
  // ========================================

  // Count query - get total number of favorites for this user
  const countQuery = supabase.from("favorites").select("*", { count: "exact", head: true }).eq("user_id", userId);

  // Data query - get paginated favorites with recipe details
  const offset = (page - 1) * limit;
  const dataQuery = supabase
    .from("favorites")
    .select(
      `
      recipe_id,
      created_at,
      recipes:recipe_id (
        id,
        title,
        description,
        nutrition_per_serving,
        prep_time_minutes
      )
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  // ========================================
  // EXECUTE QUERIES IN PARALLEL
  // ========================================

  const [countResult, dataResult] = await Promise.all([countQuery, dataQuery]);

  if (countResult.error) {
    throw countResult.error;
  }

  if (dataResult.error) {
    throw dataResult.error;
  }

  const total = countResult.count || 0;
  const data = (dataResult.data || []) as unknown as FavoriteQueryResult[];

  // ========================================
  // MAP TO DTOS
  // ========================================

  // Filter out favorites with null recipes (orphaned favorites) and map to DTOs
  const favorites = data.filter((fav) => fav.recipes !== null).map(mapToFavoriteDTO);

  // ========================================
  // CALCULATE PAGINATION METADATA
  // ========================================

  const totalPages = Math.ceil(total / limit);
  const pagination: PaginationDTO = {
    page,
    limit,
    total,
    totalPages,
  };

  return { favorites, pagination };
}

/**
 * Add a recipe to user's favorites list
 * @param supabase - Supabase client instance from context.locals
 * @param userId - ID of the authenticated user
 * @param recipeId - ID of the recipe to add to favorites
 * @returns Object containing recipeId and createdAt timestamp
 * @throws RecipeNotFoundError if recipe doesn't exist
 * @throws RecipeNotAccessibleError if recipe is private and belongs to another user
 * @throws RecipeAlreadyFavoritedError if recipe is already in favorites
 * @throws Error if database query fails
 */
export async function addRecipeToFavorites(
  supabase: SupabaseClient,
  userId: string,
  recipeId: string
): Promise<{ recipeId: string; createdAt: string }> {
  // ========================================
  // STEP 1: CHECK RECIPE EXISTS AND GET ACCESSIBILITY INFO
  // ========================================

  const { data: recipe, error: recipeError } = await supabase
    .from("recipes")
    .select("id, user_id, is_public")
    .eq("id", recipeId)
    .single();

  if (recipeError) {
    // PGRST116 = "not found" error code
    if (recipeError.code === "PGRST116") {
      throw new RecipeNotFoundError(recipeId);
    }
    throw recipeError;
  }

  if (!recipe) {
    throw new RecipeNotFoundError(recipeId);
  }

  // ========================================
  // STEP 2: CHECK RECIPE ACCESSIBILITY
  // ========================================

  // Recipe is accessible if it's public OR belongs to the user
  const isAccessible = recipe.is_public || recipe.user_id === userId;
  if (!isAccessible) {
    throw new RecipeNotAccessibleError(recipeId);
  }

  // ========================================
  // STEP 3: CHECK IF ALREADY FAVORITED
  // ========================================

  const { data: existing, error: existingError } = await supabase
    .from("favorites")
    .select("user_id, recipe_id")
    .eq("user_id", userId)
    .eq("recipe_id", recipeId)
    .single();

  if (existingError && existingError.code !== "PGRST116") {
    // Throw error unless it's a "not found" error (which is expected)
    throw existingError;
  }

  if (existing) {
    throw new RecipeAlreadyFavoritedError(recipeId);
  }

  // ========================================
  // STEP 4: INSERT FAVORITE
  // ========================================

  const { data: favorite, error: insertError } = await supabase
    .from("favorites")
    .insert({
      user_id: userId,
      recipe_id: recipeId,
    })
    .select("recipe_id, created_at")
    .single();

  if (insertError) {
    throw insertError;
  }

  if (!favorite) {
    throw new Error("Failed to create favorite");
  }

  // ========================================
  // STEP 5: RETURN FAVORITE METADATA
  // ========================================

  // Convert snake_case to camelCase
  return {
    recipeId: favorite.recipe_id,
    createdAt: favorite.created_at,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Map database favorite result to FavoriteDTO
 * Converts snake_case to camelCase and structures nested recipe data
 * @param dbFavorite - Database query result with joined recipe data
 * @returns FavoriteDTO with camelCase fields
 */
function mapToFavoriteDTO(dbFavorite: FavoriteQueryResult): FavoriteDTO {
  // This function is only called after filtering out null recipes
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const recipe = dbFavorite.recipes!;

  return {
    recipeId: dbFavorite.recipe_id,
    recipe: {
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      nutritionPerServing: recipe.nutrition_per_serving,
      prepTimeMinutes: recipe.prep_time_minutes,
    },
    createdAt: dbFavorite.created_at,
  };
}
