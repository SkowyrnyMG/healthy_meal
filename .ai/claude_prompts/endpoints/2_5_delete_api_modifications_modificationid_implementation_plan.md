# API Endpoint Implementation Plan: DELETE /api/modifications/{modificationId}

## 1. Endpoint Overview

This endpoint allows authenticated users to delete their own recipe modifications. It implements proper authorization to prevent IDOR (Insecure Direct Object Reference) attacks by ensuring users can only delete modifications they own.

**Key Features:**

- Deletes a recipe modification by ID
- Verifies user ownership before deletion
- Returns 204 No Content on success
- Uses mocked authentication for development
- Prevents information leakage by returning 404 for both non-existent and unauthorized modifications

## 2. Request Details

- **HTTP Method**: DELETE
- **URL Structure**: `/api/modifications/{modificationId}`
- **Parameters**:
  - **Required**: `modificationId` (UUID) - Path parameter identifying the modification to delete
  - **Optional**: None
- **Request Body**: None (DELETE operation doesn't require body)
- **Authentication**: Required (mocked for development with userId `a85d6d6c-b7d4-4605-9cc4-3743401b67a0`)

## 3. Used Types

### Validation Schemas

```typescript
// Reuse existing schema from GET handler
const ModificationIdParamSchema = z.object({
  modificationId: z.string().uuid("Modification ID must be a valid UUID"),
});

type ValidatedModificationIdParam = z.infer<typeof ModificationIdParamSchema>;
```

_Note: This schema already exists in the GET handler in the same file and can be reused._

### Service Function (to be created in modification.service.ts)

```typescript
/**
 * Delete a recipe modification
 * Verifies ownership before deletion to prevent IDOR attacks
 *
 * @param supabase - Supabase client instance from context.locals
 * @param modificationId - UUID of the modification to delete
 * @param userId - ID of the authenticated user
 * @throws Error with specific messages for not found or forbidden scenarios
 */
export async function deleteModification(
  supabase: SupabaseClient,
  modificationId: string,
  userId: string
): Promise<void>;
```

## 4. Response Details

### Success Response

- **Status**: 204 No Content
- **Headers**: None
- **Body**: null (no content)

### Error Responses

| Status Code | Error Type            | Message                                                 | Scenario                                          |
| ----------- | --------------------- | ------------------------------------------------------- | ------------------------------------------------- |
| 400         | Bad Request           | "Modification ID must be a valid UUID"                  | Invalid UUID format for modificationId            |
| 401         | Unauthorized          | "Authentication required"                               | User not authenticated (production only)          |
| 403         | Forbidden             | "You don't have permission to delete this modification" | User doesn't own the modification                 |
| 404         | Not Found             | "Modification not found"                                | Modification doesn't exist OR user doesn't own it |
| 500         | Internal Server Error | "An unexpected error occurred"                          | Database errors or unexpected exceptions          |

**Security Note**: For IDOR protection, return 404 for both non-existent modifications AND modifications owned by other users. This prevents attackers from discovering which modification IDs exist.

## 5. Data Flow

### Request Flow

1. **Request Reception**: Astro API route receives DELETE request with modificationId in URL path
2. **Authentication** (Mocked): Extract/verify user identity (currently hardcoded for development)
3. **Path Parameter Extraction**: Extract `modificationId` from `context.params`
4. **Input Validation**: Validate modificationId is a valid UUID using Zod schema
5. **Service Call**: Invoke `deleteModification(supabase, modificationId, userId)`
6. **Ownership Verification**: Service queries modification and verifies user ownership
7. **Database Deletion**: Service deletes modification from `recipe_modifications` table
8. **Success Response**: Return HTTP 204 No Content

### Database Operations

1. **SELECT Query**: Fetch modification by ID to verify existence and ownership
   ```sql
   SELECT id, user_id
   FROM recipe_modifications
   WHERE id = $1
   ```
2. **Ownership Check**: Compare `user_id` from database with authenticated `userId`
3. **DELETE Query**: Remove modification from database
   ```sql
   DELETE FROM recipe_modifications
   WHERE id = $1 AND user_id = $2
   ```

### Cascade Effects

- **No child records**: Recipe modifications don't have dependent records
- **Parent cascade**: If a recipe is deleted, its modifications are automatically deleted (CASCADE on `original_recipe_id` foreign key)

## 6. Security Considerations

### Primary Security Threat: IDOR (Insecure Direct Object Reference)

**Attack Scenario**:

- Attacker discovers or guesses modification IDs
- Attempts to delete modifications belonging to other users
- Could disrupt other users' data

**Mitigation Strategy**:

1. **Ownership Verification**: Always verify `user_id` matches authenticated user before deletion
2. **Information Hiding**: Return 404 for both non-existent and unauthorized modifications (don't reveal existence)
3. **UUID Usage**: ModificationIds are UUIDs, making them hard to guess
4. **Database-Level Check**: Include `user_id` in DELETE WHERE clause as additional safety layer

### Authentication & Authorization

**Development Mode** (Current):

```typescript
// MOCK: Hardcoded user ID for development
const user = { id: "a85d6d6c-b7d4-4605-9cc4-3743401b67a0" };
```

**Production Mode** (To be enabled):

```typescript
const { data: { user }, error: authError } = await context.locals.supabase.auth.getUser();
if (authError || !user) {
  return 401 Unauthorized
}
```

### Error Message Strategy

**Secure Approach**:

- Never reveal whether a modification exists if user doesn't own it
- Use same error message (404) for both "not found" and "not authorized"
- Log detailed errors server-side but return generic messages to client

**Example**:

- Modification doesn't exist → 404: "Modification not found"
- Modification exists but belongs to another user → 404: "Modification not found"
- This prevents attackers from enumerating valid modification IDs

## 7. Error Handling

### Validation Errors (400 Bad Request)

**Cause**: Invalid input format

- ModificationId is not a valid UUID

**Handling**:

```typescript
try {
  validatedParams = ModificationIdParamSchema.parse(rawParams);
} catch (error) {
  if (error instanceof z.ZodError) {
    return 400 with first validation error message
  }
}
```

### Business Logic Errors (403 Forbidden, 404 Not Found)

**Service Layer Throws**:

- `"Modification not found"` → Map to 404
- `"You don't have permission to delete this modification"` → Map to 403

**Note**: In production, consider mapping 403 to 404 for security (information hiding)

**Handling Pattern**:

```typescript
catch (error) {
  if (error instanceof Error) {
    if (error.message === "Modification not found") {
      return 404
    }
    if (error.message === "You don't have permission...") {
      return 403  // or 404 for stricter security
    }
  }
}
```

### Server Errors (500 Internal Server Error)

**Causes**:

- Database connection failures
- Unexpected exceptions
- Invalid database state

**Handling**:

1. Log full error details server-side
2. Return generic error message to client
3. Don't leak internal implementation details

### Error Logging Format

```typescript
console.error("[DELETE /api/modifications/[modificationId]] Error:", {
  modificationId: context.params.modificationId,
  userId: user?.id,
  error: error instanceof Error ? error.message : "Unknown error",
  stack: error instanceof Error ? error.stack : undefined,
});
```

**Logged Information**:

- Endpoint identifier
- ModificationId (for debugging)
- UserId (for security auditing)
- Error message
- Stack trace (for debugging)

## 8. Performance Considerations

### Database Query Performance

**Query 1: Verification**

```sql
SELECT id, user_id FROM recipe_modifications WHERE id = $1
```

- Uses primary key index
- Expected time: <5ms
- Returns single row or null

**Query 2: Deletion**

```sql
DELETE FROM recipe_modifications WHERE id = $1 AND user_id = $2
```

- Uses primary key and indexed user_id
- Expected time: <5ms
- Affects single row

**Total Estimated Response Time**: <50ms (including network and processing)

### Optimization Opportunities

**Current Approach**: Two separate queries for clarity and better error messages

- Pros: Clear error differentiation (not found vs. forbidden)
- Cons: Requires two database round trips

**Alternative Approach**: Single DELETE with RETURNING clause

```sql
DELETE FROM recipe_modifications
WHERE id = $1 AND user_id = $2
RETURNING id
```

- Pros: Single database query, slightly faster
- Cons: Can't differentiate between "not found" and "not authorized"

**Recommendation**: Keep current two-query approach for security and clarity. Performance difference is negligible for single-row operations.

### No Expected Bottlenecks

- Simple single-row operations
- Primary key lookups (indexed)
- No joins, aggregations, or scans
- No external API calls
- No file system operations

### Scalability Notes

- Endpoint scales linearly with concurrent users
- Database indexes ensure consistent performance
- No locking concerns (DELETE is atomic)
- Suitable for high-traffic scenarios

## 9. Implementation Steps

### Step 1: Create deleteModification service function

**File**: `src/lib/services/modification.service.ts`

**Implementation**:

```typescript
/**
 * Delete a recipe modification
 * Implements authorization check to prevent IDOR attacks
 *
 * @param supabase - Supabase client instance from context.locals
 * @param modificationId - UUID of the modification to delete
 * @param userId - ID of the authenticated user
 * @throws Error if modification not found or user not authorized
 */
export async function deleteModification(
  supabase: SupabaseClient,
  modificationId: string,
  userId: string
): Promise<void> {
  // Query modification to verify existence and ownership
  const { data, error } = await supabase
    .from("recipe_modifications")
    .select("id, user_id")
    .eq("id", modificationId)
    .single();

  // Handle not found
  if (error || !data) {
    throw new Error("Modification not found");
  }

  // Verify ownership (IDOR protection)
  if (data.user_id !== userId) {
    throw new Error("You don't have permission to delete this modification");
  }

  // Delete modification
  const { error: deleteError } = await supabase
    .from("recipe_modifications")
    .delete()
    .eq("id", modificationId)
    .eq("user_id", userId); // Additional safety check

  if (deleteError) {
    throw deleteError;
  }
}
```

**Pattern Reference**: Follow the pattern from `deleteRecipe` in `src/lib/services/recipe.service.ts`

### Step 2: Add DELETE handler to API route

**File**: `src/pages/api/modifications/[modificationId].ts`

**Add to existing file** (which already has GET handler):

```typescript
/**
 * DELETE /api/modifications/:modificationId
 * Deletes a recipe modification (owner only)
 *
 * Path Parameters:
 * - modificationId: UUID of the modification to delete
 *
 * Authorization:
 * - User must own the modification
 *
 * Returns:
 * - 204: Modification successfully deleted
 * - 400: Invalid modificationId format
 * - 401: Authentication required (production only)
 * - 403: Forbidden - User is not the owner
 * - 404: Modification not found
 * - 500: Internal server error
 */
export const DELETE: APIRoute = async (context) => {
  // Authentication section
  // Extract and validate path parameter
  // Call deleteModification service
  // Handle errors
  // Return 204 No Content
};
```

### Step 3: Implement authentication (mocked)

**Code Section**:

```typescript
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
//     { status: 401, headers: { "Content-Type": "application/json" } }
//   );
// }

// MOCK: Remove this in production
const user = { id: "a85d6d6c-b7d4-4605-9cc4-3743401b67a0" };
```

**Source**: Copy from `.ai/claude_rules/auth_dev_mock.md` and existing endpoints

### Step 4: Implement path parameter validation

**Code Section**:

```typescript
try {
  // ========================================
  // EXTRACT AND VALIDATE PATH PARAMETER
  // ========================================

  const rawParams = {
    modificationId: context.params.modificationId,
  };

  let validatedParams: ValidatedModificationIdParam;
  try {
    validatedParams = ModificationIdParamSchema.parse(rawParams);
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

  // Continue with deletion...
}
```

**Note**: Reuse existing `ModificationIdParamSchema` from GET handler

### Step 5: Call service and return response

**Code Section**:

```typescript
// ========================================
// DELETE MODIFICATION
// ========================================

await deleteModification(context.locals.supabase, validatedParams.modificationId, user.id);

// ========================================
// SUCCESS RESPONSE
// ========================================

return new Response(null, {
  status: 204, // No Content
});
```

### Step 6: Implement error handling

**Code Section**:

```typescript
} catch (error) {
  // Handle specific business logic errors
  if (error instanceof Error) {
    if (error.message === "Modification not found") {
      return new Response(
        JSON.stringify({
          error: "Not Found",
          message: "Modification not found",
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    if (error.message === "You don't have permission to delete this modification") {
      return new Response(
        JSON.stringify({
          error: "Forbidden",
          message: "You don't have permission to delete this modification",
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  // Log error with context
  console.error("[DELETE /api/modifications/[modificationId]] Error:", {
    modificationId: context.params.modificationId,
    userId: user?.id,
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
```

### Step 7: Add imports

**Add to top of file**:

```typescript
import { deleteModification } from "../../../lib/services/modification.service";
```

**Note**: Other required imports already exist (APIRoute, z, etc.)

### Step 8: Testing checklist

**Manual Testing Scenarios**:

1. **Successful Deletion** (204):
   - Create a modification as the mocked user
   - Call DELETE with valid modificationId
   - Verify 204 No Content response
   - Verify modification is deleted from database
   - Verify no response body

2. **Invalid UUID Format** (400):
   - Call DELETE with non-UUID modificationId (e.g., "invalid-id")
   - Verify 400 Bad Request response
   - Verify error message: "Modification ID must be a valid UUID"

3. **Modification Not Found** (404):
   - Call DELETE with valid UUID that doesn't exist
   - Verify 404 Not Found response
   - Verify error message: "Modification not found"

4. **Unauthorized Access** (403):
   - Create modification as different user (manual database insert)
   - Call DELETE with mocked userId
   - Verify 403 Forbidden response (or 404 if using strict security)
   - Verify modification is NOT deleted

5. **Database Error** (500):
   - Simulate database connection failure (temporarily)
   - Verify 500 Internal Server Error response
   - Verify generic error message returned
   - Verify detailed error logged to console

**Verification Steps**:

- Check HTTP status codes match specification
- Verify response headers (Content-Type for errors, none for 204)
- Check error messages are user-friendly
- Verify no sensitive information leaked in errors
- Confirm detailed errors logged server-side

---

## Summary

This implementation plan provides comprehensive guidance for implementing the DELETE /api/modifications/{modificationId} endpoint. The endpoint follows established patterns from the codebase (especially the DELETE recipe endpoint) and implements proper security measures to prevent IDOR attacks.

**Key Implementation Points**:

1. Create `deleteModification` service function with ownership verification
2. Add DELETE handler to existing `[modificationId].ts` file
3. Reuse existing validation schemas
4. Implement proper error handling with security-conscious responses
5. Follow mocked authentication pattern for development
6. Maintain consistency with existing endpoint patterns
