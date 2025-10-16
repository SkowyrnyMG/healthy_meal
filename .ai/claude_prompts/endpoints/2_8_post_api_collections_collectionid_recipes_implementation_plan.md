# API Endpoint Implementation Plan: POST /api/collections/{collectionId}/recipes

## 1. Endpoint Overview

This endpoint adds a recipe to a user's collection. It ensures that only the collection owner can add recipes, verifies the recipe exists, and prevents duplicate additions. The endpoint follows anti-enumeration patterns to prevent information leakage about collection ownership.

**Key Features:**
- Authentication required (currently mocked for development)
- Collection ownership verification
- Recipe existence validation
- Duplicate prevention
- Anti-enumeration security pattern

## 2. Request Details

- **HTTP Method**: POST
- **URL Structure**: `/api/collections/{collectionId}/recipes`
- **Parameters**:
  - **Required Path Parameters**:
    - `collectionId`: UUID - The ID of the collection to add the recipe to
  - **Required Body Parameters**:
    - `recipeId`: UUID - The ID of the recipe to add to the collection
  - **Optional**: None

- **Request Body**:
```json
{
  "recipeId": "123e4567-e89b-12d3-a456-426614174000"
}
```

## 3. Used Types

### DTOs
No new DTOs needed. Response uses inline structure:
```typescript
{
  success: boolean;
  collectionRecipe: {
    collectionId: string;
    recipeId: string;
    createdAt: string;
  }
}
```

### Command Models
**Existing (from src/types.ts:545-547):**
```typescript
export interface AddRecipeToCollectionCommand {
  recipeId: string;
}
```

### Custom Error Classes (to be added to collection.service.ts)
```typescript
export class RecipeNotFoundError extends Error {
  constructor(recipeId: string) {
    super(`Recipe not found: ${recipeId}`);
    this.name = "RecipeNotFoundError";
  }
}

export class RecipeAlreadyInCollectionError extends Error {
  constructor(collectionId: string, recipeId: string) {
    super(`Recipe ${recipeId} already exists in collection ${collectionId}`);
    this.name = "RecipeAlreadyInCollectionError";
  }
}
```

### Zod Validation Schemas
```typescript
// Path parameter validation
const CollectionIdParamSchema = z.string().uuid("Invalid collection ID format");

// Request body validation
const AddRecipeToCollectionSchema = z.object({
  recipeId: z.string().uuid("Invalid recipe ID format"),
});
```

## 4. Response Details

### Success Response (201 Created)
```json
{
  "success": true,
  "collectionRecipe": {
    "collectionId": "123e4567-e89b-12d3-a456-426614174000",
    "recipeId": "987fcdeb-51a2-43d7-8912-123456789abc",
    "createdAt": "2025-10-17T12:00:00Z"
  }
}
```

### Error Responses

**400 Bad Request** - Invalid input
```json
{
  "error": "Bad Request",
  "message": "Invalid recipe ID format"
}
```

**401 Unauthorized** - Not authenticated (will be used in production)
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

**403 Forbidden** - Collection belongs to another user
```json
{
  "error": "Forbidden",
  "message": "You don't have permission to modify this collection"
}
```

**404 Not Found** - Collection or recipe not found
```json
{
  "error": "Not Found",
  "message": "Collection not found"
}
```
or
```json
{
  "error": "Not Found",
  "message": "Recipe not found"
}
```

**409 Conflict** - Recipe already in collection
```json
{
  "error": "Conflict",
  "message": "Recipe already exists in this collection"
}
```

**500 Internal Server Error** - Server-side error
```json
{
  "error": "Internal Server Error",
  "message": "Failed to add recipe to collection"
}
```

## 5. Data Flow

### Service Layer Function: `addRecipeToCollection`

**Location**: `src/lib/services/collection.service.ts`

**Signature**:
```typescript
export async function addRecipeToCollection(
  supabase: SupabaseClient,
  userId: string,
  collectionId: string,
  command: AddRecipeToCollectionCommand
): Promise<{
  collectionId: string;
  recipeId: string;
  createdAt: string;
}>
```

**Flow**:
1. **Verify Collection Ownership** (anti-enumeration pattern)
   - Single query: `.from("collections").select("id, user_id").eq("id", collectionId).eq("user_id", userId).single()`
   - If not found or ownership mismatch → throw `CollectionNotFoundError`

2. **Verify Recipe Exists**
   - Query: `.from("recipes").select("id").eq("id", recipeId).single()`
   - If not found → throw `RecipeNotFoundError`

3. **Check for Duplicate**
   - Query: `.from("collection_recipes").select("recipe_id").eq("collection_id", collectionId).eq("recipe_id", recipeId).maybeSingle()`
   - If exists → throw `RecipeAlreadyInCollectionError`

4. **Insert Recipe into Collection**
   - Insert: `.from("collection_recipes").insert({ collection_id: collectionId, recipe_id: recipeId }).select("collection_id, recipe_id, added_at").single()`

5. **Return Result**
   - Map database response to camelCase format
   - Return: `{ collectionId, recipeId, createdAt }`

### Database Tables Involved

**Primary Table**: `collection_recipes`
- `collection_id` (UUID, FK to collections.id, CASCADE on delete)
- `recipe_id` (UUID, FK to recipes.id, CASCADE on delete)
- `added_at` (timestamp, default: now())
- Unique constraint: `(collection_id, recipe_id)` - prevents duplicates

**Referenced Tables**:
- `collections` - Verified for existence and ownership
- `recipes` - Verified for existence

## 6. Security Considerations

### Authentication
- **Development**: Mock userId `a85d6d6c-b7d4-4605-9cc4-3743401b67a0`
- **Production**: Use `context.locals.supabase.auth.getUser()` to verify authentication
- Return 401 if not authenticated

### Authorization
- Verify collection ownership before allowing recipe addition
- Use anti-enumeration pattern: don't reveal if collection exists when user doesn't own it
- Both "collection doesn't exist" and "user doesn't own collection" return same 404 response

### Data Validation
- **UUID Validation**: All IDs must be valid UUIDs
- **Foreign Key Integrity**: Verify both collection and recipe exist before insertion
- **Duplicate Prevention**: Check for existing recipe in collection before insertion

### Anti-Enumeration Pattern
```typescript
// Single query combining existence and ownership checks
const { data: collection, error } = await supabase
  .from("collections")
  .select("id, user_id")
  .eq("id", collectionId)
  .eq("user_id", userId)  // Combined with existence check
  .single();

// Don't reveal whether collection exists or user doesn't own it
if (!collection || error) {
  throw new CollectionNotFoundError(collectionId);
}
```

### Input Sanitization
- All inputs validated through Zod schemas
- UUIDs validated for correct format
- Request body parsed with try-catch for JSON errors

## 7. Error Handling

### Error Handling Strategy
1. **Early returns for validation errors** (guard clauses)
2. **Specific error classes** for business logic errors
3. **Proper logging** with appropriate log levels
4. **User-friendly messages** without exposing internal details

### Error Mapping

| Error Type | Status Code | Log Level | Response Message |
|------------|-------------|-----------|------------------|
| Invalid JSON | 400 | - | "Invalid JSON in request body" |
| Invalid UUID (collectionId) | 400 | - | "Invalid collection ID format" |
| Invalid UUID (recipeId) | 400 | - | "Invalid recipe ID format" |
| Not Authenticated | 401 | - | "Authentication required" |
| CollectionNotFoundError | 404 | info | "Collection not found" |
| CollectionForbiddenError | 403 | info | "You don't have permission to modify this collection" |
| RecipeNotFoundError | 404 | info | "Recipe not found" |
| RecipeAlreadyInCollectionError | 409 | info | "Recipe already exists in this collection" |
| Database Error | 500 | error | "Failed to add recipe to collection" |
| Unexpected Error | 500 | error | "Failed to add recipe to collection" |

### Logging Format
```typescript
// Info level for business logic errors
console.info("[POST /api/collections/{collectionId}/recipes] Recipe not found:", {
  userId,
  collectionId,
  recipeId,
  error: error.message,
});

// Error level for unexpected errors
console.error("[POST /api/collections/{collectionId}/recipes] Error:", {
  userId,
  collectionId,
  recipeId,
  error: error instanceof Error ? error.message : "Unknown error",
  stack: error instanceof Error ? error.stack : undefined,
});
```

## 8. Performance Considerations

### Database Queries
- **Total Queries**: 4 (in worst case when all validations pass)
  1. Collection ownership verification (1 query)
  2. Recipe existence check (1 query)
  3. Duplicate check (1 query)
  4. Insert operation (1 query)

### Optimization Opportunities
- **Database Indexes**: Ensure indexes exist on:
  - `collections(id, user_id)` - for ownership verification
  - `recipes(id)` - for recipe existence check
  - `collection_recipes(collection_id, recipe_id)` - unique constraint serves as index

### Potential Bottlenecks
- Multiple sequential database queries (unavoidable for proper validation)
- Network latency for each database round trip

### Mitigation Strategies
- Keep queries simple and indexed
- Use `.single()` and `.maybeSingle()` for optimized queries
- Leverage database constraints (unique, foreign keys) as last line of defense
- Consider future optimization: use database function to combine validation logic (if performance becomes issue)

## 9. Implementation Steps

### Step 1: Add Custom Error Classes to collection.service.ts
Location: `src/lib/services/collection.service.ts`

Add two new error classes after existing error classes:
```typescript
/**
 * Error thrown when recipe is not found
 */
export class RecipeNotFoundError extends Error {
  constructor(recipeId: string) {
    super(`Recipe not found: ${recipeId}`);
    this.name = "RecipeNotFoundError";
  }
}

/**
 * Error thrown when recipe already exists in collection
 */
export class RecipeAlreadyInCollectionError extends Error {
  constructor(collectionId: string, recipeId: string) {
    super(`Recipe ${recipeId} already exists in collection ${collectionId}`);
    this.name = "RecipeAlreadyInCollectionError";
  }
}
```

### Step 2: Create Service Function in collection.service.ts
Location: `src/lib/services/collection.service.ts`

Add new function before helper functions section:
```typescript
/**
 * Add a recipe to a collection
 * @param supabase - Supabase client instance from context.locals
 * @param userId - ID of the authenticated user
 * @param collectionId - ID of the collection
 * @param command - AddRecipeToCollectionCommand with recipeId
 * @returns Object with collectionId, recipeId, and createdAt
 * @throws CollectionNotFoundError if collection not found or user is not authorized
 * @throws RecipeNotFoundError if recipe doesn't exist
 * @throws RecipeAlreadyInCollectionError if recipe already in collection
 * @throws Error if database query fails
 */
export async function addRecipeToCollection(
  supabase: SupabaseClient,
  userId: string,
  collectionId: string,
  command: AddRecipeToCollectionCommand
): Promise<{
  collectionId: string;
  recipeId: string;
  createdAt: string;
}> {
  // STEP 1: VERIFY COLLECTION OWNERSHIP (anti-enumeration)
  // STEP 2: VERIFY RECIPE EXISTS
  // STEP 3: CHECK FOR DUPLICATE
  // STEP 4: INSERT INTO COLLECTION_RECIPES
  // STEP 5: RETURN RESULT
}
```

### Step 3: Create API Route File
Location: `src/pages/api/collections/[collectionId]/recipes.ts`

Create new directory and file with:
1. Import statements (APIRoute, z, service functions, error classes)
2. `export const prerender = false;`
3. Zod validation schemas
4. POST handler with:
   - Mock authentication
   - Path parameter validation
   - Request body parsing and validation
   - Service function call
   - Error handling for all custom errors
   - Success response (201)

### Step 4: Update Service Exports
Location: `src/lib/services/collection.service.ts`

Ensure new function and error classes are exported.

### Step 5: Manual Testing Checklist
After implementation, test:
- [ ] Success case: Add recipe to collection (201)
- [ ] Invalid collection ID format (400)
- [ ] Invalid recipe ID format (400)
- [ ] Invalid JSON body (400)
- [ ] Collection not found (404)
- [ ] Collection owned by different user (404 - anti-enumeration)
- [ ] Recipe not found (404)
- [ ] Recipe already in collection (409)
- [ ] Database error handling (500)

### Step 6: Integration Points
Files to modify/create:
1. `src/lib/services/collection.service.ts` - Add error classes and service function
2. `src/pages/api/collections/[collectionId]/recipes.ts` - Create new API route file

Dependencies:
- Existing types from `src/types.ts`
- Existing Supabase client type from `src/db/supabase.client.ts`
- Zod for validation

## 10. Summary

This implementation plan provides a comprehensive guide for implementing the POST /api/collections/{collectionId}/recipes endpoint. The implementation follows established patterns in the codebase, maintains security through anti-enumeration and proper authorization, and provides clear error handling with appropriate status codes.
