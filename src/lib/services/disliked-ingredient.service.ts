import type { SupabaseClient } from "../../db/supabase.client";
import type { DislikedIngredientDTO } from "../../types";

// ============================================================================
// CUSTOM ERROR CLASSES
// ============================================================================

/**
 * Error thrown when ingredient is already in user's disliked list
 */
export class IngredientAlreadyExistsError extends Error {
  constructor(ingredientName: string) {
    super(`Ingredient already in disliked list: ${ingredientName}`);
    this.name = "IngredientAlreadyExistsError";
  }
}

/**
 * Error thrown when ingredient is not in user's disliked list
 */
export class IngredientNotInUserListError extends Error {
  constructor(ingredientId: string) {
    super(`Ingredient not in user's disliked list: ${ingredientId}`);
    this.name = "IngredientNotInUserListError";
  }
}

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

/**
 * Check if user already has this ingredient in their disliked list (case-insensitive)
 * @param supabase - Supabase client instance
 * @param userId - User ID
 * @param ingredientName - Ingredient name to check
 * @returns true if user has ingredient, false otherwise
 * @throws Error if database query fails
 */
async function checkUserHasIngredient(
  supabase: SupabaseClient,
  userId: string,
  ingredientName: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_disliked_ingredients")
    .select("id")
    .eq("user_id", userId)
    .ilike("ingredient_name", ingredientName)
    .single();

  if (error) {
    // PGRST116 = "not found" error code
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

/**
 * Add disliked ingredient to user's profile
 * @param supabase - Supabase client instance from context.locals
 * @param userId - User ID from authentication session
 * @param ingredientName - Ingredient name to add (will be trimmed)
 * @returns DislikedIngredientDTO with added ingredient data
 * @throws IngredientAlreadyExistsError if user already has this ingredient (case-insensitive)
 * @throws Error if database operation fails
 */
export async function addDislikedIngredientToUser(
  supabase: SupabaseClient,
  userId: string,
  ingredientName: string
): Promise<DislikedIngredientDTO> {
  // Trim ingredient name
  const trimmedName = ingredientName.trim();

  // Check if user already has this ingredient (case-insensitive)
  const userHasIngredient = await checkUserHasIngredient(supabase, userId, trimmedName);
  if (userHasIngredient) {
    throw new IngredientAlreadyExistsError(trimmedName);
  }

  // Insert new disliked ingredient and return the created record
  const { data, error } = await supabase
    .from("user_disliked_ingredients")
    .insert({
      user_id: userId,
      ingredient_name: trimmedName,
    })
    .select("id, ingredient_name, created_at")
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Failed to add disliked ingredient");
  }

  return mapToDTO(data);
}

/**
 * Remove disliked ingredient from user's profile
 * @param supabase - Supabase client instance from context.locals
 * @param userId - User ID from authentication session
 * @param ingredientId - Disliked ingredient ID to remove
 * @throws IngredientNotInUserListError if ingredient is not in user's disliked list
 * @throws Error if database operation fails
 */
export async function removeDislikedIngredientFromUser(
  supabase: SupabaseClient,
  userId: string,
  ingredientId: string
): Promise<void> {
  const { data, error } = await supabase
    .from("user_disliked_ingredients")
    .delete()
    .eq("id", ingredientId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      throw new IngredientNotInUserListError(ingredientId);
    }
    throw error;
  }

  if (!data) {
    throw new IngredientNotInUserListError(ingredientId);
  }
}
