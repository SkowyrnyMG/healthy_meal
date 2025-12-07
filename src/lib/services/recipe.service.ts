import type { SupabaseClient } from "../../db/supabase.client";
import type {
  RecipeListItemDTO,
  RecipeDetailDTO,
  TagDTO,
  NutritionDTO,
  PaginationDTO,
  RecipeQueryParams,
  CreateRecipeCommand,
  UpdateRecipeCommand,
  DbRecipeInsert,
  DbRecipeUpdate,
  DbRecipeTagInsert,
} from "../../types";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Database query result interface for recipes with tags (list view)
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

/**
 * Database query result interface for recipe detail with full data
 */
interface RecipeDetailQueryResult {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  ingredients: {
    name: string;
    amount: number;
    unit: string;
  }[];
  steps: {
    stepNumber: number;
    instruction: string;
  }[];
  servings: number;
  nutrition_per_serving: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    fiber: number;
    salt: number;
  };
  prep_time_minutes: number | null;
  is_public: boolean;
  featured: boolean;
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
    // Filter recipes that have at least one of the specified tags
    // We need to query recipe_tags table first to get recipe IDs
    const { data: recipeIdsWithTags } = await supabase.from("recipe_tags").select("recipe_id").in("tag_id", tagUuids);

    if (recipeIdsWithTags && recipeIdsWithTags.length > 0) {
      const recipeIds = [...new Set(recipeIdsWithTags.map((rt) => rt.recipe_id))];
      countQuery = countQuery.in("id", recipeIds);
      dataQuery = dataQuery.in("id", recipeIds);
    } else {
      // No recipes found with these tags - return empty result early
      return {
        recipes: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      };
    }
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
  const data = (dataResult.data || []) as RecipeQueryResult[];

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

/**
 * Get public recipes from all users with filtering, searching, sorting, and pagination
 * @param supabase - Supabase client instance from context.locals
 * @param params - Query parameters for filtering, sorting, and pagination
 * @returns Object containing array of RecipeListItemDTO and pagination metadata
 * @throws Error if database query fails
 */
export async function getPublicRecipes(
  supabase: SupabaseClient,
  params: RecipeQueryParams
): Promise<{ recipes: RecipeListItemDTO[]; pagination: PaginationDTO }> {
  // Apply parameter defaults
  const {
    search,
    tags,
    maxCalories,
    maxPrepTime,
    page = 1,
    limit = 20,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = params;

  // Build base query for count (separate from data query to avoid Supabase pagination issues)
  let countQuery = supabase.from("recipes").select("*", { count: "exact", head: true }).eq("is_public", true); // Hardcoded - only public recipes

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
    .eq("is_public", true); // Hardcoded - only public recipes

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
    // Filter recipes that have at least one of the specified tags
    // We need to query recipe_tags table first to get recipe IDs
    const { data: recipeIdsWithTags } = await supabase.from("recipe_tags").select("recipe_id").in("tag_id", tagUuids);

    if (recipeIdsWithTags && recipeIdsWithTags.length > 0) {
      const recipeIds = [...new Set(recipeIdsWithTags.map((rt) => rt.recipe_id))];
      countQuery = countQuery.in("id", recipeIds);
      dataQuery = dataQuery.in("id", recipeIds);
    } else {
      // No recipes found with these tags - return empty result early
      return {
        recipes: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      };
    }
  }

  if (maxCalories !== undefined) {
    countQuery = countQuery.lte("nutrition_per_serving->calories", maxCalories);
    dataQuery = dataQuery.lte("nutrition_per_serving->calories", maxCalories);
  }

  if (maxPrepTime !== undefined) {
    countQuery = countQuery.lte("prep_time_minutes", maxPrepTime);
    dataQuery = dataQuery.lte("prep_time_minutes", maxPrepTime);
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

  // Execute both queries in parallel
  const [countResult, dataResult] = await Promise.all([countQuery, dataQuery]);

  if (countResult.error) {
    throw countResult.error;
  }

  if (dataResult.error) {
    throw dataResult.error;
  }

  const count = countResult.count || 0;
  const data = (dataResult.data || []) as RecipeQueryResult[];

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

/**
 * Get recipe by ID with complete details including ingredients, steps, and tags
 * @param supabase - Supabase client instance from context.locals
 * @param recipeId - UUID of the recipe to retrieve
 * @returns RecipeDetailDTO with complete recipe information or null if not found
 * @throws Error if database query fails (except for not found)
 */
export async function getRecipeById(supabase: SupabaseClient, recipeId: string): Promise<RecipeDetailDTO | null> {
  const { data, error } = await supabase
    .from("recipes")
    .select(
      `
      id,
      user_id,
      title,
      description,
      ingredients,
      steps,
      servings,
      nutrition_per_serving,
      prep_time_minutes,
      is_public,
      featured,
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
    .eq("id", recipeId)
    .single();

  // Handle not found gracefully (PGRST116 is PostgreSQL "not found" error)
  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw error;
  }

  if (!data) {
    return null;
  }

  return mapToRecipeDetailDTO(data as RecipeDetailQueryResult);
}

/**
 * Create a new recipe for a user
 * @param supabase - Supabase client instance from context.locals
 * @param userId - ID of the user creating the recipe
 * @param command - CreateRecipeCommand with validated recipe data
 * @returns RecipeDetailDTO with complete recipe information including tags
 * @throws Error if tag validation fails or database operation fails
 */
export async function createRecipe(
  supabase: SupabaseClient,
  userId: string,
  command: CreateRecipeCommand
): Promise<RecipeDetailDTO> {
  // ========================================
  // VALIDATE TAGS (if provided)
  // ========================================

  if (command.tagIds && command.tagIds.length > 0) {
    const { data: existingTags, error: tagError } = await supabase.from("tags").select("id").in("id", command.tagIds);

    if (tagError) {
      throw tagError;
    }

    if (!existingTags || existingTags.length !== command.tagIds.length) {
      throw new Error("One or more tag IDs are invalid");
    }
  }

  // ========================================
  // INSERT RECIPE
  // ========================================

  const recipeInsert: DbRecipeInsert = {
    user_id: userId,
    title: command.title,
    description: command.description || null,

    ingredients: command.ingredients as any, // JSONB field - type assertion required for Supabase

    steps: command.steps as any, // JSONB field - type assertion required for Supabase
    servings: command.servings,

    nutrition_per_serving: command.nutritionPerServing as any, // JSONB field - type assertion required for Supabase
    prep_time_minutes: command.prepTimeMinutes || null,
    is_public: command.isPublic ?? false,
    featured: false, // Default value - only admins can feature recipes
  };

  const { data: recipe, error: recipeError } = await supabase.from("recipes").insert(recipeInsert).select().single();

  if (recipeError || !recipe) {
    throw recipeError || new Error("Failed to create recipe");
  }

  // ========================================
  // INSERT RECIPE-TAG ASSOCIATIONS (if tags provided)
  // ========================================

  if (command.tagIds && command.tagIds.length > 0) {
    const recipeTagInserts: DbRecipeTagInsert[] = command.tagIds.map((tagId) => ({
      recipe_id: recipe.id,
      tag_id: tagId,
    }));

    const { error: tagAssocError } = await supabase.from("recipe_tags").insert(recipeTagInserts);

    if (tagAssocError) {
      throw tagAssocError;
    }
  }

  // ========================================
  // FETCH COMPLETE RECIPE WITH TAGS
  // ========================================

  const { data: completeRecipe, error: fetchError } = await supabase
    .from("recipes")
    .select(
      `
      id,
      user_id,
      title,
      description,
      ingredients,
      steps,
      servings,
      nutrition_per_serving,
      prep_time_minutes,
      is_public,
      featured,
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
    .eq("id", recipe.id)
    .single();

  if (fetchError || !completeRecipe) {
    throw fetchError || new Error("Failed to fetch created recipe");
  }

  // ========================================
  // MAP TO DTO AND RETURN
  // ========================================

  return mapToRecipeDetailDTO(completeRecipe as RecipeDetailQueryResult);
}

/**
 * Update an existing recipe for a user
 * @param supabase - Supabase client instance from context.locals
 * @param recipeId - UUID of the recipe to update
 * @param userId - ID of the user updating the recipe (for validation)
 * @param command - UpdateRecipeCommand with validated recipe data
 * @returns RecipeDetailDTO with complete updated recipe information including tags
 * @throws Error if tag validation fails or database operation fails
 */
export async function updateRecipe(
  supabase: SupabaseClient,
  recipeId: string,
  userId: string,
  command: UpdateRecipeCommand
): Promise<RecipeDetailDTO> {
  // ========================================
  // VALIDATE TAGS (if provided)
  // ========================================

  if (command.tagIds && command.tagIds.length > 0) {
    const { data: existingTags, error: tagError } = await supabase.from("tags").select("id").in("id", command.tagIds);

    if (tagError) {
      throw tagError;
    }

    if (!existingTags || existingTags.length !== command.tagIds.length) {
      throw new Error("One or more tag IDs are invalid");
    }
  }

  // ========================================
  // UPDATE RECIPE
  // ========================================

  const recipeUpdate: DbRecipeUpdate = {
    title: command.title,
    description: command.description || null,

    ingredients: command.ingredients as any, // JSONB field - type assertion required for Supabase

    steps: command.steps as any, // JSONB field - type assertion required for Supabase
    servings: command.servings,

    nutrition_per_serving: command.nutritionPerServing as any, // JSONB field - type assertion required for Supabase
    prep_time_minutes: command.prepTimeMinutes || null,
    is_public: command.isPublic ?? false,
    // Note: featured field is intentionally excluded - only admins can modify
  };

  const { data: recipe, error: recipeError } = await supabase
    .from("recipes")
    .update(recipeUpdate)
    .eq("id", recipeId)
    .select()
    .single();

  if (recipeError || !recipe) {
    throw recipeError || new Error("Failed to update recipe");
  }

  // ========================================
  // UPDATE RECIPE-TAG ASSOCIATIONS
  // ========================================

  // Delete all existing recipe-tag associations
  const { error: deleteError } = await supabase.from("recipe_tags").delete().eq("recipe_id", recipeId);

  if (deleteError) {
    throw deleteError;
  }

  // Insert new recipe-tag associations (if tags provided)
  if (command.tagIds && command.tagIds.length > 0) {
    const recipeTagInserts: DbRecipeTagInsert[] = command.tagIds.map((tagId) => ({
      recipe_id: recipeId,
      tag_id: tagId,
    }));

    const { error: tagAssocError } = await supabase.from("recipe_tags").insert(recipeTagInserts);

    if (tagAssocError) {
      throw tagAssocError;
    }
  }

  // ========================================
  // FETCH COMPLETE RECIPE WITH TAGS
  // ========================================

  const { data: completeRecipe, error: fetchError } = await supabase
    .from("recipes")
    .select(
      `
      id,
      user_id,
      title,
      description,
      ingredients,
      steps,
      servings,
      nutrition_per_serving,
      prep_time_minutes,
      is_public,
      featured,
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
    .eq("id", recipeId)
    .single();

  if (fetchError || !completeRecipe) {
    throw fetchError || new Error("Failed to fetch updated recipe");
  }

  // ========================================
  // MAP TO DTO AND RETURN
  // ========================================

  return mapToRecipeDetailDTO(completeRecipe as RecipeDetailQueryResult);
}

/**
 * Delete a recipe by ID (owner only)
 * @param supabase - Supabase client instance from context.locals
 * @param recipeId - UUID of the recipe to delete
 * @param userId - ID of the user attempting to delete (for ownership verification)
 * @throws Error if recipe not found or user is not the owner
 */
export async function deleteRecipe(supabase: SupabaseClient, recipeId: string, userId: string): Promise<void> {
  // ========================================
  // FETCH RECIPE TO VERIFY EXISTENCE AND OWNERSHIP
  // ========================================

  const recipe = await getRecipeById(supabase, recipeId);

  if (!recipe) {
    throw new Error("Recipe not found");
  }

  // ========================================
  // VERIFY OWNERSHIP (IDOR PROTECTION)
  // ========================================

  if (recipe.userId !== userId) {
    throw new Error("You don't have permission to delete this recipe");
  }

  // ========================================
  // DELETE RECIPE (CASCADE CONSTRAINTS HANDLE RELATED DATA)
  // ========================================

  const { error } = await supabase.from("recipes").delete().eq("id", recipeId);

  if (error) {
    throw error;
  }
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

/**
 * Map database recipe detail result to RecipeDetailDTO
 * Converts snake_case to camelCase, extracts JSONB fields, and flattens recipe_tags
 */
function mapToRecipeDetailDTO(dbRecipe: RecipeDetailQueryResult): RecipeDetailDTO {
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
    ingredients: dbRecipe.ingredients,
    steps: dbRecipe.steps,
    servings: dbRecipe.servings,
    nutritionPerServing,
    prepTimeMinutes: dbRecipe.prep_time_minutes,
    isPublic: dbRecipe.is_public,
    featured: dbRecipe.featured,
    tags,
    createdAt: dbRecipe.created_at,
    updatedAt: dbRecipe.updated_at,
  };
}
