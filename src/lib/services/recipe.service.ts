import type { SupabaseClient } from "../../db/supabase.client";
import type { RecipeListItemDTO, TagDTO, NutritionDTO, PaginationDTO, RecipeQueryParams } from "../../types";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Database query result interface for recipes with tags
 */
interface RecipeQueryResult {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  servings: number;
  prep_time_minutes: number | null;
  is_public: boolean;
  featured: boolean;
  nutrition_per_serving: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    fiber: number;
    salt: number;
  };
  created_at: string;
  updated_at: string;
  recipe_tags: {
    tag_id: string;
    tags: {
      id: string;
      name: string;
      slug: string;
      created_at: string;
    } | null;
  }[];
}

// ============================================================================
// PUBLIC FUNCTIONS
// ============================================================================

/**
 * Get user's recipes with filtering, searching, sorting, and pagination
 * @param supabase - Supabase client instance from context.locals
 * @param userId - ID of the user whose recipes to retrieve
 * @param params - Query parameters for filtering, sorting, and pagination
 * @returns Object containing array of RecipeListItemDTO and pagination metadata
 * @throws Error if database query fails
 */
export async function getUserRecipes(
  supabase: SupabaseClient,
  userId: string,
  params: RecipeQueryParams
): Promise<{ recipes: RecipeListItemDTO[]; pagination: PaginationDTO }> {
  // Apply parameter defaults
  const {
    search,
    tags,
    maxCalories,
    maxPrepTime,
    isPublic,
    page = 1,
    limit = 20,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = params;

  // Build base query for count (separate from data query to avoid Supabase pagination issues)
  let countQuery = supabase.from("recipes").select("*", { count: "exact", head: true }).eq("user_id", userId);

  // Build data query
  let dataQuery = supabase
    .from("recipes")
    .select(
      `
      id,
      user_id,
      title,
      description,
      servings,
      prep_time_minutes,
      is_public,
      featured,
      nutrition_per_serving,
      created_at,
      updated_at,
      recipe_tags (
        tag_id,
        tags (
          id,
          name,
          slug,
          created_at
        )
      )
    `
    )
    .eq("user_id", userId);

  // Apply filters to both queries
  if (search) {
    const searchConfig = {
      type: "plain" as const,
      config: "simple",
    };
    countQuery = countQuery.textSearch("search_vector", `'${search}'`, searchConfig);
    dataQuery = dataQuery.textSearch("search_vector", `'${search}'`, searchConfig);
  }

  if (tags) {
    const tagUuids = tags.split(",").map((s) => s.trim());
    countQuery = countQuery.in("recipe_tags.tag_id", tagUuids);
    dataQuery = dataQuery.in("recipe_tags.tag_id", tagUuids);
  }

  if (maxCalories !== undefined) {
    countQuery = countQuery.lte("nutrition_per_serving->calories", maxCalories);
    dataQuery = dataQuery.lte("nutrition_per_serving->calories", maxCalories);
  }

  if (maxPrepTime !== undefined) {
    countQuery = countQuery.lte("prep_time_minutes", maxPrepTime);
    dataQuery = dataQuery.lte("prep_time_minutes", maxPrepTime);
  }

  if (isPublic !== undefined) {
    countQuery = countQuery.eq("is_public", isPublic);
    dataQuery = dataQuery.eq("is_public", isPublic);
  }

  // Apply sorting to data query only
  const sortColumn = mapSortByToColumn(sortBy);
  dataQuery = dataQuery.order(sortColumn, {
    ascending: sortOrder === "asc",
    nullsFirst: false,
  });

  // Apply pagination to data query only
  const offset = (page - 1) * limit;
  dataQuery = dataQuery.range(offset, offset + limit - 1);

  // Execute both queries
  const [countResult, dataResult] = await Promise.all([countQuery, dataQuery]);

  if (countResult.error) {
    throw countResult.error;
  }

  if (dataResult.error) {
    throw dataResult.error;
  }

  const count = countResult.count || 0;
  const data = dataResult.data || [];

  if (data.length === 0) {
    return {
      recipes: [],
      pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
    };
  }

  // Map to DTOs
  const recipes = data.map(mapToRecipeListItemDTO);

  // Calculate pagination
  const totalPages = Math.ceil(count / limit);
  const pagination: PaginationDTO = {
    page,
    limit,
    total: count,
    totalPages,
  };

  return { recipes, pagination };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Map sortBy parameter to database column name
 */
function mapSortByToColumn(sortBy: string): string {
  const columnMap: Record<string, string> = {
    createdAt: "created_at",
    updatedAt: "updated_at",
    title: "title",
    prepTime: "prep_time_minutes",
  };

  return columnMap[sortBy] || "created_at";
}

/**
 * Map database recipe result to RecipeListItemDTO
 * Converts snake_case to camelCase and flattens recipe_tags
 */
function mapToRecipeListItemDTO(dbRecipe: RecipeQueryResult): RecipeListItemDTO {
  // Extract and map tags from recipe_tags junction table
  const tags: TagDTO[] = dbRecipe.recipe_tags
    .filter((rt): rt is { tag_id: string; tags: NonNullable<typeof rt.tags> } => rt.tags !== null)
    .map((rt) => ({
      id: rt.tags.id,
      name: rt.tags.name,
      slug: rt.tags.slug,
      createdAt: rt.tags.created_at,
    }));

  // Map nutrition data (already in correct format from JSONB)
  const nutritionPerServing: NutritionDTO = {
    calories: dbRecipe.nutrition_per_serving.calories,
    protein: dbRecipe.nutrition_per_serving.protein,
    fat: dbRecipe.nutrition_per_serving.fat,
    carbs: dbRecipe.nutrition_per_serving.carbs,
    fiber: dbRecipe.nutrition_per_serving.fiber,
    salt: dbRecipe.nutrition_per_serving.salt,
  };

  return {
    id: dbRecipe.id,
    userId: dbRecipe.user_id,
    title: dbRecipe.title,
    description: dbRecipe.description,
    servings: dbRecipe.servings,
    prepTimeMinutes: dbRecipe.prep_time_minutes,
    isPublic: dbRecipe.is_public,
    featured: dbRecipe.featured,
    nutritionPerServing,
    tags,
    createdAt: dbRecipe.created_at,
    updatedAt: dbRecipe.updated_at,
  };
}
