import type { APIRoute } from "astro";
import { z } from "zod";
import { getRecipeById } from "../../../lib/services/recipe.service";

export const prerender = false;

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

/**
 * Zod schema for recipeId path parameter validation
 */
const RecipeIdParamSchema = z.object({
  recipeId: z.string().uuid("Recipe ID must be a valid UUID"),
});

type ValidatedRecipeIdParam = z.infer<typeof RecipeIdParamSchema>;

// ============================================================================
// API ROUTE HANDLERS
// ============================================================================

/**
 * GET /api/recipes/:recipeId
 * Retrieves detailed information about a specific recipe by ID
 * Implements proper authentication and authorization (IDOR protection)
 *
 * Path Parameters:
 * - recipeId: UUID of the recipe to retrieve
 *
 * Authorization:
 * - Recipe must be public OR user must be the recipe owner
 *
 * Returns:
 * - 200: RecipeDetailDTO with complete recipe information
 * - 400: Invalid recipeId format
 * - 401: Authentication required (production only)
 * - 403: Forbidden - Private recipe and user is not the owner
 * - 404: Recipe not found
 * - 500: Internal server error
 */
export const GET: APIRoute = async (context) => {
  try {
    // ========================================
    // EXTRACT AND VALIDATE PATH PARAMETER
    // ========================================

    const rawParams = {
      recipeId: context.params.recipeId,
    };

    let validatedParams: ValidatedRecipeIdParam;
    try {
      validatedParams = RecipeIdParamSchema.parse(rawParams);
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

    // MOCK: Remove this in production
    const user = { id: "a85d6d6c-b7d4-4605-9cc4-3743401b67a0" };

    // ========================================
    // FETCH RECIPE
    // ========================================

    const recipe = await getRecipeById(context.locals.supabase, validatedParams.recipeId);

    if (!recipe) {
      return new Response(
        JSON.stringify({
          error: "Not Found",
          message: "Recipe not found",
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // ========================================
    // AUTHORIZATION (IDOR PROTECTION)
    // ========================================

    // User can access recipe if:
    // 1. Recipe is public, OR
    // 2. User is the recipe owner
    const isAuthorized = recipe.isPublic || recipe.userId === user.id;

    if (!isAuthorized) {
      return new Response(
        JSON.stringify({
          error: "Forbidden",
          message: "You don't have permission to view this recipe",
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // ========================================
    // SUCCESS RESPONSE
    // ========================================

    return new Response(JSON.stringify(recipe), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Log error with context
    console.error("[GET /api/recipes/[recipeId]] Error:", {
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
