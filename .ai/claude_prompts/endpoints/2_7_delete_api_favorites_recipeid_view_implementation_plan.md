# API Endpoint Implementation Plan: DELETE /api/favorites/{recipeId}

## 1. Endpoint Overview

This endpoint allows authenticated users to remove a recipe from their favorites list. The operation is idempotent-like in behavior - attempting to remove a recipe that is not in favorites returns a 404 error. The endpoint implements proper authorization checks to ensure users can only remove favorites from their own list and validates recipe accessibility before performing the deletion.

**Key Features:**
- Removes a specific recipe from the authenticated user's favorites
- Validates recipe exists and is accessible (public or user-owned)
- Returns 204 No Content on successful deletion
- Implements IDOR protection by verifying favorite ownership
- Follows RESTful conventions for DELETE operations

## 2. Request Details

- **HTTP Method**: DELETE
- **URL Structure**: `/api/favorites/{recipeId}`
- **Path Parameters**:
  - **recipeId** (required): UUID of the recipe to remove from favorites
- **Request Body**: None
- **Authentication**: Required (mocked for development with user ID: `a85d6d6c-b7d4-4605-9cc4-3743401b67a0`)

### Example Requests

```bash
# Remove recipe from favorites
DELETE /api/favorites/123e4567-e89b-12d3-a456-426614174000

# Invalid UUID format (will return 400)
DELETE /api/favorites/invalid-id
```

## 3. Used Types

### Validation Schema (Zod)

```typescript
const RecipeIdParamSchema = z.object({
  recipeId: z.string().uuid("Invalid recipe ID format")
});

type ValidatedRecipeIdParam = z.infer<typeof RecipeIdParamSchema>;
```

### Service Error Classes

```typescript
// Already exists in favorite.service.ts
class RecipeNotFoundError extends Error

// Already exists in favorite.service.ts
class RecipeNotAccessibleError extends Error

// New error class needed
class RecipeNotInFavoritesError extends Error
```

## 4. Response Details

### Success Response (204 No Content)
```
Status: 204 No Content
Body: null
```

### Error Responses

**400 Bad Request** - Invalid recipeId format
```json
{
  "error": "Bad Request",
  "message": "Invalid recipe ID format"
}
```

**401 Unauthorized** - Not authenticated (production only)
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

**403 Forbidden** - Recipe is private and belongs to another user
```json
{
  "error": "Forbidden",
  "message": "Cannot access private recipes from other users"
}
```

**404 Not Found** - Recipe not found
```json
{
  "error": "Not Found",
  "message": "Recipe not found"
}
```

**404 Not Found** - Recipe not in favorites
```json
{
  "error": "Not Found",
  "message": "Recipe not in favorites"
}
```

**500 Internal Server Error** - Unexpected error
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

## 5. Data Flow

### Request Flow
1. **Authentication** (Mock for development)
   - Extract user from Supabase auth session
   - Development: Use hardcoded userId `a85d6d6c-b7d4-4605-9cc4-3743401b67a0`
   - Production: Validate user session and extract userId

2. **Path Parameter Extraction & Validation**
   - Extract `recipeId` from `context.params.recipeId`
   - Validate recipeId is valid UUID format using Zod schema
   - Return 400 if validation fails

3. **Business Logic Delegation (Service Layer)**
   - Call `removeRecipeFromFavorites(supabase, userId, recipeId)`
   - Service performs three checks:
     - **Check 1**: Verify recipe exists in recipes table
     - **Check 2**: Verify recipe accessibility (is_public = true OR user_id = current user)
     - **Check 3**: Verify favorite exists in favorites table for this user+recipe
   - Service deletes the favorite record if all checks pass

4. **Response Generation**
   - Success: Return 204 No Content with null body
   - Errors: Return appropriate error response with status code and message

### Database Interactions

**Query 1: Check Recipe Existence and Accessibility**
```sql
SELECT id, user_id, is_public
FROM recipes
WHERE id = {recipeId}
```

**Query 2: Check Favorite Existence**
```sql
SELECT user_id, recipe_id
FROM favorites
WHERE user_id = {userId} AND recipe_id = {recipeId}
```

**Query 3: Delete Favorite**
```sql
DELETE FROM favorites
WHERE user_id = {userId} AND recipe_id = {recipeId}
```

### Service Layer Logic

The service function `removeRecipeFromFavorites` will:
1. Query recipes table to verify recipe exists and get accessibility info
2. Throw `RecipeNotFoundError` if recipe doesn't exist
3. Check accessibility: `recipe.is_public || recipe.user_id === userId`
4. Throw `RecipeNotAccessibleError` if not accessible
5. Query favorites table to check if favorite exists
6. Throw `RecipeNotInFavoritesError` if not in favorites
7. Delete the favorite record
8. Return void (no data needed for 204 response)

## 6. Security Considerations

### Authentication & Authorization
- **Authentication**: Verify user is logged in via Supabase auth (mocked in development)
- **IDOR Protection**: Service verifies the favorite belongs to the authenticated user
- **Access Control**: Recipe accessibility check prevents enumeration of private recipes
  - Users can only unfavorite recipes that are public OR owned by them
  - This matches the POST /api/favorites behavior for consistency

### Input Validation
- **UUID Validation**: Zod schema validates recipeId is proper UUID format
- **Prevents Injection**: UUID validation prevents SQL injection attempts
- **Type Safety**: TypeScript + Zod ensure type-safe parameter handling

### Information Leakage Prevention
- **Consistent Error Messages**: Use generic 404 messages to prevent information disclosure
- **Access Control Before Operations**: Check accessibility before revealing favorite status
- **No Enumeration**: Cannot determine if private recipes exist by trying to unfavorite them

### Best Practices
- Use parameterized queries via Supabase client (prevents SQL injection)
- Validate all inputs at API boundary
- Implement proper error logging without exposing sensitive data
- Follow principle of least privilege

## 7. Error Handling

### Validation Errors (400 Bad Request)
- **Trigger**: Invalid recipeId format (not a UUID)
- **Handling**: Catch Zod validation error, return first error message
- **Logging**: Not logged (expected client error)
- **User Message**: "Invalid recipe ID format"

### Authentication Errors (401 Unauthorized)
- **Trigger**: User not authenticated (production only)
- **Handling**: Check Supabase auth.getUser() result
- **Logging**: Not logged (expected for unauthenticated requests)
- **User Message**: "Authentication required"

### Authorization Errors (403 Forbidden)
- **Trigger**: Recipe is private and belongs to another user
- **Handling**: Catch `RecipeNotAccessibleError` from service
- **Logging**: INFO level with userId and recipeId
- **User Message**: "Cannot access private recipes from other users"

### Not Found Errors (404)
- **Trigger 1**: Recipe doesn't exist in database
  - Catch `RecipeNotFoundError` from service
  - Message: "Recipe not found"
- **Trigger 2**: Recipe not in user's favorites
  - Catch `RecipeNotInFavoritesError` from service
  - Message: "Recipe not in favorites"
- **Logging**: INFO level (expected user errors)

### Server Errors (500 Internal Server Error)
- **Trigger**: Unexpected database errors, network issues, unhandled exceptions
- **Handling**: Catch-all error handler at route level
- **Logging**: ERROR level with full context:
  - userId
  - recipeId
  - error.message
  - error.stack
- **User Message**: "An unexpected error occurred" (generic, no internal details)

### Error Handling Pattern
```typescript
try {
  // Validation
  // Service call
  // Success response
} catch (error) {
  // Specific business logic errors (403, 404)
  if (error instanceof RecipeNotFoundError) { ... }
  if (error instanceof RecipeNotAccessibleError) { ... }
  if (error instanceof RecipeNotInFavoritesError) { ... }

  // Generic errors (500)
  console.error(...) // Log unexpected errors
  return 500 response
}
```

## 8. Performance Considerations

### Database Queries
- **Query Count**: 3 queries in worst case, 1-2 in typical error cases
  - Check recipe existence: 1 query
  - Check favorite existence: 1 query
  - Delete favorite: 1 query
- **Optimization**: Queries use indexed columns (id, user_id, recipe_id)
- **No N+1 Issues**: Single recipe deletion, no iteration needed

### Indexes
Required indexes (should already exist from database schema):
- `recipes.id` (primary key)
- `favorites.user_id` (foreign key, indexed)
- `favorites.recipe_id` (foreign key, indexed)
- Composite index on `favorites(user_id, recipe_id)` would be ideal

### Potential Bottlenecks
- **Database Latency**: Sequential queries add latency
  - Recipe existence check
  - Favorite existence check
  - Delete operation
- **Mitigation**: Queries are simple lookups on indexed columns, should be fast

### Caching Considerations
- **Not Applicable**: DELETE operations should not be cached
- **Cache Invalidation**: If favorites list is cached elsewhere, invalidate on deletion

### Scalability
- **Low Resource Impact**: Simple DELETE operation with minimal queries
- **Concurrent Requests**: Supabase handles concurrent DELETE operations safely
- **No Locks Needed**: Single-row deletion doesn't require explicit locking

## 9. Implementation Steps

### Step 1: Create Service Function
**File**: `src/lib/services/favorite.service.ts`

1.1. Add new error class `RecipeNotInFavoritesError`:
```typescript
export class RecipeNotInFavoritesError extends Error {
  constructor(recipeId: string) {
    super(`Recipe not in favorites: ${recipeId}`);
    this.name = "RecipeNotInFavoritesError";
  }
}
```

1.2. Implement `removeRecipeFromFavorites` function:
```typescript
export async function removeRecipeFromFavorites(
  supabase: SupabaseClient,
  userId: string,
  recipeId: string
): Promise<void>
```

1.3. Service logic:
- Query recipe to verify existence and get accessibility info
- Throw `RecipeNotFoundError` if not found (handle PGRST116 error code)
- Check accessibility: `recipe.is_public || recipe.user_id === userId`
- Throw `RecipeNotAccessibleError` if not accessible
- Query favorites table for user+recipe combination
- Throw `RecipeNotInFavoritesError` if not found
- Delete the favorite record using `DELETE FROM favorites WHERE user_id = ? AND recipe_id = ?`
- Return void

### Step 2: Create API Route Handler
**File**: `src/pages/api/favorites/[recipeId].ts`

2.1. Add required imports:
```typescript
import type { APIRoute } from "astro";
import { z } from "zod";
import {
  removeRecipeFromFavorites,
  RecipeNotFoundError,
  RecipeNotAccessibleError,
  RecipeNotInFavoritesError,
} from "../../../lib/services/favorite.service";
```

2.2. Set prerender flag:
```typescript
export const prerender = false;
```

2.3. Define Zod validation schema:
```typescript
const RecipeIdParamSchema = z.object({
  recipeId: z.string().uuid("Invalid recipe ID format")
});
```

2.4. Implement DELETE handler following this structure:
- Authentication block (mocked for development)
- Path parameter extraction from `context.params.recipeId`
- Zod validation with error handling (return 400 on failure)
- Service call: `removeRecipeFromFavorites(supabase, userId, recipeId)`
- Success response: `return new Response(null, { status: 204 })`
- Error handling with specific catches for each error type

### Step 3: Error Handling Implementation

3.1. Catch `RecipeNotFoundError`:
- Return 404 with message: "Recipe not found"

3.2. Catch `RecipeNotAccessibleError`:
- Log at INFO level with userId and recipeId
- Return 403 with message: "Cannot access private recipes from other users"

3.3. Catch `RecipeNotInFavoritesError`:
- Log at INFO level with userId and recipeId
- Return 404 with message: "Recipe not in favorites"

3.4. Generic error handler:
- Log at ERROR level with full context
- Return 500 with generic message

### Step 4: Testing Considerations

4.1. **Unit Tests for Service** (if implementing tests):
- Test recipe not found scenario
- Test recipe not accessible scenario (private + different user)
- Test recipe not in favorites scenario
- Test successful deletion
- Test database errors

4.2. **Integration Tests for Route** (if implementing tests):
- Test invalid UUID format (400)
- Test recipe not found (404)
- Test recipe not accessible (403)
- Test recipe not in favorites (404)
- Test successful deletion (204)
- Test authentication (401) when real auth is enabled

4.3. **Manual Testing**:
- Create favorite via POST /api/favorites
- Verify it exists via GET /api/favorites
- Delete via DELETE /api/favorites/{recipeId}
- Verify 204 response
- Verify favorite no longer in GET /api/favorites
- Test error scenarios with invalid/non-existent IDs

### Step 5: Documentation and Code Review

5.1. Add JSDoc comments to service function

5.2. Add JSDoc comments to route handler explaining:
- Endpoint purpose
- Parameters
- Return values
- Error responses
- Usage examples

5.3. Ensure code follows project conventions:
- Astro route patterns
- Zod validation patterns
- Error handling patterns
- Logging patterns
- Code formatting (will be checked by Prettier/ESLint on commit)

5.4. Code review checklist:
- [ ] Service function properly validates all checks
- [ ] Route handler validates path parameters
- [ ] Authentication block present (mocked for dev)
- [ ] All error scenarios handled
- [ ] Proper error logging
- [ ] Consistent with existing favorites endpoints
- [ ] Returns correct HTTP status codes
- [ ] No security vulnerabilities (IDOR, injection, etc.)

---

## Summary

This implementation plan provides comprehensive guidance for implementing the DELETE /api/favorites/{recipeId} endpoint. The implementation will follow established patterns from the existing codebase, particularly matching the structure of POST /api/favorites and DELETE /api/profile/allergens/{id}.
