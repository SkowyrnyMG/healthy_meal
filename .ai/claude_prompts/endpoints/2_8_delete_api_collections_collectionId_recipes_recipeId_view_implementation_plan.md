# API Endpoint Implementation Plan: DELETE /api/collections/{collectionId}/recipes/{recipeId}

## 1. Endpoint Overview

This endpoint allows authenticated users to remove a recipe from one of their collections. It performs authorization checks to ensure the user owns the collection and validates that the recipe exists in the collection before deletion. The endpoint follows REST principles by using the DELETE HTTP method and returns 204 No Content on success.

**Key Features:**

- Removes recipe from collection
- Validates user ownership of collection (authorization)
- Returns 204 No Content on successful deletion
- Implements anti-enumeration security pattern
- Validates UUID format for both path parameters

## 2. Request Details

- **HTTP Method**: DELETE
- **URL Structure**: `/api/collections/{collectionId}/recipes/{recipeId}`
- **Parameters**:
  - **Required Path Parameters**:
    - `collectionId` (string, UUID): ID of the collection
    - `recipeId` (string, UUID): ID of the recipe to remove
  - **Optional**: None
- **Request Body**: None (DELETE operation uses only path parameters)
- **Authentication**: Required (currently mocked with userId: `a85d6d6c-b7d4-4605-9cc4-3743401b67a0`)

**Example Request:**

```http
DELETE /api/collections/123e4567-e89b-12d3-a456-426614174000/recipes/987fcdeb-51a2-43d7-8912-123456789abc
```

## 3. Used Types

### Validation Schemas (Zod)

```typescript
/**
 * Zod schema for validating collectionId path parameter
 */
const CollectionIdParamSchema = z.string().uuid("Invalid collection ID format");

/**
 * Zod schema for validating recipeId path parameter
 */
const RecipeIdParamSchema = z.string().uuid("Invalid recipe ID format");
```

### Service Function Signature

```typescript
/**
 * Remove a recipe from a collection
 * @param supabase - Supabase client instance from context.locals
 * @param userId - ID of the authenticated user
 * @param collectionId - ID of the collection
 * @param recipeId - ID of the recipe to remove
 * @returns void (no return value on success)
 * @throws CollectionNotFoundError if collection not found or user is not authorized
 * @throws RecipeNotInCollectionError if recipe is not in the collection
 * @throws Error if database query fails
 */
function removeRecipeFromCollection(
  supabase: SupabaseClient,
  userId: string,
  collectionId: string,
  recipeId: string
): Promise<void>;
```

### Custom Error Classes

**New Error Class (to be added):**

```typescript
/**
 * Error thrown when recipe is not found in the collection
 */
export class RecipeNotInCollectionError extends Error {
  constructor(collectionId: string, recipeId: string) {
    super(`Recipe ${recipeId} not found in collection ${collectionId}`);
    this.name = "RecipeNotInCollectionError";
  }
}
```

**Existing Error Classes (reused):**

- `CollectionNotFoundError` - Thrown when collection doesn't exist or user is not authorized

## 4. Response Details

### Success Response (204 No Content)

```http
HTTP/1.1 204 No Content
```

**No response body** - Following REST convention for DELETE operations that successfully complete.

### Error Responses

#### 400 Bad Request - Invalid UUID Format

```json
{
  "error": "Bad Request",
  "message": "Invalid collection ID format"
}
```

or

```json
{
  "error": "Bad Request",
  "message": "Invalid recipe ID format"
}
```

#### 401 Unauthorized - Not Authenticated

```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

#### 404 Not Found - Collection/Recipe Not Found or Not Authorized

```json
{
  "error": "Not Found",
  "message": "Recipe not found in collection"
}
```

**Note**: This error is returned for multiple scenarios to prevent enumeration attacks:

- Collection doesn't exist
- User doesn't own the collection
- Recipe is not in the collection

#### 500 Internal Server Error - Unexpected Error

```json
{
  "error": "Internal Server Error",
  "message": "Failed to remove recipe from collection"
}
```

## 5. Data Flow

### Request Flow

1. **Authentication Layer**
   - Extract user from Supabase auth (currently mocked)
   - If authentication fails → 401 Unauthorized

2. **Path Parameter Extraction**
   - Extract `collectionId` from `context.params.collectionId`
   - Extract `recipeId` from `context.params.recipeId`

3. **Input Validation**
   - Validate `collectionId` is a valid UUID → 400 if invalid
   - Validate `recipeId` is a valid UUID → 400 if invalid

4. **Service Layer Call**
   - Call `removeRecipeFromCollection(supabase, userId, collectionId, recipeId)`

5. **Service Layer Operations**
   - Verify collection exists and user owns it (single query, anti-enumeration)
   - Check if recipe exists in collection
   - If not found → throw `RecipeNotInCollectionError`
   - Delete record from `collection_recipes` table
   - Return void on success

6. **Response Generation**
   - Success → 204 No Content
   - Business logic errors → 404 Not Found
   - Unexpected errors → 500 Internal Server Error

### Database Interactions

**Table**: `collection_recipes`

**Query 1**: Verify collection ownership (anti-enumeration pattern)

```sql
SELECT id, user_id
FROM collections
WHERE id = {collectionId} AND user_id = {userId}
LIMIT 1
```

**Query 2**: Delete recipe from collection

```sql
DELETE FROM collection_recipes
WHERE collection_id = {collectionId} AND recipe_id = {recipeId}
RETURNING collection_id
```

**Note**: Use `RETURNING collection_id` to verify deletion occurred (row was found and deleted).

## 6. Security Considerations

### Authentication

- Verify user is authenticated before processing request
- Currently mocked with hardcoded userId for development
- Production: Use Supabase `auth.getUser()` method

### Authorization

- **Collection Ownership**: Verify the collection belongs to the authenticated user
- **Anti-enumeration Pattern**:
  - Use single query combining existence and ownership check
  - Return same 404 error whether collection doesn't exist OR user doesn't own it
  - Prevents attackers from discovering which collections exist in the system

### Input Validation

- **UUID Format Validation**: Validate both `collectionId` and `recipeId` are valid UUIDs
- **Benefits**:
  - Prevents SQL injection attempts
  - Fails fast with clear error messages
  - Reduces unnecessary database queries

### Data Access Control

- Users can only remove recipes from their own collections
- No cross-user data access possible
- Database foreign key constraints ensure referential integrity

### Security Threats Mitigation

| Threat              | Mitigation                                                              |
| ------------------- | ----------------------------------------------------------------------- |
| Enumeration Attack  | Same 404 response for unauthorized and non-existent collections         |
| SQL Injection       | UUID validation + Supabase parameterized queries                        |
| Unauthorized Access | Verify collection ownership before deletion                             |
| CSRF                | Not applicable for DELETE with no session cookies (using bearer tokens) |
| Rate Limiting       | Should be implemented at API gateway level (not in this endpoint)       |

## 7. Error Handling

### Error Handling Strategy

Follow the existing pattern from other collection endpoints:

1. **Expected Business Logic Errors**: Log with `console.info()` (not actual errors)
2. **Unexpected Errors**: Log with `console.error()` including stack trace
3. **Error Response Format**: Consistent JSON structure with `error` and `message` fields

### Error Scenarios

| Scenario                    | Status Code | Error Type            | Response Message                          |
| --------------------------- | ----------- | --------------------- | ----------------------------------------- |
| Invalid collectionId UUID   | 400         | Bad Request           | "Invalid collection ID format"            |
| Invalid recipeId UUID       | 400         | Bad Request           | "Invalid recipe ID format"                |
| User not authenticated      | 401         | Unauthorized          | "Authentication required"                 |
| Collection doesn't exist    | 404         | Not Found             | "Recipe not found in collection"          |
| User doesn't own collection | 404         | Not Found             | "Recipe not found in collection"          |
| Recipe not in collection    | 404         | Not Found             | "Recipe not found in collection"          |
| Database error              | 500         | Internal Server Error | "Failed to remove recipe from collection" |
| Unknown error               | 500         | Internal Server Error | "Failed to remove recipe from collection" |

### Error Logging Examples

**Business Logic Error (console.info):**

```typescript
console.info("[DELETE /api/collections/{collectionId}/recipes/{recipeId}] Recipe not in collection:", {
  userId,
  collectionId,
  recipeId,
  error: error.message,
});
```

**Unexpected Error (console.error):**

```typescript
console.error("[DELETE /api/collections/{collectionId}/recipes/{recipeId}] Error:", {
  userId,
  collectionId,
  recipeId,
  error: error instanceof Error ? error.message : "Unknown error",
  stack: error instanceof Error ? error.stack : undefined,
});
```

## 8. Performance Considerations

### Optimization Strategies

1. **Single Ownership Query**
   - Combine existence and ownership check in one query
   - Reduces database round trips from 2 to 1
   - Pattern: `WHERE id = X AND user_id = Y`

2. **Direct DELETE with Verification**
   - Use `DELETE ... RETURNING collection_id` to verify row was deleted
   - No need for separate SELECT before DELETE
   - Reduces queries and prevents race conditions

3. **Indexed Columns**
   - `collection_recipes.collection_id` should be indexed (foreign key)
   - `collection_recipes.recipe_id` should be indexed (foreign key)
   - Composite index on (collection_id, recipe_id) would be optimal

4. **No Response Body**
   - 204 No Content requires no serialization
   - Faster response generation
   - Lower bandwidth usage

### Expected Performance

- **Database Queries**: 2 queries maximum
  - 1 query to verify collection ownership
  - 1 query to delete recipe from collection
- **Response Time**: < 50ms for typical case (excluding network latency)
- **Bottlenecks**: None expected for this simple operation

### Scalability Considerations

- Operation is O(1) - single row deletion
- No pagination required
- No joins required for the delete operation
- Database CASCADE on collection deletion handles cleanup automatically

## 9. Implementation Steps

### Step 1: Add Custom Error Class to Service

**File**: `src/lib/services/collection.service.ts`

Add new error class after existing error classes (around line 66):

```typescript
/**
 * Error thrown when recipe is not found in the collection
 */
export class RecipeNotInCollectionError extends Error {
  constructor(collectionId: string, recipeId: string) {
    super(`Recipe ${recipeId} not found in collection ${collectionId}`);
    this.name = "RecipeNotInCollectionError";
  }
}
```

### Step 2: Add Service Function

**File**: `src/lib/services/collection.service.ts`

Add function after `addRecipeToCollection()` function (around line 583):

```typescript
/**
 * Remove a recipe from a collection
 * @param supabase - Supabase client instance from context.locals
 * @param userId - ID of the authenticated user
 * @param collectionId - ID of the collection
 * @param recipeId - ID of the recipe to remove
 * @returns void (no return value on success)
 * @throws CollectionNotFoundError if collection not found or user is not authorized (anti-enumeration)
 * @throws RecipeNotInCollectionError if recipe is not in the collection
 * @throws Error if database query fails
 */
export async function removeRecipeFromCollection(
  supabase: SupabaseClient,
  userId: string,
  collectionId: string,
  recipeId: string
): Promise<void> {
  // ========================================
  // STEP 1: VERIFY COLLECTION OWNERSHIP (anti-enumeration)
  // ========================================

  // Combined query to check existence and ownership in single database call
  // This prevents information leakage about collection ownership
  const { data: collection, error: collectionError } = await supabase
    .from("collections")
    .select("id, user_id")
    .eq("id", collectionId)
    .eq("user_id", userId)
    .single();

  if (collectionError || !collection) {
    // Don't reveal whether collection exists or user doesn't own it
    throw new CollectionNotFoundError(collectionId);
  }

  // ========================================
  // STEP 2: DELETE RECIPE FROM COLLECTION
  // ========================================

  // Use RETURNING to verify deletion occurred (row existed)
  const { data: deleted, error: deleteError } = await supabase
    .from("collection_recipes")
    .delete()
    .eq("collection_id", collectionId)
    .eq("recipe_id", recipeId)
    .select("collection_id")
    .maybeSingle();

  if (deleteError) {
    throw deleteError;
  }

  // If no row was deleted, recipe wasn't in collection
  if (!deleted) {
    throw new RecipeNotInCollectionError(collectionId, recipeId);
  }

  // ========================================
  // STEP 3: RETURN SUCCESS (VOID)
  // ========================================

  // Function completes successfully with no return value
}
```

### Step 3: Create API Endpoint File

**File**: `src/pages/api/collections/[collectionId]/recipes/[recipeId].ts`

Create new file with the following structure:

**Section 1: Imports**

```typescript
import type { APIRoute } from "astro";
import { z } from "zod";
import {
  removeRecipeFromCollection,
  CollectionNotFoundError,
  RecipeNotInCollectionError,
} from "../../../../../lib/services/collection.service";

export const prerender = false;
```

**Section 2: Validation Schemas**

```typescript
// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

/**
 * Zod schema for validating collectionId path parameter
 */
const CollectionIdParamSchema = z.string().uuid("Invalid collection ID format");

/**
 * Zod schema for validating recipeId path parameter
 */
const RecipeIdParamSchema = z.string().uuid("Invalid recipe ID format");
```

**Section 3: DELETE Handler**

```typescript
// ============================================================================
// API ROUTE HANDLERS
// ============================================================================

/**
 * DELETE /api/collections/{collectionId}/recipes/{recipeId}
 * Removes a recipe from a collection for the authenticated user
 *
 * Path parameters: collectionId (UUID), recipeId (UUID)
 *
 * Returns:
 * - 204: No Content (recipe successfully removed from collection)
 * - 400: Bad Request (invalid UUID format)
 * - 401: Unauthorized (authentication required) - currently mocked
 * - 404: Not Found (collection not found, not authorized, or recipe not in collection)
 * - 500: Internal server error
 *
 * @example
 * DELETE /api/collections/123e4567-e89b-12d3-a456-426614174000/recipes/987fcdeb-51a2-43d7-8912-123456789abc
 */
export const DELETE: APIRoute = async (context) => {
  // ========================================
  // AUTHENTICATION (MOCK FOR DEVELOPMENT)
  // ========================================

  // TODO: Production - Uncomment this block for real authentication
  // const { data: { user }, error: authError } = await context.locals.supabase.auth.getUser();
  // if (authError || !user) {
  //   return new Response(
  //     JSON.stringify({
  //       error: "Unauthorized",
  //       message: "Authentication required"
  //     }),
  //     {
  //       status: 401,
  //       headers: { "Content-Type": "application/json" }
  //     }
  //   );
  // }
  // const userId = user.id;

  // MOCK: Remove this in production
  const userId = "a85d6d6c-b7d4-4605-9cc4-3743401b67a0";

  try {
    // ========================================
    // PATH PARAMETER EXTRACTION AND VALIDATION
    // ========================================

    const collectionId = context.params.collectionId;
    const recipeId = context.params.recipeId;

    // Validate collectionId format
    let validatedCollectionId: string;
    try {
      validatedCollectionId = CollectionIdParamSchema.parse(collectionId);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return new Response(
          JSON.stringify({
            error: "Bad Request",
            message: error.errors[0].message,
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      throw error;
    }

    // Validate recipeId format
    let validatedRecipeId: string;
    try {
      validatedRecipeId = RecipeIdParamSchema.parse(recipeId);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return new Response(
          JSON.stringify({
            error: "Bad Request",
            message: error.errors[0].message,
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      throw error;
    }

    // ========================================
    // REMOVE RECIPE FROM COLLECTION VIA SERVICE
    // ========================================

    await removeRecipeFromCollection(context.locals.supabase, userId, validatedCollectionId, validatedRecipeId);

    // ========================================
    // RETURN SUCCESS RESPONSE (204 NO CONTENT)
    // ========================================

    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    // Handle specific business logic errors
    if (error instanceof CollectionNotFoundError) {
      console.info("[DELETE /api/collections/{collectionId}/recipes/{recipeId}] Collection not found:", {
        userId,
        collectionId: context.params.collectionId,
        error: error.message,
      });

      return new Response(
        JSON.stringify({
          error: "Not Found",
          message: "Recipe not found in collection",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (error instanceof RecipeNotInCollectionError) {
      console.info("[DELETE /api/collections/{collectionId}/recipes/{recipeId}] Recipe not in collection:", {
        userId,
        collectionId: context.params.collectionId,
        recipeId: context.params.recipeId,
        error: error.message,
      });

      return new Response(
        JSON.stringify({
          error: "Not Found",
          message: "Recipe not found in collection",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Log unexpected errors
    console.error("[DELETE /api/collections/{collectionId}/recipes/{recipeId}] Error:", {
      userId,
      collectionId: context.params.collectionId,
      recipeId: context.params.recipeId,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Return generic error response
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "Failed to remove recipe from collection",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
```

### Step 4: Export Error Class

**File**: `src/lib/services/collection.service.ts`

Ensure `RecipeNotInCollectionError` is exported (should be automatic with `export class` keyword).

The error class should be importable in the API route:

```typescript
import {
  removeRecipeFromCollection,
  CollectionNotFoundError,
  RecipeNotInCollectionError,
} from "../../../../../lib/services/collection.service";
```

### Step 5: Testing Checklist

After implementation, test the following scenarios:

**Success Cases:**

- [ ] DELETE request removes recipe from collection → 204 No Content
- [ ] Verify recipe is actually removed from database
- [ ] Verify collection still exists after recipe removal

**Validation Errors:**

- [ ] Invalid collectionId UUID → 400 Bad Request with "Invalid collection ID format"
- [ ] Invalid recipeId UUID → 400 Bad Request with "Invalid recipe ID format"

**Authorization Errors:**

- [ ] Collection doesn't exist → 404 Not Found
- [ ] Collection belongs to another user → 404 Not Found
- [ ] Recipe not in collection → 404 Not Found

**Edge Cases:**

- [ ] Deleting last recipe from collection (collection should remain)
- [ ] Deleting same recipe twice (second attempt should return 404)

**Error Handling:**

- [ ] Database connection error → 500 Internal Server Error
- [ ] Unexpected errors logged to console with stack trace

### Step 6: Manual Testing Examples

**Test 1: Successful Deletion**

```bash
# First, add a recipe to a collection
curl -X POST http://localhost:3000/api/collections/COLLECTION_ID/recipes \
  -H "Content-Type: application/json" \
  -d '{"recipeId": "RECIPE_ID"}'

# Then, remove it
curl -X DELETE http://localhost:3000/api/collections/COLLECTION_ID/recipes/RECIPE_ID \
  -i

# Expected: HTTP/1.1 204 No Content
```

**Test 2: Invalid UUID Format**

```bash
curl -X DELETE http://localhost:3000/api/collections/invalid-uuid/recipes/RECIPE_ID \
  -i

# Expected: HTTP/1.1 400 Bad Request
# Body: {"error":"Bad Request","message":"Invalid collection ID format"}
```

**Test 3: Recipe Not in Collection**

```bash
curl -X DELETE http://localhost:3000/api/collections/COLLECTION_ID/recipes/NON_EXISTENT_RECIPE_ID \
  -i

# Expected: HTTP/1.1 404 Not Found
# Body: {"error":"Not Found","message":"Recipe not found in collection"}
```

## 10. Additional Notes

### REST API Best Practices

- Using DELETE method for resource removal (REST convention)
- Using 204 No Content for successful deletion (no response body needed)
- UUID validation prevents malformed requests
- Idempotency: Deleting non-existent recipe returns 404 (not idempotent by strict definition, but follows REST conventions)

### Database Considerations

- Foreign key CASCADE rules in database handle cleanup automatically
- Deleting a collection automatically removes all `collection_recipes` entries
- Deleting a recipe automatically removes it from all collections
- No orphaned records possible

### Compliance with Tech Stack

- ✅ Astro 5: API routes with `export const prerender = false`
- ✅ TypeScript 5: Full type safety with interfaces and types
- ✅ Zod: Input validation for path parameters
- ✅ Supabase: Using `context.locals.supabase` from middleware
- ✅ Pattern Consistency: Follows existing endpoint patterns in codebase

---

## Summary

This implementation plan provides comprehensive guidance for developing the DELETE endpoint to remove recipes from collections. The plan follows established patterns in the codebase, implements proper security measures (anti-enumeration, authorization), and adheres to REST API best practices.
