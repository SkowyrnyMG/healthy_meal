import type { APIRoute } from "astro";
import { z } from "zod";

import { removeAllergenFromUser, AllergenNotInUserListError } from "../../../../lib/services/allergen.service";

export const prerender = false;

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const AllergenIdSchema = z.string().uuid("Invalid allergen ID format");

/**
 * DELETE /api/profile/allergens/{id}
 * Removes a specific allergen from the current authenticated user's profile
 *
 * Path parameters: id (allergenId as UUID)
 *
 * Returns:
 * - 204: No Content (allergen successfully removed)
 * - 400: Bad Request (invalid allergen ID format)
 * - 401: Unauthorized (authentication required) - currently commented for development
 * - 404: Not Found (allergen not in user's list)
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
  const userId = "c4afdcfc-d36b-4f19-b62d-0de187151b87";

  try {
    // ========================================
    // PATH PARAMETER EXTRACTION AND VALIDATION
    // ========================================

    const allergenId = context.params.id;

    // Validate allergenId format
    let validatedAllergenId: string;
    try {
      validatedAllergenId = AllergenIdSchema.parse(allergenId);
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
    // REMOVE ALLERGEN FROM USER PROFILE
    // ========================================

    await removeAllergenFromUser(context.locals.supabase, userId, validatedAllergenId);

    // Success response - 204 No Content
    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    // Handle specific business logic errors
    if (error instanceof AllergenNotInUserListError) {
      console.info("[DELETE /api/profile/allergens/{id}] Allergen not in list:", {
        userId,
        allergenId: context.params.id,
        error: error.message,
      });

      return new Response(
        JSON.stringify({
          error: "Not Found",
          message: "Allergen not in user's list",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Log unexpected errors
    console.error("[DELETE /api/profile/allergens/{id}] Error:", {
      userId,
      allergenId: context.params.id,
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
