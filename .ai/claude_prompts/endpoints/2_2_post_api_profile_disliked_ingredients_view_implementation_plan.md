# API Endpoint Implementation Plan: POST /api/profile/disliked-ingredients

## 1. Endpoint Overview

This endpoint allows authenticated users to add ingredients they dislike to their profile. The disliked ingredients list is used to personalize recipe recommendations and modifications. The endpoint validates the ingredient name, checks for duplicates, and stores the preference in the `user_disliked_ingredients` table.

## 2. Request Details

- **HTTP Method**: POST
- **URL Structure**: `/api/profile/disliked-ingredients`
- **Authentication**: Required (Supabase session via `context.locals.supabase.auth.getUser()`) - currently mocked for development
- **Parameters**: None (user ID extracted from session)
- **Request Body**:
  ```json
  {
    "ingredientName": "cebula"
  }
  ```

### Request Body Schema
- `ingredientName`: string, required
  - Min length: 1 character (after trimming)
  - Max length: 100 characters
  - Automatically trimmed of leading/trailing whitespace
  - Case-sensitive storage (but should check duplicates case-insensitively)

## 3. Used Types

### From `src/types.ts`:
- **DislikedIngredientDTO** (lines 48-52): Response DTO
  ```typescript
  interface DislikedIngredientDTO {
    id: string;
    ingredientName: string;
    createdAt: string;
  }
  ```

- **AddDislikedIngredientCommand** (lines 481-483): Request payload type
  ```typescript
  interface AddDislikedIngredientCommand {
    ingredientName: string;
  }
  ```

### New Zod Schema Required:
```typescript
const AddDislikedIngredientSchema = z.object({
  ingredientName: z
    .string()
    .trim()
    .min(1, "Ingredient name cannot be empty")
    .max(100, "Ingredient name cannot exceed 100 characters"),
});
```

### Database Types:
- `DbDislikedIngredientInsert` (src/types.ts:596) - for insert operations
- `user_disliked_ingredients` table columns: `id`, `user_id`, `ingredient_name`, `created_at`

## 4. Response Details

### Success Response (201 Created)
```json
{
  "success": true,
  "dislikedIngredient": {
    "id": "uuid-string",
    "ingredientName": "cebula",
    "createdAt": "2025-10-11T12:00:00Z"
  }
}
```

### Error Responses

**400 Bad Request** - Invalid input
```json
{
  "error": "Bad Request",
  "message": "Ingredient name cannot be empty"
}
```

**401 Unauthorized** - Not authenticated
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

**409 Conflict** - Duplicate ingredient
```json
{
  "error": "Conflict",
  "message": "Ingredient already in disliked list"
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

1. **Request Reception**: Astro API route receives POST request
2. **Authentication**: Verify user session via `context.locals.supabase.auth.getUser()` (currently mocked with userId: `c4afdcfc-d36b-4f19-b62d-0de187151b87`)
3. **JSON Parsing**: Parse request body, handle parse errors
4. **Validation**: Validate with Zod schema (trim, length checks)
5. **Service Layer Call**: Call `addDislikedIngredientToUser(supabase, userId, ingredientName)`
6. **Service Layer Operations**:
   - Check if ingredient already exists for user (case-insensitive)
   - If exists: throw `IngredientAlreadyExistsError`
   - Insert into `user_disliked_ingredients` table
   - Fetch and return newly created record
7. **Response Mapping**: Map database record to `DislikedIngredientDTO`
8. **Response Return**: Return 201 with success payload

### Database Interaction
- **Table**: `user_disliked_ingredients`
- **Relationship**: User → Disliked Ingredients (1:M)
- **Foreign Key**: `user_id` → `profiles.user_id` (CASCADE on delete)
- **Insert Query**: `INSERT INTO user_disliked_ingredients (user_id, ingredient_name)`
- **Duplicate Check Query**: Uses Supabase `.ilike()` for case-insensitive matching

## 6. Security Considerations

### Authentication & Authorization
- Verify user session before processing request
- Use `context.locals.supabase` (not direct imports) - per `.ai/claude_rules/backend.md:6`
- Users can only add ingredients to their own profile
- User ID from session, not from request body
- **Current**: Mocked authentication with TODO comments for production

### Input Validation
- Trim whitespace to prevent spacing attacks
- Limit length to 100 characters (DoS prevention)
- Validate string type (prevent type confusion)
- Sanitize input through Zod validation

### Data Security
- Use Supabase parameterized queries (SQL injection prevention)
- No user-provided table/column names
- Store ingredient names as-is (preserve user intent)
- Case-insensitive duplicate checking prevents variations

### Rate Limiting
- Consider adding rate limiting at API gateway level
- Not implemented at endpoint level (future enhancement)

## 7. Error Handling

### Error Handling Flow
Following the guard clause pattern (`.ai/claude_rules/shared.md:38-39`):

1. **Authentication Errors** (401) - Currently commented for development
   - Missing session
   - Invalid/expired token
   - Early return with 401 response

2. **JSON Parse Errors** (400)
   - Malformed JSON
   - Content-Type mismatch
   - Early return with descriptive message

3. **Validation Errors** (400)
   - Empty ingredient name (after trim)
   - Exceeds 100 characters
   - Wrong data type
   - Return Zod error message

4. **Business Logic Errors** (409)
   - `IngredientAlreadyExistsError`: ingredient already in user's list
   - Log at `console.info` level
   - Return 409 Conflict

5. **Database Errors** (500)
   - Connection failures
   - Constraint violations (unexpected)
   - Log with `console.error` including stack trace
   - Return generic 500 error

### Error Logging Pattern
```typescript
// For business logic errors
console.info("[POST /api/profile/disliked-ingredients] Duplicate ingredient:", {
  userId,
  ingredientName,
  error: error.message,
});

// For unexpected errors
console.error("[POST /api/profile/disliked-ingredients] Error:", {
  error: error instanceof Error ? error.message : "Unknown error",
  stack: error instanceof Error ? error.stack : undefined,
});
```

## 8. Performance Considerations

### Database Queries
- Single duplicate check query (using `.ilike()` for case-insensitive)
- Single insert operation with `.select()` to get inserted record
- Total: 2 queries per request (optimized with `.insert().select()`)

### Optimization Opportunities
- Database index on `user_id` (already exists via foreign key)
- Consider adding GIN index on `LOWER(ingredient_name)` for faster case-insensitive lookups
- Consider caching user's disliked ingredients list for read-heavy operations

### Scalability
- Stateless endpoint design
- No in-memory state
- Horizontal scaling friendly
- Database connection pooling via Supabase

## 9. Implementation Steps

### Step 1: Extend Disliked Ingredient Service
**File**: `src/lib/services/disliked-ingredient.service.ts`

1. **Create custom error class**:
   ```typescript
   export class IngredientAlreadyExistsError extends Error {
     constructor(ingredientName: string) {
       super(`Ingredient already in disliked list: ${ingredientName}`);
       this.name = "IngredientAlreadyExistsError";
     }
   }
   ```

2. **Create helper function** `checkUserHasIngredient()`:
   ```typescript
   async function checkUserHasIngredient(
     supabase: SupabaseClient,
     userId: string,
     ingredientName: string
   ): Promise<boolean> {
     const { data, error } = await supabase
       .from("user_disliked_ingredients")
       .select("id")
       .eq("user_id", userId)
       .ilike("ingredient_name", ingredientName)
       .single();

     if (error) {
       if (error.code === "PGRST116") {
         return false;
       }
       throw error;
     }

     return data !== null;
   }
   ```

3. **Implement** `addDislikedIngredientToUser()`:
   ```typescript
   export async function addDislikedIngredientToUser(
     supabase: SupabaseClient,
     userId: string,
     ingredientName: string
   ): Promise<DislikedIngredientDTO> {
     const trimmedName = ingredientName.trim();

     // Check if ingredient already exists (case-insensitive)
     const userHasIngredient = await checkUserHasIngredient(supabase, userId, trimmedName);
     if (userHasIngredient) {
       throw new IngredientAlreadyExistsError(trimmedName);
     }

     // Insert and return in one operation
     const { data, error } = await supabase
       .from("user_disliked_ingredients")
       .insert({
         user_id: userId,
         ingredient_name: trimmedName,
       })
       .select("id, ingredient_name, created_at")
       .single();

     if (error) {
       throw error;
     }

     if (!data) {
       throw new Error("Failed to add disliked ingredient");
     }

     return mapToDTO(data);
   }
   ```

4. **Mapper function** (already exists in the service):
   - Use existing `mapToDTO()` function
   - Converts snake_case to camelCase

### Step 2: Create API Endpoint
**File**: `src/pages/api/profile/disliked-ingredients.ts`

1. **Add required imports**:
   ```typescript
   import type { APIRoute } from "astro";
   import { z } from "zod";
   import {
     getDislikedIngredientsByUserId,
     addDislikedIngredientToUser,
     IngredientAlreadyExistsError,
   } from "../../../lib/services/disliked-ingredient.service";
   ```

2. **Add** `export const prerender = false` (per `.ai/claude_rules/astro.md:7`)

3. **Create Zod validation schema**:
   ```typescript
   const AddDislikedIngredientSchema = z.object({
     ingredientName: z
       .string()
       .trim()
       .min(1, "Ingredient name cannot be empty")
       .max(100, "Ingredient name cannot exceed 100 characters"),
   });
   ```

4. **Implement POST handler** (following pattern from `src/pages/api/profile/allergens.ts`):
   - **Authentication Section**: Use mocked userId for development
     ```typescript
     // MOCK: Remove this in production
     const userId = "c4afdcfc-d36b-4f19-b62d-0de187151b87";
     ```
   - **JSON Parsing**: Try-catch with 400 error
   - **Validation**: Zod parse with error handling
   - **Service Call**: Call `addDislikedIngredientToUser()`
   - **Success Response**: 201 with `{ success: true, dislikedIngredient }`
   - **Error Handling**:
     - Catch `IngredientAlreadyExistsError` → 409
     - Catch unexpected errors → 500
     - Log appropriately with structured logging

### Step 3: Testing Preparation
**Create test scenarios**:

1. **Success Case**:
   - POST with valid ingredient name: `{ "ingredientName": "cebula" }`
   - Expect 201 with DislikedIngredientDTO

2. **Validation Errors**:
   - Empty string → 400 "Ingredient name cannot be empty"
   - String > 100 chars → 400 "Ingredient name cannot exceed 100 characters"
   - Invalid JSON → 400 "Invalid JSON in request body"
   - Missing field → 400

3. **Duplicate Check**:
   - Add same ingredient twice → 409
   - Add with different case (e.g., "Cebula" vs "cebula") → 409 (case-insensitive)

4. **Authentication** (when enabled):
   - No session → 401

5. **Edge Cases**:
   - Whitespace-only string → 400 (after trim becomes empty)
   - Special characters → 201 (allowed)
   - Unicode characters → 201 (allowed)
   - Leading/trailing spaces → 201 (trimmed automatically)

### Step 4: Documentation
**Update**:
- Add JSDoc comments to all functions
- Document error classes
- Add usage examples in service file
- Update API documentation if exists

### Step 5: Code Review Checklist
- [ ] Follows Astro guidelines (`.ai/claude_rules/astro.md`)
- [ ] Follows backend guidelines (`.ai/claude_rules/backend.md`)
- [ ] Uses `context.locals.supabase` (not direct import)
- [ ] Uses uppercase HTTP method (POST)
- [ ] Guard clauses for error handling
- [ ] Proper error logging with context
- [ ] Zod validation for all inputs
- [ ] Logic extracted to service layer
- [ ] Types from `src/types.ts`
- [ ] Consistent with allergens endpoint pattern (`src/pages/api/profile/allergens.ts`)
- [ ] Uses mocked authentication with TODO comments

---

## Implementation Notes

**Consistency with Existing Code**:
This endpoint follows the established pattern from `POST /api/profile/allergens` (src/pages/api/profile/allergens.ts:100-233) with these key differences:
1. No lookup table (ingredients are free-text, not predefined from `allergens` table)
2. Simpler validation (just string length, no UUID validation)
3. Case-insensitive duplicate checking using `.ilike()` instead of exact match

**Authentication Strategy**:
Currently using mocked authentication following the pattern from existing endpoints:
- Mock userId: `c4afdcfc-d36b-4f19-b62d-0de187151b87`
- TODO comments for production authentication
- Same structure as `src/pages/api/profile/allergens/[id].ts:48-49`

**Estimated Complexity**: Low-Medium (similar to existing allergens endpoint, well-established patterns)

**Dependencies**:
- Existing service: `src/lib/services/disliked-ingredient.service.ts` (needs extension)
- Existing types: `src/types.ts` (already has required DTOs)
- Existing endpoint file: `src/pages/api/profile/disliked-ingredients.ts` (has GET, needs POST)
