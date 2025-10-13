# API Endpoint Implementation Plan: DELETE /api/profile/disliked-ingredients/{id}

## 1. Endpoint Overview

This endpoint removes a specific disliked ingredient from the authenticated user's profile. The endpoint requires authentication and validates that the ingredient exists in the user's disliked list before removing it. The implementation follows the established pattern from the allergens DELETE endpoint (`src/pages/api/profile/allergens/[id].ts`).

**Key characteristics:**
- Authenticated endpoint requiring valid user session
- Idempotent operation (DELETE method)
- Returns 204 No Content on successful deletion
- Uses service layer for business logic separation
- Validates UUID format for path parameter

## 2. Request Details

- **HTTP Method**: DELETE
- **URL Structure**: `/api/profile/disliked-ingredients/{id}`
- **Parameters**:
  - **Required**:
    - `id` (path parameter) - UUID of the disliked ingredient to remove
  - **Optional**: None
- **Request Body**: None (DELETE operation)
- **Authentication**: Required via Supabase session

**Path Parameter Validation:**
```typescript
const DislikedIngredientIdSchema = z.string().uuid("Invalid disliked ingredient ID format");
```

## 3. Used Types

### Existing DTOs (from `src/types.ts`)

**DislikedIngredientDTO** (lines 48-52):
```typescript
export interface DislikedIngredientDTO {
  id: string;
  ingredientName: string;
  createdAt: string;
}
```

### Database Types

**DbDislikedIngredient** (line 595):
```typescript
export type DbDislikedIngredient = Tables<"user_disliked_ingredients">;
```

### New Custom Error Class (to be added to service)

```typescript
export class IngredientNotInUserListError extends Error {
  constructor(ingredientId: string) {
    super(`Ingredient not in user's disliked list: ${ingredientId}`);
    this.name = "IngredientNotInUserListError";
  }
}
```

### Validation Schemas

- **DislikedIngredientIdSchema**: Zod schema for UUID validation

## 4. Response Details

### Success Response

**Status Code**: 204 No Content

**Headers**: None required

**Body**: Empty (null)

### Error Responses

**400 Bad Request** - Invalid UUID format:
```json
{
  "error": "Bad Request",
  "message": "Invalid disliked ingredient ID format"
}
```

**401 Unauthorized** - Authentication required:
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

**404 Not Found** - Ingredient not in user's list:
```json
{
  "error": "Not Found",
  "message": "Ingredient not in user's disliked list"
}
```

**500 Internal Server Error** - Unexpected error:
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

## 5. Data Flow

### Request Flow

1. **Request Reception**: Astro receives DELETE request at `/api/profile/disliked-ingredients/{id}`
2. **Middleware Processing**: Astro middleware sets up Supabase client in `context.locals`
3. **Authentication Check**: Endpoint retrieves user session via `context.locals.supabase.auth.getUser()`
4. **Path Parameter Extraction**: Extract `id` from `context.params.id`
5. **Input Validation**: Validate `id` using Zod UUID schema
6. **Service Call**: Call `removeDislikedIngredientFromUser(supabase, userId, ingredientId)`
7. **Database Operation**: Service checks ingredient exists for user, then deletes from `user_disliked_ingredients`
8. **Response**: Return 204 No Content on success or appropriate error

### Database Interaction

**Table**: `user_disliked_ingredients`

**DELETE Query Pattern**:
```typescript
const { data, error } = await supabase
  .from("user_disliked_ingredients")
  .delete()
  .eq("id", ingredientId)
  .eq("user_id", userId)
  .select()
  .single();
```

**Relationship Considerations** (from database resources):
- Foreign key: `user_disliked_ingredients.user_id` → `profiles.user_id` (CASCADE on delete)
- No dependent relationships to consider for deletion

### Service Layer Flow

**Function**: `removeDislikedIngredientFromUser()`

1. Execute DELETE query with both `id` and `user_id` filters
2. Check if any row was deleted (using `.select().single()`)
3. If no row found (PGRST116 error), throw `IngredientNotInUserListError`
4. If successful, return void
5. If unexpected error, propagate to endpoint handler

## 6. Security Considerations

### Authentication & Authorization

**Authentication**:
- Verify user session via `context.locals.supabase.auth.getUser()`
- Return 401 if no valid session or authentication error
- Extract `userId` from authenticated session

**Authorization**:
- Implicit authorization through query filtering (`.eq("user_id", userId)`)
- Users can only delete ingredients from their own list
- Database RLS policies should enforce user isolation

### Input Validation

**UUID Validation**:
- Use Zod schema to validate UUID format
- Prevents malformed input from reaching database
- Returns 400 with clear error message for invalid format

**Path Parameter Sanitization**:
- Supabase parameterized queries prevent SQL injection
- UUID validation provides additional input sanitization

### Potential Threats & Mitigations

1. **SQL Injection**:
   - Mitigated by Supabase parameterized queries
   - Additional protection via UUID format validation

2. **Unauthorized Access**:
   - Mitigated by authentication check
   - User ID from session ensures users only access their data

3. **Path Traversal**:
   - Not applicable (UUID parameter, not file path)
   - UUID validation prevents malicious input

4. **IDOR (Insecure Direct Object Reference)**:
   - Mitigated by filtering on both `id` and `user_id`
   - Users cannot delete other users' disliked ingredients

5. **Rate Limiting**:
   - Should be handled at middleware/infrastructure level
   - Consider implementing for all authenticated endpoints

## 7. Error Handling

### Error Hierarchy

1. **Authentication Errors** (401)
   - No user session
   - Invalid/expired token
   - Supabase auth error

2. **Validation Errors** (400)
   - Invalid UUID format
   - Malformed path parameter

3. **Business Logic Errors** (404)
   - Ingredient not in user's disliked list
   - Ingredient ID doesn't exist
   - Ingredient belongs to different user

4. **Server Errors** (500)
   - Database connection failures
   - Unexpected Supabase errors
   - Unhandled exceptions

### Error Logging Strategy

**Info-Level Logging** (business errors):
```typescript
console.info("[DELETE /api/profile/disliked-ingredients/{id}] Ingredient not in list:", {
  userId,
  ingredientId: context.params.id,
  error: error.message,
});
```

**Error-Level Logging** (unexpected errors):
```typescript
console.error("[DELETE /api/profile/disliked-ingredients/{id}] Error:", {
  userId,
  ingredientId: context.params.id,
  error: error instanceof Error ? error.message : "Unknown error",
  stack: error instanceof Error ? error.stack : undefined,
});
```

### Error Response Format

All error responses follow consistent structure:
```typescript
{
  error: string;      // Error category
  message: string;    // Human-readable error message
}
```

### Handling Specific Errors

**IngredientNotInUserListError**:
- Catch in endpoint try-catch block
- Log as info (expected business error)
- Return 404 with user-friendly message

**Zod Validation Errors**:
- Catch in nested try-catch around validation
- Extract first error message
- Return 400 with validation error

**Supabase Errors**:
- Handle PGRST116 (not found) in service layer
- Propagate unexpected errors to endpoint handler
- Log with full context for debugging

## 8. Performance Considerations

### Database Query Optimization

**Single Query Operation**:
- DELETE with composite filter (`id` AND `user_id`)
- Uses `.single()` for immediate error if no match
- No additional SELECT query needed

**Index Considerations**:
- Primary key index on `id` (automatic)
- Foreign key index on `user_id` (automatic)
- Composite filter benefits from both indexes

### Potential Bottlenecks

**Authentication Check**:
- Supabase `auth.getUser()` makes network request
- Cached at middleware level in Astro
- Minimal overhead per request

**Database Connection**:
- Supabase client pooled via `context.locals`
- No connection overhead per endpoint

### Optimization Strategies

1. **Early Returns**: Use guard clauses for validation/auth failures
2. **Minimal Data Transfer**: 204 response has no body
3. **Single Database Round-Trip**: DELETE operation is atomic
4. **Efficient Error Handling**: Type-based error catching reduces overhead

### Expected Performance

- **Response Time**: < 100ms for typical operation
- **Database Load**: Single DELETE query, minimal impact
- **Scalability**: Linear scaling with user count (no cross-user queries)

## 9. Implementation Steps

### Step 1: Update Service Layer

**File**: `src/lib/services/disliked-ingredient.service.ts`

**Changes**:
1. Add custom error class `IngredientNotInUserListError`:
   ```typescript
   export class IngredientNotInUserListError extends Error {
     constructor(ingredientId: string) {
       super(`Ingredient not in user's disliked list: ${ingredientId}`);
       this.name = "IngredientNotInUserListError";
     }
   }
   ```

2. Add removal function `removeDislikedIngredientFromUser()`:
   ```typescript
   export async function removeDislikedIngredientFromUser(
     supabase: SupabaseClient,
     userId: string,
     ingredientId: string
   ): Promise<void> {
     const { data, error } = await supabase
       .from("user_disliked_ingredients")
       .delete()
       .eq("id", ingredientId)
       .eq("user_id", userId)
       .select()
       .single();

     if (error) {
       if (error.code === "PGRST116") {
         throw new IngredientNotInUserListError(ingredientId);
       }
       throw error;
     }

     if (!data) {
       throw new IngredientNotInUserListError(ingredientId);
     }
   }
   ```

**Location**: Add after existing `addDislikedIngredientToUser()` function

### Step 2: Create API Endpoint

**File**: `src/pages/api/profile/disliked-ingredients/[id].ts` (new file)

**Implementation Structure**:

1. **Imports**:
   ```typescript
   import type { APIRoute } from "astro";
   import { z } from "zod";
   import {
     removeDislikedIngredientFromUser,
     IngredientNotInUserListError
   } from "../../../../lib/services/disliked-ingredient.service";
   ```

2. **Configuration**:
   ```typescript
   export const prerender = false;
   ```

3. **Validation Schema**:
   ```typescript
   const DislikedIngredientIdSchema = z.string().uuid("Invalid disliked ingredient ID format");
   ```

4. **DELETE Handler Structure**:
   - Authentication block (with mock for development)
   - Path parameter extraction and validation
   - Service call to remove ingredient
   - Success response (204 No Content)
   - Error handling with appropriate status codes

**Pattern**: Follow `src/pages/api/profile/allergens/[id].ts` structure exactly

### Step 3: Testing Checklist

**Manual Testing**:

1. **Success Case (204)**:
   - Create disliked ingredient via POST endpoint
   - Delete using valid UUID
   - Verify 204 response with no body
   - Verify ingredient removed from database

2. **Validation Error (400)**:
   - Test with invalid UUID format: `DELETE /api/profile/disliked-ingredients/invalid-uuid`
   - Test with non-UUID string: `DELETE /api/profile/disliked-ingredients/abc123`
   - Verify error message format

3. **Authentication Error (401)**:
   - Test without authentication session
   - Verify 401 response (when auth is uncommented)

4. **Not Found Error (404)**:
   - Test with valid UUID not in user's list
   - Test with UUID belonging to different user
   - Verify appropriate error message

5. **Edge Cases**:
   - Delete same ingredient twice (should return 404 second time)
   - Test with empty string ID
   - Test with very long string ID

**Automated Testing Considerations**:
- Unit tests for service function
- Integration tests for endpoint
- Mock Supabase client for testing
- Test all error paths

### Step 4: Documentation Updates

**Update**: API documentation if it exists

**Include**:
- Endpoint URL and method
- Authentication requirements
- Request parameters
- Response codes and formats
- Example requests/responses
- Error scenarios

### Step 5: Code Review Checklist

- [ ] Follows existing allergens endpoint pattern
- [ ] Uses `context.locals.supabase` (not direct import)
- [ ] Proper error handling with all status codes
- [ ] Consistent error logging (info vs error)
- [ ] Zod validation for path parameter
- [ ] Guard clauses for early returns
- [ ] No unnecessary else statements
- [ ] TypeScript types properly used
- [ ] Service layer separation maintained
- [ ] Authentication properly checked
- [ ] Comments follow existing style
- [ ] No TODO comments in production code (except auth mock)

---

## Additional Notes

### Alignment with Existing Patterns

This implementation follows the exact pattern established by:
- `src/pages/api/profile/allergens/[id].ts` (DELETE endpoint)
- `src/lib/services/disliked-ingredient.service.ts` (service layer)

### Development vs Production

The endpoint should include a mock userId for development (similar to allergens endpoint):
```typescript
// MOCK: Remove this in production
const userId = "c4afdcfc-d36b-4f19-b62d-0de187151b87";
```

Include TODO comment to uncomment authentication block for production.

### Future Enhancements

Potential improvements for future iterations:
1. Rate limiting middleware
2. Request logging middleware
3. Audit trail for deletions
4. Soft delete instead of hard delete
5. Bulk delete endpoint
6. Undo capability with time window
