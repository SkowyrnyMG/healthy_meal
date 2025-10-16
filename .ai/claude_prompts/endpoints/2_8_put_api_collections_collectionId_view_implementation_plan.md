# API Endpoint Implementation Plan: PUT /api/collections/{collectionId}

## 1. Endpoint Overview

The `PUT /api/collections/{collectionId}` endpoint allows authenticated users to update the name of an existing recipe collection. The endpoint verifies collection ownership, prevents duplicate collection names, and returns the updated collection data.

**Key Features:**
- Updates collection name for authenticated user
- Validates UUID format for collectionId
- Prevents duplicate collection names per user
- Enforces collection ownership (403 Forbidden for unauthorized access)
- Returns updated collection with timestamp

## 2. Request Details

- **HTTP Method**: PUT
- **URL Structure**: `/api/collections/{collectionId}`
- **Path Parameters**:
  - **Required**:
    - `collectionId` (string, UUID format) - The unique identifier of the collection to update
- **Query Parameters**: None
- **Request Body**:
```json
{
  "name": "Szybkie i zdrowe kolacje"
}
```

**Request Body Schema:**
- `name` (string, required):
  - Minimum length: 1 character (after trimming)
  - Maximum length: 100 characters
  - Automatically trimmed of leading/trailing whitespace

## 3. Used Types

**Command Models (Request):**
- `UpdateCollectionCommand` (src/types.ts:538-540)
  ```typescript
  export interface UpdateCollectionCommand {
    name: string;
  }
  ```

**Response DTOs:**
- Simplified collection response:
  ```typescript
  {
    success: true,
    collection: {
      id: string;
      name: string;
      updatedAt: string;
    }
  }
  ```

**Custom Error Classes (to be added to collection.service.ts):**
- `CollectionNotFoundError` - Collection doesn't exist (404)
- `CollectionForbiddenError` - Collection belongs to another user (403) - **NEW**
- `CollectionAlreadyExistsError` - Duplicate name conflict (409)

**Validation Schemas:**
- `CollectionIdParamSchema` - Zod schema for UUID validation (reuse from existing code)
- `UpdateCollectionSchema` - Zod schema for request body validation
  ```typescript
  const UpdateCollectionSchema = z.object({
    name: z.string()
      .min(1, "Name is required")
      .max(100, "Name must be 100 characters or less")
      .trim()
  });
  ```

## 4. Response Details

**Success Response (200 OK):**
```json
{
  "success": true,
  "collection": {
    "id": "uuid",
    "name": "Szybkie i zdrowe kolacje",
    "updatedAt": "2025-10-11T12:30:00Z"
  }
}
```

**Error Responses:**

| Status Code | Error Type | Response Body |
|------------|------------|---------------|
| 400 | Bad Request | `{ "error": "Bad Request", "message": "Invalid JSON in request body" }` |
| 400 | Validation Error | `{ "error": "Bad Request", "message": "Name is required" }` |
| 400 | Invalid UUID | `{ "error": "Bad Request", "message": "Invalid collection ID format" }` |
| 401 | Unauthorized | `{ "error": "Unauthorized", "message": "Authentication required" }` |
| 403 | Forbidden | `{ "error": "Forbidden", "message": "You don't have permission to update this collection" }` |
| 404 | Not Found | `{ "error": "Not Found", "message": "Collection not found" }` |
| 409 | Conflict | `{ "error": "Conflict", "message": "Collection with this name already exists" }` |
| 500 | Internal Error | `{ "error": "Internal Server Error", "message": "Failed to update collection" }` |

## 5. Data Flow

1. **Authentication Phase:**
   - Extract user credentials from request (mocked for development)
   - Verify user is authenticated
   - Extract userId for authorization checks

2. **Request Validation Phase:**
   - Parse collectionId from URL path parameters
   - Validate collectionId is valid UUID format using Zod
   - Parse JSON request body
   - Validate request body structure and field constraints using Zod
   - Trim whitespace from name field

3. **Authorization & Business Logic Phase:**
   - Call `updateCollection()` service function
   - Service layer performs:
     - Fetch collection from database by collectionId
     - Verify collection exists (throw CollectionNotFoundError if not)
     - Verify collection belongs to authenticated user (throw CollectionForbiddenError if not)
     - Check for duplicate collection name for this user (excluding current collection)
     - Throw CollectionAlreadyExistsError if duplicate found
     - Update collection with new name
     - Return updated collection data with updatedAt timestamp

4. **Response Phase:**
   - Map database result to DTO format
   - Return success response with updated collection data

## 6. Security Considerations

**Authentication:**
- Use mocked userId for development: `a85d6d6c-b7d4-4605-9cc4-3743401b67a0`
- Follow pattern from `.ai/claude_rules/auth_dev_mock.md`
- Production: Uncomment Supabase auth.getUser() call
- Return 401 if authentication fails

**Authorization:**
- Verify collection belongs to authenticated user
- Return 403 Forbidden if user doesn't own the collection
- Explicit differentiation between 404 (not found) and 403 (forbidden)
- Prevents users from modifying other users' collections

**Input Validation:**
- Validate UUID format for collectionId to prevent injection attacks
- Validate name length constraints (1-100 characters)
- Trim whitespace from name to prevent duplicate detection issues
- Use Zod for type-safe validation
- Reject malformed JSON with 400 error

**Data Integrity:**
- Prevent duplicate collection names per user
- Use database constraints and application-level checks
- Handle race conditions with proper error handling

**Information Disclosure:**
- Use generic error messages in production
- Don't expose internal database errors to clients
- Log detailed errors server-side only

## 7. Error Handling

**Error Handling Strategy:**

1. **Validation Errors (400):**
   - Invalid JSON parsing
   - Zod validation failures (UUID format, name constraints)
   - Return first validation error message to client

2. **Authentication Errors (401):**
   - Missing or invalid authentication
   - Only applies when production auth is enabled

3. **Authorization Errors (403):**
   - Collection belongs to another user
   - Use `CollectionForbiddenError` custom error class
   - Log with console.info (expected business error)

4. **Not Found Errors (404):**
   - Collection doesn't exist in database
   - Use `CollectionNotFoundError` custom error class
   - Log with console.info (expected business error)

5. **Conflict Errors (409):**
   - Duplicate collection name for the same user
   - Use `CollectionAlreadyExistsError` custom error class
   - Log with console.info (expected business error)

6. **Internal Server Errors (500):**
   - Unexpected database errors
   - Unhandled exceptions
   - Log with console.error including full stack trace
   - Return generic error message

**Error Logging Pattern:**
```typescript
// For expected business errors (403, 404, 409)
console.info("[PUT /api/collections/{collectionId}] Business error:", {
  userId,
  collectionId,
  error: error.message,
});

// For unexpected errors (500)
console.error("[PUT /api/collections/{collectionId}] Error:", {
  userId,
  collectionId,
  error: error instanceof Error ? error.message : "Unknown error",
  stack: error instanceof Error ? error.stack : undefined,
});
```

## 8. Performance Considerations

**Database Queries:**
- Total queries: 3
  1. Fetch collection and verify ownership (single SELECT with filters)
  2. Check for duplicate name (SELECT with user_id and name filters, excluding current collection)
  3. Update collection (single UPDATE)

**Optimization Strategies:**
- Use indexed columns for queries (user_id, id, name)
- Use `.single()` for fetch operations to fail fast if not found
- Use `.maybeSingle()` for duplicate check to handle no-match case
- Leverage database constraints for data integrity

**Potential Bottlenecks:**
- None expected - simple CRUD operation with minimal queries
- Collection name uniqueness check is scoped to single user (good performance)
- All queries use indexed columns

**Caching:**
- Not applicable for write operations
- Client may cache GET requests but should invalidate on successful PUT

## 9. Implementation Steps

### Step 1: Add CollectionForbiddenError to collection.service.ts

Add new custom error class after existing error classes:

```typescript
/**
 * Error thrown when user attempts to access/modify collection they don't own
 */
export class CollectionForbiddenError extends Error {
  constructor(collectionId: string) {
    super(`Access forbidden to collection: ${collectionId}`);
    this.name = "CollectionForbiddenError";
  }
}
```

### Step 2: Add updateCollection function to collection.service.ts

Add new service function to handle collection update logic:

```typescript
/**
 * Update collection name for a user
 * @param supabase - Supabase client instance from context.locals
 * @param userId - ID of the authenticated user
 * @param collectionId - ID of the collection to update
 * @param command - UpdateCollectionCommand with new collection name
 * @returns Updated collection with id, name, and updatedAt
 * @throws CollectionNotFoundError if collection doesn't exist
 * @throws CollectionForbiddenError if collection belongs to another user
 * @throws CollectionAlreadyExistsError if another collection with same name exists
 * @throws Error if database query fails
 */
export async function updateCollection(
  supabase: SupabaseClient,
  userId: string,
  collectionId: string,
  command: UpdateCollectionCommand
): Promise<{ id: string; name: string; updatedAt: string }> {
  // Implementation steps:
  // 1. Trim and validate name
  // 2. Fetch collection and verify existence
  // 3. Verify ownership (throw CollectionForbiddenError if mismatch)
  // 4. Check for duplicate name (excluding current collection)
  // 5. Update collection
  // 6. Return updated data
}
```

**Detailed implementation logic:**

1. **Trim name:**
   ```typescript
   const trimmedName = command.name.trim();
   ```

2. **Fetch and verify collection:**
   ```typescript
   const { data: collection, error: fetchError } = await supabase
     .from("collections")
     .select("id, user_id, name")
     .eq("id", collectionId)
     .single();

   if (fetchError) {
     if (fetchError.code === "PGRST116") {
       throw new CollectionNotFoundError(collectionId);
     }
     throw fetchError;
   }

   if (!collection) {
     throw new CollectionNotFoundError(collectionId);
   }

   if (collection.user_id !== userId) {
     throw new CollectionForbiddenError(collectionId);
   }
   ```

3. **Check for duplicate name:**
   ```typescript
   const { data: existing, error: existingError } = await supabase
     .from("collections")
     .select("id")
     .eq("user_id", userId)
     .eq("name", trimmedName)
     .neq("id", collectionId) // Exclude current collection
     .maybeSingle();

   if (existingError) {
     throw existingError;
   }

   if (existing) {
     throw new CollectionAlreadyExistsError(trimmedName);
   }
   ```

4. **Update collection:**
   ```typescript
   const { data: updated, error: updateError } = await supabase
     .from("collections")
     .update({ name: trimmedName })
     .eq("id", collectionId)
     .select("id, name, updated_at")
     .single();

   if (updateError) {
     throw updateError;
   }

   if (!updated) {
     throw new Error("Failed to update collection");
   }

   return {
     id: updated.id,
     name: updated.name,
     updatedAt: updated.updated_at,
   };
   ```

### Step 3: Create PUT handler in [collectionId].ts

Add PUT handler to existing file `src/pages/api/collections/[collectionId].ts`:

```typescript
import {
  updateCollection,
  CollectionForbiddenError
} from "../../../lib/services/collection.service";
```

Add validation schema at the top with other schemas:

```typescript
/**
 * Zod schema for updating collection
 */
const UpdateCollectionSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less")
    .trim(),
});
```

Implement PUT handler following the existing pattern:

```typescript
/**
 * PUT /api/collections/{collectionId}
 * Updates collection name for the authenticated user
 *
 * Path parameters: collectionId (UUID)
 * Request body: { name: string (1-100 characters, trimmed) }
 *
 * Returns:
 * - 200: Successfully updated collection
 * - 400: Bad Request (invalid JSON, validation errors)
 * - 401: Unauthorized (authentication required) - currently mocked
 * - 403: Forbidden (collection belongs to another user)
 * - 404: Not Found (collection not found)
 * - 409: Conflict (collection with this name already exists)
 * - 500: Internal server error
 *
 * @example
 * PUT /api/collections/123e4567-e89b-12d3-a456-426614174000
 * Body: { "name": "Szybkie i zdrowe kolacje" }
 */
export const PUT: APIRoute = async (context) => {
  // Implementation sections:
  // 1. Authentication (mock for development)
  // 2. Path parameter validation (collectionId)
  // 3. Request body parsing and validation
  // 4. Update collection via service
  // 5. Error handling with appropriate status codes
};
```

**Handler implementation structure:**

1. **Authentication block** (copy from existing handlers)
2. **Validate collectionId** (reuse existing validation logic)
3. **Parse and validate request body:**
   ```typescript
   let body: unknown;
   try {
     body = await context.request.json();
   } catch {
     return new Response(
       JSON.stringify({
         error: "Bad Request",
         message: "Invalid JSON in request body",
       }),
       { status: 400, headers: { "Content-Type": "application/json" } }
     );
   }

   let validatedData: z.infer<typeof UpdateCollectionSchema>;
   try {
     validatedData = UpdateCollectionSchema.parse(body);
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

4. **Call service function:**
   ```typescript
   const collection = await updateCollection(
     context.locals.supabase,
     userId,
     validatedCollectionId,
     validatedData
   );
   ```

5. **Error handling with catch blocks:**
   - `CollectionNotFoundError` → 404
   - `CollectionForbiddenError` → 403
   - `CollectionAlreadyExistsError` → 409
   - Generic errors → 500

### Step 4: Export new error class

Update collection.service.ts exports to include `CollectionForbiddenError`:

```typescript
export {
  CollectionNotFoundError,
  CollectionAlreadyExistsError,
  CollectionForbiddenError
};
```

### Step 5: Test the endpoint

**Manual testing checklist:**

1. ✅ Valid update request returns 200 with updated data
2. ✅ Invalid UUID format returns 400
3. ✅ Empty name returns 400
4. ✅ Name exceeding 100 characters returns 400
5. ✅ Non-existent collection returns 404
6. ✅ Collection belonging to another user returns 403
7. ✅ Duplicate name (for same user) returns 409
8. ✅ Updating to same name (no change) succeeds 200
9. ✅ Invalid JSON returns 400
10. ✅ Database error returns 500

**Test scenarios:**

```bash
# Success case
curl -X PUT http://localhost:3000/api/collections/{valid-uuid} \
  -H "Content-Type: application/json" \
  -d '{"name": "New Collection Name"}'

# Invalid UUID
curl -X PUT http://localhost:3000/api/collections/invalid-uuid \
  -H "Content-Type: application/json" \
  -d '{"name": "Test"}'

# Name too long
curl -X PUT http://localhost:3000/api/collections/{valid-uuid} \
  -H "Content-Type: application/json" \
  -d '{"name": "a very long name that exceeds one hundred characters..."}'

# Duplicate name
curl -X PUT http://localhost:3000/api/collections/{uuid1} \
  -H "Content-Type: application/json" \
  -d '{"name": "Existing Collection Name"}'
```

### Step 6: Verify implementation follows patterns

**Final checklist:**

- ✅ Follows Astro API route conventions (uppercase PUT, export const prerender = false)
- ✅ Uses Zod for validation
- ✅ Uses context.locals.supabase (not direct import)
- ✅ Uses SupabaseClient type from src/db/supabase.client.ts
- ✅ Extracts business logic to service layer
- ✅ Handles errors at the beginning of functions (guard clauses)
- ✅ Uses early returns for error conditions
- ✅ Implements proper error logging
- ✅ Follows existing code style and patterns
- ✅ Returns appropriate HTTP status codes
- ✅ Uses custom error classes for business logic errors
- ✅ Includes comprehensive JSDoc comments

---

## Summary

This implementation plan provides step-by-step guidance for implementing the `PUT /api/collections/{collectionId}` endpoint. The implementation follows existing patterns in the codebase, uses proper validation and error handling, enforces security through authentication and authorization checks, and maintains consistency with the project's architecture.
