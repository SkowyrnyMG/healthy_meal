import type { SupabaseClient } from "../../db/supabase.client";
import type { DbProfile, ProfileDTO } from "../../types";

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
