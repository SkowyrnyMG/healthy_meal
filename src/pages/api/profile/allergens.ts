import type { APIRoute } from "astro";
import { z } from "zod";

import {
  getUserAllergensByUserId,
  addAllergenToUser,
  AllergenNotFoundError,
  AllergenAlreadyExistsError,
} from "../../../lib/services/allergen.service";

export const prerender = false;

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const AddAllergenSchema = z.object({
  allergenId: z.string().uuid("Invalid allergen ID format"),
});

/**
 * GET /api/profile/allergens
 * Retrieves the current authenticated user's selected allergens
 *
 * Returns:
 * - 200: Array of UserAllergenDTO wrapped in { allergens: [] }
 * - 401: Unauthorized (authentication required) - currently commented for development
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
    const userId = "a85d6d6c-b7d4-4605-9cc4-3743401b67a0"; // Mock user ID for development

    // ========================================
    // FETCH USER ALLERGENS
    // ========================================

    const allergens = await getUserAllergensByUserId(context.locals.supabase, userId);

    // Success response
    return new Response(JSON.stringify({ allergens }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Log error with context
    console.error("[GET /api/profile/allergens] Error:", {
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
 * POST /api/profile/allergens
 * Adds a new allergen to the current authenticated user's profile
 *
 * Request body: { allergenId: string (UUID) }
 *
 * Returns:
 * - 201: Successfully added allergen with data
 * - 400: Bad Request (invalid ID, allergen not found)
 * - 401: Unauthorized (authentication required) - currently commented for development
 * - 409: Conflict (allergen already added)
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
    let validatedData: z.infer<typeof AddAllergenSchema>;
    try {
      validatedData = AddAllergenSchema.parse(body);
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
    // ADD ALLERGEN TO USER PROFILE
    // ========================================

    const allergen = await addAllergenToUser(context.locals.supabase, userId, validatedData.allergenId);

    // Success response
    return new Response(
      JSON.stringify({
        success: true,
        allergen,
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Handle specific business logic errors
    if (error instanceof AllergenNotFoundError) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Allergen not found",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (error instanceof AllergenAlreadyExistsError) {
      console.info("[POST /api/profile/allergens] Duplicate allergen attempt:", {
        userId,
        error: error.message,
      });

      return new Response(
        JSON.stringify({
          error: "Conflict",
          message: "Allergen already added to profile",
        }),
        {
          status: 409,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Log unexpected errors
    console.error("[POST /api/profile/allergens] Error:", {
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
