import type { APIRoute } from "astro";
import { getAllAllergens } from "../../lib/services/allergen.service";

export const prerender = false;

/**
 * GET /api/allergens
 * Retrieves all allergens (publicly accessible)
 *
 * Returns:
 * - 200: Array of AllergenDTO wrapped in { allergens: [] }
 * - 500: Internal server error
 */
export const GET: APIRoute = async (context) => {
  try {
    // ========================================
    // FETCH ALL ALLERGENS
    // ========================================

    const allergens = await getAllAllergens(context.locals.supabase);

    // Success response
    return new Response(JSON.stringify({ allergens }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Log error with context
    console.error("[GET /api/allergens] Error:", {
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
