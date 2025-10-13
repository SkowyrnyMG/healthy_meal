import type { APIRoute } from "astro";
import { z } from "zod";
import { getUserRecipes, createRecipe } from "../../lib/services/recipe.service";

export const prerender = false;

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

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
 * Zod schema for creating a new recipe
 */
const CreateRecipeCommandSchema = z.object({
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

type ValidatedCreateRecipeCommand = z.infer<typeof CreateRecipeCommandSchema>;

/**
 * Zod schema for recipe query parameters validation
 */
const RecipeQueryParamsSchema = z.object({
  search: z.string().trim().min(1).max(255).optional(),
  tags: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      const uuids = val.split(",").map((s) => s.trim());
      // Validate each UUID
      z.array(z.string().uuid()).parse(uuids);
      return val; // Return original comma-separated string for service
    }),
  maxCalories: z.coerce.number().int().min(1).max(10000).optional(),
  maxPrepTime: z.coerce.number().int().min(1).max(1440).optional(),
  isPublic: z
    .enum(["true", "false"])
    .transform((val) => val === "true")
    .optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  sortBy: z.enum(["createdAt", "updatedAt", "title", "prepTime"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

type ValidatedRecipeQueryParams = z.infer<typeof RecipeQueryParamsSchema>;

// ============================================================================
// API ROUTE HANDLERS
// ============================================================================

/**
 * GET /api/recipes
 * Retrieves paginated list of recipes for authenticated user with filtering and search
 *
 * Query Parameters:
 * - search: Full-text search in title and description (1-255 chars)
 * - tags: Comma-separated tag UUIDs
 * - maxCalories: Maximum calories per serving (1-10000)
 * - maxPrepTime: Maximum preparation time in minutes (1-1440)
 * - isPublic: Filter by public/private status ("true" or "false")
 * - page: Page number for pagination (min: 1, default: 1)
 * - limit: Results per page (min: 1, max: 100, default: 20)
 * - sortBy: Field to sort by (createdAt, updatedAt, title, prepTime, default: createdAt)
 * - sortOrder: Sort direction (asc, desc, default: desc)
 *
 * Returns:
 * - 200: { recipes: RecipeListItemDTO[], pagination: PaginationDTO }
 * - 400: Invalid query parameters
 * - 401: Authentication required (when real auth is enabled)
 * - 500: Internal server error
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

    // MOCK: Remove this in production
    const userId = "a85d6d6c-b7d4-4605-9cc4-3743401b67a0";

    // ========================================
    // EXTRACT AND VALIDATE QUERY PARAMETERS
    // ========================================

    const url = new URL(context.request.url);
    const rawParams = {
      search: url.searchParams.get("search") || undefined,
      tags: url.searchParams.get("tags") || undefined,
      maxCalories: url.searchParams.get("maxCalories") || undefined,
      maxPrepTime: url.searchParams.get("maxPrepTime") || undefined,
      isPublic: url.searchParams.get("isPublic") || undefined,
      page: url.searchParams.get("page") || undefined,
      limit: url.searchParams.get("limit") || undefined,
      sortBy: url.searchParams.get("sortBy") || undefined,
      sortOrder: url.searchParams.get("sortOrder") || undefined,
    };

    let validatedParams: ValidatedRecipeQueryParams;
    try {
      validatedParams = RecipeQueryParamsSchema.parse(rawParams);
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
    // FETCH RECIPES
    // ========================================

    const result = await getUserRecipes(context.locals.supabase, userId, validatedParams);

    // Success response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Log error with context
    console.error("[GET /api/recipes] Error:", {
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
 * POST /api/recipes
 * Creates a new recipe for authenticated user
 *
 * Request Body: CreateRecipeCommand
 *
 * Returns:
 * - 201: { success: true, recipe: RecipeDetailDTO }
 * - 400: Invalid request body
 * - 401: Authentication required
 * - 500: Internal server error
 */
export const POST: APIRoute = async (context) => {
  try {
    // ========================================
    // AUTHENTICATION
    // ========================================

    // TODO: Production - Uncomment for real authentication
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

    // MOCK: Remove this in production
    const userId = "a85d6d6c-b7d4-4605-9cc4-3743401b67a0";

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

    let validatedCommand: ValidatedCreateRecipeCommand;
    try {
      validatedCommand = CreateRecipeCommandSchema.parse(requestBody);
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
    // CREATE RECIPE
    // ========================================

    const recipe = await createRecipe(context.locals.supabase, userId, validatedCommand);

    // Success response
    return new Response(
      JSON.stringify({
        success: true,
        recipe,
      }),
      {
        status: 201,
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
    console.error("[POST /api/recipes] Error:", {
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
