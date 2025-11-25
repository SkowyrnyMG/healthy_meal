import { defineMiddleware } from "astro:middleware";

import { createSupabaseServerInstance } from "../db/supabase.client.ts";

// ============================================================================
// PUBLIC PATHS - No authentication required
// ============================================================================

const PUBLIC_PATHS = [
  // Landing page
  "/",

  // Auth pages (server-rendered)
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",

  // Auth API endpoints (handle auth internally)
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",

  // Public API endpoints (reference data - accessible to anonymous users)
  "/api/tags",
  "/api/allergens",
  "/api/ingredient-substitutions",
  "/api/recipes/public",
];

/**
 * Helper to check if a path is public
 * Supports exact matches and wildcard patterns
 */
function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((publicPath) => {
    if (publicPath.endsWith("*")) {
      const basePattern = publicPath.slice(0, -1);
      return pathname.startsWith(basePattern);
    }
    return pathname === publicPath;
  });
}

// ============================================================================
// MIDDLEWARE
// ============================================================================

export const onRequest = defineMiddleware(async ({ locals, cookies, url, request, redirect }, next) => {
  // Create Supabase SSR client with proper cookie handling
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  // Make supabase client available to all routes via locals
  locals.supabase = supabase;

  // Skip auth check for public paths
  if (isPublicPath(url.pathname)) {
    return next();
  }

  // IMPORTANT: Always get user session before any other operations
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Set user on locals if authenticated
  if (user) {
    locals.user = {
      id: user.id,
      email: user.email,
    };
  } else {
    // Redirect to login for protected routes
    return redirect("/auth/login");
  }

  return next();
});
