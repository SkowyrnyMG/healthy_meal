import type { APIRoute } from "astro";

import { getUserAllergensByUserId } from "../../../lib/services/allergen.service";

export const prerender = false;

/**
 * GET /api/profile/allergens
 * Retrieves the current authenticated user's selected allergens
 *
 * Returns:
 * - 200: Array of UserAllergenDTO wrapped in { allergens: [] }
 * - 401: Unauthorized (authentication required) - currently commented for development
 * - 500: Internal server error
 */
export const GET: APIRoute = async (context) => {
  try {
    // ========================================
    // AUTHENTICATION (MOCK FOR DEVELOPMENT)
    // ========================================

    // TODO: Production - Uncomment this block for real authentication
    // const { data: { user }, error: authError } = await context.locals.supabase.auth.getUser();
    // if (authError || !user) {
    //   return new Response(
    //     JSON.stringify({
    //       error: "Unauthorized",
    //       message: "Authentication required"
    //     }),
    //     {
    //       status: 401,
    //       headers: { "Content-Type": "application/json" }
    //     }
    //   );
    // }
    // const userId = user.id;

    // MOCK: Remove this in production
    const userId = "550e8400-e29b-41d4-a716-446655440000"; // Mock user ID for development

    // ========================================
    // FETCH USER ALLERGENS
    // ========================================

    const allergens = await getUserAllergensByUserId(context.locals.supabase, userId);

    // Success response
    return new Response(JSON.stringify({ allergens }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Log error with context
    console.error("[GET /api/profile/allergens] Error:", {
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
