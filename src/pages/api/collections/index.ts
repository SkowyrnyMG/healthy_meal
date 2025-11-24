import type { APIRoute } from "astro";
import { z } from "zod";
import {
  getUserCollections,
  createCollection,
  CollectionAlreadyExistsError,
} from "../../../lib/services/collection.service";

export const prerender = false;

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

/**
 * Zod schema for creating a new collection
 */
const CreateCollectionSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be 100 characters or less").trim(),
});

// ============================================================================
// API ROUTE HANDLERS
// ============================================================================

/**
 * GET /api/collections
 * Retrieves all recipe collections for the authenticated user with recipe counts
 *
 * Returns:
 * - 200: { collections: CollectionDTO[] }
 * - 401: Authentication required (when real auth is enabled)
 * - 500: Internal server error
 *
 * @example
 * GET /api/collections
 */
export const GET: APIRoute = async (context) => {
  try {
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

    // ========================================
    // RETRIEVE USER COLLECTIONS
    // ========================================

    const collections = await getUserCollections(context.locals.supabase, userId);

    // ========================================
    // RETURN SUCCESS RESPONSE
    // ========================================

    return new Response(JSON.stringify({ collections }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Log error with context
    console.error("[GET /api/collections] Error:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Return generic error response
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "Failed to retrieve collections",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

/**
 * POST /api/collections
 * Creates a new recipe collection for the authenticated user
 *
 * Request body: { name: string (1-100 characters, trimmed) }
 *
 * Returns:
 * - 201: Successfully created collection with full collection data
 * - 400: Bad Request (invalid JSON, validation errors)
 * - 401: Unauthorized (authentication required) - currently commented for development
 * - 409: Conflict (collection with this name already exists)
 * - 500: Internal server error
 *
 * @example
 * POST /api/collections
 * Body: { "name": "Szybkie kolacje" }
 */
export const POST: APIRoute = async (context) => {
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

    // Validate request body
    let validatedData: z.infer<typeof CreateCollectionSchema>;
    try {
      validatedData = CreateCollectionSchema.parse(body);
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
    // CREATE COLLECTION
    // ========================================

    const collection = await createCollection(context.locals.supabase, userId, validatedData);

    // Success response
    return new Response(
      JSON.stringify({
        success: true,
        collection,
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Handle specific business logic errors
    if (error instanceof CollectionAlreadyExistsError) {
      console.info("[POST /api/collections] Conflict:", {
        userId,
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
    console.error("[POST /api/collections] Error:", {
      userId,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Return generic error response
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "Failed to create collection",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
