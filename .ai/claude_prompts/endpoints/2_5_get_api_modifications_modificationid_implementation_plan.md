# API Endpoint Implementation Plan: GET /api/modifications/{modificationId}

## 1. Endpoint Overview

This endpoint retrieves detailed information about a specific recipe modification, including the modified recipe data and information about the original recipe. It implements proper authentication and authorization to prevent unauthorized access to private recipe modifications.

**Key Features**:

- Returns complete modification details with original recipe context
- Implements IDOR protection via authorization checks
- Supports both public recipes (anyone can view) and private recipes (owner only)
- Returns structured error responses for various failure scenarios

## 2. Request Details

- **HTTP Method**: GET
- **URL Structure**: `/api/modifications/{modificationId}`
- **Parameters**:
  - **Required Path Parameters**:
    - `modificationId` (string, UUID): Unique identifier of the modification to retrieve
  - **Optional**: None
  - **Query Parameters**: None
- **Request Body**: None (GET request)
- **Headers**:
  - Standard authentication headers (handled by middleware)
  - Content-Type: application/json (for response)

## 3. Used Types

### DTOs (Already Defined in `src/types.ts`)

```typescript
// Response DTO
interface ModificationDetailDTO {
  id: string;
  originalRecipeId: string;
  modificationType: string;
  modifiedData: ModificationDataDTO;
  originalRecipe: {
    id: string;
    title: string;
    nutritionPerServing: NutritionDTO;
  };
  createdAt: string;
}

// Nested DTOs
interface ModificationDataDTO {
  ingredients?: RecipeIngredientDTO[];
  steps?: RecipeStepDTO[];
  nutritionPerServing?: NutritionDTO;
  servings?: number;
  modificationNotes?: string;
}

interface NutritionDTO {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  salt: number;
}

interface RecipeIngredientDTO {
  name: string;
  amount: number;
  unit: string;
}

interface RecipeStepDTO {
  stepNumber: number;
  instruction: string;
}
```

### Validation Schemas (New - to be created in endpoint file)

```typescript
// Path parameter validation
const ModificationIdParamSchema = z.object({
  modificationId: z.string().uuid("Modification ID must be a valid UUID"),
});

type ValidatedModificationIdParam = z.infer<typeof ModificationIdParamSchema>;
```

### Database Query Result Type (New - to be created in service)

```typescript
interface ModificationDetailQueryResult {
  id: string;
  original_recipe_id: string;
  user_id: string;
  modification_type: string;
  modified_data: ModificationDataDTO;
  created_at: string;
  recipes: {
    id: string;
    title: string;
    user_id: string;
    is_public: boolean;
    nutrition_per_serving: NutritionDTO;
  };
}
```

## 4. Response Details

### Success Response (200 OK)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "originalRecipeId": "123e4567-e89b-12d3-a456-426614174000",
  "modificationType": "reduce_calories",
  "modifiedData": {
    "ingredients": [
      {
        "name": "ziemniaki",
        "amount": 500,
        "unit": "g"
      }
    ],
    "steps": [
      {
        "stepNumber": 1,
        "instruction": "Obierz i zetrzyj ziemniaki na tarce"
      }
    ],
    "nutritionPerServing": {
      "calories": 250,
      "protein": 8.5,
      "fat": 6.2,
      "carbs": 38.0,
      "fiber": 4.5,
      "salt": 0.8
    },
    "servings": 4,
    "modificationNotes": "Zmniejszono kalorie z 350 do 250 kcal na porcję..."
  },
  "originalRecipe": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "title": "Placki ziemniaczane",
    "nutritionPerServing": {
      "calories": 350,
      "protein": 7.0,
      "fat": 12.0,
      "carbs": 45.0,
      "fiber": 3.5,
      "salt": 1.2
    }
  },
  "createdAt": "2025-10-11T12:00:00Z"
}
```

### Error Responses

**400 Bad Request** - Invalid modificationId format

```json
{
  "error": "Bad Request",
  "message": "Modification ID must be a valid UUID"
}
```

**401 Unauthorized** - Not authenticated (production only)

```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

**403 Forbidden** - Modification belongs to another user and recipe is private

```json
{
  "error": "Forbidden",
  "message": "You don't have permission to view this modification"
}
```

**404 Not Found** - Modification not found

```json
{
  "error": "Not Found",
  "message": "Modification not found"
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

### 5.1 Request Processing Flow

```
1. HTTP Request arrives at /api/modifications/{modificationId}
   ↓
2. Astro extracts modificationId from context.params
   ↓
3. Validate modificationId format using Zod (UUID check)
   └─ Invalid? → Return 400 Bad Request
   ↓
4. Authenticate user (mocked for development)
   └─ Not authenticated? → Return 401 Unauthorized (production)
   ↓
5. Call getModificationById(supabase, modificationId, userId)
   ↓
6. Service queries database with JOIN:
   - FROM recipe_modifications
   - INNER JOIN recipes ON original_recipe_id = recipes.id
   - WHERE modification_id = modificationId
   ↓
7. Check if modification exists
   └─ Not found? → Return 404 Not Found
   ↓
8. Authorization check in service:
   - Is modification.user_id === userId? → Authorized
   - Is recipe.is_public === true? → Authorized
   - Otherwise → Return 403 Forbidden
   ↓
9. Map database result to ModificationDetailDTO
   ↓
10. Return 200 OK with ModificationDetailDTO
```

### 5.2 Database Interaction

**Query Structure** (Supabase query builder):

```typescript
const { data, error } = await supabase
  .from("recipe_modifications")
  .select(
    `
    id,
    original_recipe_id,
    user_id,
    modification_type,
    modified_data,
    created_at,
    recipes:original_recipe_id (
      id,
      title,
      user_id,
      is_public,
      nutrition_per_serving
    )
  `
  )
  .eq("id", modificationId)
  .single();
```

**Tables Involved**:

- `recipe_modifications` (main table)
- `recipes` (joined via original_recipe_id)

**Relationships Used**:

- `recipe_modifications.original_recipe_id` → `recipes.id` (1:M relationship)
- `recipe_modifications.user_id` → `profiles.user_id` (implicit, for authorization)

### 5.3 Authorization Logic

```typescript
// Check if user can access this modification
const isOwner = modification.user_id === userId;
const isPublicRecipe = modification.recipes.is_public;

if (!isOwner && !isPublicRecipe) {
  // User doesn't own modification AND recipe is private
  return null; // Will result in 404 (security best practice)
}

// User is authorized
return modificationDetailDTO;
```

## 6. Security Considerations

### 6.1 Authentication

**Development Mode** (Current):

```typescript
// Mock authentication with hardcoded userId
const userId = "a85d6d6c-b7d4-4605-9cc4-3743401b67a0";
```

**Production Mode** (To be implemented later):

```typescript
const {
  data: { user },
  error: authError,
} = await context.locals.supabase.auth.getUser();
if (authError || !user) {
  return new Response(
    JSON.stringify({
      error: "Unauthorized",
      message: "Authentication required",
    }),
    { status: 401, headers: { "Content-Type": "application/json" } }
  );
}
const userId = user.id;
```

### 6.2 Authorization (IDOR Protection)

**Threat**: Insecure Direct Object Reference - users accessing modifications they shouldn't see

**Protection Strategy**:

1. **Ownership Check**: Verify `modification.user_id === userId`
2. **Public Access Check**: Allow if `recipe.is_public === true`
3. **Fail-Safe**: Return 404 (not 403) when unauthorized to avoid information leakage

**Why 404 instead of 403?**

- Prevents attackers from discovering which modification IDs exist
- Timing-safe: same response whether modification doesn't exist or user lacks access
- Follows security best practice for resource enumeration prevention

### 6.3 Input Validation

**UUID Validation**:

- Use Zod schema to validate UUID format
- Prevents SQL injection (though Supabase uses parameterized queries)
- Provides early failure with clear error messages

**Validation Schema**:

```typescript
const ModificationIdParamSchema = z.object({
  modificationId: z.string().uuid("Modification ID must be a valid UUID"),
});
```

### 6.4 Data Access Control

**Database-Level Security** (Supabase RLS should be configured):

- Row-Level Security policies on `recipe_modifications` table
- Users can only SELECT their own modifications OR modifications of public recipes
- Defense in depth: application-level + database-level authorization

### 6.5 Information Disclosure Prevention

**Protected Information**:

- Private recipe modifications (user_id check)
- Recipe ownership information (filtered in response)
- Internal error details (generic 500 errors)

**Response Filtering**:

- Only return necessary fields in `originalRecipe` object
- Don't expose full recipe details (only id, title, nutrition)
- Don't expose recipe.user_id in response

## 7. Error Handling

### 7.1 Error Handling Strategy

Following the established pattern from existing endpoints:

1. **Early Returns**: Handle errors at the beginning of functions (guard clauses)
2. **Specific Errors First**: Validation errors → 400, Not Found → 404, Authorization → 403
3. **Generic Fallback**: Catch-all 500 error with error logging
4. **User-Friendly Messages**: Clear, actionable error messages
5. **Security-Conscious**: Don't leak internal details in error responses

### 7.2 Error Scenarios

| Error Type           | Condition                  | Status | Error Message                                         | Logged? |
| -------------------- | -------------------------- | ------ | ----------------------------------------------------- | ------- |
| Validation Error     | Invalid UUID format        | 400    | "Modification ID must be a valid UUID"                | No      |
| Authentication Error | No user session (prod)     | 401    | "Authentication required"                             | No      |
| Not Found            | Modification doesn't exist | 404    | "Modification not found"                              | No      |
| Authorization Error  | Private recipe, not owner  | 403    | "You don't have permission to view this modification" | No      |
| Database Error       | Supabase query fails       | 500    | "An unexpected error occurred"                        | Yes     |
| Unexpected Error     | Any unhandled exception    | 500    | "An unexpected error occurred"                        | Yes     |

**Note**: For security, return 404 instead of 403 when modification exists but user lacks access.

### 7.3 Error Logging Format

```typescript
console.error("[GET /api/modifications/[modificationId]] Error:", {
  modificationId: context.params.modificationId,
  userId: user?.id,
  error: error instanceof Error ? error.message : "Unknown error",
  stack: error instanceof Error ? error.stack : undefined,
});
```

**What to Log**:

- Endpoint identifier
- modificationId (from path parameter)
- userId (if authenticated)
- Error message and stack trace

**What NOT to Log**:

- User passwords or tokens
- Full request/response bodies
- Sensitive modification data

### 7.4 Error Response Structure

All error responses follow this consistent structure:

```typescript
{
  error: string; // Error type (e.g., "Bad Request", "Not Found")
  message: string; // User-friendly error description
}
```

## 8. Performance Considerations

### 8.1 Database Query Optimization

**Single Query Approach**:

- Use Supabase JOIN to fetch modification + recipe in one query
- Avoid N+1 query problem
- Reduces database round trips

**Query Performance**:

- UUID primary key lookup: O(log n) with index
- Single row fetch with `.single()`: Fast
- No pagination needed (single item)

**Expected Query Time**: < 50ms for indexed UUID lookup

### 8.2 Indexes Required

Ensure these indexes exist (should be created by migrations):

```sql
-- Primary key on recipe_modifications.id (automatic)
CREATE INDEX idx_recipe_modifications_id ON recipe_modifications(id);

-- Foreign key index for JOIN optimization
CREATE INDEX idx_recipe_modifications_original_recipe_id
  ON recipe_modifications(original_recipe_id);

-- Composite index for authorization queries (optional optimization)
CREATE INDEX idx_recipe_modifications_user_id_id
  ON recipe_modifications(user_id, id);
```

### 8.3 Response Size

**Typical Response Size**: 2-5 KB

- Modification metadata: ~200 bytes
- Modified ingredients (10-20 items): ~1-2 KB
- Modified steps (5-10 steps): ~1-2 KB
- Nutrition data: ~200 bytes
- Original recipe summary: ~300 bytes

**No pagination needed**: Single item endpoint, response size is reasonable

### 8.4 Caching Considerations

**Current Implementation**: No caching (acceptable for MVP)

### 8.5 Potential Bottlenecks

1. **Database Connection Pool**: Shared resource, can be exhausted under high load
   - Mitigation: Supabase handles connection pooling
   - Monitor: Connection pool usage metrics

2. **Large Modified Data**: JSON field can be large for complex recipes
   - Mitigation: Typical recipes are < 5 KB, acceptable
   - Monitor: Response time percentiles (p95, p99)

3. **Concurrent Requests**: Multiple users accessing same modification
   - Mitigation: Database-level locking not needed (read-only)

## 9. Implementation Steps

### Step 1: Create Service Function in `src/lib/services/modification.service.ts`

Add new function to fetch modification by ID with authorization:

```typescript
/**
 * Get modification by ID with original recipe information
 * Implements authorization check - user must own modification OR recipe must be public
 * @param supabase - Supabase client instance from context.locals
 * @param modificationId - UUID of the modification to fetch
 * @param userId - ID of the authenticated user
 * @returns ModificationDetailDTO if found and authorized, null otherwise
 * @throws Error if database query fails
 */
export async function getModificationById(
  supabase: SupabaseClient,
  modificationId: string,
  userId: string
): Promise<ModificationDetailDTO | null>;
```

**Implementation Details**:

1. Query `recipe_modifications` table with JOIN to `recipes`
2. Select fields: id, original_recipe_id, modification_type, modified_data, created_at
3. Join with recipes to get: id, title, user_id, is_public, nutrition_per_serving
4. Use `.eq("id", modificationId).single()` to fetch single modification
5. Check authorization: `isOwner || isPublicRecipe`
6. Map database result to `ModificationDetailDTO`
7. Return DTO or null if not found/unauthorized

### Step 2: Create API Route File `src/pages/api/modifications/[modificationId].ts`

Create new file with route handler structure:

**File Structure**:

```typescript
// 1. Imports
import type { APIRoute } from "astro";
import { z } from "zod";
import { getModificationById } from "../../../lib/services/modification.service";

// 2. Prerender configuration
export const prerender = false;

// 3. Validation schemas
const ModificationIdParamSchema = z.object({
  modificationId: z.string().uuid("Modification ID must be a valid UUID"),
});

// 4. Type definitions
type ValidatedModificationIdParam = z.infer<typeof ModificationIdParamSchema>;

// 5. GET handler
export const GET: APIRoute = async (context) => {
  // Implementation here
};
```

### Step 3: Implement Path Parameter Validation

In the GET handler:

1. Extract modificationId from `context.params`
2. Create raw params object: `{ modificationId: context.params.modificationId }`
3. Validate using Zod schema in try-catch block
4. On validation error (ZodError):
   - Return 400 Bad Request
   - Include first error message from `error.errors[0].message`
5. On unexpected error: re-throw

**Code Section**:

```typescript
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
```

### Step 4: Implement Authentication (Mocked)

Add mocked authentication following the established pattern:

**Code Section**:

```typescript
// ========================================
// AUTHENTICATION (MOCKED FOR DEVELOPMENT)
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
// const userId = user.id;

// MOCK: Remove this in production
const userId = "a85d6d6c-b7d4-4605-9cc4-3743401b67a0";
```

### Step 5: Fetch Modification with Authorization

Call service function to fetch modification:

1. Call `getModificationById(context.locals.supabase, modificationId, userId)`
2. Service handles authorization internally
3. If null returned (not found or unauthorized):
   - Determine if it's 404 (not found) or 403 (unauthorized)
   - For security: return 404 for both cases
4. If modification returned: proceed to response

**Code Section**:

```typescript
// ========================================
// FETCH MODIFICATION WITH AUTHORIZATION
// ========================================

const modification = await getModificationById(context.locals.supabase, validatedParams.modificationId, userId);

if (!modification) {
  return new Response(
    JSON.stringify({
      error: "Not Found",
      message: "Modification not found",
    }),
    { status: 404, headers: { "Content-Type": "application/json" } }
  );
}
```

**Note**: Service returns null for both "not found" and "unauthorized" to prevent information leakage.

### Step 6: Return Success Response

Return 200 OK with modification data:

**Code Section**:

```typescript
// ========================================
// SUCCESS RESPONSE
// ========================================

return new Response(JSON.stringify(modification), {
  status: 200,
  headers: { "Content-Type": "application/json" },
});
```

### Step 7: Implement Error Handling

Wrap entire handler in try-catch for unexpected errors:

**Code Section**:

```typescript
export const GET: APIRoute = async (context) => {
  try {
    // ... all handler logic ...
  } catch (error) {
    // Log error with context
    console.error("[GET /api/modifications/[modificationId]] Error:", {
      modificationId: context.params.modificationId,
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

### Step 8: Testing Checklist

**Manual Testing**:

1. ✅ Valid modification ID (owned by user) → 200 OK with data
2. ✅ Valid modification ID (public recipe) → 200 OK with data
3. ✅ Valid modification ID (private recipe, not owner) → 404 Not Found
4. ✅ Non-existent modification ID → 404 Not Found
5. ✅ Invalid UUID format → 400 Bad Request
6. ✅ Malformed UUID → 400 Bad Request
7. ✅ Response structure matches ModificationDetailDTO
8. ✅ originalRecipe data is correctly populated
9. ✅ modifiedData contains all expected fields

**Test Data Preparation**:

1. Create test recipe (public)
2. Create test recipe (private, owned by mock user)
3. Create test recipe (private, owned by different user)
4. Create modifications for each recipe
5. Note down modification IDs for testing

**API Testing Tools**:

- Use curl, Postman, or Thunder Client
- Test with different modification IDs
- Verify response status codes and bodies
- Check error message clarity

### Step 9: Code Review and Refinement

**Review Checklist**:

- [ ] Follows Astro conventions (uppercase handler, prerender false)
- [ ] Follows existing code style in `src/pages/api/recipes/[recipeId]/modifications.ts`
- [ ] Zod validation consistent with other endpoints
- [ ] Error handling comprehensive and user-friendly
- [ ] Authorization logic is correct and secure
- [ ] Service function has proper TypeScript types
- [ ] Database query is optimized (single JOIN query)
- [ ] Response structure matches API specification
- [ ] Code comments are clear and helpful
- [ ] No sensitive information in error responses or logs

### Step 10: Documentation and Summary

**After Implementation**:

1. Update API documentation (if exists)
2. Add endpoint to API reference
3. Document any deviations from this plan
4. Note any issues encountered during implementation
5. Update .ai/claude_prompts with lessons learned

**Summary of Changes**:

- ✅ New file: `src/pages/api/modifications/[modificationId].ts`
- ✅ New function in: `src/lib/services/modification.service.ts`
- ✅ Uses existing types from: `src/types.ts`
- ✅ Follows patterns from: `src/pages/api/recipes/[recipeId]/modifications.ts`
