# API Endpoint Implementation Plan: DELETE /api/profile/allergens/{allergenId}

## 1. Endpoint Overview

This endpoint removes a specific allergen from the authenticated user's profile. It follows REST conventions by returning a 204 No Content status on successful deletion, with no response body. The endpoint is part of the user profile allergen management system and complements the existing GET and POST endpoints.

## 2. Request Details

- **HTTP Method**: DELETE
- **URL Structure**: `/api/profile/allergens/{allergenId}`
- **Parameters**:
  - **Required**:
    - `allergenId` (path parameter) - UUID of the allergen to remove
  - **Optional**: None
- **Request Body**: None (DELETE request with path parameter only)
- **Authentication**: Required (mocked during development, to be enabled in production)

## 3. Used Types

### DTOs (from src/types.ts)

- `UserAllergenDTO` - Used for allergen data structure (id, name, createdAt)

### Command Models

None required - the allergenId is extracted from the URL path parameter

### Validation Schema

```typescript
const AllergenIdSchema = z.string().uuid("Invalid allergen ID format");
```

### Custom Error Classes (to be added to allergen.service.ts)

```typescript
export class AllergenNotInUserListError extends Error {
  constructor(allergenId: string) {
    super(`Allergen not in user's list: ${allergenId}`);
    this.name = "AllergenNotInUserListError";
  }
}
```

## 4. Response Details

### Success Response

- **Status**: 204 No Content
- **Body**: Empty (no content)
- **Headers**: None required

### Error Responses

**400 Bad Request** - Invalid allergen ID format

```json
{
  "error": "Bad Request",
  "message": "Invalid allergen ID format"
}
```

**401 Unauthorized** - Not authenticated (production only)

```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

**404 Not Found** - Allergen not in user's list

```json
{
  "error": "Not Found",
  "message": "Allergen not in user's list"
}
```

**500 Internal Server Error** - Unexpected server error

```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

## 5. Data Flow

1. **Request Reception**: Astro API route receives DELETE request
2. **Authentication**: Verify user session via `context.locals.supabase.auth.getUser()` (mocked during development with userId: "c4afdcfc-d36b-4f19-b62d-0de187151b87")
3. **Path Parameter Extraction**: Extract allergenId from `context.params.id`
4. **Validation**: Validate allergenId format using Zod (must be valid UUID)
5. **Service Layer Call**: Call `removeAllergenFromUser(supabase, userId, allergenId)`
6. **Service Layer Logic**:
   - Query `user_allergens` table to check if user has this allergen
   - If not found, throw `AllergenNotInUserListError`
   - If found, delete the record from `user_allergens` table
   - Return void (no data needed for 204 response)
7. **Response**: Return 204 No Content on success

### Database Interactions

- **Table**: `user_allergens`
- **Query**: DELETE WHERE user_id = ? AND allergen_id = ?
- **Relationship**: Uses existing M:M relationship between users and allergens

## 6. Security Considerations

### Authentication

- User must be authenticated (mocked during development)
- Production implementation will use: `context.locals.supabase.auth.getUser()`
- Returns 401 if not authenticated

### Authorization

- Users can only delete allergens from their own profile
- The userId from the auth session ensures users cannot delete other users' allergens
- Path parameter (allergenId) is validated to prevent injection attacks

### Input Validation

- **allergenId**: Must be valid UUID format (validated with Zod)
- Prevents SQL injection through parameterized Supabase queries
- Invalid UUIDs return 400 Bad Request before database interaction

### Data Integrity

- Database constraints ensure referential integrity
- CASCADE delete rules protect against orphaned records
- Service layer checks existence before deletion to provide meaningful error messages

## 7. Error Handling

### Expected Errors (Business Logic)

**AllergenNotInUserListError** (404 Not Found)

- Thrown when: User doesn't have the specified allergen in their profile
- Handling: Return 404 with "Allergen not in user's list" message
- Logging: Info level - expected user action

### Validation Errors (400 Bad Request)

**Invalid UUID Format**

- Thrown when: allergenId is not a valid UUID
- Handling: Return 400 with Zod validation error message
- Logging: Info level - client error

### Authentication Errors (401 Unauthorized)

**No User Session** (production only)

- Thrown when: `context.locals.supabase.auth.getUser()` fails
- Handling: Return 401 with "Authentication required" message
- Logging: Info level - expected for unauthenticated requests

### Database Errors (500 Internal Server Error)

**Supabase Query Failures**

- Thrown when: Database connection issues, constraint violations
- Handling: Return 500 with generic error message
- Logging: Error level with full stack trace and context

### Error Logging Strategy

```typescript
// Expected errors (info level)
console.info("[DELETE /api/profile/allergens/{id}] Allergen not in list:", {
  userId,
  allergenId,
  error: error.message,
});

// Unexpected errors (error level)
console.error("[DELETE /api/profile/allergens/{id}] Error:", {
  userId,
  allergenId,
  error: error instanceof Error ? error.message : "Unknown error",
  stack: error instanceof Error ? error.stack : undefined,
});
```

## 8. Performance Considerations

### Query Optimization

- Single DELETE query with composite WHERE clause (user_id AND allergen_id)
- No JOIN operations required for deletion
- Indexed columns (user_id, allergen_id) ensure fast lookups

### Potential Bottlenecks

- Database connection latency (mitigated by Supabase connection pooling)
- Network round trips (minimized by single query approach)

### Optimization Strategies

- Use Supabase's built-in connection pooling
- Validate input before database interaction to fail fast
- Return 204 No Content (no data serialization overhead)
- No need to fetch deleted data (unlike POST which returns created allergen)

### Caching Considerations

- No caching needed for DELETE operations
- Frontend should invalidate cached allergen lists after successful deletion

## 9. Implementation Steps

### Step 1: Update allergen.service.ts

**File**: `src/lib/services/allergen.service.ts`

1. Add `AllergenNotInUserListError` custom error class after existing error classes:

```typescript
export class AllergenNotInUserListError extends Error {
  constructor(allergenId: string) {
    super(`Allergen not in user's list: ${allergenId}`);
    this.name = "AllergenNotInUserListError";
  }
}
```

2. Add `removeAllergenFromUser` function after the `addAllergenToUser` function:

```typescript
/**
 * Remove allergen from user's profile
 * @param supabase - Supabase client instance from context.locals
 * @param userId - User ID from authentication session
 * @param allergenId - Allergen ID to remove
 * @throws AllergenNotInUserListError if user doesn't have this allergen
 * @throws Error if database operation fails
 */
export async function removeAllergenFromUser(
  supabase: SupabaseClient<Database>,
  userId: string,
  allergenId: string
): Promise<void> {
  // Check if user has this allergen
  const userHasAllergen = await checkUserHasAllergen(supabase, userId, allergenId);
  if (!userHasAllergen) {
    throw new AllergenNotInUserListError(allergenId);
  }

  // Delete allergen from user's profile
  const { error } = await supabase.from("user_allergens").delete().eq("user_id", userId).eq("allergen_id", allergenId);

  if (error) {
    throw error;
  }
}
```

### Step 2: Create [id].ts endpoint file

**File**: `src/pages/api/profile/allergens/[id].ts`

Create new file with the following structure:

```typescript
import type { APIRoute } from "astro";
import { z } from "zod";

import { removeAllergenFromUser, AllergenNotInUserListError } from "../../../../lib/services/allergen.service";

export const prerender = false;

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const AllergenIdSchema = z.string().uuid("Invalid allergen ID format");

/**
 * DELETE /api/profile/allergens/{id}
 * Removes a specific allergen from the current authenticated user's profile
 *
 * Path parameters: id (allergenId as UUID)
 *
 * Returns:
 * - 204: No Content (allergen successfully removed)
 * - 400: Bad Request (invalid allergen ID format)
 * - 401: Unauthorized (authentication required) - currently commented for development
 * - 404: Not Found (allergen not in user's list)
 * - 500: Internal server error
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
  const userId = "c4afdcfc-d36b-4f19-b62d-0de187151b87";

  try {
    // ========================================
    // PATH PARAMETER EXTRACTION AND VALIDATION
    // ========================================

    const allergenId = context.params.id;

    // Validate allergenId format
    let validatedAllergenId: string;
    try {
      validatedAllergenId = AllergenIdSchema.parse(allergenId);
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
    // REMOVE ALLERGEN FROM USER PROFILE
    // ========================================

    await removeAllergenFromUser(context.locals.supabase, userId, validatedAllergenId);

    // Success response - 204 No Content
    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    // Handle specific business logic errors
    if (error instanceof AllergenNotInUserListError) {
      console.info("[DELETE /api/profile/allergens/{id}] Allergen not in list:", {
        userId,
        allergenId: context.params.id,
        error: error.message,
      });

      return new Response(
        JSON.stringify({
          error: "Not Found",
          message: "Allergen not in user's list",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Log unexpected errors
    console.error("[DELETE /api/profile/allergens/{id}] Error:", {
      userId,
      allergenId: context.params.id,
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

### Step 3: Testing Scenarios

**Manual Testing Checklist**:

0. **Setup** - provide exisingn allergens for the mocked user in the database
   - User ID: `c4afdcfc-d36b-4f19-b62d-0de187151b87`
   - Allergens: Query existing allergens from `allergens` table and add a few to `user_allergens`, e.g. `e631c0d4-9723-4e09-bb1a-0e7bdb3805a4` it's a valid allergen ID from the database that points to "Orzeszki ziemne"

1. **Valid deletion** - allergen exists in user's list
   - Request: `DELETE /api/profile/allergens/{valid-allergen-id}`
   - Expected: 204 No Content, empty body
   - Verify: Allergen removed from database

2. **Allergen not in list** - valid UUID but user doesn't have it
   - Request: `DELETE /api/profile/allergens/{other-allergen-id}`
   - Expected: 404 Not Found
   - Response: `{"error": "Not Found", "message": "Allergen not in user's list"}`

3. **Invalid UUID format** - malformed allergenId
   - Request: `DELETE /api/profile/allergens/not-a-uuid`
   - Expected: 400 Bad Request
   - Response: `{"error": "Bad Request", "message": "Invalid allergen ID format"}`

4. **Authentication** (future, when enabled)
   - Request: `DELETE /api/profile/allergens/{id}` without session
   - Expected: 401 Unauthorized
   - Response: `{"error": "Unauthorized", "message": "Authentication required"}`

5. **Database error simulation**
   - Scenario: Connection issues or database down
   - Expected: 500 Internal Server Error
   - Response: `{"error": "Internal Server Error", "message": "An unexpected error occurred"}`

**Test Data**:

- Mock user ID: `c4afdcfc-d36b-4f19-b62d-0de187151b87`
- Valid allergen IDs: Query from `allergens` table or use existing ones from GET response
- Invalid UUIDs: `"not-a-uuid"`, `"12345"`, `""`, `"invalid-format"`

**Testing Tools**:

- curl, Postman, or similar HTTP client
- Verify database state before and after deletion
- Check console logs for appropriate info/error messages

---

## Summary

This implementation plan provides complete guidance for implementing the DELETE /api/profile/allergens/{allergenId} endpoint. The implementation:

- Follows existing patterns from GET/POST allergen endpoints
- Uses the same mock authentication approach for development
- Implements proper error handling with custom error classes
- Returns appropriate HTTP status codes (204, 400, 404, 500)
- Maintains consistency with the codebase architecture
- Provides comprehensive security through validation and authorization
- Includes detailed testing scenarios for quality assurance

The endpoint integrates seamlessly with the existing allergen management system and follows REST best practices for DELETE operations.
