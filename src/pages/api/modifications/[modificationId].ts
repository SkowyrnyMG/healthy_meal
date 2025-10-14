import type { APIRoute } from "astro";
import { z } from "zod";
import { getModificationById, deleteModification } from "../../../lib/services/modification.service";

export const prerender = false;

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

/**
 * Zod schema for modificationId path parameter validation
 */
const ModificationIdParamSchema = z.object({
  modificationId: z.string().uuid("Modification ID must be a valid UUID"),
});

type ValidatedModificationIdParam = z.infer<typeof ModificationIdParamSchema>;

// ============================================================================
// API ROUTE HANDLERS
// ============================================================================

/**
 * GET /api/modifications/:modificationId
 * Retrieves detailed information about a specific recipe modification by ID
 * Implements proper authentication and authorization (IDOR protection)
 *
 * Path Parameters:
 * - modificationId: UUID of the modification to retrieve
 *
 * Authorization:
 * - User must own the modification OR recipe must be public
 *
 * Returns:
 * - 200: ModificationDetailDTO with complete modification and original recipe information
 * - 400: Invalid modificationId format
 * - 401: Authentication required (production only)
 * - 404: Modification not found (also returned for unauthorized access to prevent information leakage)
 * - 500: Internal server error
 */
export const GET: APIRoute = async (context) => {
  try {
    // ========================================
    // EXTRACT AND VALIDATE PATH PARAMETER
    // ========================================

    const rawParams = {
      modificationId: context.params.modificationId,
    };

    let validatedParams: ValidatedModificationIdParam;
    try {
      validatedParams = ModificationIdParamSchema.parse(rawParams);
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
    // AUTHENTICATION (MOCKED FOR DEVELOPMENT)
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

    // MOCK: Remove this in production
    const user = { id: "a85d6d6c-b7d4-4605-9cc4-3743401b67a0" };

    // ========================================
    // FETCH MODIFICATION WITH AUTHORIZATION
    // ========================================

    const modification = await getModificationById(context.locals.supabase, validatedParams.modificationId, user.id);

    if (!modification) {
      // Modification not found or user is not authorized
      // Return 404 for both cases to prevent information leakage
      return new Response(
        JSON.stringify({
          error: "Not Found",
          message: "Modification not found",
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // ========================================
    // SUCCESS RESPONSE
    // ========================================

    return new Response(JSON.stringify(modification), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Log error with context
    console.error("[GET /api/modifications/[modificationId]] Error:", {
      modificationId: context.params.modificationId,
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
 * DELETE /api/modifications/:modificationId
 * Deletes a recipe modification (owner only)
 *
 * Path Parameters:
 * - modificationId: UUID of the modification to delete
 *
 * Authorization:
 * - User must own the modification
 *
 * Returns:
 * - 204: Modification successfully deleted
 * - 400: Invalid modificationId format
 * - 401: Authentication required (production only)
 * - 403: Forbidden - User is not the owner
 * - 404: Modification not found
 * - 500: Internal server error
 */
export const DELETE: APIRoute = async (context) => {
  // ========================================
  // AUTHENTICATION (MOCKED FOR DEVELOPMENT)
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

  // MOCK: Remove this in production
  const user = { id: "a85d6d6c-b7d4-4605-9cc4-3743401b67a0" };

  try {
    // ========================================
    // EXTRACT AND VALIDATE PATH PARAMETER
    // ========================================

    const rawParams = {
      modificationId: context.params.modificationId,
    };

    let validatedParams: ValidatedModificationIdParam;
    try {
      validatedParams = ModificationIdParamSchema.parse(rawParams);
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
    // DELETE MODIFICATION
    // ========================================

    await deleteModification(context.locals.supabase, validatedParams.modificationId, user.id);

    // ========================================
    // SUCCESS RESPONSE
    // ========================================

    return new Response(null, {
      status: 204, // No Content
    });
  } catch (error) {
    // ========================================
    // ERROR HANDLING
    // ========================================

    // Handle specific business logic errors
    if (error instanceof Error) {
      if (error.message === "Modification not found") {
        return new Response(
          JSON.stringify({
            error: "Not Found",
            message: "Modification not found",
          }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      if (error.message === "You don't have permission to delete this modification") {
        return new Response(
          JSON.stringify({
            error: "Forbidden",
            message: "You don't have permission to delete this modification",
          }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Log error with context
    console.error("[DELETE /api/modifications/[modificationId]] Error:", {
      modificationId: context.params.modificationId,
      userId: user?.id,
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
