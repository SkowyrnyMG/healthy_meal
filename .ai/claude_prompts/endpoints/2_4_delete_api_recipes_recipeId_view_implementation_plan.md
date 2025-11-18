# API Endpoint Implementation Plan: DELETE /api/recipes/{recipeId}

## 1. Endpoint Overview

This endpoint allows authenticated users to delete their own recipes. The operation includes authorization checks to prevent IDOR (Insecure Direct Object Reference) vulnerabilities by ensuring only the recipe owner can perform the deletion. When a recipe is deleted, all related data (tags associations, favorites, ratings, meal plans, modifications, and collection associations) are automatically removed via database CASCADE constraints.

**Key Features:**

- Authenticated endpoint with owner-only access
- IDOR protection through ownership verification
- Automatic cleanup of related data via CASCADE constraints
- RESTful 204 No Content response on success

## 2. Request Details

- **HTTP Method**: DELETE
- **URL Structure**: `/api/recipes/{recipeId}`
- **Parameters**:
  - **Required**:
    - `recipeId` (path parameter) - UUID format string identifying the recipe to delete
  - **Optional**: None
- **Request Body**: None (DELETE operations typically have no request body)
- **Headers**:
  - `Content-Type`: Not required (no request body)
  - Authentication headers (handled by Supabase middleware)

## 3. Used Types

### Validation Schema (Reuse Existing)

```typescript
const RecipeIdParamSchema = z.object({
  recipeId: z.string().uuid("Recipe ID must be a valid UUID"),
});

type ValidatedRecipeIdParam = z.infer<typeof RecipeIdParamSchema>;
```

**Note**: This schema already exists in `src/pages/api/recipes/[recipeId].ts` and can be reused.

### Service Function Signature (New)

```typescript
/**
 * Delete a recipe by ID
 * @param supabase - Supabase client instance from context.locals
 * @param recipeId - UUID of the recipe to delete
 * @param userId - ID of the user attempting to delete (for ownership verification)
 * @returns void on success
 * @throws Error if recipe not found or user is not the owner
 */
export async function deleteRecipe(supabase: SupabaseClient, recipeId: string, userId: string): Promise<void>;
```

## 4. Response Details

### Success Response

- **Status Code**: 204 No Content
- **Body**: Empty (no content)
- **Description**: Recipe successfully deleted along with all related data

### Error Responses

| Status Code | Error Type            | Description                                    |
| ----------- | --------------------- | ---------------------------------------------- |
| 400         | Bad Request           | Invalid UUID format for recipeId parameter     |
| 401         | Unauthorized          | User is not authenticated (production only)    |
| 403         | Forbidden             | User is not the recipe owner (IDOR protection) |
| 404         | Not Found             | Recipe does not exist                          |
| 500         | Internal Server Error | Database error or unexpected server exception  |

### Error Response Format

```json
{
  "error": "Error Type",
  "message": "Human-readable error description"
}
```

## 5. Data Flow

```
1. Client sends DELETE request to /api/recipes/{recipeId}

2. API Route Handler:
   ├─ Extract and validate recipeId path parameter
   │  └─ Return 400 if invalid UUID format
   │
   ├─ Authenticate user (mock in dev, real in production)
   │  └─ Return 401 if not authenticated (production only)
   │
   ├─ Call recipe.service.deleteRecipe(supabase, recipeId, userId)
   │
   └─ Service Layer:
      ├─ Fetch recipe from database by recipeId
      │  └─ Return 404 error if recipe not found
      │
      ├─ Verify ownership: recipe.user_id === userId
      │  └─ Return 403 error if user is not the owner
      │
      ├─ Delete recipe from database
      │  └─ CASCADE constraints automatically delete:
      │     • recipe_tags (tag associations)
      │     • recipe_modifications
      │     • favorites
      │     • collection_recipes (collection associations)
      │     • recipe_ratings
      │     • meal_plans
      │
      └─ Return success

3. API Route Handler returns 204 No Content response
```

## 6. Security Considerations

### Authentication

- **Development**: Uses mock user ID (`a85d6d6c-b7d4-4605-9cc4-3743401b67a0`) as specified in `.ai/claude_rules/auth_dev_mock.md`
- **Production**: Uses Supabase authentication via `context.locals.supabase.auth.getUser()`
- **Implementation**: Include TODO comment for production authentication switchover

### Authorization (IDOR Protection)

- **Threat**: User attempts to delete recipes owned by other users
- **Mitigation**:
  1. Fetch recipe from database before deletion
  2. Compare `recipe.user_id` with authenticated `userId`
  3. Return 403 Forbidden if user is not the owner
  4. Only perform deletion if ownership is verified

### Database CASCADE Constraints

The following related records are automatically deleted when a recipe is deleted:

- `recipe_tags` (CASCADE on delete)
- `recipe_modifications` (CASCADE on delete)
- `favorites` (CASCADE on delete)
- `collection_recipes` (CASCADE on delete)
- `recipe_ratings` (CASCADE on delete)
- `meal_plans` (CASCADE on delete)

This ensures data integrity and prevents orphaned records.

### Input Validation

- Validate `recipeId` is a valid UUID using Zod schema
- Reject malformed UUIDs with 400 Bad Request

## 7. Error Handling

### Validation Errors (400 Bad Request)

```typescript
// Invalid UUID format
{
  "error": "Bad Request",
  "message": "Recipe ID must be a valid UUID"
}
```

### Authentication Errors (401 Unauthorized)

```typescript
// Not authenticated (production only)
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

### Authorization Errors (403 Forbidden)

```typescript
// User is not the recipe owner
{
  "error": "Forbidden",
  "message": "You don't have permission to delete this recipe"
}
```

### Not Found Errors (404 Not Found)

```typescript
// Recipe does not exist
{
  "error": "Not Found",
  "message": "Recipe not found"
}
```

### Server Errors (500 Internal Server Error)

```typescript
// Unexpected error or database failure
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

### Error Logging

All errors should be logged with context:

```typescript
console.error("[DELETE /api/recipes/[recipeId]] Error:", {
  recipeId: context.params.recipeId,
  userId: user?.id,
  error: error instanceof Error ? error.message : "Unknown error",
  stack: error instanceof Error ? error.stack : undefined,
});
```

## 8. Performance Considerations

### Database Operations

- **Single Query Pattern**: Fetch recipe once to verify existence and ownership before deletion
- **CASCADE Performance**: Database handles CASCADE deletes efficiently at the constraint level
- **Index Usage**: UUID primary keys are indexed, ensuring fast lookups

### Potential Bottlenecks

1. **Recipe Lookup**: Single SELECT query by UUID (fast with primary key index)
2. **Ownership Verification**: In-memory comparison after fetch (negligible overhead)
3. **Deletion**: Single DELETE query with automatic CASCADE (handled by PostgreSQL)

### Optimization Strategies

- **Transaction Safety**: Supabase automatically handles transactions for CASCADE deletes
- **Error Early Return**: Validate input and check ownership before attempting deletion
- **No N+1 Queries**: All related data is deleted via CASCADE constraints, not application code

### Expected Performance

- **Latency**: < 100ms for typical recipe deletion (single DB round trip)
- **Throughput**: Limited by database write capacity, not application code
- **Scalability**: Scales linearly with database capacity

## 9. Implementation Steps

### Step 1: Add deleteRecipe function to recipe.service.ts

Create a new service function to handle recipe deletion with ownership verification:

```typescript
/**
 * Delete a recipe by ID (owner only)
 * @param supabase - Supabase client instance from context.locals
 * @param recipeId - UUID of the recipe to delete
 * @param userId - ID of the user attempting to delete (for ownership verification)
 * @throws Error if recipe not found or user is not the owner
 */
export async function deleteRecipe(supabase: SupabaseClient, recipeId: string, userId: string): Promise<void> {
  // 1. Fetch recipe to verify existence and ownership
  const recipe = await getRecipeById(supabase, recipeId);

  if (!recipe) {
    throw new Error("Recipe not found");
  }

  // 2. Verify ownership (IDOR protection)
  if (recipe.userId !== userId) {
    throw new Error("You don't have permission to delete this recipe");
  }

  // 3. Delete recipe (CASCADE constraints handle related data)
  const { error } = await supabase.from("recipes").delete().eq("id", recipeId);

  if (error) {
    throw error;
  }
}
```

**Key Points:**

- Reuse existing `getRecipeById` function for recipe lookup
- Throw descriptive errors that the API handler can map to HTTP status codes
- Let database CASCADE constraints handle related data cleanup

### Step 2: Add DELETE handler to /api/recipes/[recipeId].ts

Add the DELETE route handler to the existing file:

```typescript
/**
 * DELETE /api/recipes/:recipeId
 * Deletes a recipe (owner only)
 *
 * Path Parameters:
 * - recipeId: UUID of the recipe to delete
 *
 * Authorization:
 * - User must be the recipe owner
 *
 * Returns:
 * - 204: Recipe successfully deleted
 * - 400: Invalid recipeId format
 * - 401: Authentication required (production only)
 * - 403: Forbidden - User is not the owner
 * - 404: Recipe not found
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
  //     { status: 401, headers: { "Content-Type": "application/json" } }
  //   );
  // }

  // MOCK: Remove this in production
  const user = { id: "a85d6d6c-b7d4-4605-9cc4-3743401b67a0" };

  try {
    // ========================================
    // EXTRACT AND VALIDATE PATH PARAMETER
    // ========================================

    const rawParams = {
      recipeId: context.params.recipeId,
    };

    let validatedParams: ValidatedRecipeIdParam;
    try {
      validatedParams = RecipeIdParamSchema.parse(rawParams);
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

    // ========================================
    // DELETE RECIPE
    // ========================================

    await deleteRecipe(context.locals.supabase, validatedParams.recipeId, user.id);

    // ========================================
    // SUCCESS RESPONSE
    // ========================================

    return new Response(null, {
      status: 204, // No Content
    });
  } catch (error) {
    // Handle specific business logic errors
    if (error instanceof Error) {
      if (error.message === "Recipe not found") {
        return new Response(
          JSON.stringify({
            error: "Not Found",
            message: "Recipe not found",
          }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      if (error.message === "You don't have permission to delete this recipe") {
        return new Response(
          JSON.stringify({
            error: "Forbidden",
            message: "You don't have permission to delete this recipe",
          }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Log error with context
    console.error("[DELETE /api/recipes/[recipeId]] Error:", {
      recipeId: context.params.recipeId,
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
};
```

**Key Points:**

- Follows existing pattern from GET/PUT handlers in the same file
- Uses guard clauses for error handling (early returns)
- Places happy path last
- Matches error messages from service layer to HTTP status codes
- Comprehensive error logging with context

### Step 3: Add import for deleteRecipe function

At the top of `/api/recipes/[recipeId].ts`, add the import:

```typescript
import { getRecipeById, updateRecipe, deleteRecipe } from "../../../lib/services/recipe.service";
```

### Step 4: Export prerender = false

Ensure the file has `export const prerender = false` at the top (already present, verify it remains).

### Step 5: Test the endpoint

After implementation, test the following scenarios:

1. **Happy Path**: Delete own recipe → 204 No Content
2. **Invalid UUID**: Use malformed UUID → 400 Bad Request
3. **Not Found**: Use non-existent recipe UUID → 404 Not Found
4. **IDOR Protection**: Try to delete another user's recipe → 403 Forbidden
5. **Cascade Verification**: Verify related data (tags, favorites, etc.) is deleted
6. **Error Handling**: Simulate database error → 500 Internal Server Error

### Step 6: Verify CASCADE cleanup

After deleting a recipe, query the following tables to ensure CASCADE deletes worked:

- `recipe_tags` - should have no entries for deleted recipe
- `favorites` - should have no entries for deleted recipe
- `collection_recipes` - should have no entries for deleted recipe
- `recipe_ratings` - should have no entries for deleted recipe
- `meal_plans` - should have no entries for deleted recipe
- `recipe_modifications` - should have no entries for deleted recipe

---

## Implementation Checklist

- [ ] Add `deleteRecipe` function to `src/lib/services/recipe.service.ts`
- [ ] Add `DELETE` handler to `src/pages/api/recipes/[recipeId].ts`
- [ ] Add import for `deleteRecipe` in the API route file
- [ ] Verify `export const prerender = false` is present
- [ ] Test happy path (delete own recipe)
- [ ] Test invalid UUID format (400)
- [ ] Test recipe not found (404)
- [ ] Test IDOR protection (403)
- [ ] Test CASCADE cleanup of related data
- [ ] Test error handling (500)
- [ ] Review error logging output
- [ ] Run linter and fix any issues
