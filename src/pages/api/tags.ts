import type { APIRoute } from "astro";
import { getAllTags } from "../../lib/services/tag.service";

export const prerender = false;

/**
 * GET /api/tags
 * Retrieves all recipe tags (publicly accessible)
 *
 * Returns:
 * - 200: Array of TagDTO wrapped in { tags: [] }
 * - 500: Internal server error
 */
export const GET: APIRoute = async (context) => {
  try {
    // ========================================
    // FETCH ALL TAGS
    // ========================================

    const tags = await getAllTags(context.locals.supabase);

    // Success response
    return new Response(JSON.stringify({ tags }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Log error with context
    console.error("[GET /api/tags] Error:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Return generic error response
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
