# API Endpoint Implementation Plan: DELETE /api/collections/{collectionId}

## 1. Endpoint Overview

This endpoint allows authenticated users to delete their recipe collections. When a collection is deleted, all associated collection_recipes entries are automatically removed through database cascade deletion. The endpoint implements anti-enumeration security patterns to prevent unauthorized users from discovering collection IDs.

**Key Features:**

- Deletes a specific collection by ID
- Verifies user ownership before deletion
- Automatic cascade deletion of collection recipes
- Anti-enumeration pattern (returns 404 for both not found and forbidden)
- Returns 204 No Content on successful deletion

## 2. Request Details

- **HTTP Method**: DELETE
- **URL Structure**: `/api/collections/{collectionId}`
- **Parameters**:
  - **Required**:
    - `collectionId` (path parameter, UUID format) - The unique identifier of the collection to delete
  - **Optional**: None
- **Request Body**: None (DELETE method typically has no body)
- **Authentication**: Required (mocked for development with userId: `a85d6d6c-b7d4-4605-9cc4-3743401b67a0`)

## 3. Used Types

### Validation Schemas (Zod)

**CollectionIdParamSchema** (already exists in `[collectionId].ts`):

```typescript
const CollectionIdParamSchema = z.string().uuid("Invalid collection ID format");
```

### Service Function Signature

**New function to add to `collection.service.ts`**:

```typescript
/**
 * Delete a collection for a user
 * @param supabase - Supabase client instance from context.locals
 * @param userId - ID of the authenticated user
 * @param collectionId - ID of the collection to delete
 * @returns void (no return value on success)
 * @throws CollectionNotFoundError if collection not found or user is not authorized (anti-enumeration)
 * @throws Error if database query fails
 */
async function deleteCollection(supabase: SupabaseClient, userId: string, collectionId: string): Promise<void>;
```

### Error Classes (already exist)

- `CollectionNotFoundError` - Used for both not found and unauthorized scenarios
- `CollectionForbiddenError` - Used internally in service, converted to NotFoundError at route level

## 4. Response Details

### Success Response

- **Status Code**: 204 No Content
- **Response Body**: Empty (no content)
- **Headers**: None required

### Error Responses

| Status Code | Error Type            | Response Body                                                                  | Scenario                                                           |
| ----------- | --------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| 400         | Bad Request           | `{"error": "Bad Request", "message": "Invalid collection ID format"}`          | collectionId is not a valid UUID                                   |
| 401         | Unauthorized          | `{"error": "Unauthorized", "message": "Authentication required"}`              | User not authenticated (currently mocked)                          |
| 404         | Not Found             | `{"error": "Not Found", "message": "Collection not found"}`                    | Collection doesn't exist OR user doesn't own it (anti-enumeration) |
| 500         | Internal Server Error | `{"error": "Internal Server Error", "message": "Failed to delete collection"}` | Unexpected database or server error                                |

**Note**: 403 Forbidden is converted to 404 Not Found to implement anti-enumeration pattern.

## 5. Data Flow

### Request Flow

1. **Authentication**: Verify user is authenticated (mocked for development)
2. **Path Parameter Extraction**: Extract `collectionId` from URL path
3. **Validation**: Validate `collectionId` is a valid UUID using Zod
4. **Service Call**: Call `deleteCollection(supabase, userId, collectionId)`
5. **Success Response**: Return 204 No Content

### Service Layer Flow (`deleteCollection` function)

1. **Fetch Collection**: Query `collections` table for collection with matching `id` and `user_id`
2. **Ownership Verification**: Check if collection exists and belongs to the authenticated user
   - If not found: throw `CollectionNotFoundError`
   - If found but wrong user: throw `CollectionNotFoundError` (anti-enumeration)
3. **Delete Collection**: Execute DELETE query on `collections` table
4. **Cascade Effect**: Database automatically deletes related `collection_recipes` entries (CASCADE configured)
5. **Return**: Function completes successfully (void return)

### Database Operations

```sql
-- Step 1: Fetch and verify ownership
SELECT id, user_id FROM collections
WHERE id = $collectionId AND user_id = $userId;

-- Step 2: Delete collection (if ownership verified)
DELETE FROM collections WHERE id = $collectionId;

-- Step 3: Automatic cascade (handled by database)
-- DELETE FROM collection_recipes WHERE collection_id = $collectionId;
```

## 6. Security Considerations

### Authentication

- **Development**: Using mocked userId (`a85d6d6c-b7d4-4605-9cc4-3743401b67a0`)
- **Production**: Must uncomment Supabase authentication block
- Return 401 Unauthorized if authentication fails

### Authorization

- **Ownership Verification**: Only allow users to delete their own collections
- **Anti-Enumeration Pattern**:
  - Return 404 for both "collection not found" and "user doesn't own collection"
  - Prevents attackers from discovering valid collection IDs
  - Implemented by throwing `CollectionNotFoundError` for both scenarios

### Input Validation

- **UUID Validation**: Strictly validate `collectionId` is a valid UUID format
- **Zod Schema**: Use existing `CollectionIdParamSchema` for validation
- **Early Return**: Return 400 Bad Request for invalid formats before database queries

### Cascade Deletion Security

- **Database-Enforced**: Cascade deletion is handled by database constraints
- **No Orphans**: Ensures no orphaned `collection_recipes` entries remain
- **Atomic Operation**: Deletion is transactional (database handles atomicity)

## 7. Error Handling

### Validation Errors (400 Bad Request)

```typescript
try {
  validatedCollectionId = CollectionIdParamSchema.parse(collectionId);
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

### Business Logic Errors (404 Not Found)

```typescript
if (error instanceof CollectionNotFoundError) {
  console.info("[DELETE /api/collections/{collectionId}] Collection not found:", {
    userId,
    collectionId: context.params.collectionId,
    error: error.message,
  });

  return new Response(
    JSON.stringify({
      error: "Not Found",
      message: "Collection not found",
    }),
    { status: 404, headers: { "Content-Type": "application/json" } }
  );
}
```

### Unexpected Errors (500 Internal Server Error)

```typescript
// Log unexpected errors with full details
console.error("[DELETE /api/collections/{collectionId}] Error:", {
  userId,
  collectionId: context.params.collectionId,
  error: error instanceof Error ? error.message : "Unknown error",
  stack: error instanceof Error ? error.stack : undefined,
});

// Return generic error response (don't leak implementation details)
return new Response(
  JSON.stringify({
    error: "Internal Server Error",
    message: "Failed to delete collection",
  }),
  { status: 500, headers: { "Content-Type": "application/json" } }
);
```

### Error Logging Strategy

- **console.info**: For expected business logic errors (404, 403)
- **console.error**: For unexpected errors with stack traces
- **Consistent Format**: Include userId, collectionId, error message in all logs
- **Security**: Don't expose sensitive information in error responses

## 8. Performance Considerations

### Database Queries

- **Single Query for Verification**: Combine existence and ownership check in one query
  - Use `.eq("id", collectionId).eq("user_id", userId).single()`
  - Reduces round trips to database
- **Indexed Columns**: Both `id` and `user_id` should be indexed (primary/foreign keys)
- **Cascade Efficiency**: Database handles cascade deletion efficiently

### Optimization Strategies

1. **Combined Verification Query**: Check existence and ownership in single database call
2. **Early Validation**: Validate UUID format before any database queries
3. **No Response Body**: 204 No Content requires no serialization overhead
4. **Database Cascade**: Let PostgreSQL handle cascade deletion (faster than application-level)

### Potential Bottlenecks

- **Cascade Deletion**: If collection has thousands of recipes, cascade deletion might take time
  - Mitigated by: Database handles this efficiently with proper indexing
  - Not a concern for typical use case (collections typically have < 100 recipes)
- **Network Latency**: Supabase API calls over network
  - Mitigated by: Minimize number of queries (combined verification)

### Scalability Notes

- DELETE operations are generally fast (single row deletion)
- Cascade deletion on `collection_recipes` is index-assisted
- No pagination needed (single resource deletion)
- No complex joins or aggregations required

## 9. Implementation Steps

### Step 1: Create Service Function in `collection.service.ts`

1. Add `deleteCollection` function to the service file
2. Implement logic to:
   - Query collection with ownership verification in single query
   - Throw `CollectionNotFoundError` if not found or wrong user
   - Delete collection from database
   - Return void on success
3. Add comprehensive JSDoc comments explaining parameters and errors

### Step 2: Add DELETE Handler to `src/pages/api/collections/[collectionId].ts`

1. Export `DELETE` constant as APIRoute
2. Add JSDoc comment with endpoint description and examples
3. Implement authentication block (mocked for development)
4. Extract and validate `collectionId` path parameter
5. Call `deleteCollection` service function
6. Return 204 No Content on success

### Step 3: Implement Error Handling

1. Handle Zod validation errors (400 Bad Request)
2. Handle `CollectionNotFoundError` (404 Not Found)
3. Handle unexpected errors (500 Internal Server Error)
4. Add appropriate logging for each error type
5. Ensure anti-enumeration pattern (403 returns as 404)

### Step 4: Import Service Function

1. Add `deleteCollection` to imports from `collection.service`
2. Ensure error classes are already imported (`CollectionNotFoundError`)

### Step 5: Test the Implementation

1. Test successful deletion (204 No Content)
2. Test invalid UUID format (400 Bad Request)
3. Test non-existent collection (404 Not Found)
4. Test deleting another user's collection (404 Not Found - anti-enumeration)
5. Test cascade deletion (verify collection_recipes are deleted)
6. Test authentication failure (401 Unauthorized - when auth is enabled)

### Step 6: Verify Database Cascade Behavior

1. Confirm `collection_recipes` entries are automatically deleted
2. Verify no orphaned records remain
3. Test with collection containing multiple recipes

### Step 7: Documentation and Code Quality

1. Ensure all functions have proper JSDoc comments
2. Follow existing code style in the file
3. Use consistent error handling patterns
4. Include descriptive console logs for debugging

---

## Summary

This implementation plan provides a comprehensive guide for implementing the DELETE /api/collections/{collectionId} endpoint. The endpoint follows established patterns in the codebase, implements anti-enumeration security measures, and leverages database cascade deletion for efficiency.
