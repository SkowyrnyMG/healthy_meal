import type { APIRoute } from "astro";
import { z } from "zod";
import {
  getUserFavorites,
  addRecipeToFavorites,
  removeRecipeFromFavorites,
  RecipeNotFoundError,
  RecipeNotAccessibleError,
  RecipeAlreadyFavoritedError,
  RecipeNotInFavoritesError,
} from "../../lib/services/favorite.service";

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

/**
 * Zod schema for adding a favorite
 */
const AddFavoriteSchema = z.object({
  recipeId: z.string().uuid("Invalid recipe ID format"),
});

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

/**
 * POST /api/favorites
 * Adds a recipe to the authenticated user's favorites list
 *
 * Request body: { recipeId: string (UUID) }
 *
 * Returns:
 * - 201: Successfully added to favorites with metadata
 * - 400: Bad Request (invalid ID format, invalid JSON)
 * - 401: Unauthorized (authentication required)
 * - 403: Forbidden (recipe is private and belongs to another user)
 * - 404: Not Found (recipe not found)
 * - 409: Conflict (recipe already in favorites)
 * - 500: Internal server error
 */
export const POST: APIRoute = async (context) => {
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

  try {
    // ========================================
    // REQUEST BODY PARSING AND VALIDATION
    // ========================================

    let body: unknown;
    try {
      body = await context.request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Invalid JSON in request body",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate request body
    let validatedData: z.infer<typeof AddFavoriteSchema>;
    try {
      validatedData = AddFavoriteSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return new Response(
          JSON.stringify({
            error: "Bad Request",
            message: error.errors[0].message,
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      throw error;
    }

    // ========================================
    // ADD RECIPE TO FAVORITES
    // ========================================

    const favorite = await addRecipeToFavorites(context.locals.supabase, userId, validatedData.recipeId);

    // Success response
    return new Response(
      JSON.stringify({
        success: true,
        favorite,
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Handle specific business logic errors
    if (error instanceof RecipeNotFoundError) {
      return new Response(
        JSON.stringify({
          error: "Not Found",
          message: "Recipe not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (error instanceof RecipeNotAccessibleError) {
      return new Response(
        JSON.stringify({
          error: "Forbidden",
          message: "Cannot favorite private recipes from other users",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (error instanceof RecipeAlreadyFavoritedError) {
      console.info("[POST /api/favorites] Conflict:", {
        userId,
        recipeId: (error.message.match(/Recipe already favorited: (.+)/) || [])[1],
        error: error.message,
      });

      return new Response(
        JSON.stringify({
          error: "Conflict",
          message: "Recipe already in favorites",
        }),
        {
          status: 409,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Log unexpected errors
    console.error("[POST /api/favorites] Error:", {
      userId,
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

/**
 * DELETE /api/favorites
 * Removes a recipe from the authenticated user's favorites list
 *
 * Request body: { recipeId: string (UUID) }
 *
 * Returns:
 * - 200: Successfully removed from favorites
 * - 400: Bad Request (invalid ID format, invalid JSON)
 * - 401: Unauthorized (authentication required)
 * - 403: Forbidden (recipe is private and belongs to another user)
 * - 404: Not Found (recipe not found OR recipe not in favorites)
 * - 500: Internal server error
 */
export const DELETE: APIRoute = async (context) => {
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

  try {
    // ========================================
    // REQUEST BODY PARSING AND VALIDATION
    // ========================================

    let body: unknown;
    try {
      body = await context.request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Invalid JSON in request body",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate request body (reuse AddFavoriteSchema)
    let validatedData: z.infer<typeof AddFavoriteSchema>;
    try {
      validatedData = AddFavoriteSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return new Response(
          JSON.stringify({
            error: "Bad Request",
            message: error.errors[0].message,
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      throw error;
    }

    // ========================================
    // REMOVE RECIPE FROM FAVORITES
    // ========================================

    await removeRecipeFromFavorites(context.locals.supabase, userId, validatedData.recipeId);

    // Success response
    return new Response(
      JSON.stringify({
        success: true,
        message: "Recipe removed from favorites",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Handle specific business logic errors
    if (error instanceof RecipeNotFoundError) {
      return new Response(
        JSON.stringify({
          error: "Not Found",
          message: "Recipe not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (error instanceof RecipeNotAccessibleError) {
      return new Response(
        JSON.stringify({
          error: "Forbidden",
          message: "Cannot unfavorite private recipes from other users",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (error instanceof RecipeNotInFavoritesError) {
      return new Response(
        JSON.stringify({
          error: "Not Found",
          message: "Recipe not in favorites",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Log unexpected errors
    console.error("[DELETE /api/favorites] Error:", {
      userId,
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
