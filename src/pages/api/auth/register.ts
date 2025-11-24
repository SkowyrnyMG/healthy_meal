import type { APIRoute } from "astro";
import { z } from "zod";

import { createSupabaseServerInstance } from "@/db/supabase.client.ts";

export const prerender = false;

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const registerSchema = z
  .object({
    email: z.string().email("Wprowadź poprawny adres e-mail"),
    password: z
      .string()
      .min(8, "Hasło musi mieć co najmniej 8 znaków")
      .regex(/[a-zA-Z]/, "Hasło musi zawierać co najmniej jedną literę")
      .regex(/[0-9]/, "Hasło musi zawierać co najmniej jedną cyfrę"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są identyczne",
    path: ["confirmPassword"],
  });

// ============================================================================
// REGISTER API ENDPOINT
// ============================================================================

/**
 * POST /api/auth/register
 *
 * Registers a new user with email and password using Supabase Auth.
 * Supabase will send a confirmation email to the user's email address.
 * User must click the confirmation link before they can log in.
 *
 * @returns 200 OK with success message on successful registration
 * @returns 400 Bad Request for validation errors
 * @returns 409 Conflict if user already exists
 * @returns 500 Internal Server Error on failure
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = registerSchema.safeParse(body);

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

    // Attempt to register user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    // Handle authentication errors
    if (error) {
      console.error("[Register API] Supabase auth error:", error);

      // Map Supabase error to user-friendly Polish message
      let errorMessage = "Nie udało się utworzyć konta. Spróbuj ponownie.";
      let statusCode = 400;

      // Check for specific error types
      if (error.message.includes("User already registered")) {
        errorMessage = "Użytkownik z tym adresem e-mail już istnieje.";
        statusCode = 409;
      } else if (error.message.includes("Password should be")) {
        errorMessage = "Hasło nie spełnia wymagań bezpieczeństwa.";
        statusCode = 400;
      } else if (error.message.includes("Unable to validate email")) {
        errorMessage = "Nieprawidłowy adres e-mail.";
        statusCode = 400;
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

    // Success - user registered, confirmation email sent
    console.log("[Register API] User registered successfully:", data.user?.email);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Konto zostało utworzone! Sprawdź swoją skrzynkę e-mail, aby potwierdzić adres.",
        requiresEmailConfirmation: true,
        user: {
          id: data.user?.id,
          email: data.user?.email,
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
    console.error("[Register API] Unexpected error:", error);
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
