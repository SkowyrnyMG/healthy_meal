import type { APIRoute } from "astro";

import { getDislikedIngredientsByUserId } from "../../../lib/services/disliked-ingredient.service";

export const prerender = false;

/**
 * GET /api/profile/disliked-ingredients
 * Retrieves the current authenticated user's disliked ingredients
 *
 * Returns:
 * - 200: Array of DislikedIngredientDTO wrapped in { dislikedIngredients: [] }
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
    const userId = "c4afdcfc-d36b-4f19-b62d-0de187151b87"; // Mock user ID for development

    // ========================================
    // FETCH USER DISLIKED INGREDIENTS
    // ========================================

    const dislikedIngredients = await getDislikedIngredientsByUserId(context.locals.supabase, userId);

    // Success response
    return new Response(JSON.stringify({ dislikedIngredients }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Log error with context
    console.error("[GET /api/profile/disliked-ingredients] Error:", {
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
