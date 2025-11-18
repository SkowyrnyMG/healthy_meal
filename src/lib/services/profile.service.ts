import type { SupabaseClient } from "../../db/supabase.client";
import type { DbProfile, DbProfileUpdate, ProfileDTO, UpdateProfileCommand } from "../../types";

/**
 * Get user profile by user ID
 * @param supabase - Supabase client instance from context.locals
 * @param userId - User ID from authentication session
 * @returns ProfileDTO or null if not found
 * @throws Error if database query fails
 */
export async function getProfileByUserId(supabase: SupabaseClient, userId: string): Promise<ProfileDTO | null> {
  const { data, error } = await supabase.from("profiles").select("*").eq("user_id", userId).single();

  if (error) {
    // PGRST116 = "not found" error code from PostgREST
    // This is an acceptable case - user may not have a profile yet
    if (error.code === "PGRST116") {
      return null;
    }
    // Other errors should be thrown for proper error handling
    throw error;
  }

  if (!data) {
    return null;
  }

  return mapToDTO(data);
}

/**
 * Update user profile by user ID
 * @param supabase - Supabase client instance from context.locals
 * @param userId - User ID from authentication session
 * @param data - Partial profile data to update
 * @returns Updated ProfileDTO
 * @throws Error if database query fails or profile not found
 */
export async function updateProfileByUserId(
  supabase: SupabaseClient,
  userId: string,
  data: UpdateProfileCommand
): Promise<ProfileDTO> {
  // Convert camelCase DTO to snake_case for database
  const dbUpdate: DbProfileUpdate = {
    weight: data.weight,
    age: data.age,
    gender: data.gender,
    activity_level: data.activityLevel,
    diet_type: data.dietType,
    target_goal: data.targetGoal,
    target_value: data.targetValue,
    updated_at: new Date().toISOString(),
  };

  // Remove undefined fields to allow partial updates
  const cleanedUpdate = Object.fromEntries(
    Object.entries(dbUpdate).filter(([, value]) => value !== undefined)
  ) as DbProfileUpdate;

  const { data: updatedProfile, error } = await supabase
    .from("profiles")
    .update(cleanedUpdate)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  if (!updatedProfile) {
    throw new Error("Profile not found");
  }

  return mapToDTO(updatedProfile);
}

/**
 * Map database profile entity to DTO
 * Converts snake_case to camelCase and formats timestamps
 * @param dbProfile - Database profile entity
 * @returns ProfileDTO with camelCase properties
 */
function mapToDTO(dbProfile: DbProfile): ProfileDTO {
  return {
    userId: dbProfile.user_id,
    weight: dbProfile.weight,
    age: dbProfile.age,
    gender: dbProfile.gender,
    activityLevel: dbProfile.activity_level,
    dietType: dbProfile.diet_type,
    targetGoal: dbProfile.target_goal,
    targetValue: dbProfile.target_value,
    createdAt: dbProfile.created_at,
    updatedAt: dbProfile.updated_at,
  };
}
