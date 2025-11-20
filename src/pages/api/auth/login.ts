import type { APIRoute } from "astro";
import { z } from "zod";

import { createSupabaseServerInstance } from "@/db/supabase.client.ts";

export const prerender = false;

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const loginSchema = z.object({
  email: z.string().email("Wprowadź poprawny adres e-mail"),
  password: z.string().min(8, "Hasło musi mieć co najmniej 8 znaków"),
});

// ============================================================================
// LOGIN API ENDPOINT
// ============================================================================

/**
 * POST /api/auth/login
 *
 * Authenticates a user with email and password using Supabase Auth.
 * Sets session cookies automatically via Supabase SSR client.
 *
 * @returns 200 OK with user data and redirect URL on success
 * @returns 400 Bad Request for validation errors
 * @returns 401 Unauthorized for invalid credentials
 * @returns 500 Internal Server Error on failure
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: validation.error.errors[0].message,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const { email, password } = validation.data;

    // Create Supabase SSR client
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Attempt to sign in with password
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // Handle authentication errors
    if (error) {
      console.error("[Login API] Supabase auth error:", error);

      // Map Supabase error to user-friendly Polish message
      let errorMessage = "Nieprawidłowy e-mail lub hasło. Spróbuj ponownie.";
      let statusCode = 401;

      // Check for specific error types
      if (error.message.includes("Email not confirmed")) {
        errorMessage = "Konto nie zostało zweryfikowane. Sprawdź swoją skrzynkę e-mail.";
        statusCode = 403;
      } else if (error.message.includes("Invalid login credentials")) {
        errorMessage = "Nieprawidłowy e-mail lub hasło. Spróbuj ponownie.";
        statusCode = 401;
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage,
        }),
        {
          status: statusCode,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Success - return user data and redirect URL
    return new Response(
      JSON.stringify({
        success: true,
        redirect: "/dashboard",
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("[Login API] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Wystąpił błąd serwera. Spróbuj ponownie później.",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
