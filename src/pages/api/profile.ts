import type { APIRoute } from "astro";
import { z } from "zod";

import { getProfileByUserId, updateProfileByUserId } from "../../lib/services/profile.service";

export const prerender = false;

/**
 * Zod schema for validating profile update request
 * Accepts null values and transforms them to undefined for database compatibility
 */
const UpdateProfileSchema = z.object({
  weight: z
    .number()
    .min(40)
    .max(200)
    .nullable()
    .optional()
    .transform((val) => val ?? undefined),
  age: z
    .number()
    .int()
    .min(13)
    .max(100)
    .nullable()
    .optional()
    .transform((val) => val ?? undefined),
  gender: z
    .enum(["male", "female"])
    .nullable()
    .optional()
    .transform((val) => val ?? undefined),
  activityLevel: z
    .enum(["sedentary", "lightly_active", "moderately_active", "very_active", "extremely_active"])
    .nullable()
    .optional()
    .transform((val) => val ?? undefined),
  dietType: z
    .enum(["high_protein", "keto", "vegetarian", "weight_gain", "weight_loss", "balanced"])
    .nullable()
    .optional()
    .transform((val) => val ?? undefined),
  targetGoal: z
    .enum(["lose_weight", "gain_weight", "maintain_weight"])
    .nullable()
    .optional()
    .transform((val) => val ?? undefined),
  targetValue: z
    .number()
    .min(0.1)
    .max(100)
    .nullable()
    .optional()
    .transform((val) => val ?? undefined),
});

/**
 * GET /api/profile
 * Retrieves the current authenticated user's profile data
 *
 * Returns:
 * - 200: ProfileDTO with user's dietary preferences and physical data
 * - 401: Unauthorized (authentication required) - currently commented for development
 * - 404: Profile not found
 * - 500: Internal server error
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
    // FETCH PROFILE
    // ========================================

    const profile = await getProfileByUserId(context.locals.supabase, userId);

    // Handle not found
    if (!profile) {
      return new Response(
        JSON.stringify({
          error: "Not Found",
          message: "Profile not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Success response
    return new Response(JSON.stringify(profile), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Log error with context
    console.error("[GET /api/profile] Error:", {
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
 * PUT /api/profile
 * Updates the current authenticated user's profile data
 *
 * Request body:
 * - weight?: number (40-200)
 * - age?: number (13-100)
 * - gender?: 'male' | 'female'
 * - activityLevel?: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active'
 * - dietType?: 'high_protein' | 'keto' | 'vegetarian' | 'weight_gain' | 'weight_loss' | 'balanced'
 * - targetGoal?: 'lose_weight' | 'gain_weight' | 'maintain_weight'
 * - targetValue?: number (0.1-100)
 *
 * Returns:
 * - 200: Updated ProfileDTO
 * - 400: Invalid request body
 * - 401: Unauthorized (authentication required)
 * - 404: Profile not found
 * - 500: Internal server error
 */
export const PUT: APIRoute = async (context) => {
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
    // PARSE AND VALIDATE REQUEST BODY
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

    const validationResult = UpdateProfileSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Validation failed",
          details: validationResult.error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const updateData = validationResult.data;

    // ========================================
    // UPDATE PROFILE
    // ========================================

    const updatedProfile = await updateProfileByUserId(context.locals.supabase, userId, updateData);

    // Success response
    return new Response(JSON.stringify(updatedProfile), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Log error with context
    console.error("[PUT /api/profile] Error:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Handle specific errors
    if (error instanceof Error && error.message === "Profile not found") {
      return new Response(
        JSON.stringify({
          error: "Not Found",
          message: "Profile not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

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
