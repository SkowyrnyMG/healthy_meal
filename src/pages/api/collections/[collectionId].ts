import type { APIRoute } from "astro";
import { z } from "zod";
import {
  getCollectionWithRecipes,
  updateCollection,
  deleteCollection,
  CollectionNotFoundError,
  CollectionForbiddenError,
  CollectionAlreadyExistsError,
} from "../../../lib/services/collection.service";

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

/**
 * Zod schema for updating collection
 */
const UpdateCollectionSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be 100 characters or less").trim(),
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
  // AUTHENTICATION
  // ========================================

  const userId = context.locals.user?.id;

  if (!userId) {
    return new Response(
      JSON.stringify({
        error: "Unauthorized",
        message: "Authentication required",
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

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

/**
 * PUT /api/collections/{collectionId}
 * Updates collection name for the authenticated user
 *
 * Path parameters: collectionId (UUID)
 * Request body: { name: string (1-100 characters, trimmed) }
 *
 * Returns:
 * - 200: Successfully updated collection
 * - 400: Bad Request (invalid JSON, validation errors)
 * - 401: Unauthorized (authentication required) - currently mocked
 * - 403: Forbidden (collection belongs to another user)
 * - 404: Not Found (collection not found)
 * - 409: Conflict (collection with this name already exists)
 * - 500: Internal server error
 *
 * @example
 * PUT /api/collections/123e4567-e89b-12d3-a456-426614174000
 * Body: { "name": "Szybkie i zdrowe kolacje" }
 */
export const PUT: APIRoute = async (context) => {
  // ========================================
  // AUTHENTICATION
  // ========================================

  const userId = context.locals.user?.id;

  if (!userId) {
    return new Response(
      JSON.stringify({
        error: "Unauthorized",
        message: "Authentication required",
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

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

    let validatedData: z.infer<typeof UpdateCollectionSchema>;
    try {
      validatedData = UpdateCollectionSchema.parse(body);
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
    // UPDATE COLLECTION VIA SERVICE
    // ========================================

    const collection = await updateCollection(context.locals.supabase, userId, validatedCollectionId, validatedData);

    // ========================================
    // RETURN SUCCESS RESPONSE
    // ========================================

    return new Response(
      JSON.stringify({
        success: true,
        collection,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Handle specific business logic errors
    if (error instanceof CollectionNotFoundError) {
      console.info("[PUT /api/collections/{collectionId}] Collection not found:", {
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

    if (error instanceof CollectionForbiddenError) {
      console.info("[PUT /api/collections/{collectionId}] Collection forbidden:", {
        userId,
        collectionId: context.params.collectionId,
        error: error.message,
      });

      return new Response(
        JSON.stringify({
          error: "Forbidden",
          message: "You don't have permission to update this collection",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (error instanceof CollectionAlreadyExistsError) {
      console.info("[PUT /api/collections/{collectionId}] Collection name already exists:", {
        userId,
        collectionId: context.params.collectionId,
        error: error.message,
      });

      return new Response(
        JSON.stringify({
          error: "Conflict",
          message: "Collection with this name already exists",
        }),
        {
          status: 409,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Log unexpected errors
    console.error("[PUT /api/collections/{collectionId}] Error:", {
      userId,
      collectionId: context.params.collectionId,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Return generic error response
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "Failed to update collection",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

/**
 * DELETE /api/collections/{collectionId}
 * Deletes a collection and all its associated recipes for the authenticated user
 *
 * Path parameters: collectionId (UUID)
 *
 * Returns:
 * - 204: No Content (collection successfully deleted)
 * - 400: Bad Request (invalid collection ID format)
 * - 401: Unauthorized (authentication required) - currently mocked
 * - 404: Not Found (collection not found or belongs to another user - anti-enumeration)
 * - 500: Internal server error
 *
 * @example
 * DELETE /api/collections/123e4567-e89b-12d3-a456-426614174000
 */
export const DELETE: APIRoute = async (context) => {
  // ========================================
  // AUTHENTICATION
  // ========================================

  const userId = context.locals.user?.id;

  if (!userId) {
    return new Response(
      JSON.stringify({
        error: "Unauthorized",
        message: "Authentication required",
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

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
    // DELETE COLLECTION VIA SERVICE
    // ========================================

    await deleteCollection(context.locals.supabase, userId, validatedCollectionId);

    // ========================================
    // RETURN SUCCESS RESPONSE (204 NO CONTENT)
    // ========================================

    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    // Handle specific business logic errors
    if (error instanceof CollectionNotFoundError) {
      console.info("[DELETE /api/collections/{collectionId}] Collection not found:", {
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
    console.error("[DELETE /api/collections/{collectionId}] Error:", {
      userId,
      collectionId: context.params.collectionId,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Return generic error response
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "Failed to delete collection",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
