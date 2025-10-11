import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../../db/database.types";
import type { UserAllergenDTO } from "../../types";

/**
 * Get user's allergens by user ID
 * @param supabase - Supabase client instance from context.locals
 * @param userId - User ID from authentication session
 * @returns Array of UserAllergenDTO (empty array if no allergens)
 * @throws Error if database query fails
 */
export async function getUserAllergensByUserId(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<UserAllergenDTO[]> {
  const { data, error } = await supabase
    .from("user_allergens")
    .select("allergen_id, created_at, allergens(id, name_pl)")
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

/**
 * Type for user allergen query result with joined allergen data
 */
interface UserAllergenQueryResult {
  allergen_id: string;
  created_at: string;
  allergens: {
    id: string;
    name_pl: string;
  };
}

/**
 * Map database user_allergen entity to DTO
 * Converts snake_case to camelCase and extracts nested allergen data
 * @param dbUserAllergen - Database user_allergen entity with joined allergen
 * @returns UserAllergenDTO with camelCase properties
 */
function mapToDTO(dbUserAllergen: UserAllergenQueryResult): UserAllergenDTO {
  return {
    id: dbUserAllergen.allergens.id,
    name: dbUserAllergen.allergens.name_pl,
    addedAt: dbUserAllergen.created_at,
  };
}
