import type { APIRoute } from "astro";
import { z } from "zod";
import {
  removeRecipeFromCollection,
  CollectionNotFoundError,
  RecipeNotInCollectionError,
} from "../../../../../lib/services/collection.service";

export const prerender = false;

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

/**
 * Zod schema for validating collectionId path parameter
 */
const CollectionIdParamSchema = z.string().uuid("Invalid collection ID format");

/**
 * Zod schema for validating recipeId path parameter
 */
const RecipeIdParamSchema = z.string().uuid("Invalid recipe ID format");

// ============================================================================
// API ROUTE HANDLERS
// ============================================================================

/**
 * DELETE /api/collections/{collectionId}/recipes/{recipeId}
 * Removes a recipe from a collection for the authenticated user
 *
 * Path parameters: collectionId (UUID), recipeId (UUID)
 *
 * Returns:
 * - 204: No Content (recipe successfully removed from collection)
 * - 400: Bad Request (invalid UUID format)
 * - 401: Unauthorized (authentication required) - currently mocked
 * - 404: Not Found (collection not found, not authorized, or recipe not in collection)
 * - 500: Internal server error
 *
 * @example
 * DELETE /api/collections/123e4567-e89b-12d3-a456-426614174000/recipes/987fcdeb-51a2-43d7-8912-123456789abc
 */
export const DELETE: APIRoute = async (context) => {
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

    const collectionId = context.params.collectionId;
    const recipeId = context.params.recipeId;

    // Validate collectionId format
    let validatedCollectionId: string;
    try {
      validatedCollectionId = CollectionIdParamSchema.parse(collectionId);
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
    // REMOVE RECIPE FROM COLLECTION VIA SERVICE
    // ========================================

    await removeRecipeFromCollection(context.locals.supabase, userId, validatedCollectionId, validatedRecipeId);

    // ========================================
    // RETURN SUCCESS RESPONSE (204 NO CONTENT)
    // ========================================

    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    // Handle specific business logic errors
    if (error instanceof CollectionNotFoundError) {
      console.info("[DELETE /api/collections/{collectionId}/recipes/{recipeId}] Collection not found:", {
        userId,
        collectionId: context.params.collectionId,
        error: error.message,
      });

      return new Response(
        JSON.stringify({
          error: "Not Found",
          message: "Recipe not found in collection",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (error instanceof RecipeNotInCollectionError) {
      console.info("[DELETE /api/collections/{collectionId}/recipes/{recipeId}] Recipe not in collection:", {
        userId,
        collectionId: context.params.collectionId,
        recipeId: context.params.recipeId,
        error: error.message,
      });

      return new Response(
        JSON.stringify({
          error: "Not Found",
          message: "Recipe not found in collection",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Log unexpected errors
    console.error("[DELETE /api/collections/{collectionId}/recipes/{recipeId}] Error:", {
      userId,
      collectionId: context.params.collectionId,
      recipeId: context.params.recipeId,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Return generic error response
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "Failed to remove recipe from collection",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
