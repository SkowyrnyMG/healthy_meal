# API Endpoint Implementation Plan: POST /api/profile/allergens

## 1. Endpoint Overview

This endpoint adds a new allergen to the authenticated user's dietary preferences. It accepts an allergen ID in the request body, validates it, checks for duplicates, and inserts it into the user's allergen list.

**Key Features**:

- Requires authentication
- Validates allergen ID format (UUID)
- Prevents duplicate allergen additions
- Returns newly added allergen with timestamp
- Validates allergen exists in database

## 2. Request Details

- **HTTP Method**: POST
- **URL Structure**: `/api/profile/allergens`
- **Parameters**:
  - **Required**: None (user ID extracted from authentication session)
  - **Optional**: None
- **Request Body**:
  ```json
  {
    "allergenId": "uuid"
  }
  ```

## 3. Used Types

**Existing DTOs** (from `src/types.ts`):

```typescript
// Line 474-476 in types.ts
export interface AddAllergenCommand {
  allergenId: string;
}

// Line 38-42 in types.ts
export interface UserAllergenDTO {
  id: string;
  name: string;
  createdAt: string;
}
```

**Response Structure**:

```typescript
{
  success: boolean;
  allergen: UserAllergenDTO;
}
```

**Note**: The API specification uses `namePl` in the response, but the existing `UserAllergenDTO` uses `name`. For consistency with the codebase and the GET endpoint, we'll use `name` instead of `namePl`.

**Database Types**:

- `DbAllergen` - from `Tables<"allergens">`
- `DbUserAllergen` - from `Tables<"user_allergens">`
- `DbUserAllergenInsert` - from `TablesInsert<"user_allergens">`

**Validation Schema** (Zod):

```typescript
import { z } from "zod";

const AddAllergenSchema = z.object({
  allergenId: z.string().uuid("Invalid allergen ID format"),
});
```

## 4. Response Details

**Success Response (201 Created)**:

```json
{
  "success": true,
  "allergen": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Gluten",
    "createdAt": "2025-10-12T14:30:00Z"
  }
}
```

**Error Responses**:

**400 Bad Request - Invalid Format**:

```json
{
  "error": "Bad Request",
  "message": "Invalid allergen ID format"
}
```

**400 Bad Request - Allergen Not Found**:

```json
{
  "error": "Bad Request",
  "message": "Allergen not found"
}
```

**401 Unauthorized**:

```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

**409 Conflict**:

```json
{
  "error": "Conflict",
  "message": "Allergen already added to profile"
}
```

**500 Internal Server Error**:

```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

## 5. Data Flow

1. **Request Reception** → API route receives POST request with JSON body
2. **Authentication** → Extract and validate user from auth session via `context.locals.supabase.auth.getUser()`
3. **Request Parsing** → Parse JSON body and extract `allergenId`
4. **Input Validation** → Validate request body against Zod schema:
   - Check allergenId is present
   - Validate UUID format
5. **Service Call** → Call `addAllergenToUser(supabase, userId, allergenId)` from allergen service
6. **Business Logic** (in service):
   - Verify allergen exists in `allergens` table
   - Check if user already has this allergen in `user_allergens`
   - If duplicate, throw conflict error
   - If not exists, insert into `user_allergens`
7. **Database Insert** → Insert new record:
   ```sql
   INSERT INTO user_allergens (user_id, allergen_id)
   VALUES ($1, $2)
   RETURNING *
   ```
8. **Fetch Complete Data** → Join with `allergens` table to get allergen name:
   ```sql
   SELECT ua.allergen_id, a.id, a.name_pl, ua.created_at
   FROM user_allergens ua
   INNER JOIN allergens a ON ua.allergen_id = a.id
   WHERE ua.user_id = $1 AND ua.allergen_id = $2
   ```
9. **Data Mapping** → Convert database entity to DTO (snake_case → camelCase)
10. **Response Formation** → Wrap in response object: `{ success: true, allergen: dto }`
11. **Response Return** → Send JSON response with 201 status code

## 6. Security Considerations

### Authentication

- **Requirement**: User must be authenticated via Supabase Auth
- **Implementation**: Use `context.locals.supabase.auth.getUser()` to validate session
- **Development**: Mock user ID for development (add TODO comment for production)
- **Protection**: Return 401 if authentication fails

### Authorization

- **Data Isolation**: Users can only add allergens to their own profile
- **Implementation**: Use authenticated user's ID from session, NOT from request body
- **Protection**: Supabase Row Level Security (RLS) should be enabled on `user_allergens` table
- **Threat Prevention**: Prevents users from adding allergens to other users' profiles

### Input Validation

- **allergenId Validation**:
  - Must be present (required field)
  - Must be valid UUID format
  - Must exist in `allergens` table
- **Implementation**: Zod schema validation before database operations
- **SQL Injection Prevention**: Supabase SDK uses parameterized queries
- **XSS Prevention**: No HTML content in allergen names

### Data Integrity

- **Duplicate Prevention**: Check if allergen already exists for user
- **Foreign Key Constraint**: `allergen_id` must reference existing allergen
- **Unique Constraint**: Database should have unique constraint on (user_id, allergen_id)
- **Cascading**: On user deletion, allergens cascade delete (per schema)

### Rate Limiting

- **Current**: Not implemented
- **Future Consideration**: Add rate limiting middleware to prevent spam
- **Typical Limit**: 10 allergens per minute per user

## 7. Error Handling

### Error Scenarios and Handling Strategy

**1. Authentication Failure (401)**

- **Scenario**: User not logged in, invalid token, expired session
- **Handling**: Early return with 401 status before any processing
- **Logging**: Log authentication attempt without sensitive data
- **Response**: `{ error: "Unauthorized", message: "Authentication required" }`

**2. Missing Request Body (400)**

- **Scenario**: POST request without body or empty body
- **Handling**: JSON parse error, return 400
- **Logging**: Log malformed request
- **Response**: `{ error: "Bad Request", message: "Request body required" }`

**3. Invalid allergenId Format (400)**

- **Scenario**: allergenId is not a valid UUID (e.g., "abc", "123", empty string)
- **Handling**: Zod validation fails, return 400 with validation error
- **Logging**: Log validation error with received value
- **Response**: `{ error: "Bad Request", message: "Invalid allergen ID format" }`

**4. Allergen Not Found (400)**

- **Scenario**: Valid UUID but allergen doesn't exist in `allergens` table
- **Handling**: Service checks allergen existence, throws error if not found
- **Logging**: Log allergen ID that was not found
- **Response**: `{ error: "Bad Request", message: "Allergen not found" }`

**5. Duplicate Allergen (409)**

- **Scenario**: User already has this allergen in their profile
- **Handling**: Service checks for duplicate before insert, throws conflict error
- **Logging**: Log duplicate attempt (info level, not error)
- **Response**: `{ error: "Conflict", message: "Allergen already added to profile" }`

**6. Database Insert Failure (500)**

- **Scenario**: Insert query fails due to connection, constraints, etc.
- **Handling**: Catch exception, return 500
- **Logging**: Log full error with stack trace
- **Response**: `{ error: "Internal Server Error", message: "An unexpected error occurred" }`

**7. Service Layer Exception (500)**

- **Scenario**: Unexpected error in service logic
- **Handling**: Catch in API route, return 500
- **Logging**: Log error with full context
- **Response**: `{ error: "Internal Server Error", message: "An unexpected error occurred" }`

### Error Logging Pattern

```typescript
// Validation errors (debug level)
console.debug("[POST /api/profile/allergens] Validation error:", {
  allergenId: body.allergenId,
  error: validationError.message,
});

// Conflict errors (info level)
console.info("[POST /api/profile/allergens] Duplicate allergen:", {
  userId,
  allergenId,
});

// Server errors (error level)
console.error("[POST /api/profile/allergens] Error:", {
  error: error instanceof Error ? error.message : "Unknown error",
  stack: error instanceof Error ? error.stack : undefined,
  userId,
  allergenId,
});
```

### Custom Error Classes

```typescript
// For cleaner error handling in service layer
export class AllergenNotFoundError extends Error {
  constructor(allergenId: string) {
    super(`Allergen not found: ${allergenId}`);
    this.name = "AllergenNotFoundError";
  }
}

export class AllergenAlreadyExistsError extends Error {
  constructor(allergenId: string) {
    super(`Allergen already exists: ${allergenId}`);
    this.name = "AllergenAlreadyExistsError";
  }
}
```

## 8. Performance Considerations

### Potential Bottlenecks

1. **Multiple Database Queries**: Check existence + check duplicate + insert + fetch result
2. **Network Latency**: Round-trip time to Supabase (3-4 queries)
3. **Transaction Overhead**: Ensuring atomicity of operations

### Optimization Strategies

**Database Level**:

- **Indexes**: Ensure indexes on:
  - `allergens.id` (primary key, auto-indexed)
  - `user_allergens.user_id` (foreign key, likely indexed)
  - `user_allergens.allergen_id` (foreign key, likely indexed)
  - Composite unique index on `(user_id, allergen_id)`
- **Constraints**: Use database constraints for duplicate prevention

**Query Optimization**:

```typescript
// Option 1: Let database handle duplicate check via unique constraint
// Catch unique violation error and return 409

// Option 2: Use upsert with ON CONFLICT (more efficient)
.upsert({ user_id: userId, allergen_id: allergenId }, { onConflict: 'user_id,allergen_id' })

// Option 3: Combine existence and duplicate check in service
// Single query to check allergen exists and user doesn't have it yet
```

**Recommended Approach**: Use database unique constraint and catch the error, reducing application-level checks.

**Transaction Considerations**:

- Current approach: Individual queries (Supabase auto-transactions)
- Alternative: Use Supabase transaction (if multiple operations needed)
- For this simple insert: Transactions not necessary

**Caching**:

- **Allergen Master List**: Could cache list of valid allergen IDs (rarely changes)
- **User Allergens**: No caching needed (write operation)
- **Current Implementation**: No caching (always fresh data)

**Expected Performance**:

- **Validation Time**: < 1ms (Zod validation)
- **Database Operations**:
  - Check allergen exists: ~20ms
  - Check duplicate: ~20ms (or rely on unique constraint)
  - Insert: ~30ms
  - Fetch result: ~20ms
- **Total Response Time**: < 150ms (including auth validation)
- **Payload Size**: < 200 bytes

### Scalability Considerations

- **Write Frequency**: Low (users add allergens infrequently)
- **Concurrent Writes**: Unlikely (same user adding multiple allergens simultaneously)
- **Database Load**: Minimal (simple insert operations)
- **Bottleneck**: None expected for typical usage patterns

## 9. Implementation Steps

### Step 1: Create Zod Validation Schema

**File**: `src/pages/api/profile/allergens.ts` (add to existing file)

**Tasks**:

1. Import Zod at the top of the file:

   ```typescript
   import { z } from "zod";
   ```

2. Define validation schema:

   ```typescript
   const AddAllergenSchema = z.object({
     allergenId: z.string().uuid("Invalid allergen ID format"),
   });
   ```

3. Create helper function for request body parsing:
   ```typescript
   function parseRequestBody(body: unknown) {
     try {
       return AddAllergenSchema.parse(body);
     } catch (error) {
       if (error instanceof z.ZodError) {
         throw new Error(error.errors[0].message);
       }
       throw error;
     }
   }
   ```

### Step 2: Add Service Functions to allergen.service.ts

**File**: `src/lib/services/allergen.service.ts`

**Tasks**:

1. Add custom error classes at the top:

   ```typescript
   export class AllergenNotFoundError extends Error {
     constructor(allergenId: string) {
       super(`Allergen not found: ${allergenId}`);
       this.name = "AllergenNotFoundError";
     }
   }

   export class AllergenAlreadyExistsError extends Error {
     constructor(allergenId: string) {
       super(`Allergen already exists: ${allergenId}`);
       this.name = "AllergenAlreadyExistsError";
     }
   }
   ```

2. Implement `checkAllergenExists()` helper:

   ```typescript
   /**
    * Check if allergen exists in the allergens table
    * @param supabase - Supabase client instance
    * @param allergenId - Allergen ID to check
    * @returns true if exists, false otherwise
    * @throws Error if database query fails
    */
   async function checkAllergenExists(supabase: SupabaseClient<Database>, allergenId: string): Promise<boolean> {
     const { data, error } = await supabase.from("allergens").select("id").eq("id", allergenId).single();

     if (error) {
       // PGRST116 = "not found" error code
       if (error.code === "PGRST116") {
         return false;
       }
       throw error;
     }

     return data !== null;
   }
   ```

3. Implement `checkUserHasAllergen()` helper:

   ```typescript
   /**
    * Check if user already has this allergen
    * @param supabase - Supabase client instance
    * @param userId - User ID
    * @param allergenId - Allergen ID
    * @returns true if user has allergen, false otherwise
    * @throws Error if database query fails
    */
   async function checkUserHasAllergen(
     supabase: SupabaseClient<Database>,
     userId: string,
     allergenId: string
   ): Promise<boolean> {
     const { data, error } = await supabase
       .from("user_allergens")
       .select("allergen_id")
       .eq("user_id", userId)
       .eq("allergen_id", allergenId)
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

4. Implement main `addAllergenToUser()` function:

   ```typescript
   /**
    * Add allergen to user's profile
    * @param supabase - Supabase client instance from context.locals
    * @param userId - User ID from authentication session
    * @param allergenId - Allergen ID to add
    * @returns UserAllergenDTO with added allergen data
    * @throws AllergenNotFoundError if allergen doesn't exist
    * @throws AllergenAlreadyExistsError if user already has this allergen
    * @throws Error if database operation fails
    */
   export async function addAllergenToUser(
     supabase: SupabaseClient<Database>,
     userId: string,
     allergenId: string
   ): Promise<UserAllergenDTO> {
     // Check if allergen exists
     const allergenExists = await checkAllergenExists(supabase, allergenId);
     if (!allergenExists) {
       throw new AllergenNotFoundError(allergenId);
     }

     // Check if user already has this allergen
     const userHasAllergen = await checkUserHasAllergen(supabase, userId, allergenId);
     if (userHasAllergen) {
       throw new AllergenAlreadyExistsError(allergenId);
     }

     // Insert new user allergen
     const { error: insertError } = await supabase.from("user_allergens").insert({
       user_id: userId,
       allergen_id: allergenId,
     });

     if (insertError) {
       throw insertError;
     }

     // Fetch the newly added allergen with complete data
     const { data, error: fetchError } = await supabase
       .from("user_allergens")
       .select("allergen_id, created_at, allergens(id, name_pl)")
       .eq("user_id", userId)
       .eq("allergen_id", allergenId)
       .single();

     if (fetchError || !data) {
       throw fetchError || new Error("Failed to fetch added allergen");
     }

     return mapToDTO(data);
   }
   ```

5. Update imports to include new error classes in exports

### Step 3: Implement POST Handler in API Route

**File**: `src/pages/api/profile/allergens.ts`

**Tasks**:

1. Add imports at the top:

   ```typescript
   import { z } from "zod";
   import {
     addAllergenToUser,
     AllergenNotFoundError,
     AllergenAlreadyExistsError,
   } from "../../../lib/services/allergen.service";
   ```

2. Add the validation schema (as defined in Step 1)

3. Implement POST handler:

   ```typescript
   /**
    * POST /api/profile/allergens
    * Adds a new allergen to the current authenticated user's profile
    *
    * Request body: { allergenId: string (UUID) }
    *
    * Returns:
    * - 201: Successfully added allergen with data
    * - 400: Bad Request (invalid ID, allergen not found)
    * - 401: Unauthorized (authentication required) - currently commented for development
    * - 409: Conflict (allergen already added)
    * - 500: Internal server error
    */
   export const POST: APIRoute = async (context) => {
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
       const userId = "550e8400-e29b-41d4-a716-446655440000";

       // ========================================
       // REQUEST BODY PARSING AND VALIDATION
       // ========================================

       let body: unknown;
       try {
         body = await context.request.json();
       } catch (error) {
         return new Response(
           JSON.stringify({
             error: "Bad Request",
             message: "Invalid JSON in request body",
           }),
           {
             status: 400,
             headers: { "Content-Type": "application/json" },
           }
         );
       }

       // Validate request body
       let validatedData: z.infer<typeof AddAllergenSchema>;
       try {
         validatedData = AddAllergenSchema.parse(body);
       } catch (error) {
         if (error instanceof z.ZodError) {
           return new Response(
             JSON.stringify({
               error: "Bad Request",
               message: error.errors[0].message,
             }),
             {
               status: 400,
               headers: { "Content-Type": "application/json" },
             }
           );
         }
         throw error;
       }

       // ========================================
       // ADD ALLERGEN TO USER PROFILE
       // ========================================

       const allergen = await addAllergenToUser(context.locals.supabase, userId, validatedData.allergenId);

       // Success response
       return new Response(
         JSON.stringify({
           success: true,
           allergen,
         }),
         {
           status: 201,
           headers: { "Content-Type": "application/json" },
         }
       );
     } catch (error) {
       // Handle specific business logic errors
       if (error instanceof AllergenNotFoundError) {
         return new Response(
           JSON.stringify({
             error: "Bad Request",
             message: "Allergen not found",
           }),
           {
             status: 400,
             headers: { "Content-Type": "application/json" },
           }
         );
       }

       if (error instanceof AllergenAlreadyExistsError) {
         console.info("[POST /api/profile/allergens] Duplicate allergen attempt:", {
           userId: userId,
           error: error.message,
         });

         return new Response(
           JSON.stringify({
             error: "Conflict",
             message: "Allergen already added to profile",
           }),
           {
             status: 409,
             headers: { "Content-Type": "application/json" },
           }
         );
       }

       // Log unexpected errors
       console.error("[POST /api/profile/allergens] Error:", {
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

### Step 4: Test the Endpoint

**Manual Testing**:

1. Start development server: `npm run dev`
2. Test successful addition:
   ```bash
   curl -X POST http://localhost:3000/api/profile/allergens \
     -H "Content-Type: application/json" \
     -d '{"allergenId": "valid-allergen-uuid-here"}'
   ```
3. Test with invalid UUID:
   ```bash
   curl -X POST http://localhost:3000/api/profile/allergens \
     -H "Content-Type: application/json" \
     -d '{"allergenId": "not-a-uuid"}'
   ```
4. Test duplicate addition (run same valid request twice)
5. Test with non-existent allergen:
   ```bash
   curl -X POST http://localhost:3000/api/profile/allergens \
     -H "Content-Type: application/json" \
     -d '{"allergenId": "550e8400-e29b-41d4-a716-446655440099"}'
   ```
6. Test with missing body:
   ```bash
   curl -X POST http://localhost:3000/api/profile/allergens \
     -H "Content-Type: application/json"
   ```

**Test Cases**:

- ✅ Valid allergen ID returns 201 with allergen data
- ✅ Invalid UUID format returns 400
- ✅ Non-existent allergen returns 400
- ✅ Duplicate allergen returns 409
- ✅ Missing request body returns 400
- ✅ Invalid JSON returns 400
- ✅ Unauthenticated request returns 401 (when auth enabled)
- ✅ Response structure matches API spec
- ✅ Timestamp is properly formatted (ISO 8601)
- ✅ Verify allergen appears in GET /api/profile/allergens after POST

**Expected Responses**:

Success (201):

```json
{
  "success": true,
  "allergen": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Gluten",
    "createdAt": "2025-10-12T14:30:00.123Z"
  }
}
```

Invalid UUID (400):

```json
{
  "error": "Bad Request",
  "message": "Invalid allergen ID format"
}
```

Allergen not found (400):

```json
{
  "error": "Bad Request",
  "message": "Allergen not found"
}
```

Duplicate (409):

```json
{
  "error": "Conflict",
  "message": "Allergen already added to profile"
}
```

### Step 5: Database Verification

**Tasks**:

1. Verify unique constraint exists on `user_allergens` table:
   - Constraint on `(user_id, allergen_id)` should prevent duplicates at DB level
   - If not exists, consider adding for extra safety

2. Verify foreign key constraints:
   - `user_allergens.allergen_id` → `allergens.id` should have FK constraint
   - `user_allergens.user_id` → `profiles.user_id` should have FK constraint

3. Check indexes for performance:

   ```sql
   -- Check indexes on user_allergens table
   SELECT indexname, indexdef
   FROM pg_indexes
   WHERE tablename = 'user_allergens';
   ```

4. Verify Row Level Security (RLS) policies:
   - Users should only be able to insert allergens for themselves
   - Check Supabase dashboard for RLS policies on `user_allergens` table

### Step 6: Type Safety Verification

**Tasks**:

1. Run TypeScript compiler: `npx tsc --noEmit`
2. Verify no type errors in:
   - `allergen.service.ts`
   - `allergens.ts` API route
3. Check that:
   - Zod schema types match `AddAllergenCommand`
   - Service function return type matches `UserAllergenDTO`
   - Error classes extend Error properly
   - Supabase query types are inferred correctly

**Common Type Issues to Watch**:

- Ensure Zod schema validation result is properly typed
- Verify error class constructors are typed correctly
- Check that service function parameters match expected types
- Ensure DTO mapping handles null/undefined properly

### Step 7: Code Quality Checks

**Tasks**:

1. Run linter: `npm run lint`
2. Run formatter: `npm run format`
3. Fix any linting errors or warnings
4. Ensure code follows project conventions:
   - Early returns for errors (guard clauses)
   - Proper error logging with context
   - Clear comments and JSDoc documentation
   - No console.log statements (only console.error/info/debug)
   - Consistent error handling patterns

**Code Review Checklist**:

- [ ] All functions have JSDoc comments
- [ ] Error messages are user-friendly
- [ ] Server errors are logged with full context
- [ ] No sensitive data in logs or error messages
- [ ] Input validation happens before business logic
- [ ] Service functions are properly typed
- [ ] Error classes follow naming conventions
- [ ] Mock authentication has TODO comment
- [ ] Status codes match API specification
- [ ] Response structure matches API specification

### Step 8: Integration Testing

**Tasks**:

1. Test complete workflow:
   - User has no allergens → GET returns empty array
   - POST valid allergen → Returns 201
   - GET again → Returns array with new allergen
   - POST same allergen → Returns 409
   - GET again → Still has only one instance of allergen

2. Test error scenarios:
   - POST with invalid UUID → 400
   - POST with non-existent allergen → 400
   - POST without authentication (when enabled) → 401

3. Verify data persistence:
   - Check database directly to ensure record was inserted
   - Verify timestamp is stored correctly
   - Check foreign key relationships are maintained

4. Cross-endpoint consistency:
   - Allergen added via POST appears in GET response
   - Data format is consistent between endpoints
   - Timestamps match between POST response and GET response

### Step 9: Documentation

**Tasks**:

1. Ensure JSDoc comments are complete and accurate
2. Document error scenarios in comments
3. Add usage examples in comments
4. Update API documentation (if external docs exist)
5. Document any assumptions or limitations:
   - Uses mock authentication for development
   - Relies on database unique constraint for duplicate prevention
   - No rate limiting implemented yet

**Documentation Notes**:

- Endpoint uses mock authentication for development (TODO for production)
- Returns 409 for duplicate allergens (idempotent behavior could be considered)
- Validates allergen existence before allowing addition
- Uses custom error classes for better error handling
- Response uses `name` field (not `namePl`) for consistency with GET endpoint

---

## Summary

This implementation follows established patterns in the codebase and adheres to all specified rules:

✅ **Astro Best Practices**:

- Uses Astro API routes with uppercase POST handler
- `export const prerender = false` for dynamic routes
- Uses `context.locals.supabase` for database access
- Proper async/await error handling

✅ **Backend Best Practices**:

- Extracts all business logic to `allergen.service.ts`
- Uses Zod schema for input validation
- Proper separation of concerns (route → validation → service → database)
- Custom error classes for specific business logic errors

✅ **Code Quality**:

- Early returns for error conditions (guard clauses)
- Proper error logging with appropriate levels (debug, info, error)
- Type-safe implementation throughout
- Clear, descriptive function names and comments
- No deeply nested conditionals

✅ **Security**:

- Authentication required (mocked for development)
- User data isolation (can only add to own profile)
- Input validation prevents invalid UUIDs
- No SQL injection vulnerability (parameterized queries)
- Generic error messages to clients, detailed logs server-side
- Authorization enforced through authenticated user ID from session

✅ **Error Handling**:

- All error scenarios covered (400, 401, 409, 500)
- Custom error classes for business logic errors
- Proper HTTP status codes for each scenario
- User-friendly error messages
- Detailed server-side logging

✅ **Type System**:

- Uses existing `AddAllergenCommand` type
- Returns `UserAllergenDTO` matching GET endpoint
- Zod schema provides runtime validation
- Type-safe Supabase client from `context.locals`
- Custom error classes properly typed

✅ **Performance**:

- Efficient database queries with specific field selection
- Leverages database indexes and constraints
- Minimal round trips (3-4 queries total)
- Expected response time < 150ms

**Production Readiness Checklist**:

Before deploying to production:

1. [ ] Uncomment authentication block in POST handler
2. [ ] Remove mock user ID
3. [ ] Verify Supabase RLS policies are enabled and correct
4. [ ] Ensure database has unique constraint on (user_id, allergen_id)
5. [ ] Test with real authentication tokens
6. [ ] Load test with expected user volumes
7. [ ] Set up monitoring and alerting for errors
8. [ ] Consider adding rate limiting middleware
9. [ ] Review and update error messages if needed
10. [ ] Document endpoint in external API documentation

**Future Enhancements**:

- Rate limiting to prevent abuse
- Batch allergen addition (POST multiple allergens at once)
- DELETE endpoint to remove allergens
- Allergen suggestions based on user profile
- Analytics on most common allergens
