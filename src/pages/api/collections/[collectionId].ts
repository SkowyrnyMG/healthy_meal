import type { APIRoute } from "astro";
import { z } from "zod";
import { getCollectionWithRecipes, CollectionNotFoundError } from "../../../lib/services/collection.service";

export const prerender = false;

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

/**
 * Zod schema for validating collectionId path parameter
 */
const CollectionIdParamSchema = z.string().uuid("Invalid collection ID format");

/**
 * Zod schema for validating pagination query parameters
 */
const QueryParamsSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().int().min(1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().int().min(1).max(100)),
});

// ============================================================================
// API ROUTE HANDLERS
// ============================================================================

/**
 * GET /api/collections/{collectionId}
 * Retrieves a specific recipe collection with paginated recipes for the authenticated user
 *
 * Path parameters: collectionId (UUID)
 * Query parameters:
 * - page (number, optional): Page number for pagination (default: 1, min: 1)
 * - limit (number, optional): Number of recipes per page (default: 20, min: 1, max: 100)
 *
 * Returns:
 * - 200: Collection with paginated recipes and metadata
 * - 400: Bad Request (invalid collection ID or query parameters)
 * - 401: Unauthorized (authentication required) - currently mocked for development
 * - 404: Not Found (collection not found or not authorized - anti-enumeration)
 * - 500: Internal server error
 *
 * @example
 * GET /api/collections/123e4567-e89b-12d3-a456-426614174000?page=1&limit=20
 */
export const GET: APIRoute = async (context) => {
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
    // PATH PARAMETER EXTRACTION AND VALIDATION
    // ========================================

    const collectionId = context.params.collectionId;

    // Validate collectionId format
    let validatedCollectionId: string;
    try {
      validatedCollectionId = CollectionIdParamSchema.parse(collectionId);
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
    // QUERY PARAMETER EXTRACTION AND VALIDATION
    // ========================================

    const url = new URL(context.request.url);
    const queryParams = {
      page: url.searchParams.get("page") ?? undefined,
      limit: url.searchParams.get("limit") ?? undefined,
    };

    // Validate and apply defaults for query parameters
    let validatedParams: z.infer<typeof QueryParamsSchema>;
    try {
      validatedParams = QueryParamsSchema.parse(queryParams);
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
    // RETRIEVE COLLECTION WITH RECIPES
    // ========================================

    const collection = await getCollectionWithRecipes(
      context.locals.supabase,
      userId,
      validatedCollectionId,
      validatedParams.page,
      validatedParams.limit
    );

    // ========================================
    // RETURN SUCCESS RESPONSE
    // ========================================

    return new Response(JSON.stringify(collection), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle specific business logic errors
    if (error instanceof CollectionNotFoundError) {
      console.info("[GET /api/collections/{collectionId}] Collection not found:", {
        userId,
        collectionId: context.params.collectionId,
        error: error.message,
      });

      return new Response(
        JSON.stringify({
          error: "Not Found",
          message: "Collection not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Log unexpected errors
    console.error("[GET /api/collections/{collectionId}] Error:", {
      userId,
      collectionId: context.params.collectionId,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Return generic error response
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "Failed to retrieve collection",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
