import type { APIRoute } from "astro";
import { z } from "zod";
import { getIngredientSubstitutions } from "../../lib/services/ingredient-substitution.service";

export const prerender = false;

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

/**
 * Zod schema for ingredient substitution query parameters validation
 */
const SubstitutionQueryParamsSchema = z.object({
  ingredient: z
    .string({ required_error: "Ingredient is required" })
    .trim()
    .min(1, "Ingredient is required")
    .max(100, "Ingredient must be at most 100 characters"),
  healthierOnly: z.coerce.boolean().optional().default(false),
});

type ValidatedSubstitutionQueryParams = z.infer<typeof SubstitutionQueryParamsSchema>;

// ============================================================================
// API ROUTE HANDLERS
// ============================================================================

/**
 * GET /api/ingredient-substitutions
 * Retrieves ingredient substitution suggestions from the knowledge base
 *
 * Query Parameters:
 * - ingredient: Ingredient name to search for (1-100 chars, required, case-insensitive)
 * - healthierOnly: Filter for only healthier alternatives (boolean, optional, default: false)
 *
 * Returns:
 * - 200: { originalIngredient: string, substitutions: IngredientSubstitutionDTO[] }
 * - 400: Invalid query parameters
 * - 401: Authentication required (when real auth is enabled)
 * - 500: Internal server error
 *
 * @example
 * GET /api/ingredient-substitutions?ingredient=masło
 * GET /api/ingredient-substitutions?ingredient=masło&healthierOnly=true
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
    // const userId = "a85d6d6c-b7d4-4605-9cc4-3743401b67a0";

    // ========================================
    // EXTRACT AND VALIDATE QUERY PARAMETERS
    // ========================================

    const url = new URL(context.request.url);
    const rawParams = {
      ingredient: url.searchParams.get("ingredient") ?? undefined,
      healthierOnly: url.searchParams.get("healthierOnly") ?? undefined,
    };

    let validatedParams: ValidatedSubstitutionQueryParams;
    try {
      validatedParams = SubstitutionQueryParamsSchema.parse(rawParams);
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
    // FETCH INGREDIENT SUBSTITUTIONS
    // ========================================

    const substitutions = await getIngredientSubstitutions(
      context.locals.supabase,
      validatedParams.ingredient,
      validatedParams.healthierOnly
    );

    // Success response
    return new Response(
      JSON.stringify({
        originalIngredient: validatedParams.ingredient,
        substitutions,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Log error with context
    console.error("[GET /api/ingredient-substitutions] Error:", {
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
