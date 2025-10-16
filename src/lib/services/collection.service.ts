import type { SupabaseClient } from "../../db/supabase.client";
import type { CollectionDTO, CreateCollectionCommand } from "../../types";

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
