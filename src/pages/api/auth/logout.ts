import type { APIRoute } from "astro";

export const prerender = false;

/**
 * POST /api/auth/logout
 *
 * Logs out the current user by calling Supabase signOut
 * and clearing authentication cookies.
 *
 * @returns 200 OK with success message
 * @returns 500 Internal Server Error on failure
 */
export const POST: APIRoute = async ({ locals, cookies }) => {
  try {
    // Sign out from Supabase
    const { error } = await locals.supabase.auth.signOut();

    if (error) {
      console.error("[Logout API] Supabase signOut error:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to sign out",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Clear Supabase auth cookies
    // Supabase typically uses these cookie names
    const authCookieNames = ["sb-access-token", "sb-refresh-token", "sb-auth-token"];

    authCookieNames.forEach((cookieName) => {
      cookies.delete(cookieName, {
        path: "/",
      });
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Logged out successfully",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("[Logout API] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "An unexpected error occurred",
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
