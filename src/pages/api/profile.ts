import type { APIRoute } from "astro";

import { getProfileByUserId } from "../../lib/services/profile.service";

export const prerender = false;

/**
 * GET /api/profile
 * Retrieves the current authenticated user's profile data
 *
 * Returns:
 * - 200: ProfileDTO with user's dietary preferences and physical data
 * - 401: Unauthorized (authentication required) - currently commented for development
 * - 404: Profile not found
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
    // FETCH PROFILE
    // ========================================

    const profile = await getProfileByUserId(context.locals.supabase, userId);

    // Handle not found
    if (!profile) {
      return new Response(
        JSON.stringify({
          error: "Not Found",
          message: "Profile not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Success response
    return new Response(JSON.stringify(profile), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Log error with context
    console.error("[GET /api/profile] Error:", {
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
