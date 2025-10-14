import type { SupabaseClient } from "../../db/supabase.client";
import type { IngredientSubstitutionDTO } from "../../types";

// ============================================================================
// DATABASE QUERY RESULT TYPES
// ============================================================================

/**
 * Type for ingredient_substitutions query result from database
 * Represents the raw database row with snake_case naming
 */
interface IngredientSubstitutionQueryResult {
  id: string;
  original_ingredient: string;
  substitute_ingredient: string;
  nutrition_comparison: {
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
  created_at: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Map database ingredient_substitution entity to DTO
 * Converts snake_case to camelCase and ensures proper typing
 * @param dbSubstitution - Database ingredient_substitution entity
 * @returns IngredientSubstitutionDTO with camelCase properties
 */
function mapSubstitutionToDTO(dbSubstitution: IngredientSubstitutionQueryResult): IngredientSubstitutionDTO {
  return {
    id: dbSubstitution.id,
    originalIngredient: dbSubstitution.original_ingredient,
    substituteIngredient: dbSubstitution.substitute_ingredient,
    nutritionComparison: dbSubstitution.nutrition_comparison,
    healthier: dbSubstitution.healthier,
    createdAt: dbSubstitution.created_at,
  };
}

// ============================================================================
// PUBLIC FUNCTIONS
// ============================================================================

/**
 * Get ingredient substitutions by ingredient name
 * Performs case-insensitive search on original_ingredient column
 * Optionally filters for only healthier alternatives
 *
 * @param supabase - Supabase client instance from context.locals
 * @param ingredient - Ingredient name to search for (case-insensitive)
 * @param healthierOnly - If true, returns only healthier substitutions
 * @returns Array of IngredientSubstitutionDTO (empty array if no matches)
 * @throws Error if database query fails
 *
 * @example
 * const substitutions = await getIngredientSubstitutions(supabase, "masło", true);
 * // Returns healthier alternatives for "masło" (butter)
 */
export async function getIngredientSubstitutions(
  supabase: SupabaseClient,
  ingredient: string,
  healthierOnly = false
): Promise<IngredientSubstitutionDTO[]> {
  // Build query with ILIKE for case-insensitive search
  let query = supabase
    .from("ingredient_substitutions")
    .select("id, original_ingredient, substitute_ingredient, nutrition_comparison, healthier, created_at")
    .ilike("original_ingredient", ingredient);

  // Apply healthier filter if requested
  if (healthierOnly) {
    query = query.eq("healthier", true);
  }

  // Order by most recent first
  query = query.order("created_at", { ascending: false });

  // Execute query
  const { data, error } = await query;

  if (error) {
    throw error;
  }

  // Return empty array if no results
  if (!data || data.length === 0) {
    return [];
  }

  // Map database results to DTOs
  return data.map((item) => mapSubstitutionToDTO(item as IngredientSubstitutionQueryResult));
}
