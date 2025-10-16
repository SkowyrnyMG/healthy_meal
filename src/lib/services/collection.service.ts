import type { SupabaseClient } from "../../db/supabase.client";
import type {
  CollectionDTO,
  CollectionDetailDTO,
  CollectionRecipeDTO,
  CreateCollectionCommand,
  NutritionDTO,
  PaginationDTO,
} from "../../types";

// ============================================================================
// CUSTOM ERROR CLASSES
// ============================================================================

/**
 * Error thrown when collection with the same name already exists for the user
 */
export class CollectionAlreadyExistsError extends Error {
  constructor(name: string) {
    super(`Collection with name already exists: ${name}`);
    this.name = "CollectionAlreadyExistsError";
  }
}

/**
 * Error thrown when collection is not found or user is not authorized
 * Used for both cases to prevent enumeration attacks
 */
export class CollectionNotFoundError extends Error {
  constructor(collectionId: string) {
    super(`Collection not found: ${collectionId}`);
    this.name = "CollectionNotFoundError";
  }
}

// ============================================================================
// TYPES
// ============================================================================

/**
 * Database query result interface for collections with recipe count
 */
interface CollectionQueryResult {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  collection_recipes: { count: number }[];
}

/**
 * Database query result interface for collection recipe with joined recipe data
 */
interface CollectionRecipeQueryResult {
  recipe_id: string;
  added_at: string;
  recipes: {
    id: string;
    title: string;
    description: string | null;
    nutrition_per_serving: NutritionDTO;
  } | null;
}

// ============================================================================
// PUBLIC FUNCTIONS
// ============================================================================

/**
 * Create a new collection for a user
 * @param supabase - Supabase client instance from context.locals
 * @param userId - ID of the authenticated user
 * @param command - CreateCollectionCommand with collection name
 * @returns CollectionDTO with the newly created collection (recipeCount: 0)
 * @throws CollectionAlreadyExistsError if collection with the same name already exists for the user
 * @throws Error if database query fails
 */
export async function createCollection(
  supabase: SupabaseClient,
  userId: string,
  command: CreateCollectionCommand
): Promise<CollectionDTO> {
  // ========================================
  // STEP 1: TRIM AND VALIDATE NAME
  // ========================================

  const trimmedName = command.name.trim();

  // ========================================
  // STEP 2: CHECK FOR DUPLICATE NAME
  // ========================================

  const { data: existing, error: existingError } = await supabase
    .from("collections")
    .select("id")
    .eq("user_id", userId)
    .eq("name", trimmedName)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing) {
    throw new CollectionAlreadyExistsError(trimmedName);
  }

  // ========================================
  // STEP 3: INSERT NEW COLLECTION
  // ========================================

  const { data: collection, error: insertError } = await supabase
    .from("collections")
    .insert({
      user_id: userId,
      name: trimmedName,
    })
    .select("id, user_id, name, created_at")
    .single();

  if (insertError) {
    throw insertError;
  }

  if (!collection) {
    throw new Error("Failed to create collection");
  }

  // ========================================
  // STEP 4: RETURN COLLECTION DTO
  // ========================================

  return {
    id: collection.id,
    userId: collection.user_id,
    name: collection.name,
    recipeCount: 0, // New collection has no recipes
    createdAt: collection.created_at,
  };
}

/**
 * Get all collections for a user with recipe counts
 * @param supabase - Supabase client instance from context.locals
 * @param userId - ID of the authenticated user
 * @returns Array of CollectionDTO with recipe counts
 * @throws Error if database query fails
 */
export async function getUserCollections(supabase: SupabaseClient, userId: string): Promise<CollectionDTO[]> {
  // ========================================
  // QUERY COLLECTIONS WITH RECIPE COUNT
  // ========================================

  const { data, error } = await supabase
    .from("collections")
    .select(
      `
      id,
      user_id,
      name,
      created_at,
      collection_recipes(count)
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  // ========================================
  // MAP TO DTOS
  // ========================================

  const collections = (data || []) as unknown as CollectionQueryResult[];

  return collections.map(mapToCollectionDTO);
}

/**
 * Get a specific collection with paginated recipes
 * @param supabase - Supabase client instance from context.locals
 * @param userId - ID of the authenticated user
 * @param collectionId - ID of the collection to retrieve
 * @param page - Page number (1-indexed, default: 1)
 * @param limit - Number of recipes per page (default: 20, max: 100)
 * @returns CollectionDetailDTO with paginated recipes and metadata
 * @throws CollectionNotFoundError if collection not found or user is not authorized
 * @throws Error if database query fails
 */
export async function getCollectionWithRecipes(
  supabase: SupabaseClient,
  userId: string,
  collectionId: string,
  page = 1,
  limit = 20
): Promise<CollectionDetailDTO> {
  // ========================================
  // STEP 1: FETCH COLLECTION AND VERIFY OWNERSHIP
  // ========================================

  const { data: collection, error: collectionError } = await supabase
    .from("collections")
    .select("id, user_id, name, created_at")
    .eq("id", collectionId)
    .eq("user_id", userId)
    .single();

  if (collectionError) {
    // PGRST116 = "not found" error code
    if (collectionError.code === "PGRST116") {
      throw new CollectionNotFoundError(collectionId);
    }
    throw collectionError;
  }

  if (!collection) {
    throw new CollectionNotFoundError(collectionId);
  }

  // ========================================
  // STEP 2: COUNT TOTAL RECIPES IN COLLECTION
  // ========================================

  const { count, error: countError } = await supabase
    .from("collection_recipes")
    .select("*", { count: "exact", head: true })
    .eq("collection_id", collectionId);

  if (countError) {
    throw countError;
  }

  const total = count || 0;

  // ========================================
  // STEP 3: CALCULATE PAGINATION
  // ========================================

  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;

  // ========================================
  // STEP 4: FETCH PAGINATED RECIPES
  // ========================================

  const { data: collectionRecipes, error: recipesError } = await supabase
    .from("collection_recipes")
    .select(
      `
      recipe_id,
      added_at,
      recipes:recipe_id (
        id,
        title,
        description,
        nutrition_per_serving
      )
    `
    )
    .eq("collection_id", collectionId)
    .order("added_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (recipesError) {
    throw recipesError;
  }

  // ========================================
  // STEP 5: MAP TO DTO
  // ========================================

  const recipes = (collectionRecipes || []) as unknown as CollectionRecipeQueryResult[];

  // Filter out recipes with null recipe data (orphaned references)
  const validRecipes = recipes.filter((cr) => cr.recipes !== null);

  const pagination: PaginationDTO = {
    page,
    limit,
    total,
    totalPages,
  };

  return mapToCollectionDetailDTO(collection, validRecipes, pagination);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Map database collection result to CollectionDTO
 * Converts snake_case to camelCase and extracts recipe count from aggregation
 * @param dbCollection - Database query result with recipe count aggregation
 * @returns CollectionDTO with camelCase fields
 */
function mapToCollectionDTO(dbCollection: CollectionQueryResult): CollectionDTO {
  return {
    id: dbCollection.id,
    userId: dbCollection.user_id,
    name: dbCollection.name,
    recipeCount: dbCollection.collection_recipes?.[0]?.count ?? 0,
    createdAt: dbCollection.created_at,
  };
}

/**
 * Map database collection and recipes to CollectionDetailDTO
 * Converts snake_case to camelCase and structures nested recipe data
 * @param collection - Database collection record
 * @param recipes - Array of collection recipes with joined recipe data (already filtered for null recipes)
 * @param pagination - Pagination metadata
 * @returns CollectionDetailDTO with camelCase fields and embedded recipes
 */
function mapToCollectionDetailDTO(
  collection: {
    id: string;
    user_id: string;
    name: string;
    created_at: string;
  },
  recipes: CollectionRecipeQueryResult[],
  pagination: PaginationDTO
): CollectionDetailDTO {
  // Map recipes to CollectionRecipeDTO format
  // recipes are already filtered to exclude null values before being passed here
  const mappedRecipes: CollectionRecipeDTO[] = recipes.map((cr) => {
    // Type guard to ensure recipe exists (should always be true due to prior filtering)
    if (!cr.recipes) {
      throw new Error("Unexpected null recipe in filtered results");
    }

    return {
      recipeId: cr.recipe_id,
      recipe: {
        id: cr.recipes.id,
        title: cr.recipes.title,
        description: cr.recipes.description,
        nutritionPerServing: cr.recipes.nutrition_per_serving,
      },
      createdAt: cr.added_at,
    };
  });

  return {
    id: collection.id,
    userId: collection.user_id,
    name: collection.name,
    recipes: mappedRecipes,
    pagination,
    createdAt: collection.created_at,
  };
}
