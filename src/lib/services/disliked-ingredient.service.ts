import type { SupabaseClient } from "../../db/supabase.client";
import type { DislikedIngredientDTO } from "../../types";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Type for user disliked ingredient query result
 */
interface DislikedIngredientQueryResult {
  id: string;
  ingredient_name: string;
  created_at: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Map database user_disliked_ingredient entity to DTO
 * Converts snake_case to camelCase
 * @param dbRecord - Database disliked ingredient record
 * @returns DislikedIngredientDTO with camelCase properties
 */
function mapToDTO(dbRecord: DislikedIngredientQueryResult): DislikedIngredientDTO {
  return {
    id: dbRecord.id,
    ingredientName: dbRecord.ingredient_name,
    createdAt: dbRecord.created_at,
  };
}

// ============================================================================
// PUBLIC FUNCTIONS
// ============================================================================

/**
 * Get user's disliked ingredients by user ID
 * @param supabase - Supabase client instance from context.locals
 * @param userId - User ID from authentication session
 * @returns Array of DislikedIngredientDTO (empty array if no disliked ingredients)
 * @throws Error if database query fails
 */
export async function getDislikedIngredientsByUserId(
  supabase: SupabaseClient,
  userId: string
): Promise<DislikedIngredientDTO[]> {
  const { data, error } = await supabase
    .from("user_disliked_ingredients")
    .select("id, ingredient_name, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    return [];
  }

  return data.map(mapToDTO);
}
