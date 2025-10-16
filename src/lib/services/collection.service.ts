import type { SupabaseClient } from "../../db/supabase.client";
import type { CollectionDTO } from "../../types";

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
