# API Endpoint Implementation Plan: POST /api/favorites

## 1. Endpoint Overview

**Endpoint:** `POST /api/favorites`

**Purpose:** Allow authenticated users to add recipes to their personal favorites collection. This endpoint validates that the recipe exists and is accessible to the user (either public or owned by the user) before creating the favorite relationship.

**Key Behaviors:**
- Creates a favorite relationship between the authenticated user and a recipe
- Validates recipe accessibility based on ownership and public visibility
- Prevents duplicate favorites through composite primary key constraint
- Returns 201 Created on success with the favorite metadata

## 2. Request Details

- **HTTP Method:** POST
- **URL Structure:** `/api/favorites`
- **Content-Type:** `application/json`
- **Authentication:** Required (mocked for development with userId `a85d6d6c-b7d4-4605-9cc4-3743401b67a0`)

### Request Body

```json
{
  "recipeId": "uuid"
}
```

### Parameters

**Required:**
- `recipeId` (string, UUID): The ID of the recipe to add to favorites

**Optional:**
- None

### Validation Rules

- `recipeId`: Required, must be a valid UUID format
- Request body must be valid JSON

## 3. Used Types

### Command Model (Request)

**Location:** `src/types.ts:524-526`

```typescript
export interface AddFavoriteCommand {
  recipeId: string;
}
```

### Response Type

```typescript
{
  success: boolean;
  favorite: {
    recipeId: string;
    createdAt: string; // ISO 8601 timestamp
  }
}
```

Note: The response uses a simplified favorite object, not the full `FavoriteDTO` which includes embedded recipe details (used in GET requests).

### Zod Validation Schema

**Location:** To be created in `src/pages/api/favorites.ts`

```typescript
const AddFavoriteSchema = z.object({
  recipeId: z.string().uuid("Invalid recipe ID format")
});
```

### Service Function Signature

**Location:** To be created in `src/lib/services/favorite.service.ts`

```typescript
export async function addRecipeToFavorites(
  supabase: SupabaseClient,
  userId: string,
  recipeId: string
): Promise<{ recipeId: string; createdAt: string }>
```

### Custom Error Classes

**Location:** To be created in `src/lib/services/favorite.service.ts`

```typescript
export class RecipeNotFoundError extends Error {
  constructor(recipeId: string) {
    super(`Recipe not found: ${recipeId}`);
    this.name = "RecipeNotFoundError";
  }
}

export class RecipeNotAccessibleError extends Error {
  constructor(recipeId: string) {
    super(`Recipe not accessible: ${recipeId}`);
    this.name = "RecipeNotAccessibleError";
  }
}

export class RecipeAlreadyFavoritedError extends Error {
  constructor(recipeId: string) {
    super(`Recipe already favorited: ${recipeId}`);
    this.name = "RecipeAlreadyFavoritedError";
  }
}
```

## 4. Response Details

### Success Response (201 Created)

```json
{
  "success": true,
  "favorite": {
    "recipeId": "123e4567-e89b-12d3-a456-426614174000",
    "createdAt": "2025-10-11T12:00:00Z"
  }
}
```

### Error Responses

#### 400 Bad Request
```json
{
  "error": "Bad Request",
  "message": "Invalid recipe ID format"
}
```

Triggered by:
- Invalid JSON in request body
- Missing recipeId field
- Invalid UUID format

#### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

Triggered by:
- Missing or invalid authentication (currently mocked for development)

#### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "Cannot favorite private recipes from other users"
}
```

Triggered by:
- Recipe is private (is_public = false) and belongs to another user

#### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Recipe not found"
}
```

Triggered by:
- Recipe ID doesn't exist in the database

#### 409 Conflict
```json
{
  "error": "Conflict",
  "message": "Recipe already in favorites"
}
```

Triggered by:
- Recipe is already in the user's favorites list

#### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

Triggered by:
- Database errors
- Unexpected exceptions

## 5. Data Flow

### High-Level Flow

1. **Request Reception**: API route receives POST request with recipe ID
2. **Authentication**: Verify user is authenticated (mocked for development)
3. **Input Validation**: Validate request body using Zod schema
4. **Service Call**: Invoke `addRecipeToFavorites` service function
5. **Business Logic**: Service performs multi-step validation and insertion
6. **Response**: Return 201 with favorite metadata or appropriate error

### Detailed Service Logic Flow

**Function:** `addRecipeToFavorites(supabase, userId, recipeId)`

```
┌─────────────────────────────────────┐
│ 1. Check Recipe Exists              │
│    Query: recipes table by ID       │
│    Failure → RecipeNotFoundError    │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 2. Check Recipe Accessibility       │
│    Condition: is_public = true OR   │
│               user_id = userId      │
│    Failure → RecipeNotAccessibleErr │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 3. Check Not Already Favorited      │
│    Query: favorites table           │
│    Exists → RecipeAlreadyFavoritedErr│
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 4. Insert Favorite Record           │
│    Table: favorites                 │
│    Data: (user_id, recipe_id)       │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 5. Return Created Favorite Metadata │
│    Return: { recipeId, createdAt }  │
└─────────────────────────────────────┘
```

### Database Interactions

**Query 1: Verify Recipe Exists and Check Accessibility**
```typescript
const { data: recipe, error } = await supabase
  .from("recipes")
  .select("id, user_id, is_public")
  .eq("id", recipeId)
  .single();
```

**Query 2: Check if Already Favorited**
```typescript
const { data: existing, error } = await supabase
  .from("favorites")
  .select("user_id, recipe_id")
  .eq("user_id", userId)
  .eq("recipe_id", recipeId)
  .single();
```

**Query 3: Insert Favorite**
```typescript
const { data, error } = await supabase
  .from("favorites")
  .insert({
    user_id: userId,
    recipe_id: recipeId
  })
  .select("recipe_id, created_at")
  .single();
```

### Table Relationships

```
┌──────────────────┐       ┌──────────────────┐
│   profiles       │       │   recipes        │
│  (user_id PK)    │       │   (id PK)        │
└────────┬─────────┘       └────────┬─────────┘
         │                          │
         │                          │
         └──────┐          ┌────────┘
                │          │
         ┌──────▼──────────▼─────┐
         │    favorites          │
         │ PK: (user_id,         │
         │      recipe_id)       │
         │ CASCADE DELETE        │
         └───────────────────────┘
```

## 6. Security Considerations

### Authentication

**Development:**
- Using mocked userId: `a85d6d6c-b7d4-4605-9cc4-3743401b67a0`
- Authentication check commented out

**Production:**
- Uncomment Supabase auth check: `context.locals.supabase.auth.getUser()`
- Return 401 if authentication fails
- Extract userId from authenticated user session

### Authorization

**Recipe Accessibility Rules:**
1. User can favorite their own recipes (regardless of public status)
2. User can favorite public recipes (is_public = true)
3. User CANNOT favorite private recipes owned by other users

**Implementation:**
```typescript
// Recipe is accessible if:
const isAccessible = recipe.is_public || recipe.user_id === userId;
if (!isAccessible) {
  throw new RecipeNotAccessibleError(recipeId);
}
```

### Input Validation

**Layer 1: JSON Parsing**
- Validate request body is valid JSON
- Return 400 if parsing fails

**Layer 2: Schema Validation**
- Validate recipeId is present and valid UUID using Zod
- Return 400 with specific error message if validation fails

**Layer 3: Business Logic Validation**
- Verify recipe exists in database
- Verify recipe is accessible to user
- Verify recipe not already favorited

### SQL Injection Prevention

- All database queries use Supabase client with parameterized queries
- UUID validation via Zod prevents malicious input
- No raw SQL or string concatenation used

### IDOR (Insecure Direct Object Reference) Prevention

- Authorization check prevents favoriting inaccessible private recipes
- User can only create favorites for themselves (userId from auth session)
- Cannot favorite on behalf of other users

### Data Integrity

**Database Constraints:**
- Composite primary key (user_id, recipe_id) prevents duplicate favorites
- Foreign key on recipe_id ensures recipe exists (CASCADE DELETE)
- Foreign key on user_id ensures user profile exists (CASCADE DELETE)
- NOT NULL constraints on both columns

**Application-Level Checks:**
- Explicit recipe existence check
- Explicit duplicate check for better error messaging

### Row Level Security (RLS)

**Favorites Table Policies:**
- Users can only INSERT favorites for themselves
- RLS enforced at database level using `auth.uid()`
- Additional application-level checks for defense in depth

## 7. Error Handling

### Error Handling Strategy

**Pattern:** Early returns with guard clauses
- Handle errors at the beginning of functions
- Use early returns for error conditions
- Place happy path last for improved readability
- Avoid unnecessary else statements

### Error Mapping

| Service Error | HTTP Status | Response Message |
|---------------|-------------|------------------|
| `RecipeNotFoundError` | 404 | "Recipe not found" |
| `RecipeNotAccessibleError` | 403 | "Cannot favorite private recipes from other users" |
| `RecipeAlreadyFavoritedError` | 409 | "Recipe already in favorites" |
| JSON parsing error | 400 | "Invalid JSON in request body" |
| Zod validation error | 400 | Zod error message (e.g., "Invalid recipe ID format") |
| Database error | 500 | "An unexpected error occurred" |
| Unknown error | 500 | "An unexpected error occurred" |

### Error Logging

**Info Level (Expected Business Logic Errors):**
```typescript
console.info("[POST /api/favorites] Conflict:", {
  userId,
  recipeId,
  error: error.message
});
```

Use for:
- 409 Conflict (duplicate favorite attempts)

**Error Level (Unexpected Errors):**
```typescript
console.error("[POST /api/favorites] Error:", {
  userId,
  recipeId,
  error: error instanceof Error ? error.message : "Unknown error",
  stack: error instanceof Error ? error.stack : undefined
});
```

Use for:
- Database errors
- 500 Internal Server Error
- Unexpected exceptions

### API Route Error Handling Structure

```typescript
export const POST: APIRoute = async (context) => {
  // 1. Authentication check (early return if fails)

  try {
    // 2. Request body parsing (early return if fails)

    try {
      // 3. Zod validation (early return if fails)
    } catch (error) {
      // Handle Zod errors → 400
    }

    // 4. Service call
    const favorite = await addRecipeToFavorites(...);

    // 5. Success response → 201

  } catch (error) {
    // 6. Handle service errors
    if (error instanceof RecipeNotFoundError) {
      // → 404
    }
    if (error instanceof RecipeNotAccessibleError) {
      // → 403
    }
    if (error instanceof RecipeAlreadyFavoritedError) {
      // → 409
    }

    // 7. Generic error → 500
  }
};
```

## 8. Performance Considerations

### Database Query Optimization

**Current Approach: 3 Sequential Queries**
1. Check recipe exists and accessibility (1 query)
2. Check if already favorited (1 query)
3. Insert favorite (1 query)

**Optimization Opportunities:**

**Option 1: Combine Queries 1 & 2**
- Use a single query with LEFT JOIN to check both recipe existence/accessibility and existing favorite
- Reduces round trips from 3 to 2

**Option 2: Optimistic Insert**
- Attempt insert directly
- Handle constraints violations (UNIQUE, FOREIGN KEY) and map to appropriate errors
- Best case: 1 query (insert succeeds)
- Worst case: 2 queries (insert fails, query for specific error reason)
- Trade-off: Less clear error messages, requires error code parsing

**Recommendation for Initial Implementation:**
- Use 3 sequential queries for clarity and explicit error handling
- Optimize later if performance metrics indicate need

### Indexing

**Existing Indexes:**
- Primary key on favorites (user_id, recipe_id) - automatically indexed
- Primary key on recipes (id) - automatically indexed
- Foreign key on recipes (user_id) - should be indexed

**Query Analysis:**
- Query 1: Uses recipes.id (indexed via PK) ✓
- Query 2: Uses favorites (user_id, recipe_id) (indexed via composite PK) ✓
- Query 3: Insert operation ✓

**Conclusion:** No additional indexes needed.

### Expected Performance

**Estimated Query Times:**
- Recipe lookup: ~5ms (indexed PK lookup)
- Favorite check: ~5ms (indexed composite PK lookup)
- Insert: ~10ms (write operation)
- **Total: ~20ms** (excluding network latency)

**Bottlenecks:**
- Network latency to Supabase (if hosted remotely)
- Write performance on favorites table (unlikely with low volume)

**Monitoring Metrics:**
- P50, P95, P99 latency
- Error rate by status code
- Favorites created per minute
- Database connection pool utilization

## 9. Implementation Steps

### Step 1: Create Custom Error Classes
**File:** `src/lib/services/favorite.service.ts`

Add three custom error classes:
- `RecipeNotFoundError`
- `RecipeNotAccessibleError`
- `RecipeAlreadyFavoritedError`

Follow the pattern from `allergen.service.ts:8-36` for error class structure.

### Step 2: Implement Service Function
**File:** `src/lib/services/favorite.service.ts`

Create `addRecipeToFavorites` function:

**Inputs:**
- `supabase: SupabaseClient`
- `userId: string`
- `recipeId: string`

**Logic:**
1. Query recipe by ID, select: id, user_id, is_public
2. Check if recipe exists (throw `RecipeNotFoundError` if not)
3. Check accessibility: `is_public || user_id === userId`
4. Throw `RecipeNotAccessibleError` if not accessible
5. Query favorites table for existing entry
6. Throw `RecipeAlreadyFavoritedError` if exists
7. Insert into favorites table
8. Return `{ recipeId, createdAt }` (snake_case to camelCase conversion)

**Returns:** `Promise<{ recipeId: string; createdAt: string }>`

**Error Handling:**
- Wrap Supabase errors and throw with context
- Use explicit error handling for PGRST116 (not found)

### Step 3: Create Zod Validation Schema
**File:** `src/pages/api/favorites.ts`

Add validation schema after imports, before route handlers:

```typescript
const AddFavoriteSchema = z.object({
  recipeId: z.string().uuid("Invalid recipe ID format")
});
```

Follow the pattern from `src/pages/api/profile/allergens.ts:17-19`.

### Step 4: Implement POST Handler
**File:** `src/pages/api/favorites.ts`

Add POST handler export after the existing GET handler.

**Structure:**
1. **Authentication Section**
   - Use mocked auth from `.ai/claude_rules/auth_dev_mock.md`
   - Copy pattern from `src/pages/api/profile/allergens.ts:100-122`

2. **Request Body Parsing**
   - Try to parse JSON from `context.request.json()`
   - Return 400 with "Invalid JSON in request body" if fails
   - Follow pattern from `allergens.ts:129-143`

3. **Zod Validation**
   - Validate body against `AddFavoriteSchema`
   - Catch `ZodError` and return 400 with error message
   - Follow pattern from `allergens.ts:145-163`

4. **Service Call**
   - Call `addRecipeToFavorites(context.locals.supabase, userId, validatedData.recipeId)`
   - Wrap in try-catch for error handling

5. **Success Response**
   - Return 201 with `{ success: true, favorite: { recipeId, createdAt } }`
   - Set `Content-Type: application/json` header

6. **Error Handling**
   - Catch `RecipeNotFoundError` → 404
   - Catch `RecipeNotAccessibleError` → 403
   - Catch `RecipeAlreadyFavoritedError` → 409 (log at info level)
   - Catch all others → 500
   - Log all errors with context (userId, recipeId)
   - Follow pattern from `allergens.ts:182-232`

### Step 5: Add JSDoc Comments

Add comprehensive JSDoc comment above POST handler:

```typescript
/**
 * POST /api/favorites
 * Adds a recipe to the authenticated user's favorites list
 *
 * Request body: { recipeId: string (UUID) }
 *
 * Returns:
 * - 201: Successfully added to favorites with metadata
 * - 400: Bad Request (invalid ID format, invalid JSON)
 * - 401: Unauthorized (authentication required)
 * - 403: Forbidden (recipe is private and belongs to another user)
 * - 404: Not Found (recipe not found)
 * - 409: Conflict (recipe already in favorites)
 * - 500: Internal server error
 */
```

### Step 6: Export Error Classes from Service

**File:** `src/lib/services/favorite.service.ts`

Ensure all error classes are exported so they can be imported in the API route:

```typescript
export {
  RecipeNotFoundError,
  RecipeNotAccessibleError,
  RecipeAlreadyFavoritedError
};
```

### Step 7: Update API Route Imports

**File:** `src/pages/api/favorites.ts`

Add import for service function and error classes:

```typescript
import {
  getUserFavorites,
  addRecipeToFavorites,
  RecipeNotFoundError,
  RecipeNotAccessibleError,
  RecipeAlreadyFavoritedError
} from "../../lib/services/favorite.service";
```

### Step 8: Manual Testing

Test all scenarios using curl or API client:

**Test 1: Successful favorite creation (201)**
```bash
curl -X POST http://localhost:3000/api/favorites \
  -H "Content-Type: application/json" \
  -d '{"recipeId": "valid-public-recipe-uuid"}'
```

**Test 2: Invalid UUID format (400)**
```bash
curl -X POST http://localhost:3000/api/favorites \
  -H "Content-Type: application/json" \
  -d '{"recipeId": "not-a-uuid"}'
```

**Test 3: Recipe not found (404)**
```bash
curl -X POST http://localhost:3000/api/favorites \
  -H "Content-Type: application/json" \
  -d '{"recipeId": "123e4567-e89b-12d3-a456-426614174000"}'
```

**Test 4: Private recipe from another user (403)**
```bash
curl -X POST http://localhost:3000/api/favorites \
  -H "Content-Type: application/json" \
  -d '{"recipeId": "private-recipe-from-another-user-uuid"}'
```

**Test 5: Duplicate favorite (409)**
```bash
# Run same request twice
curl -X POST http://localhost:3000/api/favorites \
  -H "Content-Type: application/json" \
  -d '{"recipeId": "valid-public-recipe-uuid"}'
```

**Test 6: Invalid JSON (400)**
```bash
curl -X POST http://localhost:3000/api/favorites \
  -H "Content-Type: application/json" \
  -d '{invalid json}'
```

### Step 9: Verify with GET Endpoint

After adding favorites via POST, verify they appear in GET /api/favorites:

```bash
curl http://localhost:3000/api/favorites
```

Confirm the newly added favorite is in the response list.

### Step 10: Code Review Checklist

- [ ] Service function has proper TypeScript types
- [ ] All error classes extend Error and set name property
- [ ] Zod schema validates UUID format
- [ ] POST handler follows established patterns from codebase
- [ ] Error handling uses early returns and guard clauses
- [ ] Success response returns 201 (not 200)
- [ ] All errors have appropriate status codes
- [ ] Error logging includes context (userId, recipeId)
- [ ] Authentication uses mocked userId for development
- [ ] JSDoc comments are comprehensive
- [ ] No console.log statements (use console.error/console.info)
- [ ] camelCase for TypeScript, snake_case for database operations
- [ ] Response uses `Content-Type: application/json` header

---

## Summary

This implementation plan provides a comprehensive guide for implementing the POST /api/favorites endpoint. The plan follows the established patterns in the codebase, particularly mirroring the structure from `POST /api/profile/allergens`.

**Key Implementation Points:**
1. Create 3 custom error classes for specific business logic errors
2. Implement service function with 3-step validation (exists, accessible, not duplicate)
3. Add POST handler with proper authentication, validation, and error handling
4. Use Zod for input validation with UUID format checking
5. Return 201 Created with simplified favorite metadata
6. Handle 5 distinct error scenarios (400, 403, 404, 409, 500)
7. Follow guard clause pattern with early returns
8. Log errors with appropriate context and severity level
