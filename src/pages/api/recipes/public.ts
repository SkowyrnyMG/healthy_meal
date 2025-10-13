import type { APIRoute } from "astro";
import { z } from "zod";
import { getPublicRecipes } from "../../../lib/services/recipe.service";

export const prerender = false;

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

/**
 * Zod schema for public recipe query parameters validation
 * Note: isPublic is NOT included as it's always true for this endpoint
 */
const PublicRecipeQueryParamsSchema = z.object({
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
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  sortBy: z.enum(["createdAt", "updatedAt", "title", "prepTime"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

type ValidatedPublicRecipeQueryParams = z.infer<typeof PublicRecipeQueryParamsSchema>;

// ============================================================================
// API ROUTE HANDLERS
// ============================================================================

/**
 * GET /api/recipes/public
 * Retrieves paginated list of public recipes from all users with filtering and search
 *
 * Query Parameters:
 * - search: Full-text search in title and description (1-255 chars)
 * - tags: Comma-separated tag UUIDs
 * - maxCalories: Maximum calories per serving (1-10000)
 * - maxPrepTime: Maximum preparation time in minutes (1-1440)
 * - page: Page number for pagination (min: 1, default: 1)
 * - limit: Results per page (min: 1, max: 100, default: 20)
 * - sortBy: Field to sort by (createdAt, updatedAt, title, prepTime, default: createdAt)
 * - sortOrder: Sort direction (asc, desc, default: desc)
 *
 * Returns:
 * - 200: { recipes: RecipeListItemDTO[], pagination: PaginationDTO }
 * - 400: Invalid query parameters
 * - 401: Authentication required (production only)
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

    // MOCK: Remove this in production
    // Note: User authentication is still required, but we don't use userId for filtering
    // (public recipes are from all users)

    // ========================================
    // EXTRACT AND VALIDATE QUERY PARAMETERS
    // ========================================

    const url = new URL(context.request.url);
    const rawParams = {
      search: url.searchParams.get("search") || undefined,
      tags: url.searchParams.get("tags") || undefined,
      maxCalories: url.searchParams.get("maxCalories") || undefined,
      maxPrepTime: url.searchParams.get("maxPrepTime") || undefined,
      page: url.searchParams.get("page") || undefined,
      limit: url.searchParams.get("limit") || undefined,
      sortBy: url.searchParams.get("sortBy") || undefined,
      sortOrder: url.searchParams.get("sortOrder") || undefined,
    };

    let validatedParams: ValidatedPublicRecipeQueryParams;
    try {
      validatedParams = PublicRecipeQueryParamsSchema.parse(rawParams);
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
    // FETCH PUBLIC RECIPES
    // ========================================

    const result = await getPublicRecipes(context.locals.supabase, validatedParams);

    // Success response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Log error with context
    console.error("[GET /api/recipes/public] Error:", {
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
