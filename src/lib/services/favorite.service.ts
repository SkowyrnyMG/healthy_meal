import type { SupabaseClient } from "../../db/supabase.client";
import type { FavoriteDTO, PaginationDTO, NutritionDTO } from "../../types";

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
