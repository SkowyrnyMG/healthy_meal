# API Endpoint Implementation Plan: GET /api/collections/{collectionId}

## 1. Endpoint Overview

This endpoint retrieves a specific recipe collection for the authenticated user, including paginated recipes within that collection. It verifies collection ownership and returns detailed collection information with embedded recipe data.

**Key Features:**
- Retrieves collection by ID with ownership verification
- Returns paginated list of recipes in the collection
- Provides detailed recipe information (title, description, nutrition)
- Includes pagination metadata for client-side navigation

## 2. Request Details

- **HTTP Method**: GET
- **URL Structure**: `/api/collections/{collectionId}`
- **Parameters**:
  - **Required Path Parameters**:
    - `collectionId` (UUID): Unique identifier of the collection
  - **Optional Query Parameters**:
    - `page` (number): Page number for pagination (default: 1, min: 1)
    - `limit` (number): Number of recipes per page (default: 20, min: 1, max: 100)
- **Request Body**: None (GET request)
- **Authentication**: Required (mocked for development)

## 3. Used Types

### DTOs (Already Defined in src/types.ts)

**CollectionDetailDTO**: Response structure for collection with recipes
```typescript
interface CollectionDetailDTO {
  id: string;
  userId: string;
  name: string;
  recipes: CollectionRecipeDTO[];
  pagination: PaginationDTO;
  createdAt: string;
}
```

**CollectionRecipeDTO**: Recipe information within a collection
```typescript
interface CollectionRecipeDTO {
  recipeId: string;
  recipe: {
    id: string;
    title: string;
    description: string | null;
    nutritionPerServing: NutritionDTO;
  };
  createdAt: string;
}
```

**PaginationDTO**: Pagination metadata
```typescript
interface PaginationDTO {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
```

**NutritionDTO**: Nutrition information
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

### Validation Schemas (To Be Created)

**CollectionIdParamSchema**: Validates collectionId path parameter
```typescript
const CollectionIdParamSchema = z.string().uuid("Invalid collection ID format");
```

**QueryParamsSchema**: Validates pagination query parameters
```typescript
const QueryParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
```

### Service Types (To Be Created in collection.service.ts)

**Database Query Result Interface**:
```typescript
interface CollectionWithRecipesQueryResult {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  collection_recipes: Array<{
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
    };
  }>;
}
```

## 4. Response Details

### Success Response (200 OK)

```json
{
  "id": "uuid",
  "userId": "uuid",
  "name": "Szybkie kolacje",
  "recipes": [
    {
      "recipeId": "uuid",
      "recipe": {
        "id": "uuid",
        "title": "Placki ziemniaczane",
        "description": "...",
        "nutritionPerServing": {
          "calories": 250,
          "protein": 8,
          "fat": 10,
          "carbs": 32,
          "fiber": 3,
          "salt": 0.5
        }
      },
      "createdAt": "2025-10-11T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 8,
    "totalPages": 1
  },
  "createdAt": "2025-10-11T12:00:00Z"
}
```

### Error Responses

**400 Bad Request**: Invalid parameters
```json
{
  "error": "Bad Request",
  "message": "Invalid collection ID format"
}
```

**401 Unauthorized**: Not authenticated (production only)
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

**404 Not Found**: Collection not found or unauthorized access
```json
{
  "error": "Not Found",
  "message": "Collection not found"
}
```

**500 Internal Server Error**: Unexpected error
```json
{
  "error": "Internal Server Error",
  "message": "Failed to retrieve collection"
}
```

## 5. Data Flow

### Request Flow

1. **Authentication Layer**:
   - Extract userId from authentication (mocked for development)
   - Verify user is authenticated (return 401 if not)

2. **Parameter Validation Layer**:
   - Extract collectionId from path parameters
   - Validate collectionId is valid UUID (return 400 if invalid)
   - Extract and validate query parameters (page, limit)
   - Apply defaults for missing query parameters

3. **Service Layer** (`getCollectionWithRecipes`):
   - Query collection from database by ID
   - Check if collection exists (throw CollectionNotFoundError if not)
   - Verify collection belongs to the authenticated user (throw CollectionNotFoundError if not - to prevent enumeration)
   - Query total count of recipes in the collection
   - Calculate pagination metadata (total pages, offset)
   - Query paginated recipes with joins to get recipe details
   - Map database results to DTOs

4. **Response Layer**:
   - Return 200 OK with CollectionDetailDTO
   - Handle errors and return appropriate status codes

### Database Queries

**Query 1: Fetch Collection with Ownership Check**
```sql
SELECT id, user_id, name, created_at
FROM collections
WHERE id = ? AND user_id = ?
LIMIT 1;
```

**Query 2: Count Total Recipes in Collection**
```sql
SELECT COUNT(*) as total
FROM collection_recipes
WHERE collection_id = ?;
```

**Query 3: Fetch Paginated Recipes**
```sql
SELECT
  cr.recipe_id,
  cr.created_at,
  r.id,
  r.title,
  r.description,
  r.nutrition_per_serving
FROM collection_recipes cr
INNER JOIN recipes r ON cr.recipe_id = r.id
WHERE cr.collection_id = ?
ORDER BY cr.created_at DESC
LIMIT ? OFFSET ?;
```

**Note**: Supabase SDK will handle these queries using its query builder, not raw SQL.

## 6. Security Considerations

### Authentication
- **Development**: Mocked userId (`a85d6d6c-b7d4-4605-9cc4-3743401b67a0`)
- **Production**: Use `context.locals.supabase.auth.getUser()` to get authenticated user
- Code includes commented production auth ready to enable

### Authorization
- **Ownership Verification**: Only collection owner can access collection
- **Anti-Enumeration**: Return 404 (not 403) for both non-existent and unauthorized collections
  - Prevents attackers from determining which collections exist
  - Users cannot distinguish between "collection doesn't exist" and "collection exists but not yours"

### Input Validation
- **UUID Validation**: Prevents SQL injection through path parameter
- **Query Parameter Validation**:
  - Page must be positive integer (prevents negative values, strings)
  - Limit capped at 100 (prevents DoS attacks via large page sizes)
  - Type coercion ensures numeric values
- **Zod Schemas**: Provide type safety and runtime validation

### SQL Injection Prevention
- Supabase uses parameterized queries
- All user inputs are validated before database queries
- UUID validation ensures only valid formats are used

### Rate Limiting Considerations
- Not implemented at endpoint level
- Should be handled at infrastructure level (API Gateway, middleware)
- Consider implementing if collection queries become performance bottleneck

## 7. Error Handling

### Custom Error Classes (To Be Created)

```typescript
export class CollectionNotFoundError extends Error {
  constructor(collectionId: string) {
    super(`Collection not found: ${collectionId}`);
    this.name = "CollectionNotFoundError";
  }
}

// Note: We use CollectionNotFoundError for both non-existent and
// unauthorized access to prevent enumeration attacks
```

### Error Handling Strategy

1. **Validation Errors** (400 Bad Request):
   - Invalid UUID format for collectionId
   - Invalid page or limit values
   - Log with console.info (expected user errors)

2. **Authentication Errors** (401 Unauthorized):
   - Missing or invalid authentication
   - Log with console.info

3. **Authorization Errors** (404 Not Found):
   - Collection doesn't exist OR belongs to another user
   - Use same 404 response to prevent enumeration
   - Log with console.info including userId and collectionId

4. **Server Errors** (500 Internal Server Error):
   - Database connection errors
   - Unexpected errors during query execution
   - Log with console.error including full context and stack trace

### Error Logging Format

**Expected Errors (console.info)**:
```typescript
console.info("[GET /api/collections/{collectionId}] Collection not found:", {
  userId,
  collectionId,
  error: error.message,
});
```

**Unexpected Errors (console.error)**:
```typescript
console.error("[GET /api/collections/{collectionId}] Error:", {
  userId,
  collectionId,
  error: error instanceof Error ? error.message : "Unknown error",
  stack: error instanceof Error ? error.stack : undefined,
});
```

## 8. Performance Considerations

### Potential Bottlenecks

1. **Database Query Performance**:
   - Join between collection_recipes and recipes tables
   - Potential N+1 query if not properly optimized
   - Large collections with many recipes

2. **Pagination Overhead**:
   - COUNT query adds overhead
   - May become slow for collections with thousands of recipes

### Optimization Strategies

1. **Database Indexing**:
   - Ensure index on `collections.id` (primary key - already indexed)
   - Ensure index on `collections.user_id` for ownership checks
   - Ensure index on `collection_recipes.collection_id` for recipe filtering
   - Ensure composite index on `(collection_id, created_at)` for sorted pagination

2. **Query Optimization**:
   - Use single query with joins instead of multiple queries
   - Supabase automatically optimizes with proper select statements
   - Leverage PostgreSQL query planner

3. **Pagination**:
   - Default limit of 20 prevents loading too much data
   - Maximum limit of 100 prevents abuse
   - Use OFFSET for simplicity (acceptable for collections < 10k recipes)
   - Consider cursor-based pagination if collections grow very large

4. **Response Size**:
   - Only return essential recipe fields (not full recipe details)
   - Nutrition data is included but ingredients/steps are excluded
   - Keeps response size manageable

### Expected Performance

- **Small Collections** (< 100 recipes): < 100ms
- **Medium Collections** (100-1000 recipes): < 200ms
- **Large Collections** (> 1000 recipes): < 500ms

**Note**: These are estimates. Actual performance depends on database server specifications and network latency.

## 9. Implementation Steps

### Step 1: Create Service Layer Function

**File**: `src/lib/services/collection.service.ts`

1. Add custom error class `CollectionNotFoundError`
2. Create database query result interface `CollectionWithRecipesQueryResult`
3. Implement `getCollectionWithRecipes()` function:
   - Accept parameters: `supabase`, `userId`, `collectionId`, `page`, `limit`
   - Query collection and verify ownership in single query
   - Throw `CollectionNotFoundError` if not found or not authorized
   - Query total count of recipes in collection
   - Calculate pagination metadata (totalPages, offset)
   - Query paginated recipes with recipe details
   - Map results to `CollectionDetailDTO`
   - Return `CollectionDetailDTO`

4. Implement helper function `mapToCollectionDetailDTO()`:
   - Convert snake_case to camelCase
   - Map recipes array to `CollectionRecipeDTO[]`
   - Construct pagination object

### Step 2: Create API Route Handler

**File**: `src/pages/api/collections/[collectionId].ts`

1. Add necessary imports (APIRoute, z, service functions, error classes)
2. Set `export const prerender = false`
3. Define validation schemas:
   - `CollectionIdParamSchema` for UUID validation
   - `QueryParamsSchema` for pagination parameters
4. Implement GET handler:
   - Add authentication block (mocked for development)
   - Extract and validate collectionId from path params
   - Extract and validate query params (page, limit)
   - Call `getCollectionWithRecipes()` service function
   - Return 200 OK with collection data
   - Handle `CollectionNotFoundError` → 404 Not Found
   - Handle unexpected errors → 500 Internal Server Error
   - Include proper error logging

### Step 3: Testing Considerations

**Manual Testing**:
1. Test with valid collectionId and default pagination
2. Test with custom page and limit values
3. Test with invalid collectionId (non-UUID)
4. Test with non-existent collectionId
5. Test with another user's collectionId (should return 404)
6. Test edge cases (page beyond total pages, limit = 1, limit = 100)
7. Test with empty collection (no recipes)

**Test Cases**:
- Valid request → 200 OK with correct data structure
- Invalid UUID → 400 Bad Request
- Non-existent collection → 404 Not Found
- Unauthorized collection → 404 Not Found (not 403)
- Invalid pagination params → 400 Bad Request
- page = 0 → 400 Bad Request
- limit = 101 → 400 Bad Request
- Empty collection → 200 OK with empty recipes array

### Step 4: Code Review Checklist

- [ ] Follows existing code patterns from project
- [ ] Uses Astro APIRoute type correctly
- [ ] Uses `context.locals.supabase` for database access
- [ ] Implements proper error handling with early returns
- [ ] Uses Zod for input validation
- [ ] Extracts business logic to service layer
- [ ] Includes comprehensive error logging
- [ ] Uses camelCase for DTOs (not snake_case)
- [ ] Implements anti-enumeration (404 instead of 403)
- [ ] Includes proper TypeScript types
- [ ] Authentication code is commented but ready for production
- [ ] Follows happy path last pattern (errors first, success last)

### Step 5: Documentation

- Update API documentation with new endpoint
- Document query parameters and their defaults
- Include example requests and responses
- Note anti-enumeration security consideration
- Document pagination behavior

## Summary

This implementation plan covers the complete implementation of the `GET /api/collections/{collectionId}` endpoint. The endpoint follows established patterns from the codebase, implements proper security measures (authorization, input validation, anti-enumeration), and provides efficient paginated access to collection recipes.
