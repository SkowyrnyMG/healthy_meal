# API Endpoint Implementation Plan: GET /api/profile/disliked-ingredients

## 1. Endpoint Overview

This endpoint retrieves the authenticated user's list of disliked ingredients. It returns an array of ingredient records, each containing the ingredient ID, name, and creation timestamp. The endpoint follows the existing codebase pattern established by the allergens endpoint, using service layer extraction and proper error handling.

**Key Features:**

- Read-only operation (no data modification)
- Returns empty array if user has no disliked ingredients
- Requires authentication (mock auth for development)
- Follows existing DislikedIngredientDTO structure

## 2. Request Details

- **HTTP Method**: GET
- **URL Structure**: `/api/profile/disliked-ingredients`
- **Parameters**:
  - Required: None (user ID extracted from auth session)
  - Optional: None
- **Request Body**: N/A (GET request has no body)
- **Headers**:
  - Authentication headers managed by Supabase client
  - Content-Type: application/json (for response)

## 3. Used Types

### Existing DTOs (from src/types.ts)

```typescript
// Response DTO
interface DislikedIngredientDTO {
  id: string;
  ingredientName: string;
  createdAt: string;
}

// Database types (already defined)
type DbDislikedIngredient = Tables<"user_disliked_ingredients">;
```

### New Service Types (to be created in service file)

```typescript
// Query result type for mapping
interface DislikedIngredientQueryResult {
  id: string;
  ingredient_name: string;
  created_at: string;
}
```

**No Command Models needed** - this is a read-only GET endpoint

## 4. Response Details

### Success Response (200 OK)

```json
{
  "dislikedIngredients": [
    {
      "id": "uuid",
      "ingredientName": "cebula",
      "createdAt": "2025-10-11T12:00:00Z"
    }
  ]
}
```

### Error Responses

**401 Unauthorized** (Authentication required - production only)

```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

**500 Internal Server Error** (Unexpected errors)

```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

## 5. Data Flow

1. **Request Reception**: Astro API route receives GET request at `/api/profile/disliked-ingredients`

2. **Authentication** (Development vs Production):
   - Development: Use mock user ID (`c4afdcfc-d36b-4f19-b62d-0de187151b87`)
   - Production: Extract user from `context.locals.supabase.auth.getUser()`
   - Return 401 if authentication fails (production only)

3. **Service Layer Call**:
   - Call `getDislikedIngredientsByUserId(context.locals.supabase, userId)`
   - Service queries `user_disliked_ingredients` table
   - Filter by `user_id = userId`
   - Order by `created_at DESC` (newest first)

4. **Database Query**:

   ```typescript
   supabase
     .from("user_disliked_ingredients")
     .select("id, ingredient_name, created_at")
     .eq("user_id", userId)
     .order("created_at", { ascending: false });
   ```

5. **Data Mapping**:
   - Transform database records from snake_case to camelCase
   - Map to DislikedIngredientDTO array
   - Return empty array if no records found

6. **Response Formation**:
   - Wrap array in `{ dislikedIngredients: [...] }` object
   - Set status 200
   - Set Content-Type: application/json

## 6. Security Considerations

### Authentication

- **Requirement**: User must be authenticated via Supabase Auth
- **Development**: Mock authentication using predefined user ID
- **Production**: Real authentication via `context.locals.supabase.auth.getUser()`
- **Failure handling**: Return 401 with descriptive message

### Authorization

- **Principle**: Users can only access their own disliked ingredients
- **Enforcement**: Query filtered by authenticated user's ID
- **RLS**: Currently disabled for development, should be enabled in production
- **Policy**: `user_disliked_ingredients_select` policy ensures `auth.uid() = user_id`

### Data Validation

- **Input**: No user input to validate (GET request)
- **Output**: Data comes directly from database, validated by DB schema
- **SQL Injection**: Protected by Supabase client's parameterized queries

### Security Best Practices

- Don't expose internal error details to client
- Log full errors server-side for debugging
- Use prepared statements via Supabase client
- Follow principle of least privilege (user sees only their data)

## 7. Error Handling

### Authentication Errors (401)

- **Scenario**: User not authenticated or session expired
- **Handling**: Return 401 with clear message
- **Logging**: Minimal (don't log stack traces for expected auth failures)
- **Note**: Currently commented out for development

### Database Query Errors (500)

- **Scenario**: Database connection failure, query errors
- **Handling**: Catch in try-catch, return generic 500 error
- **Logging**: Log full error object with stack trace
- **Format**: `console.error("[GET /api/profile/disliked-ingredients] Error:", { error, stack })`

### Empty Results (200)

- **Scenario**: User has no disliked ingredients
- **Handling**: Return 200 with empty array (not an error)
- **Response**: `{ "dislikedIngredients": [] }`

### Error Response Pattern

```typescript
{
  error: "Error Type",
  message: "User-friendly error message"
}
```

## 8. Performance Considerations

### Database Optimization

- **Index**: `idx_user_disliked_ingredients_user_id` already exists on `user_id` column
- **Query efficiency**: Simple equality filter with index support
- **Result size**: Typically small (users rarely have many disliked ingredients)

### Caching Strategy

- **Not implemented initially** (data changes infrequently but needs to be current)
- **Future consideration**: Client-side caching with cache invalidation on POST/DELETE

### Response Size

- **Expected**: Small payloads (typically < 1KB)
- **Scaling**: Linear growth with number of disliked ingredients per user
- **Mitigation**: Not needed for MVP (no pagination required)

## 9. Implementation Steps

### Step 1: Create Disliked Ingredient Service

**File**: `src/lib/services/disliked-ingredient.service.ts`

1. Create service file with imports:
   - SupabaseClient type from "@supabase/supabase-js"
   - Database type from "../../db/database.types"
   - DislikedIngredientDTO from "../../types"

2. Define query result interface:

   ```typescript
   interface DislikedIngredientQueryResult {
     id: string;
     ingredient_name: string;
     created_at: string;
   }
   ```

3. Implement mapping function:

   ```typescript
   function mapToDTO(dbRecord: DislikedIngredientQueryResult): DislikedIngredientDTO {
     return {
       id: dbRecord.id,
       ingredientName: dbRecord.ingredient_name,
       createdAt: dbRecord.created_at,
     };
   }
   ```

4. Implement main service function:

   ```typescript
   export async function getDislikedIngredientsByUserId(
     supabase: SupabaseClient<Database>,
     userId: string
   ): Promise<DislikedIngredientDTO[]> {
     const { data, error } = await supabase
       .from("user_disliked_ingredients")
       .select("id, ingredient_name, created_at")
       .eq("user_id", userId)
       .order("created_at", { ascending: false });

     if (error) {
       throw error;
     }

     if (!data || data.length === 0) {
       return [];
     }

     return data.map(mapToDTO);
   }
   ```

### Step 2: Create API Endpoint

**File**: `src/pages/api/profile/disliked-ingredients.ts`

1. Add imports:

   ```typescript
   import type { APIRoute } from "astro";
   import { getDislikedIngredientsByUserId } from "../../../lib/services/disliked-ingredient.service";
   ```

2. Add prerender directive:

   ```typescript
   export const prerender = false;
   ```

3. Implement GET handler with:
   - Try-catch block for error handling
   - Authentication section (mock for development, real for production)
   - Service layer call
   - Success response (200)
   - Error response (500) with logging

4. Follow the exact pattern from `src/pages/api/profile/allergens.ts` GET handler:
   - Mock user ID for development
   - TODO comment for production authentication
   - Proper error logging format
   - Consistent response structure

### Step 3: Test the Implementation

1. **Manual testing**:
   - Start dev server (`npm run dev`)
   - Test GET request to `/api/profile/disliked-ingredients`
   - Verify response structure matches spec
   - Test with user who has disliked ingredients
   - Test with user who has no disliked ingredients

2. **Database verification**:
   - Ensure test data exists in `user_disliked_ingredients` table
   - Verify user_id matches mock user ID
   - Check data ordering (newest first)

3. **Error scenarios**:
   - Test with invalid user ID (should return empty array, not error)
   - Test database connection issues (mock if possible)

### Step 4: Code Quality Checks

1. Run linter: `npm run lint`
2. Format code: `npm run format`
3. Verify TypeScript compilation: `npm run build`
4. Review code for:
   - Consistent error handling
   - Proper type annotations
   - Clear comments
   - Following project conventions

### Step 5: Documentation

1. Add JSDoc comments to service function
2. Add endpoint documentation comment to API route
3. Ensure implementation plan is saved to:
   `.ai/claude_prompts/endpoints/2_2_get_api_profile_disliked_ingredients_implementation_plan.md`

---

**Implementation Priority**: High
**Estimated Complexity**: Low (follows established pattern)
**Dependencies**: None (all required types and infrastructure exist)
**Testing Requirements**: Manual API testing with development server
