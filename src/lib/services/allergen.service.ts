import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../../db/database.types";
import type { UserAllergenDTO } from "../../types";

// ============================================================================
// CUSTOM ERROR CLASSES
// ============================================================================

/**
 * Error thrown when allergen is not found in the allergens table
 */
export class AllergenNotFoundError extends Error {
  constructor(allergenId: string) {
    super(`Allergen not found: ${allergenId}`);
    this.name = "AllergenNotFoundError";
  }
}

/**
 * Error thrown when user already has the allergen in their profile
 */
export class AllergenAlreadyExistsError extends Error {
  constructor(allergenId: string) {
    super(`Allergen already exists: ${allergenId}`);
    this.name = "AllergenAlreadyExistsError";
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if allergen exists in the allergens table
 * @param supabase - Supabase client instance
 * @param allergenId - Allergen ID to check
 * @returns true if exists, false otherwise
 * @throws Error if database query fails
 */
async function checkAllergenExists(supabase: SupabaseClient<Database>, allergenId: string): Promise<boolean> {
  const { data, error } = await supabase.from("allergens").select("id").eq("id", allergenId).single();

  if (error) {
    // PGRST116 = "not found" error code
    if (error.code === "PGRST116") {
      return false;
    }
    throw error;
  }

  return data !== null;
}

/**
 * Check if user already has this allergen
 * @param supabase - Supabase client instance
 * @param userId - User ID
 * @param allergenId - Allergen ID
 * @returns true if user has allergen, false otherwise
 * @throws Error if database query fails
 */
async function checkUserHasAllergen(
  supabase: SupabaseClient<Database>,
  userId: string,
  allergenId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_allergens")
    .select("allergen_id")
    .eq("user_id", userId)
    .eq("allergen_id", allergenId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return false;
    }
    throw error;
  }

  return data !== null;
}

// ============================================================================
// PUBLIC FUNCTIONS
// ============================================================================

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
    createdAt: dbUserAllergen.created_at,
  };
}

/**
 * Add allergen to user's profile
 * @param supabase - Supabase client instance from context.locals
 * @param userId - User ID from authentication session
 * @param allergenId - Allergen ID to add
 * @returns UserAllergenDTO with added allergen data
 * @throws AllergenNotFoundError if allergen doesn't exist
 * @throws AllergenAlreadyExistsError if user already has this allergen
 * @throws Error if database operation fails
 */
export async function addAllergenToUser(
  supabase: SupabaseClient<Database>,
  userId: string,
  allergenId: string
): Promise<UserAllergenDTO> {
  // Check if allergen exists
  const allergenExists = await checkAllergenExists(supabase, allergenId);
  if (!allergenExists) {
    throw new AllergenNotFoundError(allergenId);
  }

  // Check if user already has this allergen
  const userHasAllergen = await checkUserHasAllergen(supabase, userId, allergenId);
  if (userHasAllergen) {
    throw new AllergenAlreadyExistsError(allergenId);
  }

  // Insert new user allergen
  const { error: insertError } = await supabase.from("user_allergens").insert({
    user_id: userId,
    allergen_id: allergenId,
  });

  if (insertError) {
    throw insertError;
  }

  // Fetch the newly added allergen with complete data
  const { data, error: fetchError } = await supabase
    .from("user_allergens")
    .select("allergen_id, created_at, allergens(id, name_pl)")
    .eq("user_id", userId)
    .eq("allergen_id", allergenId)
    .single();

  if (fetchError || !data) {
    throw fetchError || new Error("Failed to fetch added allergen");
  }

  return mapToDTO(data as UserAllergenQueryResult);
}
