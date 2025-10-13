import type { SupabaseClient } from "../../db/supabase.client";
import type { TagDTO } from "../../types";

// ============================================================================
// PUBLIC FUNCTIONS
// ============================================================================

/**
 * Get all recipe tags
 * @param supabase - Supabase client instance from context.locals
 * @returns Array of TagDTO (empty array if no tags)
 * @throws Error if database query fails
 */
export async function getAllTags(supabase: SupabaseClient): Promise<TagDTO[]> {
  const { data, error } = await supabase
    .from("tags")
    .select("id, name, slug, created_at")
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
 * Type for tag query result from database
 */
interface TagQueryResult {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

/**
 * Map database tag entity to DTO
 * Converts snake_case to camelCase
 */
function mapToDTO(dbTag: TagQueryResult): TagDTO {
  return {
    id: dbTag.id,
    name: dbTag.name,
    slug: dbTag.slug,
    createdAt: dbTag.created_at,
  };
}
