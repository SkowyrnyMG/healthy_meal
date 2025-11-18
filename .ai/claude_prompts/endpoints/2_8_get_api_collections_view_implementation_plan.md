# API Endpoint Implementation Plan: GET /api/collections

## 1. Endpoint Overview

The GET /api/collections endpoint retrieves a list of all recipe collections belonging to the authenticated user. Each collection includes its unique identifier, name, recipe count, and creation timestamp. This endpoint enables users to view their organizational structure for recipes, facilitating navigation to specific collections for detailed viewing.

**Key characteristics:**

- Read-only operation (no data modification)
- Returns all collections owned by the authenticated user
- Includes aggregated recipe count for each collection
- No pagination specified (consider performance implications)

## 2. Request Details

- **HTTP Method**: GET
- **URL Structure**: `/api/collections`
- **Authentication**: Required (mocked userId for development)
- **Parameters**:
  - **Required**: None (userId extracted from authentication context)
  - **Optional**: None
- **Request Body**: None (GET request)
- **Query Parameters**: None specified in the current API specification

**Note**: Consider adding pagination parameters (page, limit) in future iterations if users can create many collections.

## 3. Used Types

### DTOs (from `src/types.ts`)

```typescript
/**
 * Recipe collection DTO with recipe count
 * Mapped from collections table with aggregation
 */
export interface CollectionDTO {
  id: string;
  userId: string;
  name: string;
  recipeCount: number;
  createdAt: string;
}
```

### Response Type

```typescript
interface GetCollectionsResponse {
  collections: CollectionDTO[];
}
```

### No Command Models Required

This is a read-only endpoint with no input payload, so no command models are needed.

## 4. Response Details

### Success Response (200 OK)

```json
{
  "collections": [
    {
      "id": "uuid",
      "userId": "uuid",
      "name": "Szybkie kolacje",
      "recipeCount": 8,
      "createdAt": "2025-10-11T12:00:00Z"
    }
  ]
}
```

**Response characteristics:**

- Returns an array of CollectionDTO objects
- Array may be empty if user has no collections
- Collections ordered by creation date (newest first)
- All timestamps in ISO 8601 format

### Error Responses

- **401 Unauthorized**: User not authenticated or authentication token invalid

  ```json
  {
    "error": "Unauthorized",
    "message": "Authentication required"
  }
  ```

- **500 Internal Server Error**: Database errors or unexpected server failures
  ```json
  {
    "error": "Internal Server Error",
    "message": "Failed to retrieve collections"
  }
  ```

## 5. Data Flow

### Request Flow:

1. **Request received** at `/api/collections` endpoint
2. **Authentication**: Extract and validate authenticated user from `context.locals.supabase`
3. **Service invocation**: Call `CollectionService.getUserCollections(supabase, userId)`
4. **Database query**:
   - Query `collections` table filtered by `user_id`
   - Aggregate recipe count from `collection_recipes` table
   - Order by `created_at DESC`
5. **Data transformation**: Map database results to `CollectionDTO[]`
6. **Response formatting**: Wrap in response object and return with 200 status

### Database Query Details:

```sql
SELECT
  c.id,
  c.user_id,
  c.name,
  c.created_at,
  COUNT(cr.recipe_id) as recipe_count
FROM collections c
LEFT JOIN collection_recipes cr ON c.id = cr.collection_id
WHERE c.user_id = $1
GROUP BY c.id, c.user_id, c.name, c.created_at
ORDER BY c.created_at DESC
```

**Note**: Use Supabase SDK methods to achieve this query, not raw SQL.

### Service Layer:

Create or update `src/lib/services/collection.service.ts`:

```typescript
export class CollectionService {
  static async getUserCollections(supabase: SupabaseClient, userId: string): Promise<CollectionDTO[]> {
    // Implementation details in Implementation Steps section
  }
}
```

## 6. Security Considerations

### Authentication

- **Requirement**: User must be authenticated via Supabase auth
- **Development**: Use mocked userId `a85d6d6c-b7d4-4605-9cc4-3743401b67a0`
- **Production**: Uncomment real authentication block (see `.ai/claude_rules/auth_dev_mock.md`)

### Authorization

- **Ownership verification**: Query automatically filters by authenticated userId
- **Data isolation**: Ensure the WHERE clause includes `user_id = $authenticatedUserId`
- **No user input to validate**: Since there are no parameters, SQL injection risk is minimal

### Data Validation

- **userId**: Validated by authentication mechanism (Supabase returns valid UUID)
- **No query parameters**: No additional validation needed

### Potential Threats

1. **Authorization Bypass**: Mitigated by filtering results by authenticated userId
2. **Information Disclosure**: Only return collections owned by the user
3. **DoS via Large Result Sets**: No pagination could allow very large responses - monitor and add pagination if needed
4. **SQL Injection**: Mitigated by using Supabase SDK parameterized queries

## 7. Error Handling

### Error Scenarios

1. **Authentication Failure (401)**
   - **Cause**: User not authenticated, invalid token, or expired session
   - **Response**: 401 Unauthorized with error message
   - **Logging**: Log authentication attempt with timestamp

2. **Database Query Failure (500)**
   - **Cause**: Database connection issues, query timeout, or malformed query
   - **Response**: 500 Internal Server Error with generic message
   - **Logging**: Log full error details including stack trace and userId

3. **Unexpected Server Error (500)**
   - **Cause**: Runtime exceptions, null reference errors, or type mismatches
   - **Response**: 500 Internal Server Error
   - **Logging**: Log error with full context for debugging

### Error Handling Pattern

```typescript
try {
  // Authentication
  // Service call
  // Response formatting
} catch (error) {
  console.error("[GET /api/collections] Error:", {
    userId,
    error: error instanceof Error ? error.message : "Unknown error",
    stack: error instanceof Error ? error.stack : undefined,
  });

  return new Response(
    JSON.stringify({
      error: "Internal Server Error",
      message: "Failed to retrieve collections",
    }),
    {
      status: 500,
      headers: { "Content-Type": "application/json" },
    }
  );
}
```

### Logging Strategy

- Log all errors with structured context (userId, timestamp, error message)
- Use console.error for error-level logs
- Include stack traces for debugging
- Do not expose internal error details to the client

## 8. Performance Considerations

### Potential Bottlenecks

1. **No Pagination**: Could return thousands of collections for power users
2. **Aggregation Query**: COUNT on collection_recipes requires table scan
3. **Multiple Collections**: N+1 query problem if not properly joined

### Optimization Strategies

1. **Database Indexing**:
   - Ensure index on `collections.user_id` for fast filtering
   - Index on `collection_recipes.collection_id` for efficient counting

2. **Query Optimization**:
   - Use single query with LEFT JOIN and GROUP BY
   - Avoid separate queries for each collection

3. **Caching** (future consideration):
   - Consider caching user collections with short TTL
   - Invalidate cache on collection creation/deletion

4. **Pagination** (future enhancement):
   - Add `page` and `limit` query parameters
   - Default to 50 collections per page
   - Include pagination metadata in response

### Database Query Performance

- Single query with LEFT JOIN and aggregation
- Expected execution time: <50ms for typical user with <100 collections
- Scales linearly with number of collections and recipes

## 9. Implementation Steps

### Step 1: Create Collection Service

**File**: `src/lib/services/collection.service.ts`

1. Create new service file if it doesn't exist
2. Implement `getUserCollections` method:

   ```typescript
   import type { SupabaseClient } from "@/db/supabase.client";
   import type { CollectionDTO } from "@/types";

   export class CollectionService {
     static async getUserCollections(supabase: SupabaseClient, userId: string): Promise<CollectionDTO[]> {
       const { data, error } = await supabase
         .from("collections")
         .select(
           `
           id,
           user_id,
           name,
           created_at,
           collection_recipes(count)
         `
         )
         .eq("user_id", userId)
         .order("created_at", { ascending: false });

       if (error) {
         throw error;
       }

       return data.map((collection) => ({
         id: collection.id,
         userId: collection.user_id,
         name: collection.name,
         recipeCount: collection.collection_recipes?.[0]?.count ?? 0,
         createdAt: collection.created_at,
       }));
     }
   }
   ```

### Step 2: Create API Route Handler

**File**: `src/pages/api/collections/index.ts`

1. Create the file structure: `src/pages/api/collections/index.ts`
2. Implement the GET handler:

   ```typescript
   import type { APIRoute } from "astro";
   import { CollectionService } from "@/lib/services/collection.service";

   export const prerender = false;

   export const GET: APIRoute = async (context) => {
     try {
       // Authentication (mocked for development)
       const userId = "a85d6d6c-b7d4-4605-9cc4-3743401b67a0";

       // Retrieve user collections
       const collections = await CollectionService.getUserCollections(context.locals.supabase, userId);

       // Return success response
       return new Response(JSON.stringify({ collections }), {
         status: 200,
         headers: { "Content-Type": "application/json" },
       });
     } catch (error) {
       console.error("[GET /api/collections] Error:", {
         error: error instanceof Error ? error.message : "Unknown error",
         stack: error instanceof Error ? error.stack : undefined,
       });

       return new Response(
         JSON.stringify({
           error: "Internal Server Error",
           message: "Failed to retrieve collections",
         }),
         {
           status: 500,
           headers: { "Content-Type": "application/json" },
         }
       );
     }
   };
   ```

### Step 3: Add Authentication Block

1. Include the mocked authentication code from `.ai/claude_rules/auth_dev_mock.md`
2. Add TODO comment for production authentication
3. Ensure the commented production code is ready for uncommenting

### Step 4: Test the Endpoint

1. Start the development server: `npm run dev`
2. Test with curl or Postman:
   ```bash
   curl http://localhost:3000/api/collections
   ```
3. Verify response structure matches CollectionDTO[]
4. Test with user that has no collections (should return empty array)
5. Test with user that has multiple collections

### Step 5: Verify Database Queries

1. Check Supabase dashboard for query performance
2. Verify indexes exist on `collections.user_id` and `collection_recipes.collection_id`
3. Monitor query execution time
4. Ensure no N+1 query problems

### Step 6: Error Handling Testing

1. Test with invalid/expired authentication token (should return 401)
2. Simulate database connection failure (should return 500)
3. Verify error logs contain useful debugging information
4. Ensure error responses don't leak internal implementation details

### Step 7: Code Quality Checks

1. Run linter: `npm run lint`
2. Fix any linting issues: `npm run lint:fix`
3. Format code: `npm run format`
4. Review code for adherence to project guidelines

### Step 8: Documentation

1. Update API documentation if it exists
2. Add JSDoc comments to service methods
3. Document any assumptions or limitations
4. Note the lack of pagination for future consideration

---
