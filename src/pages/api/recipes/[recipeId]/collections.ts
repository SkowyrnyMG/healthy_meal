import type { APIRoute } from "astro";
import { z } from "zod";
import { getCollectionsForRecipe } from "../../../../lib/services/collection.service";

export const prerender = false;

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

/**
 * Zod schema for validating recipeId path parameter
 */
const RecipeIdParamSchema = z.string().uuid("Invalid recipe ID format");

// ============================================================================
// API ROUTE HANDLERS
// ============================================================================

/**
 * GET /api/recipes/{recipeId}/collections
 * Gets all collection IDs that contain a specific recipe for the authenticated user
 *
 * Path parameters: recipeId (UUID)
 *
 * Returns:
 * - 200: Success with array of collection IDs
 * - 400: Bad Request (invalid UUID format)
 * - 401: Unauthorized (authentication required) - currently mocked
 * - 500: Internal server error
 *
 * Response format:
 * {
 *   "collectionIds": ["uuid-1", "uuid-2", ...]
 * }
 *
 * @example
 * GET /api/recipes/987fcdeb-51a2-43d7-8912-123456789abc/collections
 * Response: { "collectionIds": ["123e4567-e89b-12d3-a456-426614174000"] }
 */
export const GET: APIRoute = async (context) => {
  // ========================================
  // AUTHENTICATION
  // ========================================

  const userId = context.locals.user?.id;

  if (!userId) {
    return new Response(
      JSON.stringify({
        error: "Unauthorized",
        message: "Authentication required",
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

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
    // RETRIEVE COLLECTIONS FOR RECIPE VIA SERVICE
    // ========================================

    const collectionIds = await getCollectionsForRecipe(context.locals.supabase, userId, validatedRecipeId);

    // ========================================
    // RETURN SUCCESS RESPONSE
    // ========================================

    return new Response(
      JSON.stringify({
        collectionIds,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Log unexpected errors
    // eslint-disable-next-line no-console
    console.error("[GET /api/recipes/{recipeId}/collections] Error:", {
      userId,
      recipeId: context.params.recipeId,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Return generic error response
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "Failed to retrieve collections for recipe",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
