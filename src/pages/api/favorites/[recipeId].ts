import type { APIRoute } from "astro";
import { z } from "zod";
import {
  removeRecipeFromFavorites,
  RecipeNotFoundError,
  RecipeNotAccessibleError,
  RecipeNotInFavoritesError,
} from "../../../lib/services/favorite.service";

export const prerender = false;

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const RecipeIdParamSchema = z.string().uuid("Invalid recipe ID format");

// ============================================================================
// API ROUTE HANDLERS
// ============================================================================

/**
 * DELETE /api/favorites/{recipeId}
 * Removes a recipe from the authenticated user's favorites list
 *
 * Path parameters: recipeId (UUID)
 *
 * Returns:
 * - 204: No Content (recipe successfully removed from favorites)
 * - 400: Bad Request (invalid recipe ID format)
 * - 401: Unauthorized (authentication required) - currently mocked for development
 * - 403: Forbidden (recipe is private and belongs to another user)
 * - 404: Not Found (recipe not found OR recipe not in favorites)
 * - 500: Internal server error
 *
 * @example
 * DELETE /api/favorites/123e4567-e89b-12d3-a456-426614174000
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
    // PATH PARAMETER EXTRACTION AND VALIDATION
    // ========================================

    const recipeId = context.params.recipeId;

    // Validate recipeId format
    let validatedRecipeId: string;
    try {
      validatedRecipeId = RecipeIdParamSchema.parse(recipeId);
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

    await removeRecipeFromFavorites(context.locals.supabase, userId, validatedRecipeId);

    // Success response - 204 No Content
    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    // Handle specific business logic errors
    if (error instanceof RecipeNotFoundError) {
      console.info("[DELETE /api/favorites/{recipeId}] Recipe not found:", {
        userId,
        recipeId: context.params.recipeId,
        error: error.message,
      });

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
      console.info("[DELETE /api/favorites/{recipeId}] Recipe not accessible:", {
        userId,
        recipeId: context.params.recipeId,
        error: error.message,
      });

      return new Response(
        JSON.stringify({
          error: "Forbidden",
          message: "Cannot access private recipes from other users",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (error instanceof RecipeNotInFavoritesError) {
      console.info("[DELETE /api/favorites/{recipeId}] Recipe not in favorites:", {
        userId,
        recipeId: context.params.recipeId,
        error: error.message,
      });

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
    console.error("[DELETE /api/favorites/{recipeId}] Error:", {
      userId,
      recipeId: context.params.recipeId,
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
