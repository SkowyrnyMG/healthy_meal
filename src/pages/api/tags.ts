import type { APIRoute } from "astro";
import { z } from "zod";
import { getAllTags } from "../../lib/services/tag.service";

export const prerender = false;

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

/**
 * Zod schema for creating a new tag
 */
const CreateTagCommandSchema = z.object({
  name: z.string().trim().min(1, "Tag name is required").max(100, "Tag name must be 100 characters or less"),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .max(100, "Slug must be 100 characters or less")
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
});

// ============================================================================
// API ROUTE HANDLERS
// ============================================================================

/**
 * GET /api/tags
 * Retrieves all recipe tags (publicly accessible)
 *
 * Returns:
 * - 200: Array of TagDTO wrapped in { tags: [] }
 * - 500: Internal server error
 */
export const GET: APIRoute = async (context) => {
  try {
    // ========================================
    // FETCH ALL TAGS
    // ========================================

    const tags = await getAllTags(context.locals.supabase);

    // Success response
    return new Response(JSON.stringify({ tags }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Log error with context
    console.error("[GET /api/tags] Error:", {
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
 * POST /api/tags
 * Creates a new custom tag for authenticated users
 *
 * Request Body: CreateTagCommand { name, slug }
 *
 * Returns:
 * - 201: { success: true, tag: TagDTO }
 * - 400: Invalid request body or duplicate tag name/slug
 * - 401: Authentication required (production only)
 * - 500: Internal server error
 */
export const POST: APIRoute = async (context) => {
  try {
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

    let validatedCommand: ValidatedCreateTagCommand;
    try {
      validatedCommand = CreateTagCommandSchema.parse(requestBody);
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
    // CHECK FOR DUPLICATE TAG
    // ========================================

    // Check if tag with same name or slug already exists
    const { data: existingTags, error: checkError } = await context.locals.supabase
      .from("tags")
      .select("id, name, slug")
      .or(`name.eq.${validatedCommand.name},slug.eq.${validatedCommand.slug}`)
      .limit(1);

    if (checkError) {
      throw new Error(`Failed to check for existing tags: ${checkError.message}`);
    }

    if (existingTags && existingTags.length > 0) {
      const existingTag = existingTags[0];
      if (existingTag.name === validatedCommand.name) {
        return new Response(
          JSON.stringify({
            error: "Bad Request",
            message: "Tag o tej nazwie już istnieje",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      if (existingTag.slug === validatedCommand.slug) {
        return new Response(
          JSON.stringify({
            error: "Bad Request",
            message: "Tag o tym identyfikatorze już istnieje. Spróbuj innej nazwy.",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // ========================================
    // CREATE TAG
    // ========================================

    const { data: newTag, error: insertError } = await context.locals.supabase
      .from("tags")
      .insert({
        name: validatedCommand.name,
        slug: validatedCommand.slug,
      })
      .select("id, name, slug, created_at")
      .single();

    if (insertError) {
      // Check for unique constraint violation
      if (insertError.code === "23505") {
        return new Response(
          JSON.stringify({
            error: "Bad Request",
            message: "Tag o tej nazwie lub identyfikatorze już istnieje",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      throw new Error(`Failed to create tag: ${insertError.message}`);
    }

    // Map database result to TagDTO
    const tagDTO = {
      id: newTag.id,
      name: newTag.name,
      slug: newTag.slug,
      createdAt: newTag.created_at,
    };

    // Success response
    return new Response(
      JSON.stringify({
        success: true,
        tag: tagDTO,
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Log error with context
    console.error("[POST /api/tags] Error:", {
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
