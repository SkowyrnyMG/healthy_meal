import type { APIRoute } from "astro";
import { z } from "zod";
import { getRecipeById } from "../../../../lib/services/recipe.service";
import { createModification, getModificationsByRecipeId } from "../../../../lib/services/modification.service";
import type { CreateModificationCommand } from "../../../../types";

export const prerender = false;

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

/**
 * Zod schema for recipeId path parameter validation
 */
const RecipeIdParamSchema = z.object({
  recipeId: z.string().uuid("Recipe ID must be a valid UUID"),
});

type ValidatedRecipeIdParam = z.infer<typeof RecipeIdParamSchema>;

/**
 * Zod schema for pagination query parameters
 */
const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

type ValidatedPaginationQuery = z.infer<typeof PaginationQuerySchema>;

/**
 * Zod schema for modification parameters using discriminated union
 * Each modification type has its own parameter requirements
 */
const CreateModificationCommandSchema = z.discriminatedUnion("modificationType", [
  // Reduce calories - requires targetCalories OR reductionPercentage
  z.object({
    modificationType: z.literal("reduce_calories"),
    parameters: z.union([
      z.object({
        targetCalories: z
          .number()
          .positive("Target calories must be positive")
          .max(10000, "Target calories must be 10000 or less"),
      }),
      z.object({
        reductionPercentage: z
          .number()
          .min(1, "Reduction percentage must be at least 1%")
          .max(100, "Reduction percentage cannot exceed 100%"),
      }),
    ]),
  }),

  // Increase calories - requires targetCalories OR increasePercentage
  z.object({
    modificationType: z.literal("increase_calories"),
    parameters: z.union([
      z.object({
        targetCalories: z
          .number()
          .positive("Target calories must be positive")
          .max(10000, "Target calories must be 10000 or less"),
      }),
      z.object({
        increasePercentage: z
          .number()
          .min(1, "Increase percentage must be at least 1%")
          .max(100, "Increase percentage cannot exceed 100%"),
      }),
    ]),
  }),

  // Increase protein - requires targetProtein OR increasePercentage
  z.object({
    modificationType: z.literal("increase_protein"),
    parameters: z.union([
      z.object({
        targetProtein: z
          .number()
          .positive("Target protein must be positive")
          .max(1000, "Target protein must be 1000g or less"),
      }),
      z.object({
        increasePercentage: z
          .number()
          .min(1, "Increase percentage must be at least 1%")
          .max(100, "Increase percentage cannot exceed 100%"),
      }),
    ]),
  }),

  // Increase fiber - requires targetFiber OR increasePercentage
  z.object({
    modificationType: z.literal("increase_fiber"),
    parameters: z.union([
      z.object({
        targetFiber: z
          .number()
          .positive("Target fiber must be positive")
          .max(1000, "Target fiber must be 1000g or less"),
      }),
      z.object({
        increasePercentage: z
          .number()
          .min(1, "Increase percentage must be at least 1%")
          .max(100, "Increase percentage cannot exceed 100%"),
      }),
    ]),
  }),

  // Portion size - requires newServings
  z.object({
    modificationType: z.literal("portion_size"),
    parameters: z.object({
      newServings: z
        .number()
        .int("Servings must be an integer")
        .positive("Servings must be positive")
        .max(100, "Servings cannot exceed 100"),
    }),
  }),

  // Ingredient substitution - requires originalIngredient, optional preferredSubstitute
  z.object({
    modificationType: z.literal("ingredient_substitution"),
    parameters: z.object({
      originalIngredient: z
        .string()
        .trim()
        .min(1, "Original ingredient is required")
        .max(100, "Original ingredient must be 100 characters or less"),
      preferredSubstitute: z
        .string()
        .trim()
        .min(1, "Preferred substitute must not be empty if provided")
        .max(100, "Preferred substitute must be 100 characters or less")
        .optional(),
    }),
  }),
]);

type ValidatedCreateModificationCommand = z.infer<typeof CreateModificationCommandSchema>;

// ============================================================================
// API ROUTE HANDLERS
// ============================================================================

/**
 * GET /api/recipes/:recipeId/modifications
 * Retrieves a paginated list of all modifications for a specific recipe
 * Implements proper authentication and authorization (IDOR protection)
 *
 * Path Parameters:
 * - recipeId: UUID of the recipe to fetch modifications for
 *
 * Query Parameters:
 * - page: Page number (default: 1, min: 1)
 * - limit: Results per page (default: 20, min: 1, max: 100)
 *
 * Authorization:
 * - Recipe must be public OR user must be the recipe owner
 *
 * Returns:
 * - 200: { modifications: ModificationDTO[], pagination: PaginationDTO }
 * - 400: Invalid recipeId format or pagination parameters
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
    // EXTRACT AND VALIDATE QUERY PARAMETERS
    // ========================================

    const rawQuery = {
      page: context.url.searchParams.get("page") || undefined,
      limit: context.url.searchParams.get("limit") || undefined,
    };

    let validatedQuery: ValidatedPaginationQuery;
    try {
      validatedQuery = PaginationQuerySchema.parse(rawQuery);
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

    const user = context.locals.user;

    if (!user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Authentication required",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

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

    // User can access modifications if:
    // 1. Recipe is public (anyone can view modifications of public recipes), OR
    // 2. User is the recipe owner (can view modifications of their own private recipes)
    const isAuthorized = recipe.isPublic || recipe.userId === user.id;

    if (!isAuthorized) {
      return new Response(
        JSON.stringify({
          error: "Forbidden",
          message: "You don't have permission to view modifications for this recipe",
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // ========================================
    // FETCH MODIFICATIONS
    // ========================================

    const result = await getModificationsByRecipeId(
      context.locals.supabase,
      validatedParams.recipeId,
      validatedQuery.page,
      validatedQuery.limit
    );

    // ========================================
    // SUCCESS RESPONSE
    // ========================================

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Log error with context
    console.error("[GET /api/recipes/[recipeId]/modifications] Error:", {
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

/**
 * POST /api/recipes/:recipeId/modifications
 * Creates an AI-powered modification of an existing recipe
 * For MVP, uses mocked AI responses to avoid API costs
 *
 * Path Parameters:
 * - recipeId: UUID of the recipe to modify
 *
 * Request Body: CreateModificationCommand
 * - modificationType: One of 6 modification types
 * - parameters: Type-specific parameters (validated via discriminated union)
 *
 * Authorization:
 * - Recipe must be public OR user must be the recipe owner
 *
 * Returns:
 * - 201: { success: true, modification: ModificationDTO }
 * - 400: Invalid recipeId format or request body validation error
 * - 401: Authentication required (production only)
 * - 403: Forbidden - Recipe is private and user is not the owner
 * - 404: Recipe not found
 * - 500: Internal server error
 */
export const POST: APIRoute = async (context) => {
  // ========================================
  // AUTHENTICATION
  // ========================================

  const user = context.locals.user;

  if (!user) {
    return new Response(
      JSON.stringify({
        error: "Unauthorized",
        message: "Authentication required",
      }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

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
    // RATE LIMITING CHECK (PLACEHOLDER)
    // ========================================

    // TODO: Implement rate limiting (10 requests per 5 minutes per user)
    // const isRateLimited = await checkRateLimit(user.id);
    // if (isRateLimited) {
    //   return new Response(
    //     JSON.stringify({
    //       error: "Too Many Requests",
    //       message: "Rate limit exceeded. Please try again later."
    //     }),
    //     { status: 429, headers: { "Content-Type": "application/json" } }
    //   );
    // }

    // ========================================
    // PARSE AND VALIDATE REQUEST BODY
    // ========================================

    let requestBody: unknown;
    try {
      requestBody = await context.request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Invalid JSON in request body",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    let validatedCommand: ValidatedCreateModificationCommand;
    try {
      validatedCommand = CreateModificationCommandSchema.parse(requestBody);
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

    // User can create modification if:
    // 1. Recipe is public (anyone can create modifications of public recipes), OR
    // 2. User is the recipe owner (can modify their own private recipes)
    const isAuthorized = recipe.isPublic || recipe.userId === user.id;

    if (!isAuthorized) {
      return new Response(
        JSON.stringify({
          error: "Forbidden",
          message: "You don't have permission to modify this recipe",
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // ========================================
    // CREATE MODIFICATION
    // ========================================

    const modification = await createModification(
      context.locals.supabase,
      recipe,
      user.id,
      validatedCommand as CreateModificationCommand
    );

    // ========================================
    // SUCCESS RESPONSE
    // ========================================

    return new Response(
      JSON.stringify({
        success: true,
        modification,
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Log error with context
    console.error("[POST /api/recipes/[recipeId]/modifications] Error:", {
      recipeId: context.params.recipeId,
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
