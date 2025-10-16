import type { APIRoute } from "astro";
import { getUserCollections } from "../../../lib/services/collection.service";

export const prerender = false;

// ============================================================================
// API ROUTE HANDLERS
// ============================================================================

/**
 * GET /api/collections
 * Retrieves all recipe collections for the authenticated user with recipe counts
 *
 * Returns:
 * - 200: { collections: CollectionDTO[] }
 * - 401: Authentication required (when real auth is enabled)
 * - 500: Internal server error
 *
 * @example
 * GET /api/collections
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
    const userId = "a85d6d6c-b7d4-4605-9cc4-3743401b67a0";

    // ========================================
    // RETRIEVE USER COLLECTIONS
    // ========================================

    const collections = await getUserCollections(context.locals.supabase, userId);

    // ========================================
    // RETURN SUCCESS RESPONSE
    // ========================================

    return new Response(JSON.stringify({ collections }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Log error with context
    console.error("[GET /api/collections] Error:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Return generic error response
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "Failed to retrieve collections",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
