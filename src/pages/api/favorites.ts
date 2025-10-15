import type { APIRoute } from "astro";
import { z } from "zod";
import { getUserFavorites } from "../../lib/services/favorite.service";

export const prerender = false;

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

/**
 * Zod schema for favorites query parameters validation
 */
const FavoritesQueryParamsSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

type ValidatedFavoritesQueryParams = z.infer<typeof FavoritesQueryParamsSchema>;

// ============================================================================
// API ROUTE HANDLERS
// ============================================================================

/**
 * GET /api/favorites
 * Retrieves paginated list of authenticated user's favorite recipes
 *
 * Query Parameters:
 * - page: Page number (positive integer, default: 1)
 * - limit: Results per page (1-100, default: 20)
 *
 * Returns:
 * - 200: { favorites: FavoriteDTO[], pagination: PaginationDTO }
 * - 400: Invalid query parameters
 * - 401: Authentication required (when real auth is enabled)
 * - 500: Internal server error
 *
 * @example
 * GET /api/favorites
 * GET /api/favorites?page=2&limit=10
 */
export const GET: APIRoute = async (context) => {
  try {
    // ========================================
    // AUTHENTICATION
    // ========================================

    // TODO: Production - Uncomment this block for real authentication
    // const { data: { user }, error: authError } = await context.locals.supabase.auth.getUser();
    // if (authError || !user) {
    //   return new Response(
    //     JSON.stringify({
    //       error: "Unauthorized",
    //       message: "Authentication required"
    //     }),
    //     { status: 401, headers: { "Content-Type": "application/json" } }
    //   );
    // }
    // const userId = user.id;

    // MOCK: Remove this in production - Authentication is mocked for development
    const userId = "a85d6d6c-b7d4-4605-9cc4-3743401b67a0";

    // ========================================
    // EXTRACT AND VALIDATE QUERY PARAMETERS
    // ========================================

    const url = new URL(context.request.url);
    const rawParams = {
      page: url.searchParams.get("page") ?? undefined,
      limit: url.searchParams.get("limit") ?? undefined,
    };

    let validatedParams: ValidatedFavoritesQueryParams;
    try {
      validatedParams = FavoritesQueryParamsSchema.parse(rawParams);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return new Response(
          JSON.stringify({
            error: "Bad Request",
            message: error.errors[0].message,
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      throw error;
    }

    // ========================================
    // FETCH USER FAVORITES
    // ========================================

    const { favorites, pagination } = await getUserFavorites(
      context.locals.supabase,
      userId,
      validatedParams.page,
      validatedParams.limit
    );

    // Success response
    return new Response(
      JSON.stringify({
        favorites,
        pagination,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Log error with context
    console.error("[GET /api/favorites] Error:", {
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
