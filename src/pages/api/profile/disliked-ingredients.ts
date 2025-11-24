import type { APIRoute } from "astro";
import { z } from "zod";

import {
  getDislikedIngredientsByUserId,
  addDislikedIngredientToUser,
  IngredientAlreadyExistsError,
} from "../../../lib/services/disliked-ingredient.service";

export const prerender = false;

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const AddDislikedIngredientSchema = z.object({
  ingredientName: z
    .string()
    .trim()
    .min(1, "Ingredient name cannot be empty")
    .max(100, "Ingredient name cannot exceed 100 characters"),
});

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

/**
 * POST /api/profile/disliked-ingredients
 * Adds a new disliked ingredient to the current authenticated user's profile
 *
 * Request body: { ingredientName: string }
 *
 * Returns:
 * - 201: Successfully added ingredient with data
 * - 400: Bad Request (invalid input)
 * - 401: Unauthorized (authentication required) - currently commented for development
 * - 409: Conflict (ingredient already added)
 * - 500: Internal server error
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
    let validatedData: z.infer<typeof AddDislikedIngredientSchema>;
    try {
      validatedData = AddDislikedIngredientSchema.parse(body);
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
    // ADD DISLIKED INGREDIENT TO USER PROFILE
    // ========================================

    const dislikedIngredient = await addDislikedIngredientToUser(
      context.locals.supabase,
      userId,
      validatedData.ingredientName
    );

    // Success response
    return new Response(
      JSON.stringify({
        success: true,
        dislikedIngredient,
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Handle specific business logic errors
    if (error instanceof IngredientAlreadyExistsError) {
      console.info("[POST /api/profile/disliked-ingredients] Duplicate ingredient attempt:", {
        userId,
        error: error.message,
      });

      return new Response(
        JSON.stringify({
          error: "Conflict",
          message: "Ingredient already in disliked list",
        }),
        {
          status: 409,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Log unexpected errors
    console.error("[POST /api/profile/disliked-ingredients] Error:", {
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
