import type { APIRoute } from "astro";
import { z } from "zod";
import { getRecipeById, updateRecipe, deleteRecipe } from "../../../lib/services/recipe.service";
import type { UpdateRecipeCommand } from "../../../types";

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

/**
 * Zod schema for recipe ingredient validation
 */
const RecipeIngredientSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Ingredient name is required")
    .max(255, "Ingredient name must be 255 characters or less"),
  amount: z.number().positive("Ingredient amount must be positive"),
  unit: z.string().trim().min(1, "Unit is required").max(50, "Unit must be 50 characters or less"),
});

/**
 * Zod schema for recipe step validation
 */
const RecipeStepSchema = z.object({
  stepNumber: z.number().int("Step number must be an integer").positive("Step number must be positive"),
  instruction: z
    .string()
    .trim()
    .min(1, "Step instruction is required")
    .max(2000, "Step instruction must be 2000 characters or less"),
});

/**
 * Zod schema for nutrition information validation
 */
const NutritionSchema = z.object({
  calories: z.number().min(0, "Calories cannot be negative").max(10000, "Calories must be 10000 or less"),
  protein: z.number().min(0, "Protein cannot be negative").max(1000, "Protein must be 1000g or less"),
  fat: z.number().min(0, "Fat cannot be negative").max(1000, "Fat must be 1000g or less"),
  carbs: z.number().min(0, "Carbs cannot be negative").max(1000, "Carbs must be 1000g or less"),
  fiber: z.number().min(0, "Fiber cannot be negative").max(1000, "Fiber must be 1000g or less"),
  salt: z.number().min(0, "Salt cannot be negative").max(100, "Salt must be 100g or less"),
});

/**
 * Zod schema for updating a recipe (reuses CreateRecipeCommand validation)
 */
const UpdateRecipeCommandSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255, "Title must be 255 characters or less"),
  description: z.string().trim().max(5000, "Description must be 5000 characters or less").optional(),
  ingredients: z
    .array(RecipeIngredientSchema)
    .min(1, "At least one ingredient is required")
    .max(100, "Maximum 100 ingredients allowed"),
  steps: z
    .array(RecipeStepSchema)
    .min(1, "At least one step is required")
    .max(100, "Maximum 100 steps allowed")
    .refine(
      (steps) => {
        // Validate step numbers are sequential starting from 1
        const sorted = [...steps].sort((a, b) => a.stepNumber - b.stepNumber);
        return sorted.every((step, idx) => step.stepNumber === idx + 1);
      },
      { message: "Step numbers must be sequential starting from 1" }
    ),
  servings: z.number().int("Servings must be an integer").positive("Servings must be positive"),
  nutritionPerServing: NutritionSchema,
  prepTimeMinutes: z
    .number()
    .int("Prep time must be an integer")
    .positive("Prep time must be positive")
    .max(1440, "Prep time cannot exceed 1440 minutes (24 hours)")
    .optional(),
  isPublic: z.boolean().optional().default(false),
  tagIds: z.array(z.string().uuid("Invalid tag UUID format")).max(50, "Maximum 50 tags allowed").optional(),
});

type ValidatedUpdateRecipeCommand = z.infer<typeof UpdateRecipeCommandSchema>;

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

/**
 * PUT /api/recipes/:recipeId
 * Updates an existing recipe for authenticated user
 * Implements proper authentication and authorization (IDOR protection)
 *
 * Path Parameters:
 * - recipeId: UUID of the recipe to update
 *
 * Request Body: UpdateRecipeCommand (same structure as CreateRecipeCommand)
 *
 * Authorization:
 * - User must be the recipe owner
 *
 * Returns:
 * - 200: { success: true, recipe: RecipeDetailDTO }
 * - 400: Invalid recipeId format or request body validation error
 * - 401: Authentication required (production only)
 * - 403: Forbidden - User is not the recipe owner
 * - 404: Recipe not found
 * - 500: Internal server error
 */
export const PUT: APIRoute = async (context) => {
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

    let validatedCommand: ValidatedUpdateRecipeCommand;
    try {
      validatedCommand = UpdateRecipeCommandSchema.parse(requestBody);
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
    // CHECK RECIPE EXISTENCE
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

    // User must be the recipe owner to update
    if (recipe.userId !== user.id) {
      return new Response(
        JSON.stringify({
          error: "Forbidden",
          message: "You don't have permission to update this recipe",
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // ========================================
    // UPDATE RECIPE
    // ========================================

    const updatedRecipe = await updateRecipe(
      context.locals.supabase,
      validatedParams.recipeId,
      user.id,
      validatedCommand as UpdateRecipeCommand
    );

    // ========================================
    // SUCCESS RESPONSE
    // ========================================

    return new Response(
      JSON.stringify({
        success: true,
        recipe: updatedRecipe,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Handle business logic errors (e.g., invalid tagIds)
    if (error instanceof Error && error.message.includes("tag IDs are invalid")) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: error.message,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Log error with context
    console.error("[PUT /api/recipes/[recipeId]] Error:", {
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

/**
 * DELETE /api/recipes/:recipeId
 * Deletes a recipe (owner only)
 *
 * Path Parameters:
 * - recipeId: UUID of the recipe to delete
 *
 * Authorization:
 * - User must be the recipe owner
 *
 * Returns:
 * - 204: Recipe successfully deleted
 * - 400: Invalid recipeId format
 * - 401: Authentication required (production only)
 * - 403: Forbidden - User is not the owner
 * - 404: Recipe not found
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
    // DELETE RECIPE
    // ========================================

    await deleteRecipe(context.locals.supabase, validatedParams.recipeId, user.id);

    // ========================================
    // SUCCESS RESPONSE
    // ========================================

    return new Response(null, {
      status: 204, // No Content
    });
  } catch (error) {
    // Handle specific business logic errors
    if (error instanceof Error) {
      if (error.message === "Recipe not found") {
        return new Response(
          JSON.stringify({
            error: "Not Found",
            message: "Recipe not found",
          }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      if (error.message === "You don't have permission to delete this recipe") {
        return new Response(
          JSON.stringify({
            error: "Forbidden",
            message: "You don't have permission to delete this recipe",
          }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Log error with context
    console.error("[DELETE /api/recipes/[recipeId]] Error:", {
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
