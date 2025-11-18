# API Endpoint Implementation Plan: GET /api/recipes/public

## 1. Endpoint Overview

This endpoint enables authenticated users to browse and discover public recipes shared by all users in the system. Unlike GET /api/recipes which returns only the authenticated user's own recipes, this endpoint provides access to the community's public recipe collection.

**Key Characteristics:**

- Returns public recipes from all users (not limited to authenticated user)
- Requires authentication (user must be logged in to browse)
- Supports full-text search, filtering by tags, calories, and prep time
- Provides pagination and flexible sorting options
- Implicitly filters for `is_public = true` (cannot be overridden)

## 2. Request Details

- **HTTP Method**: GET
- **URL Structure**: `/api/recipes/public`
- **Authentication**: Required (mock for development, real auth in production)
- **Content-Type**: N/A (GET request with query parameters)

### Parameters

**All parameters are optional query parameters:**

| Parameter     | Type   | Validation                                          | Default     | Description                                      |
| ------------- | ------ | --------------------------------------------------- | ----------- | ------------------------------------------------ |
| `search`      | string | 1-255 characters, trimmed                           | -           | Full-text search in recipe title and description |
| `tags`        | string | Comma-separated UUIDs                               | -           | Filter recipes by tag IDs                        |
| `maxCalories` | number | Integer, 1-10000                                    | -           | Maximum calories per serving                     |
| `maxPrepTime` | number | Integer, 1-1440                                     | -           | Maximum preparation time in minutes              |
| `page`        | number | Integer, min 1                                      | 1           | Page number for pagination                       |
| `limit`       | number | Integer, 1-100                                      | 20          | Number of results per page                       |
| `sortBy`      | enum   | "createdAt" \| "updatedAt" \| "title" \| "prepTime" | "createdAt" | Field to sort by                                 |
| `sortOrder`   | enum   | "asc" \| "desc"                                     | "desc"      | Sort direction                                   |

**Note**: The `isPublic` parameter is NOT available in this endpoint. All results are implicitly filtered to public recipes only.

### Example Requests

```
GET /api/recipes/public
GET /api/recipes/public?search=pasta&maxCalories=500
GET /api/recipes/public?tags=uuid1,uuid2&sortBy=title&sortOrder=asc
GET /api/recipes/public?page=2&limit=50&maxPrepTime=30
```

## 3. Used Types

### DTOs (from `src/types.ts`)

**RecipeListItemDTO** - Response data structure for recipe list items:

```typescript
interface RecipeListItemDTO {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  servings: number;
  prepTimeMinutes: number | null;
  isPublic: boolean;
  featured: boolean;
  nutritionPerServing: NutritionDTO;
  tags: TagDTO[];
  createdAt: string;
  updatedAt: string;
}
```

**NutritionDTO** - Nutrition information per serving:

```typescript
interface NutritionDTO {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  salt: number;
}
```

**TagDTO** - Tag information:

```typescript
interface TagDTO {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}
```

**PaginationDTO** - Pagination metadata:

```typescript
interface PaginationDTO {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
```

**RecipeQueryParams** - Query parameters interface:

```typescript
interface RecipeQueryParams {
  search?: string;
  tags?: string;
  maxCalories?: number;
  maxPrepTime?: number;
  isPublic?: boolean; // Will be hardcoded to true
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "updatedAt" | "title" | "prepTime";
  sortOrder?: "asc" | "desc";
}
```

### Validation Schema

**PublicRecipeQueryParamsSchema** - New Zod schema for validating query parameters:

```typescript
const PublicRecipeQueryParamsSchema = z.object({
  search: z.string().trim().min(1).max(255).optional(),
  tags: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      const uuids = val.split(",").map((s) => s.trim());
      z.array(z.string().uuid()).parse(uuids);
      return val;
    }),
  maxCalories: z.coerce.number().int().min(1).max(10000).optional(),
  maxPrepTime: z.coerce.number().int().min(1).max(1440).optional(),
  // Note: isPublic is NOT included - it's hardcoded to true in service
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  sortBy: z.enum(["createdAt", "updatedAt", "title", "prepTime"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});
```

## 4. Response Details

### Success Response (200 OK)

```json
{
  "recipes": [
    {
      "id": "uuid",
      "userId": "uuid",
      "title": "Healthy Pasta Primavera",
      "description": "A light and colorful pasta dish",
      "servings": 4,
      "prepTimeMinutes": 30,
      "isPublic": true,
      "featured": false,
      "nutritionPerServing": {
        "calories": 450,
        "protein": 15,
        "fat": 12,
        "carbs": 65,
        "fiber": 8,
        "salt": 1.5
      },
      "tags": [
        {
          "id": "uuid",
          "name": "Italian",
          "slug": "italian",
          "createdAt": "2025-01-15T10:00:00Z"
        }
      ],
      "createdAt": "2025-01-15T10:00:00Z",
      "updatedAt": "2025-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### Error Responses

**400 Bad Request** - Invalid query parameters:

```json
{
  "error": "Bad Request",
  "message": "Expected string, received number"
}
```

**401 Unauthorized** - Not authenticated (production only):

```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

**500 Internal Server Error** - Server error:

```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

## 5. Data Flow

### Request Flow

1. **API Route Handler** (`src/pages/api/recipes/public.ts`)
   - Receives HTTP GET request with query parameters
   - Extracts query parameters from URL
   - **Authentication** (currently mocked for development)
     - Production: Validates user session via `context.locals.supabase.auth.getUser()`
     - Development: Uses mock userId
   - Validates query parameters with Zod schema
   - Returns 400 if validation fails
   - Calls service layer with validated parameters

2. **Service Layer** (`src/lib/services/recipe.service.ts`)
   - Receives validated query parameters
   - Builds Supabase query:
     - **Base filter**: `is_public = true` (hardcoded)
     - Applies optional filters (search, tags, calories, prep time)
     - Applies sorting (with proper column mapping)
     - Applies pagination (offset/limit)
   - Executes two queries in parallel:
     - Count query: Get total matching recipes
     - Data query: Get paginated recipe data with tags
   - Maps database results to DTOs
   - Returns recipes array and pagination metadata

3. **Response Formation**
   - Service returns structured data
   - API route wraps in JSON response
   - Returns 200 OK with data

### Database Interactions

**Tables Involved:**

- `recipes` - Main recipe data
- `recipe_tags` - Many-to-many junction table
- `tags` - Tag definitions

**Query Pattern:**

```sql
-- Count query (for pagination)
SELECT COUNT(*) FROM recipes
WHERE is_public = true
  AND [optional filters...]

-- Data query (with joins)
SELECT
  recipes.*,
  recipe_tags.tag_id,
  tags.*
FROM recipes
LEFT JOIN recipe_tags ON recipes.id = recipe_tags.recipe_id
LEFT JOIN tags ON recipe_tags.tag_id = tags.id
WHERE recipes.is_public = true
  AND [optional filters...]
ORDER BY [sort column] [sort order]
LIMIT [limit] OFFSET [offset]
```

**Full-Text Search:**

- Uses PostgreSQL's `search_vector` column on recipes table
- Configured with `tsvector` and GIN index for performance
- Search configuration: "simple" mode with "plain" type

## 6. Security Considerations

### Authentication & Authorization

**Current Implementation (Development):**

- Mock authentication with hardcoded userId
- TODO comment marks where real auth should be enabled

**Production Requirements:**

- Authenticate user via Supabase session: `context.locals.supabase.auth.getUser()`
- Return 401 Unauthorized if not authenticated
- No authorization needed beyond authentication (all users can view public recipes)

### Data Access Controls

1. **Public-Only Filter**
   - `is_public = true` filter is **hardcoded in service layer**
   - Cannot be overridden by query parameters
   - Ensures no private recipes are exposed

2. **No User Ownership Filter**
   - Unlike GET /api/recipes, this endpoint does NOT filter by `user_id`
   - Returns public recipes from all users
   - This is intentional and expected behavior

### Input Validation

1. **SQL Injection Prevention**
   - Supabase SDK uses parameterized queries
   - No raw SQL concatenation
   - Zod validation sanitizes inputs before service layer

2. **XSS Prevention**
   - No HTML rendering in this endpoint
   - JSON responses are automatically escaped
   - Frontend must sanitize when rendering

3. **DoS Prevention**
   - Maximum limit: 100 items per page
   - Search string: max 255 characters
   - Numeric ranges: enforced min/max values
   - Database query timeout handled by Supabase

### Potential Threats & Mitigations

| Threat                   | Mitigation                                    |
| ------------------------ | --------------------------------------------- |
| Unauthenticated access   | Require valid Supabase session (production)   |
| Private recipe exposure  | Hardcode `is_public = true` in service        |
| Parameter pollution      | Explicitly exclude `isPublic` from Zod schema |
| Large result sets        | Enforce max limit of 100 items                |
| Malicious search strings | Zod validation + Supabase parameterization    |
| Tag UUID injection       | Validate each UUID with Zod                   |

## 7. Error Handling

### Validation Errors (400 Bad Request)

**Trigger Conditions:**

- Empty or whitespace-only search string (after trim)
- Search string > 255 characters
- Invalid UUID format in tags parameter
- Non-numeric or out-of-range numeric values
- Invalid enum values for sortBy or sortOrder
- page < 1 or limit < 1 or limit > 100

**Handling:**

```typescript
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
```

### Authentication Errors (401 Unauthorized)

**Trigger Conditions (Production):**

- Missing authentication token
- Invalid or expired session
- User not found

**Handling:**

```typescript
const {
  data: { user },
  error: authError,
} = await context.locals.supabase.auth.getUser();
if (authError || !user) {
  return new Response(
    JSON.stringify({
      error: "Unauthorized",
      message: "Authentication required",
    }),
    { status: 401, headers: { "Content-Type": "application/json" } }
  );
}
```

### Database Errors (500 Internal Server Error)

**Trigger Conditions:**

- Supabase connection failure
- Query execution errors
- Timeout errors
- Unexpected service errors

**Handling:**

```typescript
catch (error) {
  console.error("[GET /api/recipes/public] Error:", {
    error: error instanceof Error ? error.message : "Unknown error",
    stack: error instanceof Error ? error.stack : undefined,
  });

  return new Response(
    JSON.stringify({
      error: "Internal Server Error",
      message: "An unexpected error occurred",
    }),
    { status: 500, headers: { "Content-Type": "application/json" } }
  );
}
```

### Error Logging Strategy

**What to Log:**

- All 500 errors with full stack trace
- Endpoint name in log prefix: `[GET /api/recipes/public]`
- Error message and type
- Do NOT log sensitive data (user tokens, passwords)

**What NOT to Expose to Client:**

- Internal error details
- Stack traces
- Database schema information
- Service implementation details

## 8. Performance Considerations

### Potential Bottlenecks

1. **Full-Text Search Performance**
   - Full-text search on large recipe tables can be slow
   - Depends on `search_vector` GIN index
   - **Mitigation**: Ensure GIN index exists on `search_vector` column

2. **Tag Join Queries**
   - Multiple LEFT JOINs can impact performance
   - N+1 problem if not properly optimized
   - **Mitigation**: Use single query with joins (already implemented)

3. **Large Result Sets**
   - Counting all matching recipes can be expensive
   - **Mitigation**: Separate count query from data query (parallel execution)

4. **Pagination with High Offsets**
   - `OFFSET` performance degrades with large values (page 100+)
   - **Mitigation**: Acceptable for typical use cases; consider cursor pagination for v2

### Optimization Strategies

1. **Database Indexes**

   ```sql
   -- Required indexes (should already exist)
   CREATE INDEX idx_recipes_is_public ON recipes(is_public);
   CREATE INDEX idx_recipes_search_vector ON recipes USING GIN(search_vector);
   CREATE INDEX idx_recipes_created_at ON recipes(created_at DESC);
   CREATE INDEX idx_recipes_prep_time ON recipes(prep_time_minutes);
   CREATE INDEX idx_recipes_calories ON recipes((nutrition_per_serving->>'calories'));
   ```

2. **Query Optimization**
   - Execute count and data queries in parallel using `Promise.all()`
   - Use Supabase's built-in query optimization
   - Leverage existing `search_vector` for full-text search

3. **Caching Opportunities (Future)**
   - Cache popular searches (e.g., no filters, default sort)
   - Cache tag filter results
   - Use Redis or similar for query result caching
   - Cache duration: 5-15 minutes

4. **Response Size Management**
   - Maximum 100 items per page (enforced)
   - Consider compression for large responses (handled by CDN/server)
   - Minimize JSON payload (already optimized DTOs)

### Performance Targets

- **Response Time**: < 500ms for typical queries (p95)
- **Database Query Time**: < 200ms for data query
- **Count Query Time**: < 100ms
- **Maximum Pagination**: Support up to page 1000 (20,000 recipes)

## 9. Implementation Steps

### Step 1: Add Service Function to recipe.service.ts

**File**: `src/lib/services/recipe.service.ts`

Add new `getPublicRecipes()` function after existing `getUserRecipes()`:

```typescript
/**
 * Get public recipes from all users with filtering, searching, sorting, and pagination
 * @param supabase - Supabase client instance from context.locals
 * @param params - Query parameters for filtering, sorting, and pagination
 * @returns Object containing array of RecipeListItemDTO and pagination metadata
 * @throws Error if database query fails
 */
export async function getPublicRecipes(
  supabase: SupabaseClient,
  params: RecipeQueryParams
): Promise<{ recipes: RecipeListItemDTO[]; pagination: PaginationDTO }> {
  // Apply parameter defaults
  const {
    search,
    tags,
    maxCalories,
    maxPrepTime,
    page = 1,
    limit = 20,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = params;

  // Build base query for count (separate from data query to avoid Supabase pagination issues)
  let countQuery = supabase.from("recipes").select("*", { count: "exact", head: true }).eq("is_public", true); // Hardcoded - only public recipes

  // Build data query
  let dataQuery = supabase
    .from("recipes")
    .select(
      `
      id,
      user_id,
      title,
      description,
      servings,
      prep_time_minutes,
      is_public,
      featured,
      nutrition_per_serving,
      created_at,
      updated_at,
      recipe_tags (
        tag_id,
        tags (
          id,
          name,
          slug,
          created_at
        )
      )
    `
    )
    .eq("is_public", true); // Hardcoded - only public recipes

  // Apply filters to both queries (reuse logic from getUserRecipes)
  if (search) {
    const searchConfig = {
      type: "plain" as const,
      config: "simple",
    };
    countQuery = countQuery.textSearch("search_vector", `'${search}'`, searchConfig);
    dataQuery = dataQuery.textSearch("search_vector", `'${search}'`, searchConfig);
  }

  if (tags) {
    const tagUuids = tags.split(",").map((s) => s.trim());
    countQuery = countQuery.in("recipe_tags.tag_id", tagUuids);
    dataQuery = dataQuery.in("recipe_tags.tag_id", tagUuids);
  }

  if (maxCalories !== undefined) {
    countQuery = countQuery.lte("nutrition_per_serving->calories", maxCalories);
    dataQuery = dataQuery.lte("nutrition_per_serving->calories", maxCalories);
  }

  if (maxPrepTime !== undefined) {
    countQuery = countQuery.lte("prep_time_minutes", maxPrepTime);
    dataQuery = dataQuery.lte("prep_time_minutes", maxPrepTime);
  }

  // Apply sorting to data query only
  const sortColumn = mapSortByToColumn(sortBy);
  dataQuery = dataQuery.order(sortColumn, {
    ascending: sortOrder === "asc",
    nullsFirst: false,
  });

  // Apply pagination to data query only
  const offset = (page - 1) * limit;
  dataQuery = dataQuery.range(offset, offset + limit - 1);

  // Execute both queries in parallel
  const [countResult, dataResult] = await Promise.all([countQuery, dataQuery]);

  if (countResult.error) {
    throw countResult.error;
  }

  if (dataResult.error) {
    throw dataResult.error;
  }

  const count = countResult.count || 0;
  const data = (dataResult.data || []) as RecipeQueryResult[];

  if (data.length === 0) {
    return {
      recipes: [],
      pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
    };
  }

  // Map to DTOs (reuse existing mapper)
  const recipes = data.map(mapToRecipeListItemDTO);

  // Calculate pagination
  const totalPages = Math.ceil(count / limit);
  const pagination: PaginationDTO = {
    page,
    limit,
    total: count,
    totalPages,
  };

  return { recipes, pagination };
}
```

**Key Differences from `getUserRecipes()`:**

- No `userId` parameter
- No `.eq("user_id", userId)` filter
- Hardcoded `.eq("is_public", true)` filter
- Reuses existing helper functions (`mapSortByToColumn`, `mapToRecipeListItemDTO`)

### Step 2: Create API Endpoint File

**File**: `src/pages/api/recipes/public.ts`

Create new file with the following content:

```typescript
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
```

### Step 3: Testing Checklist

After implementation, test the following scenarios:

**Basic Functionality:**

- [ ] GET `/api/recipes/public` returns paginated public recipes
- [ ] Response includes both `recipes` array and `pagination` object
- [ ] Recipes have all expected fields (id, title, description, etc.)
- [ ] Tags are properly joined and included
- [ ] Only public recipes are returned (`isPublic: true`)

**Filtering:**

- [ ] Search parameter filters by title/description
- [ ] Tags parameter filters by tag IDs (single and multiple)
- [ ] maxCalories filters correctly
- [ ] maxPrepTime filters correctly
- [ ] Multiple filters work together (AND logic)

**Sorting:**

- [ ] sortBy="createdAt" with sortOrder="desc" (default)
- [ ] sortBy="title" with sortOrder="asc"
- [ ] sortBy="prepTime" with sortOrder="asc"
- [ ] sortBy="updatedAt" with sortOrder="desc"

**Pagination:**

- [ ] Default pagination (page=1, limit=20)
- [ ] Custom pagination (page=2, limit=10)
- [ ] Pagination metadata is accurate (total, totalPages)
- [ ] Last page returns fewer items if total not divisible by limit
- [ ] Empty result set returns empty array with pagination

**Validation:**

- [ ] Invalid search (empty after trim) returns 400
- [ ] Search > 255 chars returns 400
- [ ] Invalid UUID in tags returns 400
- [ ] maxCalories out of range returns 400
- [ ] maxPrepTime out of range returns 400
- [ ] Invalid sortBy value returns 400
- [ ] Invalid sortOrder value returns 400
- [ ] page < 1 returns 400
- [ ] limit > 100 returns 400

**Error Handling:**

- [ ] Database errors return 500
- [ ] Error messages don't expose internal details
- [ ] Errors are logged with proper context

**Security:**

- [ ] Private recipes are NOT returned (even with parameter manipulation)
- [ ] Users from different accounts see the same public recipes
- [ ] No SQL injection via search parameter
- [ ] No parameter pollution attacks work

## 10. Future Enhancements

1. **Performance Optimization**
   - Implement Redis caching for popular queries
   - Add cursor-based pagination for better performance
   - Optimize database indexes based on query patterns

2. **Advanced Filtering**
   - Filter by allergens (exclude recipes with specific allergens)
   - Filter by dietary preferences (vegan, vegetarian, etc.)
   - Filter by ingredient availability
   - Filter by user ratings

3. **Enhanced Search**
   - Support for advanced search operators (AND, OR, NOT)
   - Search by ingredients
   - Fuzzy matching for typos
   - Search result highlighting

4. **Social Features**
   - Include recipe popularity metrics (view count, favorites)
   - Show recipe creator information
   - Filter by featured/trending recipes

5. **Analytics**
   - Track popular searches
   - Monitor query performance
   - Identify slow queries for optimization
