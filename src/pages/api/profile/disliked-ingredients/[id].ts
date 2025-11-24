import type { APIRoute } from "astro";
import { z } from "zod";

import {
  removeDislikedIngredientFromUser,
  IngredientNotInUserListError,
} from "../../../../lib/services/disliked-ingredient.service";

export const prerender = false;

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const DislikedIngredientIdSchema = z.string().uuid("Invalid disliked ingredient ID format");

/**
 * DELETE /api/profile/disliked-ingredients/{id}
 * Removes a specific disliked ingredient from the current authenticated user's profile
 *
 * Path parameters: id (disliked ingredient ID as UUID)
 *
 * Returns:
 * - 204: No Content (ingredient successfully removed)
 * - 400: Bad Request (invalid ingredient ID format)
 * - 401: Unauthorized (authentication required) - currently commented for development
 * - 404: Not Found (ingredient not in user's list)
 * - 500: Internal server error
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

    const ingredientId = context.params.id;

    // Validate ingredientId format
    let validatedIngredientId: string;
    try {
      validatedIngredientId = DislikedIngredientIdSchema.parse(ingredientId);
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
    // REMOVE DISLIKED INGREDIENT FROM USER PROFILE
    // ========================================

    await removeDislikedIngredientFromUser(context.locals.supabase, userId, validatedIngredientId);

    // Success response - 204 No Content
    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    // Handle specific business logic errors
    if (error instanceof IngredientNotInUserListError) {
      console.info("[DELETE /api/profile/disliked-ingredients/{id}] Ingredient not in list:", {
        userId,
        ingredientId: context.params.id,
        error: error.message,
      });

      return new Response(
        JSON.stringify({
          error: "Not Found",
          message: "Ingredient not in user's disliked list",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Log unexpected errors
    console.error("[DELETE /api/profile/disliked-ingredients/{id}] Error:", {
      userId,
      ingredientId: context.params.id,
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
