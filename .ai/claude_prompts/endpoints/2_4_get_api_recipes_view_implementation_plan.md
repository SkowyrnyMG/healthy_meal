# API Endpoint Implementation Plan: GET /api/recipes

## 1. Endpoint Overview

This endpoint retrieves a paginated list of recipes owned by the authenticated user with support for advanced filtering, full-text search, and sorting capabilities. Users can search recipes by text, filter by tags, nutrition values, preparation time, and public/private status. The endpoint leverages PostgreSQL's full-text search capabilities for efficient text searching.

**Key Features:**

- Full-text search in title and description using PostgreSQL tsvector
- Multi-tag filtering with comma-separated UUID list
- Nutrition-based filtering (maximum calories per serving)
- Time-based filtering (maximum preparation time)
- Privacy status filtering (public/private)
- Flexible sorting on multiple fields
- Pagination with configurable page size

## 2. Request Details

- **HTTP Method**: GET
- **URL Structure**: `/api/recipes`
- **Authentication**: Required (mock for development, real authentication in production)
- **Parameters**: All parameters are optional query parameters

### Query Parameters

| Parameter     | Type    | Required | Validation                                    | Default     | Description                               |
| ------------- | ------- | -------- | --------------------------------------------- | ----------- | ----------------------------------------- |
| `search`      | string  | No       | 1-255 characters, trimmed                     | -           | Full-text search in title and description |
| `tags`        | string  | No       | Comma-separated UUIDs                         | -           | Filter by tag IDs                         |
| `maxCalories` | number  | No       | Min: 1, Max: 10000                            | -           | Maximum calories per serving              |
| `maxPrepTime` | number  | No       | Min: 1, Max: 1440                             | -           | Maximum preparation time in minutes       |
| `isPublic`    | boolean | No       | "true" or "false" string                      | -           | Filter by public/private status           |
| `page`        | number  | No       | Min: 1                                        | 1           | Page number for pagination                |
| `limit`       | number  | No       | Min: 1, Max: 100                              | 20          | Results per page                          |
| `sortBy`      | enum    | No       | "createdAt", "updatedAt", "title", "prepTime" | "createdAt" | Field to sort by                          |
| `sortOrder`   | enum    | No       | "asc", "desc"                                 | "desc"      | Sort direction                            |

### Example Requests

```
GET /api/recipes
GET /api/recipes?search=placki&page=1&limit=10
GET /api/recipes?tags=uuid1,uuid2&maxCalories=500
GET /api/recipes?maxPrepTime=30&sortBy=prepTime&sortOrder=asc
GET /api/recipes?isPublic=true&sortBy=title
```

## 3. Used Types

### DTOs (from `src/types.ts`)

**RecipeListItemDTO** - Main response item structure:

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

**NutritionDTO** - Nested nutrition information:

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

**TagDTO** - Nested tag information:

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

**RecipeQueryParams** - Query parameters structure:

```typescript
interface RecipeQueryParams {
  search?: string;
  tags?: string;
  maxCalories?: number;
  maxPrepTime?: number;
  isPublic?: boolean;
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "updatedAt" | "title" | "prepTime";
  sortOrder?: "asc" | "desc";
}
```

### Validation Schema

**RecipeQueryParamsSchema** - Zod schema for validation:

```typescript
const RecipeQueryParamsSchema = z.object({
  search: z.string().trim().min(1).max(255).optional(),
  tags: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      const uuids = val.split(",").map((s) => s.trim());
      // Validate each UUID
      return z.array(z.string().uuid()).parse(uuids);
    }),
  maxCalories: z.coerce.number().int().min(1).max(10000).optional(),
  maxPrepTime: z.coerce.number().int().min(1).max(1440).optional(),
  isPublic: z
    .enum(["true", "false"])
    .transform((val) => val === "true")
    .optional(),
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
      "title": "Placki ziemniaczane",
      "description": "Tradycyjne polskie placki",
      "servings": 4,
      "prepTimeMinutes": 30,
      "isPublic": false,
      "featured": false,
      "nutritionPerServing": {
        "calories": 450,
        "protein": 12,
        "fat": 15,
        "carbs": 60,
        "fiber": 6,
        "salt": 1.5
      },
      "tags": [
        {
          "id": "uuid",
          "name": "Obiad",
          "slug": "obiad",
          "createdAt": "2025-10-11T12:00:00Z"
        }
      ],
      "createdAt": "2025-10-11T12:00:00Z",
      "updatedAt": "2025-10-11T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

### Error Responses

**400 Bad Request** - Invalid query parameters:

```json
{
  "error": "Bad Request",
  "message": "Invalid query parameter: tags must be valid UUIDs"
}
```

**401 Unauthorized** - Not authenticated:

```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

**500 Internal Server Error** - Server-side error:

```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

## 5. Data Flow

### High-Level Flow

1. **Request Reception** → Receive GET request at `/api/recipes`
2. **Authentication** → Verify user authentication (mock for development)
3. **Parameter Extraction** → Extract query parameters from URL
4. **Validation** → Validate parameters using Zod schema
5. **Service Call** → Call `getUserRecipes` service function
6. **Database Query** → Execute complex Supabase query with filters
7. **Data Transformation** → Map database results to DTOs
8. **Response** → Return JSON response with recipes and pagination

### Database Query Flow

The service layer builds a dynamic Supabase query with the following steps:

1. **Base Query Setup**:
   - Select from `recipes` table
   - Filter by `user_id = userId` (ensure user only sees their own recipes)

2. **Full-Text Search** (if `search` provided):
   - Use `search_vector` column with `to_tsquery('simple', searchTerm)`
   - PostgreSQL will use GIN index for efficient searching
   - Weighted search: title (A priority) > description (B priority)

3. **Tag Filtering** (if `tags` provided):
   - LEFT JOIN with `recipe_tags` table on `recipe_id`
   - Filter where `tag_id IN (tagUuids)`
   - Use `array_agg` to collect all tags per recipe

4. **Nutrition Filtering** (if `maxCalories` provided):
   - Extract calories from JSONB: `(nutrition_per_serving->>'calories')::numeric`
   - Filter where calories <= maxCalories

5. **Preparation Time Filtering** (if `maxPrepTime` provided):
   - Filter where `prep_time_minutes <= maxPrepTime`
   - Handle NULL values appropriately

6. **Privacy Filtering** (if `isPublic` provided):
   - Filter where `is_public = isPublic`

7. **Sorting**:
   - Apply ORDER BY based on `sortBy` parameter
   - Map field names: "prepTime" → "prep_time_minutes"
   - Handle NULL values in prep_time_minutes (push to end)
   - Apply `sortOrder` (ASC/DESC)

8. **Pagination**:
   - Calculate offset: `(page - 1) * limit`
   - Apply `.range(offset, offset + limit - 1)`
   - Get total count with `{ count: 'exact' }`

9. **Tag Aggregation**:
   - Join with `tags` table to get full tag information
   - Group tags by recipe using aggregation

### Service Function Structure

```typescript
async function getUserRecipes(
  supabase: SupabaseClient,
  userId: string,
  params: RecipeQueryParams
): Promise<{ recipes: RecipeListItemDTO[]; pagination: PaginationDTO }>;
```

**Steps**:

1. Destructure and apply defaults to params
2. Build base query with user filter
3. Apply conditional filters based on provided params
4. Execute count query for total
5. Apply sorting and pagination
6. Execute main query
7. Map results to DTOs
8. Calculate pagination metadata
9. Return recipes with pagination

## 6. Security Considerations

### Authentication & Authorization

**Threat**: Unauthorized access to recipe data

- **Mitigation**:
  - Verify authentication using `context.locals.supabase.auth.getUser()`
  - Return 401 if user not authenticated
  - Development: Use mock user ID with TODO comment for production

**Threat**: Cross-user data leakage

- **Mitigation**:
  - Always filter recipes by `user_id = userId`
  - Never expose other users' private recipes
  - Enforce at database query level, not just application level

### Input Validation

**Threat**: SQL Injection through query parameters

- **Mitigation**:
  - Use Supabase's parameterized queries (handles escaping)
  - Validate all UUIDs with Zod before querying
  - Never construct raw SQL from user input

**Threat**: UUID injection in tags parameter

- **Mitigation**:
  - Split comma-separated string and validate each UUID
  - Use Zod's UUID validator
  - Reject request if any UUID is invalid

**Threat**: Full-text search injection

- **Mitigation**:
  - PostgreSQL's `to_tsquery` handles escaping
  - Limit search string to 255 characters
  - Trim whitespace to prevent abuse

**Threat**: JSONB query injection in nutrition filtering

- **Mitigation**:
  - Use Supabase's safe JSONB operators (`->>`)
  - Cast values explicitly to numeric type
  - Validate numeric ranges (1-10000 for calories)

### Resource Protection

**Threat**: Pagination abuse (requesting excessive data)

- **Mitigation**:
  - Enforce maximum limit of 100 items per page
  - Default to 20 items if not specified
  - Validate page number is positive integer

**Threat**: Query performance degradation

- **Mitigation**:
  - Rely on database indexes (GIN index on search_vector)
  - Limit result set with pagination
  - Use efficient JOIN strategies
  - Set reasonable query timeouts

### Data Privacy

**Threat**: Exposure of sensitive recipe information

- **Mitigation**:
  - Only return recipes belonging to authenticated user
  - Respect `is_public` flag for visibility control
  - Don't expose other users' private recipe data

## 7. Error Handling

### Validation Errors (400 Bad Request)

**Scenarios**:

- Invalid UUID format in tags parameter
  - _Example_: `tags=invalid-uuid,another-bad-uuid`
  - _Response_: `"Invalid UUID format in tags parameter"`

- Search string too long (>255 characters)
  - _Example_: `search=very-long-string...`
  - _Response_: `"Search query must be 255 characters or less"`

- Out-of-range numeric values
  - _Example_: `maxCalories=99999` or `maxPrepTime=-10`
  - _Response_: `"maxCalories must be between 1 and 10000"`

- Invalid enum values
  - _Example_: `sortBy=invalid` or `sortOrder=random`
  - _Response_: `"sortBy must be one of: createdAt, updatedAt, title, prepTime"`

- Invalid boolean format
  - _Example_: `isPublic=maybe`
  - _Response_: `"isPublic must be 'true' or 'false'"`

**Handling**:

```typescript
try {
  validatedParams = RecipeQueryParamsSchema.parse(rawParams);
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

**Scenarios**:

- Missing authentication token
- Expired authentication token
- Invalid authentication token

**Handling** (Production - currently commented):

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

**Development** (Current):

```typescript
// MOCK: Remove this in production
const userId = "a85d6d6c-b7d4-4605-9cc4-3743401b67a0";
```

### Database Errors (500 Internal Server Error)

**Scenarios**:

- Database connection failure
- Query execution timeout
- Constraint violations
- Unexpected database errors

**Handling**:

```typescript
try {
  const result = await getUserRecipes(context.locals.supabase, userId, validatedParams);
  // ... success response
} catch (error) {
  console.error("[GET /api/recipes] Error:", {
    error: error instanceof Error ? error.message : "Unknown error",
    stack: error instanceof Error ? error.stack : undefined,
    userId,
    params: validatedParams,
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

**Log Levels**:

- `console.error`: Unexpected errors, database failures
- `console.warn`: Potential issues (not currently used)
- `console.info`: Informational messages (not currently used)

**Logged Information**:

- Error message and stack trace
- User ID (for debugging)
- Request parameters (for reproducing issues)
- Endpoint identifier (e.g., "[GET /api/recipes]")

**Privacy Considerations**:

- Don't log sensitive data (passwords, tokens)
- User IDs are acceptable for debugging
- Sanitize any user input before logging

## 8. Performance Considerations

### Potential Bottlenecks

1. **Full-Text Search Performance**
   - _Issue_: Text search can be slow on large datasets
   - _Optimization_:
     - Use GIN index on `search_vector` column (already created in migration)
     - Generated tsvector column is pre-computed at insert/update time
     - Use 'simple' configuration for language-agnostic search (can switch to 'polish' for better Polish language support)

2. **Tag Filtering with JOINs**
   - _Issue_: Multiple JOINs can slow down query execution
   - _Optimization_:
     - Use LEFT JOIN instead of multiple queries
     - Leverage foreign key indexes on `recipe_tags` table
     - Use `array_agg` to aggregate tags efficiently

3. **JSONB Nutrition Filtering**
   - _Issue_: Extracting and filtering JSONB data can be slow
   - _Optimization_:
     - Use `->>` operator for efficient key extraction
     - Cast to numeric type only once in query
     - Consider adding GIN index on `nutrition_per_serving` if this becomes a bottleneck

4. **Large Result Sets**
   - _Issue_: Users with hundreds of recipes could slow down queries
   - _Optimization_:
     - Enforce maximum limit of 100 items per page
     - Use pagination with offset/limit
     - Return only necessary fields (RecipeListItemDTO, not full recipe details)

5. **Count Query Overhead**
   - _Issue_: Counting total results adds overhead
   - _Optimization_:
     - Use Supabase's `{ count: 'exact' }` option efficiently
     - Consider caching count for frequently accessed pages
     - For very large datasets, consider approximate counts

### Database Indexes

**Existing Indexes** (from migrations):

- Primary key on `recipes.id`
- Foreign key index on `recipes.user_id`
- GIN index on `recipes.search_vector` for full-text search
- Primary key on `recipe_tags (recipe_id, tag_id)`

**Query Optimization**:

- Filter by `user_id` first (most selective)
- Apply full-text search using indexed `search_vector`
- JOIN on indexed foreign keys
- Sort on indexed columns when possible

## 9. Implementation Steps

### Step 1: Create Recipe Service (`src/lib/services/recipe.service.ts`)

1. **Import dependencies**:
   - `SupabaseClient` type from `src/db/supabase.client.ts`
   - DTOs from `src/types.ts`: `RecipeListItemDTO`, `TagDTO`, `NutritionDTO`, `PaginationDTO`, `RecipeQueryParams`

2. **Define database query result interface**:

   ```typescript
   interface RecipeQueryResult {
     id: string;
     user_id: string;
     title: string;
     description: string | null;
     servings: number;
     prep_time_minutes: number | null;
     is_public: boolean;
     featured: boolean;
     nutrition_per_serving: any; // JSONB
     created_at: string;
     updated_at: string;
     tags: any[]; // Array of tag objects from JOIN
   }
   ```

3. **Implement `getUserRecipes` function**:
   - **Signature**: `async function getUserRecipes(supabase: SupabaseClient, userId: string, params: RecipeQueryParams): Promise<{ recipes: RecipeListItemDTO[], pagination: PaginationDTO }>`

   - **Apply parameter defaults**:

     ```typescript
     const {
       search,
       tags,
       maxCalories,
       maxPrepTime,
       isPublic,
       page = 1,
       limit = 20,
       sortBy = "createdAt",
       sortOrder = "desc",
     } = params;
     ```

   - **Build base query**:

     ```typescript
     let query = supabase
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
       `,
         { count: "exact" }
       )
       .eq("user_id", userId);
     ```

   - **Apply full-text search filter** (if search provided):

     ```typescript
     if (search) {
       query = query.textSearch("search_vector", `'${search}'`, {
         type: "plain",
         config: "simple",
       });
     }
     ```

   - **Apply tag filter** (if tags provided):
     - Parse comma-separated tags into array
     - Filter using `recipe_tags.tag_id` IN clause

   - **Apply nutrition filter** (if maxCalories provided):

     ```typescript
     if (maxCalories) {
       query = query.lte("nutrition_per_serving->calories", maxCalories);
     }
     ```

   - **Apply prep time filter** (if maxPrepTime provided):

     ```typescript
     if (maxPrepTime) {
       query = query.lte("prep_time_minutes", maxPrepTime);
     }
     ```

   - **Apply privacy filter** (if isPublic provided):

     ```typescript
     if (isPublic !== undefined) {
       query = query.eq("is_public", isPublic);
     }
     ```

   - **Apply sorting**:
     - Map sortBy: "prepTime" → "prep_time_minutes", others to snake_case
     - Handle NULL prep_time_minutes (use NULLS LAST)
     - Apply order with sortOrder (asc/desc)

   - **Apply pagination**:

     ```typescript
     const offset = (page - 1) * limit;
     query = query.range(offset, offset + limit - 1);
     ```

   - **Execute query**:

     ```typescript
     const { data, error, count } = await query;
     if (error) throw error;
     if (!data) return { recipes: [], pagination: { page, limit, total: 0, totalPages: 0 } };
     ```

   - **Map to DTOs**:
     - Transform each recipe using `mapToRecipeListItemDTO` helper
     - Convert snake_case to camelCase
     - Parse JSONB nutrition data
     - Flatten recipe_tags → tags array

   - **Calculate pagination**:

     ```typescript
     const totalPages = Math.ceil((count || 0) / limit);
     const pagination: PaginationDTO = { page, limit, total: count || 0, totalPages };
     ```

   - **Return result**:
     ```typescript
     return { recipes: mappedRecipes, pagination };
     ```

4. **Implement helper function `mapToRecipeListItemDTO`**:
   - Convert snake_case fields to camelCase
   - Parse nutrition_per_serving JSONB
   - Map recipe_tags to tags array
   - Convert timestamps to ISO strings

5. **Add JSDoc comments** for all exported functions

### Step 2: Create Validation Schema in API Route (`src/pages/api/recipes.ts`)

1. **Import dependencies**:

   ```typescript
   import type { APIRoute } from "astro";
   import { z } from "zod";
   import { getUserRecipes } from "../../lib/services/recipe.service";
   ```

2. **Define Zod validation schema**:

   ```typescript
   const RecipeQueryParamsSchema = z.object({
     search: z.string().trim().min(1).max(255).optional(),
     tags: z
       .string()
       .optional()
       .transform((val) => {
         if (!val) return undefined;
         const uuids = val.split(",").map((s) => s.trim());
         return z.array(z.string().uuid()).parse(uuids);
       }),
     maxCalories: z.coerce.number().int().min(1).max(10000).optional(),
     maxPrepTime: z.coerce.number().int().min(1).max(1440).optional(),
     isPublic: z
       .enum(["true", "false"])
       .transform((val) => val === "true")
       .optional(),
     page: z.coerce.number().int().min(1).optional().default(1),
     limit: z.coerce.number().int().min(1).max(100).optional().default(20),
     sortBy: z.enum(["createdAt", "updatedAt", "title", "prepTime"]).optional().default("createdAt"),
     sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
   });
   ```

3. **Add type inference**:
   ```typescript
   type ValidatedRecipeQueryParams = z.infer<typeof RecipeQueryParamsSchema>;
   ```

### Step 3: Implement GET Handler (`src/pages/api/recipes.ts`)

1. **Add prerender directive**:

   ```typescript
   export const prerender = false;
   ```

2. **Implement GET handler**:

   ```typescript
   export const GET: APIRoute = async (context) => {
     // Implementation in next step
   };
   ```

3. **Add mock authentication** (following allergens endpoint pattern):

   ```typescript
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
   // const userId = user.id;

   // MOCK: Remove this in production
   const userId = "a85d6d6c-b7d4-4605-9cc4-3743401b67a0";
   ```

4. **Extract and parse query parameters**:

   ```typescript
   const url = new URL(context.request.url);
   const rawParams = {
     search: url.searchParams.get("search") || undefined,
     tags: url.searchParams.get("tags") || undefined,
     maxCalories: url.searchParams.get("maxCalories") || undefined,
     maxPrepTime: url.searchParams.get("maxPrepTime") || undefined,
     isPublic: url.searchParams.get("isPublic") || undefined,
     page: url.searchParams.get("page") || undefined,
     limit: url.searchParams.get("limit") || undefined,
     sortBy: url.searchParams.get("sortBy") || undefined,
     sortOrder: url.searchParams.get("sortOrder") || undefined,
   };
   ```

5. **Validate parameters with Zod**:

   ```typescript
   let validatedParams: ValidatedRecipeQueryParams;
   try {
     validatedParams = RecipeQueryParamsSchema.parse(rawParams);
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

6. **Call service and handle errors**:

   ```typescript
   try {
     const result = await getUserRecipes(context.locals.supabase, userId, validatedParams);

     return new Response(JSON.stringify(result), { status: 200, headers: { "Content-Type": "application/json" } });
   } catch (error) {
     console.error("[GET /api/recipes] Error:", {
       error: error instanceof Error ? error.message : "Unknown error",
       stack: error instanceof Error ? error.stack : undefined,
       userId,
       params: validatedParams,
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

7. **Add JSDoc documentation** to the GET handler explaining the endpoint

### Step 4: Testing

1. **Start development server**:

   ```bash
   npm run dev
   ```

2. **Test basic retrieval**:

   ```bash
   curl http://localhost:3000/api/recipes
   ```

3. **Test full-text search**:

   ```bash
   curl "http://localhost:3000/api/recipes?search=placki"
   curl "http://localhost:3000/api/recipes?search=ziemniaczane"
   ```

4. **Test tag filtering** (replace with actual tag UUIDs):

   ```bash
   curl "http://localhost:3000/api/recipes?tags=uuid1,uuid2"
   ```

5. **Test nutrition filtering**:

   ```bash
   curl "http://localhost:3000/api/recipes?maxCalories=500"
   curl "http://localhost:3000/api/recipes?maxCalories=300&maxPrepTime=30"
   ```

6. **Test privacy filtering**:

   ```bash
   curl "http://localhost:3000/api/recipes?isPublic=true"
   curl "http://localhost:3000/api/recipes?isPublic=false"
   ```

7. **Test pagination**:

   ```bash
   curl "http://localhost:3000/api/recipes?page=1&limit=10"
   curl "http://localhost:3000/api/recipes?page=2&limit=5"
   ```

8. **Test sorting**:

   ```bash
   curl "http://localhost:3000/api/recipes?sortBy=title&sortOrder=asc"
   curl "http://localhost:3000/api/recipes?sortBy=prepTime&sortOrder=asc"
   curl "http://localhost:3000/api/recipes?sortBy=createdAt&sortOrder=desc"
   ```

9. **Test combined filters**:

   ```bash
   curl "http://localhost:3000/api/recipes?search=obiad&maxCalories=600&sortBy=prepTime&limit=5"
   ```

10. **Test error cases**:

    ```bash
    # Invalid UUID in tags
    curl "http://localhost:3000/api/recipes?tags=invalid-uuid"

    # Out of range calories
    curl "http://localhost:3000/api/recipes?maxCalories=99999"

    # Invalid sort field
    curl "http://localhost:3000/api/recipes?sortBy=invalid"

    # Invalid boolean
    curl "http://localhost:3000/api/recipes?isPublic=maybe"
    ```

11. **Verify response structure**:
    - Check that all RecipeListItemDTO fields are present
    - Verify camelCase naming convention
    - Confirm tags are properly nested
    - Validate pagination metadata is accurate

12. **Performance testing**:
    - Test with user having 0, 10, 100+ recipes
    - Measure query execution time
    - Verify full-text search uses index (check query plan if needed)

### Step 5: Documentation and Cleanup

1. **Add endpoint documentation** to API documentation (if exists)
2. **Update CHANGELOG** or project documentation
3. **Verify code follows project conventions**:
   - Snake_case to camelCase mapping
   - Error handling pattern
   - Logging format
   - Comment style
4. **Run linter and formatter**:
   ```bash
   npm run lint
   npm run format
   ```

---

## Notes for Developers

### Database Schema Assumptions

- The `recipes` table has a generated `search_vector` column with GIN index
- The text search uses 'simple' configuration (can be changed to 'polish' for better Polish support)
- The `recipe_tags` junction table links recipes to tags
- JSONB nutrition data has consistent structure with required fields

### Alternative Approaches Considered

1. **Client-side filtering**: Rejected due to performance concerns with large datasets
2. **Separate endpoints per filter**: Rejected for simplicity and flexibility
3. **GraphQL instead of REST**: Not in scope for this project
4. **Cursor-based pagination**: Offset-based pagination chosen for simplicity

### Future Enhancements

1. **Advanced search**: Support for ingredient search, dietary restrictions
2. **Saved filters**: Allow users to save common filter combinations
3. **Faceted search**: Return filter counts (e.g., "5 recipes with tag:obiad")
4. **Recipe suggestions**: Recommend recipes based on user preferences
5. **Export functionality**: Export filtered recipe list to PDF/CSV
6. **Sorting by popularity**: Sort by rating or cook count (requires additional data)

### Troubleshooting

**Issue**: Full-text search returns no results

- **Solution**: Check that `search_vector` is generated and indexed. Verify search term format.

**Issue**: Tag filtering returns empty results

- **Solution**: Verify tag UUIDs exist and are associated with user's recipes via `recipe_tags` table.

**Issue**: JSONB filtering not working

- **Solution**: Confirm JSONB structure matches expected format. Check that values are numeric.

**Issue**: Performance degradation with many recipes

- **Solution**: Verify indexes are being used. Consider reducing page limit. Check query execution plan.

**Issue**: Pagination total count incorrect

- **Solution**: Ensure `{ count: 'exact' }` is used in query. Verify filters are applied consistently to count and data queries.
