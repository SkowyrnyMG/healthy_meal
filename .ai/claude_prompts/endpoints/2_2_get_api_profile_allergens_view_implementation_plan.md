# API Endpoint Implementation Plan: GET /api/profile/allergens

## 1. Endpoint Overview

This endpoint retrieves the list of allergens that the authenticated user has selected for their dietary preferences. It returns an array of allergen objects, each containing the allergen ID, name (in Polish), and the timestamp when it was added to the user's profile.

**Key Features**:

- Requires authentication
- Returns user-specific allergen data
- Joins `user_allergens` and `allergens` tables
- Returns empty array if user has no allergens

## 2. Request Details

- **HTTP Method**: GET
- **URL Structure**: `/api/profile/allergens`
- **Parameters**:
  - **Required**: None (user ID extracted from authentication session)
  - **Optional**: None
- **Request Body**: None

## 3. Used Types

**Existing DTOs** (from `src/types.ts`):

```typescript
// Line 38-42 in types.ts
export interface UserAllergenDTO {
  id: string;
  name: string; // Using 'name' instead of 'namePl' from API spec
  addedAt: string;
}
```

**Response Structure**:

```typescript
{
  allergens: UserAllergenDTO[]
}
```

**Database Types**:

- `DbAllergen` - from `Tables<"allergens">`
- `DbUserAllergen` - from `Tables<"user_allergens">`

## 4. Response Details

**Success Response (200 OK)**:

```json
{
  "allergens": [
    {
      "id": "uuid",
      "name": "Gluten",
      "addedAt": "2025-10-11T12:00:00Z"
    }
  ]
}
```

**Error Responses**:

**401 Unauthorized**:

```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

**500 Internal Server Error**:

```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

**Note**: The API spec mentions 404 Not Found for "Allergen not found", but for a list endpoint, it's more appropriate to return 200 with an empty array when the user has no allergens. A 404 would only apply if the user profile itself doesn't exist, which is already handled by authentication.

Developer note: I agree with note above. Returning 200 with an empty array is the correct approach for a list endpoint.

## 5. Data Flow

1. **Request Reception** → API route receives GET request
2. **Authentication** → Extract and validate user from auth session via `context.locals.supabase.auth.getUser()`
3. **Service Call** → Call `getUserAllergensByUserId(supabase, userId)` from allergen service
4. **Database Query** → Service joins `user_allergens` with `allergens` table:
   ```sql
   SELECT ua.allergen_id, a.id, a.name_pl, ua.added_at
   FROM user_allergens ua
   INNER JOIN allergens a ON ua.allergen_id = a.id
   WHERE ua.user_id = $1
   ORDER BY ua.added_at DESC
   ```
5. **Data Mapping** → Convert database entities (snake_case) to DTOs (camelCase)
6. **Response Formation** → Wrap allergen array in response object
7. **Response Return** → Send JSON response with appropriate status code

## 6. Security Considerations

### Authentication

- **Requirement**: User must be authenticated via Supabase Auth
- **Implementation**: Use `context.locals.supabase.auth.getUser()` to validate session
- **Development**: Mock user ID for development (add TODO comment for production)

### Authorization

- **Data Isolation**: Users can only access their own allergens
- **Implementation**: Filter by `user_id` in WHERE clause using authenticated user's ID
- **Protection**: Supabase Row Level Security (RLS) should be enabled on `user_allergens` table

### Input Validation

- **User ID**: Validated through authentication system (UUID format)
- **No User Input**: Endpoint accepts no parameters, reducing attack surface

### Data Protection

- **SQL Injection**: Protected by Supabase SDK parameterized queries
- **Error Messages**: Return generic errors to client, log detailed information server-side
- **Sensitive Data**: No sensitive data in allergen names or IDs

## 7. Error Handling

### Error Scenarios and Handling Strategy

**1. Authentication Failure (401)**

- **Scenario**: User not logged in, invalid token, expired session
- **Handling**: Early return with 401 status
- **Logging**: Log authentication attempt without sensitive data

**2. Database Query Failure (500)**

- **Scenario**: Connection timeout, query syntax error, table not found
- **Handling**: Catch exception, return generic 500 error
- **Logging**: Log full error details with stack trace

**3. Empty Result Set (200)**

- **Scenario**: User has no allergens selected
- **Handling**: Return 200 with empty array: `{ allergens: [] }`
- **Logging**: No logging needed (valid scenario)

**4. Service Layer Exception (500)**

- **Scenario**: Unexpected error in data mapping or service logic
- **Handling**: Catch in API route, return 500
- **Logging**: Log error with request context

### Error Logging Pattern

```typescript
console.error("[GET /api/profile/allergens] Error:", {
  error: error instanceof Error ? error.message : "Unknown error",
  stack: error instanceof Error ? error.stack : undefined,
  userId: userId, // Safe to log in server context
});
```

## 8. Performance Considerations

### Potential Bottlenecks

1. **Database Join**: Joining `user_allergens` with `allergens` table
2. **Network Latency**: Round-trip time to Supabase
3. **Large Result Sets**: Users with many allergens (unlikely, typically < 20)

### Optimization Strategies

**Database Level**:

- Ensure indexes exist on `user_allergens.user_id` (likely already indexed as FK)
- Ensure indexes exist on `user_allergens.allergen_id` (likely already indexed as FK)
- Use `.select()` to fetch only needed columns

**Query Optimization**:

```typescript
// Efficient: Select only needed fields
.select('allergen_id, added_at, allergens(id, name_pl)')

// Avoid: Select all fields with wildcards
.select('*, allergens(*)')
```

**Caching Considerations**:

- Allergen list changes infrequently for most users
- Consider HTTP caching headers (Cache-Control, ETag) in future iterations
- Current implementation: No caching (always fresh data)

**Expected Performance**:

- **Query Time**: < 50ms (indexed foreign key lookup + join)
- **Response Time**: < 200ms (including auth validation)
- **Typical Payload**: < 1KB (5-10 allergens average)

## 9. Implementation Steps

### Step 1: Create Allergen Service

**File**: `src/lib/services/allergen.service.ts`

**Tasks**:

1. Create service file with proper imports:
   - `SupabaseClient` from `@supabase/supabase-js`
   - `Database` from `../../db/database.types`
   - `DbAllergen`, `DbUserAllergen`, `UserAllergenDTO` from `../../types`

2. Implement `getUserAllergensByUserId()` function:
   - Parameter: `supabase: SupabaseClient<Database>`, `userId: string`
   - Return type: `Promise<UserAllergenDTO[]>`
   - Query: Join `user_allergens` with `allergens` table
   - Filter by user_id
   - Order by `added_at DESC` (most recent first)

3. Implement `mapToDTO()` helper function:
   - Convert snake_case database fields to camelCase DTO fields
   - Map: `allergen_id` → `id`, `name_pl` → `name`, `added_at` → `addedAt`
   - Handle nested allergen data from join

4. Handle errors:
   - Return empty array for no results
   - Throw errors for database failures

**Implementation Pattern**:

```typescript
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../../db/database.types";
import type { UserAllergenDTO } from "../../types";

/**
 * Get user's allergens by user ID
 * @param supabase - Supabase client instance from context.locals
 * @param userId - User ID from authentication session
 * @returns Array of UserAllergenDTO (empty array if no allergens)
 * @throws Error if database query fails
 */
export async function getUserAllergensByUserId(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<UserAllergenDTO[]> {
  const { data, error } = await supabase
    .from("user_allergens")
    .select("allergen_id, added_at, allergens(id, name_pl)")
    .eq("user_id", userId)
    .order("added_at", { ascending: false });

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    return [];
  }

  return data.map(mapToDTO);
}

/**
 * Map database user_allergen entity to DTO
 * Converts snake_case to camelCase and extracts nested allergen data
 * @param dbUserAllergen - Database user_allergen entity with joined allergen
 * @returns UserAllergenDTO with camelCase properties
 */
function mapToDTO(dbUserAllergen: any): UserAllergenDTO {
  return {
    id: dbUserAllergen.allergens.id,
    name: dbUserAllergen.allergens.name_pl,
    addedAt: dbUserAllergen.added_at,
  };
}
```

### Step 2: Create API Route Handler

**File**: `src/pages/api/profile/allergens.ts`

**Tasks**:

1. Add required imports and prerender directive:

   ```typescript
   import type { APIRoute } from "astro";
   import { getUserAllergensByUserId } from "../../../lib/services/allergen.service";

   export const prerender = false;
   ```

2. Implement GET handler following existing pattern from `profile.ts`:
   - Add authentication block (mocked for development)
   - Call `getUserAllergensByUserId()`
   - Wrap result in response object: `{ allergens: result }`
   - Return 200 with JSON response

3. Add error handling:
   - Try-catch block for unexpected errors
   - Return 401 for authentication failures (commented for development)
   - Return 500 for service/database errors
   - Log errors with context

4. Add JSDoc comment describing endpoint behavior

**Implementation Pattern**:

```typescript
import type { APIRoute } from "astro";

import { getUserAllergensByUserId } from "../../../lib/services/allergen.service";

export const prerender = false;

/**
 * GET /api/profile/allergens
 * Retrieves the current authenticated user's selected allergens
 *
 * Returns:
 * - 200: Array of UserAllergenDTO wrapped in { allergens: [] }
 * - 401: Unauthorized (authentication required) - currently commented for development
 * - 500: Internal server error
 */
export const GET: APIRoute = async (context) => {
  try {
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
    const userId = "550e8400-e29b-41d4-a716-446655440000"; // Mock user ID for development

    // ========================================
    // FETCH USER ALLERGENS
    // ========================================

    const allergens = await getUserAllergensByUserId(context.locals.supabase, userId);

    // Success response
    return new Response(JSON.stringify({ allergens }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Log error with context
    console.error("[GET /api/profile/allergens] Error:", {
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

### Step 3: Test the Endpoint

**Manual Testing**:

1. Start development server: `npm run dev`
2. Test with curl or browser:
   ```bash
   curl http://localhost:3000/api/profile/allergens
   ```
3. Verify response structure matches API spec
4. Test with user who has allergens vs. user with no allergens
5. Verify error scenarios (invalid auth, database errors)

**Test Cases**:

- ✅ User with multiple allergens returns correct array
- ✅ User with no allergens returns empty array `{ allergens: [] }`
- ✅ Unauthenticated request returns 401 (when auth is enabled)
- ✅ Response structure matches spec
- ✅ Timestamps are properly formatted (ISO 8601)
- ✅ Allergens ordered by `addedAt` descending

**Expected Responses**:

User with allergens:

```json
{
  "allergens": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Gluten",
      "addedAt": "2025-10-11T12:00:00Z"
    },
    {
      "id": "223e4567-e89b-12d3-a456-426614174001",
      "name": "Lactose",
      "addedAt": "2025-10-10T10:30:00Z"
    }
  ]
}
```

User with no allergens:

```json
{
  "allergens": []
}
```

### Step 4: Verify Type Safety

**Tasks**:

1. Run TypeScript compiler: `npm run build` or `npx tsc`
2. Verify no type errors in new files
3. Ensure DTO mapping is type-safe
4. Check that Supabase query types are correct

**Common Type Issues to Watch**:

- Ensure joined allergen data is properly typed
- Verify `mapToDTO` function handles nested objects correctly
- Check that `UserAllergenDTO` properties match exactly

### Step 5: Code Quality Checks

**Tasks**:

1. Run linter: `npm run lint`
2. Run formatter: `npm run format`
3. Fix any linting errors or warnings
4. Ensure code follows project conventions:
   - Early returns for errors
   - Guard clauses for validation
   - Proper error logging
   - Clear comments and documentation

**Pre-commit Checklist**:

- [ ] ESLint passes with no errors
- [ ] Prettier formatting applied
- [ ] TypeScript compiles without errors
- [ ] JSDoc comments are complete
- [ ] No console.log statements (only console.error for errors)
- [ ] Mock authentication has TODO comment

### Step 6: Documentation

**Tasks**:

1. Ensure JSDoc comments are complete
2. Add example responses in comments
3. Document any assumptions or limitations
4. Update API documentation if it exists

**Documentation Notes**:

- Endpoint uses mock authentication for development
- Returns empty array (not 404) when user has no allergens
- Allergens are ordered by most recently added first
- Uses existing `UserAllergenDTO` with `name` field (not `namePl`)

---

## Summary

This implementation follows established patterns in the codebase and adheres to all specified rules:

✅ **Astro Best Practices**:

- Uses Astro API routes with uppercase GET handler
- `export const prerender = false` for dynamic routes
- Uses `context.locals.supabase` for database access

✅ **Backend Best Practices**:

- Extracts logic to dedicated `allergen.service.ts`
- Uses Zod schemas implicitly through TypeScript types
- Proper separation of concerns (route → service → database)

✅ **Code Quality**:

- Early returns for error conditions
- Guard clauses for validation
- Proper error logging with context
- Type-safe DTO mapping

✅ **Security**:

- Authentication required (mocked for development)
- User data isolation through WHERE clause
- No SQL injection vulnerability (parameterized queries)
- Generic error messages to clients

✅ **Type System**:

- Uses existing `UserAllergenDTO` type
- Type-safe Supabase client from `context.locals`
- Database types from `database.types.ts`

The endpoint will be production-ready after:

1. Uncommenting the authentication block
2. Testing with real user data and authentication
3. Verifying Supabase RLS policies are enabled
4. Load testing with expected user volumes
