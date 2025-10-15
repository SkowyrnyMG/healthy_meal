# API Endpoint Implementation Plan: GET /api/favorites

## 1. Endpoint Overview

The GET /api/favorites endpoint retrieves a paginated list of the authenticated user's favorite recipes. Each favorite includes embedded recipe information such as title, description, nutrition data, and preparation time. The endpoint supports pagination through query parameters and returns metadata about the total number of favorites and available pages.

**Key Features:**
- Retrieves user-specific favorites only (authorization enforced)
- Supports pagination with configurable page size
- Returns embedded recipe details for each favorite
- Provides pagination metadata for frontend navigation

## 2. Request Details

- **HTTP Method**: GET
- **URL Structure**: `/api/favorites`
- **Authentication**: Required (mocked for development with userId: `a85d6d6c-b7d4-4605-9cc4-3743401b67a0`)
- **Parameters**:
  - **Optional Query Parameters**:
    - `page` (number): Page number for pagination
      - Type: positive integer
      - Minimum: 1
      - Default: 1
    - `limit` (number): Number of results per page
      - Type: positive integer
      - Minimum: 1
      - Maximum: 100
      - Default: 20
- **Request Body**: None (GET request)

## 3. Used Types

### Existing DTOs (from `src/types.ts`)

**FavoriteDTO** (lines 259-269):
```typescript
export interface FavoriteDTO {
  recipeId: string;
  recipe: {
    id: string;
    title: string;
    description: string | null;
    nutritionPerServing: NutritionDTO;
    prepTimeMinutes: number | null;
  };
  createdAt: string;
}
```

**PaginationDTO** (lines 438-443):
```typescript
export interface PaginationDTO {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
```

**NutritionDTO** (lines 89-96):
```typescript
export interface NutritionDTO {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  salt: number;
}
```

### New Validation Schema

Create a Zod schema for query parameter validation:

```typescript
const FavoritesQueryParamsSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

type ValidatedFavoritesQueryParams = z.infer<typeof FavoritesQueryParamsSchema>;
```

### Database Query Result Interface

Define an interface for the Supabase query result:

```typescript
interface FavoriteQueryResult {
  recipe_id: string;
  created_at: string;
  recipes: {
    id: string;
    title: string;
    description: string | null;
    nutrition_per_serving: {
      calories: number;
      protein: number;
      fat: number;
      carbs: number;
      fiber: number;
      salt: number;
    };
    prep_time_minutes: number | null;
  } | null;
}
```

## 4. Response Details

### Success Response (200 OK)

```json
{
  "favorites": [
    {
      "recipeId": "550e8400-e29b-41d4-a716-446655440000",
      "recipe": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "title": "Placki ziemniaczane",
        "description": "Traditional Polish potato pancakes",
        "nutritionPerServing": {
          "calories": 250,
          "protein": 8,
          "fat": 10,
          "carbs": 35,
          "fiber": 3,
          "salt": 0.5
        },
        "prepTimeMinutes": 30
      },
      "createdAt": "2025-10-11T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 12,
    "totalPages": 1
  }
}
```

### Error Responses

**400 Bad Request** - Invalid query parameters:
```json
{
  "error": "Bad Request",
  "message": "Number must be greater than or equal to 1"
}
```

**401 Unauthorized** - Not authenticated (production only):
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

**500 Internal Server Error** - Unexpected server error:
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

## 5. Data Flow

### Database Query Flow

1. **Extract and Validate Query Parameters**
   - Parse `page` and `limit` from URL search params
   - Validate using Zod schema
   - Apply defaults if not provided

2. **Execute Parallel Queries**
   - **Count Query**: Get total number of favorites for the user
     - Table: `favorites`
     - Filter: `user_id = {userId}`
     - Purpose: Calculate pagination metadata

   - **Data Query**: Retrieve paginated favorites with recipe details
     - Table: `favorites`
     - Join: `recipes` (one-to-one relationship)
     - Filter: `user_id = {userId}`
     - Select: `recipe_id`, `created_at`, embedded recipe fields
     - Order: `created_at DESC` (most recent first)
     - Pagination: `range(offset, offset + limit - 1)`

3. **Transform Database Results**
   - Map snake_case database fields to camelCase DTO fields
   - Extract nested recipe object from join
   - Handle null recipe case (orphaned favorites)

4. **Calculate Pagination Metadata**
   - Total count from count query
   - Total pages: `Math.ceil(total / limit)`
   - Current page and limit from validated params

5. **Return Response**
   - Wrap favorites array and pagination in response object
   - Set Content-Type: application/json
   - Status: 200 OK

### Service Layer Responsibilities

Create `src/lib/services/favorite.service.ts` with:

```typescript
export async function getUserFavorites(
  supabase: SupabaseClient,
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<{ favorites: FavoriteDTO[]; pagination: PaginationDTO }>
```

**Responsibilities:**
- Execute parallel count and data queries
- Handle database errors
- Map database results to DTOs
- Calculate pagination metadata
- Return structured response

## 6. Security Considerations

### Authentication
- **Development**: Use mocked userId `a85d6d6c-b7d4-4605-9cc4-3743401b67a0`
- **Production**: Validate user session with `context.locals.supabase.auth.getUser()`
- Return 401 Unauthorized if authentication fails

### Authorization
- **User Isolation**: Filter favorites by authenticated userId
- **IDOR Prevention**: userId comes from session, not from request parameters
- **Data Access Control**: Users can only access their own favorites

### Input Validation
- **Query Parameters**: Validate with Zod schema before processing
- **Type Safety**: Use TypeScript for compile-time type checking
- **Range Validation**:
  - page ≥ 1
  - 1 ≤ limit ≤ 100

### Data Exposure
- **No Sensitive Data**: Favorites and recipes are user-specific, no cross-user data leak
- **Error Messages**: Return generic error messages, no sensitive information in errors

### SQL Injection Prevention
- **Parameterized Queries**: Supabase SDK handles query parameterization
- **No Raw SQL**: Use Supabase query builder only

## 7. Error Handling

### Error Scenarios and Responses

| Scenario | Status Code | Error Type | Message |
|----------|-------------|------------|---------|
| Invalid page (< 1) | 400 | Bad Request | "Number must be greater than or equal to 1" |
| Invalid limit (< 1 or > 100) | 400 | Bad Request | "Number must be less than or equal to 100" |
| Invalid limit type | 400 | Bad Request | "Expected number, received string" |
| Missing authentication (production) | 401 | Unauthorized | "Authentication required" |
| Database query error | 500 | Internal Server Error | "An unexpected error occurred" |
| Unexpected exception | 500 | Internal Server Error | "An unexpected error occurred" |

### Error Handling Strategy

1. **Early Returns**: Use guard clauses for error conditions
2. **Specific to Generic**: Handle specific errors first, then catch-all
3. **Structured Logging**: Log errors with context (endpoint, userId, error details)
4. **User-Friendly Messages**: Never expose internal error details to users
5. **Status Code Accuracy**: Use appropriate HTTP status codes

### Logging Pattern

```typescript
console.error("[GET /api/favorites] Error:", {
  error: error instanceof Error ? error.message : "Unknown error",
  stack: error instanceof Error ? error.stack : undefined,
  userId: userId, // Include context when available
});
```

## 8. Performance Considerations

### Query Optimization

1. **Parallel Queries**
   - Execute count and data queries concurrently using `Promise.all()`
   - Reduces total query time by ~50%

2. **Index Utilization**
   - `favorites.user_id` should have an index (part of foreign key)
   - `favorites.created_at` benefits from an index for sorting
   - Consider composite index: `(user_id, created_at DESC)`

3. **Selective Field Retrieval**
   - Only fetch required recipe fields (not full recipe details)
   - Reduces data transfer and parsing overhead

4. **Pagination Benefits**
   - Limits result set size to configurable maximum (100)
   - Prevents memory issues with large favorites lists
   - Faster response times for large datasets

### Potential Bottlenecks

1. **Large Favorites Lists**
   - Mitigation: Enforce maximum limit of 100 items per page
   - Consideration: Monitor query performance for users with 1000+ favorites

2. **Recipe Join Complexity**
   - Mitigation: Only select necessary recipe fields
   - Consideration: Recipe table should have primary key index (auto-created)

3. **Orphaned Favorites**
   - Scenario: Recipe deleted but favorite remains (should not happen with CASCADE)
   - Mitigation: Filter out null recipes in mapping function

### Caching Opportunities

- **Not Recommended**: Favorites change frequently (add/remove)
- **Alternative**: Implement client-side caching with cache invalidation
- **Future Enhancement**: Add ETag support for conditional requests

## 9. Implementation Steps

### Step 1: Create Favorite Service

**File**: `src/lib/services/favorite.service.ts`

1. Import required types from `src/types.ts` and `src/db/supabase.client.ts`
2. Define `FavoriteQueryResult` interface for database query results
3. Implement `getUserFavorites()` function:
   - Accept supabase client, userId, page, and limit parameters
   - Build count query for total favorites
   - Build data query with recipe join and pagination
   - Execute queries in parallel with `Promise.all()`
   - Handle database errors
   - Map results to DTOs using helper function
   - Calculate and return pagination metadata
4. Implement `mapToFavoriteDTO()` helper function:
   - Convert snake_case to camelCase
   - Extract nested recipe object
   - Handle null recipes (filter or throw error)

### Step 2: Create API Route

**File**: `src/pages/api/favorites.ts`

1. Import required dependencies:
   - `type { APIRoute }` from "astro"
   - `z` from "zod"
   - `getUserFavorites` from service layer
2. Add `export const prerender = false` for SSR
3. Define `FavoritesQueryParamsSchema` with Zod
4. Implement GET handler:
   - Add authentication block (mocked for development)
   - Extract query parameters from URL
   - Validate parameters with Zod schema
   - Handle validation errors (400)
   - Call service layer function
   - Return success response (200)
   - Handle and log errors (500)

### Step 3: Add Type Safety

1. Verify `FavoriteDTO` and `PaginationDTO` exist in `src/types.ts` (already present)
2. Ensure `NutritionDTO` is correctly defined (already present)
3. Add JSDoc comments to service functions for IDE support

### Step 4: Test the Endpoint

1. **Manual Testing**:
   - Start dev server: `npm run dev`
   - Test default pagination: `GET /api/favorites`
   - Test custom pagination: `GET /api/favorites?page=2&limit=10`
   - Test validation errors: `GET /api/favorites?page=0`
   - Test validation errors: `GET /api/favorites?limit=200`

2. **Database Setup**:
   - Verify favorites exist for mock user ID
   - Verify recipes are properly joined
   - Check pagination calculations

3. **Error Scenarios**:
   - Test with invalid query parameters
   - Test with non-integer values
   - Verify error messages and status codes

### Step 5: Code Quality Checks

1. Run linter: `npm run lint`
2. Fix any linting issues: `npm run lint:fix`
3. Format code: `npm run format`
4. Verify TypeScript compilation: `npm run build`

### Step 6: Documentation

1. Add JSDoc comments to all public functions
2. Document query parameter validation rules
3. Add inline comments for complex logic
4. Update API documentation (if separate docs exist)

---

## Summary

This implementation plan provides a comprehensive guide for implementing the GET /api/favorites endpoint. The endpoint will:

- Retrieve authenticated user's favorite recipes with pagination
- Follow existing codebase patterns (Astro API routes, Zod validation, service layer)
- Implement proper error handling and logging
- Ensure security through authentication and authorization
- Optimize performance with parallel queries and pagination
- Maintain type safety with TypeScript and DTOs
