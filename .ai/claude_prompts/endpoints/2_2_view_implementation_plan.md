# API Endpoint Implementation Plan: GET /api/profile

## 1. Endpoint Overview

The GET /api/profile endpoint retrieves the current authenticated user's profile data, including dietary preferences and physical information. This is a read-only endpoint that returns a ProfileDTO containing weight, age, gender, activity level, diet type, target goals, and timestamps.

**Purpose**: Provide user profile data for display in the user interface, settings pages, and personalization features.

**Authentication Strategy**:

- **Development/Mock**: Use hardcoded userId for testing
- **Production**: Supabase session authentication (to be uncommented later)

## 2. Request Details

- **HTTP Method**: GET
- **URL Structure**: `/api/profile`
- **Parameters**:
  - **Required**: None (userId extracted from authentication session)
  - **Optional**: None
  - **Path Parameters**: None
  - **Query Parameters**: None
- **Request Body**: None (GET request)
- **Headers**:
  - `Authorization`: Bearer token (for Supabase auth - production only)
  - `Cookie`: Session cookie (for Supabase auth - production only)

## 3. Used Types

### DTOs (from `src/types.ts`)

```typescript
/**
 * ProfileDTO - Response structure
 * Lines 11-22 in src/types.ts
 */
interface ProfileDTO {
  userId: string;
  weight: number | null;
  age: number | null;
  gender: string | null;
  activityLevel: string | null;
  dietType: string | null;
  targetGoal: string | null;
  targetValue: number | null;
  createdAt: string;
  updatedAt: string;
}
```

### Database Types (from `src/types.ts`)

```typescript
/**
 * DbProfile - Database entity type
 * Line 587 in src/types.ts
 */
type DbProfile = Tables<"profiles">;
```

### Command Models

**None required** - This is a read-only GET endpoint with no input payload.

## 4. Response Details

### Success Response (200 OK)

```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "weight": 75.5,
  "age": 28,
  "gender": "male",
  "activityLevel": "moderately_active",
  "dietType": "high_protein",
  "targetGoal": "lose_weight",
  "targetValue": 5.0,
  "createdAt": "2025-10-11T12:00:00Z",
  "updatedAt": "2025-10-11T12:00:00Z"
}
```

### Error Responses

**401 Unauthorized** - User not authenticated

```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

**404 Not Found** - Profile doesn't exist for authenticated user

```json
{
  "error": "Not Found",
  "message": "Profile not found"
}
```

**500 Internal Server Error** - Server-side error

```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

## 5. Data Flow

### Request Flow

1. **Request arrives** at GET /api/profile
2. **Authentication check**:
   - **Mock (Development)**: Use hardcoded userId (e.g., "550e8400-e29b-41d4-a716-446655440000")
   - **Production (Commented out)**: Extract userId from Supabase session via `context.locals.supabase.auth.getUser()`
3. **Service invocation**: Call `ProfileService.getProfileByUserId(userId)`
4. **Database query**: Service queries `profiles` table with WHERE `user_id = userId`
5. **Data mapping**: Map `DbProfile` to `ProfileDTO` with camelCase field names
6. **Response**: Return ProfileDTO as JSON with 200 status code

### Database Interaction

**Table**: `profiles`

**Query Pattern**:

```typescript
const { data, error } = await supabase.from("profiles").select("*").eq("user_id", userId).single();
```

**Mapping Logic**:

```typescript
// DbProfile (snake_case) -> ProfileDTO (camelCase)
{
  user_id -> userId,
  weight -> weight,
  age -> age,
  gender -> gender,
  activity_level -> activityLevel,
  diet_type -> dietType,
  target_goal -> targetGoal,
  target_value -> targetValue,
  created_at -> createdAt (convert to ISO string),
  updated_at -> updatedAt (convert to ISO string)
}
```

### Service Layer

**File**: `src/lib/services/profile.service.ts`

**Methods**:

- `getProfileByUserId(userId: string): Promise<ProfileDTO | null>`
  - Queries profiles table
  - Maps database entity to DTO
  - Returns null if profile not found
  - Throws error for database failures

## 6. Security Considerations

### Authentication

**Mock Implementation (Current)**:

- Hardcoded userId for development testing
- Comment clearly indicates this is temporary
- Easy to toggle to production authentication

**Production Implementation (Commented)**:

```typescript
// Production: Uncomment this block
// const { data: { user }, error: authError } = await context.locals.supabase.auth.getUser();
// if (authError || !user) {
//   return new Response(JSON.stringify({
//     error: "Unauthorized",
//     message: "Authentication required"
//   }), { status: 401 });
// }
// const userId = user.id;

// Mock: Remove this line in production
const userId = "550e8400-e29b-41d4-a716-446655440000"; // Mock user ID
```

### Authorization

- User can only access their own profile
- userId comes from authenticated session (trusted source)
- No additional authorization checks needed (implicit via session)

### Data Validation

**Input**:

- No user-provided input to validate
- userId from session is trusted (validated by Supabase)

**Output**:

- ProfileDTO structure is type-safe via TypeScript
- All fields properly typed (string, number, null)
- ISO 8601 timestamp format for dates

### Security Threats & Mitigations

| Threat                  | Mitigation                                           |
| ----------------------- | ---------------------------------------------------- |
| **Unauthorized Access** | Require valid Supabase session (production)          |
| **Session Hijacking**   | Rely on Supabase HTTP-only cookies and secure tokens |
| **Data Leakage**        | Only return data for authenticated user's profile    |
| **SQL Injection**       | Use Supabase SDK parameterized queries (not raw SQL) |
| **XSS**                 | Return JSON with proper Content-Type header          |

## 7. Error Handling

### Error Scenarios

| Scenario                  | Status Code | Response                                                                      | Logging           |
| ------------------------- | ----------- | ----------------------------------------------------------------------------- | ----------------- |
| No authentication session | 401         | `{ error: "Unauthorized", message: "Authentication required" }`               | No log (expected) |
| Profile not found         | 404         | `{ error: "Not Found", message: "Profile not found" }`                        | No log (expected) |
| Database connection error | 500         | `{ error: "Internal Server Error", message: "An unexpected error occurred" }` | Log full error    |
| Supabase SDK error        | 500         | `{ error: "Internal Server Error", message: "An unexpected error occurred" }` | Log full error    |
| Service layer exception   | 500         | `{ error: "Internal Server Error", message: "An unexpected error occurred" }` | Log full error    |

### Error Handling Pattern

```typescript
try {
  // Authentication check
  // Service invocation
  // Success response
} catch (error) {
  console.error("[GET /api/profile] Error:", {
    userId,
    error: error instanceof Error ? error.message : "Unknown error",
    stack: error instanceof Error ? error.stack : undefined,
  });

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

### Logging Strategy

**Development**:

- Log to console with structured format
- Include userId, error message, stack trace

**Production**:

- Log to error tracking service (e.g., Sentry, LogRocket)
- Include request context (userId, timestamp, endpoint)
- Do not log sensitive data (passwords, tokens)

## 8. Performance Considerations

### Potential Bottlenecks

1. **Database Query**:
   - Single row lookup by indexed primary key (user_id)
   - Very fast O(1) operation with proper indexing
   - Expected query time: < 10ms

2. **Network Latency**:
   - Supabase hosted database adds network round-trip
   - Mitigation: Consider caching if profile data changes infrequently

3. **JSON Serialization**:
   - Minimal overhead for small ProfileDTO object
   - No performance concerns

### Optimization Strategies

**Current Implementation**:

- Use `.single()` to fetch only one row
- Select only necessary columns (or use `*` for simplicity since table is small)
- No JOINs needed (profiles table is standalone)

**Future Optimizations** (if needed):

- **Caching**: Cache ProfileDTO in Redis with TTL (e.g., 5 minutes)
- **CDN Edge Caching**: Not applicable (user-specific data)
- **Database Indexing**: Ensure `profiles.user_id` has index (should be primary key)

### Expected Performance

- **Database Query**: < 10ms
- **Total Response Time**: < 50ms (including network)
- **Throughput**: Can handle 1000+ requests/second with proper infrastructure

## 9. Implementation Steps

### Step 1: Create ProfileService

**File**: `src/lib/services/profile.service.ts`

**Tasks**:

1. Create new file with TypeScript types imported
2. Import Supabase client type: `SupabaseClient` from `src/db/supabase.client.ts`
3. Import types: `ProfileDTO`, `DbProfile` from `src/types.ts`
4. Implement `getProfileByUserId(supabase: SupabaseClient, userId: string)` method:
   - Query profiles table with `.eq('user_id', userId).single()`
   - Handle null/not found case (return null)
   - Map DbProfile to ProfileDTO (snake_case → camelCase)
   - Convert timestamps to ISO strings
   - Throw error for database failures
5. Add JSDoc comments for documentation

**Example Implementation**:

```typescript
import type { SupabaseClient } from "../db/supabase.client";
import type { ProfileDTO, DbProfile } from "../types";

export class ProfileService {
  /**
   * Get user profile by user ID
   * @param supabase - Supabase client instance
   * @param userId - User ID from authentication session
   * @returns ProfileDTO or null if not found
   * @throws Error if database query fails
   */
  static async getProfileByUserId(supabase: SupabaseClient, userId: string): Promise<ProfileDTO | null> {
    const { data, error } = await supabase.from("profiles").select("*").eq("user_id", userId).single();

    if (error) {
      // Not found is acceptable (return null)
      if (error.code === "PGRST116") {
        return null;
      }
      // Other errors should throw
      throw error;
    }

    if (!data) {
      return null;
    }

    return this.mapToDTO(data);
  }

  /**
   * Map database profile to DTO
   */
  private static mapToDTO(dbProfile: DbProfile): ProfileDTO {
    return {
      userId: dbProfile.user_id,
      weight: dbProfile.weight,
      age: dbProfile.age,
      gender: dbProfile.gender,
      activityLevel: dbProfile.activity_level,
      dietType: dbProfile.diet_type,
      targetGoal: dbProfile.target_goal,
      targetValue: dbProfile.target_value,
      createdAt: dbProfile.created_at,
      updatedAt: dbProfile.updated_at,
    };
  }
}
```

### Step 2: Create API Endpoint

**File**: `src/pages/api/profile.ts`

**Tasks**:

1. Create new file with Astro API route structure
2. Add `export const prerender = false` directive
3. Import ProfileService
4. Import types from `src/types.ts`
5. Implement GET handler:
   - **Mock authentication**: Hardcoded userId
   - **Comment out**: Real Supabase authentication code
   - Extract Supabase client from `context.locals.supabase`
   - Call `ProfileService.getProfileByUserId()`
   - Handle null response (404)
   - Return JSON response with ProfileDTO
   - Implement try-catch for error handling
6. Add proper response headers (Content-Type: application/json)
7. Add JSDoc comments

**Example Implementation**:

```typescript
import type { APIRoute } from "astro";
import { ProfileService } from "../../lib/services/profile.service";

export const prerender = false;

/**
 * GET /api/profile
 * Get current authenticated user's profile
 */
export const GET: APIRoute = async (context) => {
  try {
    // ========================================
    // AUTHENTICATION (MOCK FOR DEVELOPMENT)
    // ========================================

    // TODO: Production - Uncomment this block
    // const { data: { user }, error: authError } = await context.locals.supabase.auth.getUser();
    // if (authError || !user) {
    //   return new Response(
    //     JSON.stringify({
    //       error: "Unauthorized",
    //       message: "Authentication required"
    //     }),
    //     {
    //       status: 401,
    //       headers: { 'Content-Type': 'application/json' }
    //     }
    //   );
    // }
    // const userId = user.id;

    // MOCK: Remove this in production
    const userId = "550e8400-e29b-41d4-a716-446655440000"; // Mock user ID for development

    // ========================================
    // FETCH PROFILE
    // ========================================

    const profile = await ProfileService.getProfileByUserId(context.locals.supabase, userId);

    // Handle not found
    if (!profile) {
      return new Response(
        JSON.stringify({
          error: "Not Found",
          message: "Profile not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Success response
    return new Response(JSON.stringify(profile), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Log error with context
    console.error("[GET /api/profile] Error:", {
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

### Step 3: Verify Supabase Middleware

**File**: `src/middleware/index.ts`

**Tasks**:

1. Read existing middleware file
2. Verify that Supabase client is injected into `context.locals.supabase`
3. Ensure middleware runs before API routes
4. No changes needed (just verification)

**Expected Middleware Structure**:

```typescript
// Should already exist and inject supabase into context.locals
export const onRequest = defineMiddleware(async (context, next) => {
  // Supabase client initialization
  context.locals.supabase = createSupabaseClient(...);
  return next();
});
```

### Step 4: Test the Endpoint

**Development Server**:

1. Run `npm run dev`
2. Server starts on http://localhost:3000

**Manual Testing**:

**Test 1: Success Case (Mock User)**

```bash
curl http://localhost:3000/api/profile
```

Expected Response (200):

```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "weight": 75.5,
  "age": 28,
  "gender": "male",
  "activityLevel": "moderately_active",
  "dietType": "high_protein",
  "targetGoal": "lose_weight",
  "targetValue": 5.0,
  "createdAt": "2025-10-11T12:00:00Z",
  "updatedAt": "2025-10-11T12:00:00Z"
}
```

**Test 2: Profile Not Found**

- Change mock userId to non-existent UUID
- Expected Response (404):

```json
{
  "error": "Not Found",
  "message": "Profile not found"
}
```

**Test 3: Database Error**

- Temporarily break database connection
- Expected Response (500):

```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

### Step 5: Prepare Test Data in Database

**Prerequisites**:

1. Ensure Supabase project is set up
2. Ensure `profiles` table exists with schema matching DbProfile type

**Create Test Profile**:

```sql
INSERT INTO profiles (
  user_id,
  weight,
  age,
  gender,
  activity_level,
  diet_type,
  target_goal,
  target_value,
  created_at,
  updated_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  75.5,
  28,
  'male',
  'moderately_active',
  'high_protein',
  'lose_weight',
  5.0,
  NOW(),
  NOW()
);
```

**Verification Query**:

```sql
SELECT * FROM profiles WHERE user_id = '550e8400-e29b-41d4-a716-446655440000';
```

### Step 6: Update to Production Authentication (Later)

**When Ready for Production**:

1. Open `src/pages/api/profile.ts`
2. **Uncomment** the Supabase authentication block:
   ```typescript
   const { data: { user }, error: authError } = await context.locals.supabase.auth.getUser();
   if (authError || !user) {
     return new Response(..., { status: 401 });
   }
   const userId = user.id;
   ```
3. **Remove** the mock userId line:
   ```typescript
   // DELETE THIS LINE
   const userId = "550e8400-e29b-41d4-a716-446655440000";
   ```
4. Test with real authenticated users
5. Verify 401 response for unauthenticated requests

### Step 7: Code Quality Checks

**Linting**:

```bash
npm run lint
```

**Formatting**:

```bash
npm run format
```

**Type Checking**:

```bash
npx tsc --noEmit
```

**Pre-commit Hooks**:

- Husky runs lint-staged automatically
- ESLint checks .ts files
- Prettier formats code

### Step 8: Documentation

**Add API Documentation** (if applicable):

- Update API documentation with endpoint details
- Include request/response examples
- Document authentication requirements
- Note that mock authentication is used in development

**Code Comments**:

- Service methods have JSDoc comments
- API route has descriptive comments
- Mock authentication clearly marked with TODO

## 10. Success Criteria

### Functional Requirements

- ✅ Endpoint responds to GET requests at `/api/profile`
- ✅ Returns ProfileDTO with correct structure
- ✅ Returns 200 status for successful requests
- ✅ Returns 404 when profile not found
- ✅ Returns 500 for server errors
- ✅ Mock authentication works in development
- ✅ Production authentication code is ready (commented)

### Non-Functional Requirements

- ✅ Response time < 50ms for cached database
- ✅ Code follows TypeScript best practices
- ✅ Proper error handling with try-catch
- ✅ Error logging with structured data
- ✅ Linter passes without errors
- ✅ Type-safe implementation (no `any` types)
- ✅ Code is well-commented and documented

### Testing Checklist

- [ ] Manual test: Success case returns 200 with ProfileDTO
- [ ] Manual test: Non-existent user returns 404
- [ ] Manual test: Database error returns 500
- [ ] Verify: Response has correct Content-Type header
- [ ] Verify: ProfileDTO fields match API specification
- [ ] Verify: Timestamps are in ISO 8601 format
- [ ] Verify: ESLint passes
- [ ] Verify: TypeScript compiles without errors

## 11. Future Enhancements

### Caching

**Implementation**:

- Add Redis caching layer in ProfileService
- Cache ProfileDTO with TTL (5-10 minutes)
- Invalidate cache on profile updates

**Benefits**:

- Reduce database load
- Improve response times
- Scale to higher traffic

### Extended Profile Data

**Potential Additions**:

- Include user allergens in response
- Include disliked ingredients
- Add computed fields (BMI, calorie targets)

**Changes Required**:

- Extend ProfileDTO interface
- Add JOINs to query user_allergens and user_disliked_ingredients
- Update mapping logic

### Rate Limiting

**Implementation**:

- Add rate limiting middleware
- Limit to 100 requests/minute per user
- Return 429 Too Many Requests when exceeded

**Benefits**:

- Prevent abuse
- Protect database from excessive queries
- Improve overall system stability
