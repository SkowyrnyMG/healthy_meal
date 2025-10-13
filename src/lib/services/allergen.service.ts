import type { SupabaseClient } from "../../db/supabase.client";
import type { AllergenDTO, UserAllergenDTO } from "../../types";

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

/**
 * Error thrown when allergen is not in user's profile
 */
export class AllergenNotInUserListError extends Error {
  constructor(allergenId: string) {
    super(`Allergen not in user's list: ${allergenId}`);
    this.name = "AllergenNotInUserListError";
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
async function checkAllergenExists(supabase: SupabaseClient, allergenId: string): Promise<boolean> {
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
async function checkUserHasAllergen(supabase: SupabaseClient, userId: string, allergenId: string): Promise<boolean> {
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
export async function getUserAllergensByUserId(supabase: SupabaseClient, userId: string): Promise<UserAllergenDTO[]> {
  const { data, error } = await supabase
    .from("user_allergens")
    .select("allergen_id, created_at, allergens(id, name)")
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
    name: string;
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
    name: dbUserAllergen.allergens.name,
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
  supabase: SupabaseClient,
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
    .select("allergen_id, created_at, allergens(id, name)")
    .eq("user_id", userId)
    .eq("allergen_id", allergenId)
    .single();

  if (fetchError || !data) {
    throw fetchError || new Error("Failed to fetch added allergen");
  }

  return mapToDTO(data as UserAllergenQueryResult);
}

/**
 * Remove allergen from user's profile
 * @param supabase - Supabase client instance from context.locals
 * @param userId - User ID from authentication session
 * @param allergenId - Allergen ID to remove
 * @throws AllergenNotInUserListError if user doesn't have this allergen
 * @throws Error if database operation fails
 */
export async function removeAllergenFromUser(
  supabase: SupabaseClient,
  userId: string,
  allergenId: string
): Promise<void> {
  // Check if user has this allergen
  const userHasAllergen = await checkUserHasAllergen(supabase, userId, allergenId);
  if (!userHasAllergen) {
    throw new AllergenNotInUserListError(allergenId);
  }

  // Delete allergen from user's profile
  const { error } = await supabase.from("user_allergens").delete().eq("user_id", userId).eq("allergen_id", allergenId);

  if (error) {
    throw error;
  }
}

/**
 * Get all allergens
 * @param supabase - Supabase client instance from context.locals
 * @returns Array of AllergenDTO (empty array if no allergens)
 * @throws Error if database query fails
 */
export async function getAllAllergens(supabase: SupabaseClient): Promise<AllergenDTO[]> {
  const { data, error } = await supabase
    .from("allergens")
    .select("id, name, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    return [];
  }

  return data.map(mapAllergenToDTO);
}

/**
 * Type for allergen query result from database
 */
interface AllergenQueryResult {
  id: string;
  name: string;
  created_at: string;
}

/**
 * Map database allergen entity to DTO
 * Converts snake_case to camelCase
 */
function mapAllergenToDTO(dbAllergen: AllergenQueryResult): AllergenDTO {
  return {
    id: dbAllergen.id,
    name: dbAllergen.name,
    createdAt: dbAllergen.created_at,
  };
}
