import type { APIRoute } from "astro";
import { z } from "zod";
import {
  addRecipeToCollection,
  CollectionNotFoundError,
  RecipeNotFoundError,
  RecipeAlreadyInCollectionError,
} from "../../../../lib/services/collection.service";

export const prerender = false;

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

/**
 * Zod schema for validating collectionId path parameter
 */
const CollectionIdParamSchema = z.string().uuid("Invalid collection ID format");

/**
 * Zod schema for validating request body
 */
const AddRecipeToCollectionSchema = z.object({
  recipeId: z.string().uuid("Invalid recipe ID format"),
});

// ============================================================================
// API ROUTE HANDLERS
// ============================================================================

/**
 * POST /api/collections/{collectionId}/recipes
 * Adds a recipe to a collection for the authenticated user
 *
 * Path parameters: collectionId (UUID)
 * Request body: { recipeId: string (UUID) }
 *
 * Returns:
 * - 201: Created (recipe successfully added to collection)
 * - 400: Bad Request (invalid JSON, validation errors)
 * - 401: Unauthorized (authentication required) - currently mocked
 * - 404: Not Found (collection not found, not authorized, or recipe not found)
 * - 409: Conflict (recipe already exists in collection)
 * - 500: Internal server error
 *
 * @example
 * POST /api/collections/123e4567-e89b-12d3-a456-426614174000/recipes
 * Body: { "recipeId": "987fcdeb-51a2-43d7-8912-123456789abc" }
 */
export const POST: APIRoute = async (context) => {
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

    let validatedData: z.infer<typeof AddRecipeToCollectionSchema>;
    try {
      validatedData = AddRecipeToCollectionSchema.parse(body);
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
    // ADD RECIPE TO COLLECTION VIA SERVICE
    // ========================================

    const collectionRecipe = await addRecipeToCollection(
      context.locals.supabase,
      userId,
      validatedCollectionId,
      validatedData
    );

    // ========================================
    // RETURN SUCCESS RESPONSE
    // ========================================

    return new Response(
      JSON.stringify({
        success: true,
        collectionRecipe,
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Handle specific business logic errors
    if (error instanceof CollectionNotFoundError) {
      console.info("[POST /api/collections/{collectionId}/recipes] Collection not found:", {
        userId,
        collectionId: context.params.collectionId,
        error: error.message,
      });

      return new Response(
        JSON.stringify({
          error: "Not Found",
          message: "Collection not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (error instanceof RecipeNotFoundError) {
      console.info("[POST /api/collections/{collectionId}/recipes] Recipe not found:", {
        userId,
        collectionId: context.params.collectionId,
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

    if (error instanceof RecipeAlreadyInCollectionError) {
      console.info("[POST /api/collections/{collectionId}/recipes] Recipe already in collection:", {
        userId,
        collectionId: context.params.collectionId,
        error: error.message,
      });

      return new Response(
        JSON.stringify({
          error: "Conflict",
          message: "Recipe already exists in this collection",
        }),
        {
          status: 409,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Log unexpected errors
    console.error("[POST /api/collections/{collectionId}/recipes] Error:", {
      userId,
      collectionId: context.params.collectionId,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Return generic error response
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "Failed to add recipe to collection",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
