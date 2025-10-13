# API Endpoint Implementation Plan: GET /api/allergens

## 1. Endpoint Overview

This endpoint retrieves all allergens available in the system. It is publicly accessible and does not require authentication. The endpoint returns a comprehensive list of allergens that users can reference when setting up their dietary preferences.

**Key characteristics:**

- Public access (no authentication required)
- Read-only operation
- Returns complete allergen catalog
- Simple listing with no filtering or pagination

## 2. Request Details

- **HTTP Method**: GET
- **URL Structure**: `/api/allergens`
- **Parameters**:
  - Required: None
  - Optional: None
- **Request Body**: None
- **Authentication**: Optional (endpoint is publicly accessible)

## 3. Used Types

### Response DTO

**AllergenDTO** (already exists in `src/types.ts:28-32`):

```typescript
export interface AllergenDTO {
  id: string;
  name: string;
  createdAt: string;
}
```

**Note**: The API specification shows `namePl` in the response, but the existing DTO uses `name`. The database field is `name`. The service layer should map `name` to `name` in the DTO to maintain consistency with existing code.
In the response, the field will be `name` (not `namePl`).
Update the API documentation to reflect this change.
Prepare Supabase migration to rename `name` to `name` in the `allergens` table in the future.

### Response Structure

```typescript
{
  allergens: AllergenDTO[]
}
```

## 4. Response Details

### Success Response (200 OK)

```json
{
  "allergens": [
    {
      "id": "uuid",
      "name": "Gluten",
      "createdAt": "2025-10-11T12:00:00Z"
    },
    {
      "id": "uuid",
      "name": "Lactose",
      "createdAt": "2025-10-11T12:00:00Z"
    }
  ]
}
```

**Status Code**: 200
**Content-Type**: application/json

### Error Response (500 Internal Server Error)

```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

**Status Code**: 500
**Content-Type**: application/json

## 5. Data Flow

1. **Request Reception**: Astro API route handler receives GET request
2. **Service Invocation**: Call `getAllAllergens(supabase)` from allergen.service.ts
3. **Database Query**: Service queries `allergens` table via Supabase client
   - Select: `id, name, created_at`
   - Order by: `created_at DESC` (newest first)
4. **Data Mapping**: Transform database entities to AllergenDTO format
   - Map `name` → `name`
   - Map `created_at` → `createdAt`
5. **Response**: Return JSON with allergens array wrapped in object
6. **Error Handling**: Catch any errors, log with context, return 500 status

### Database Interaction

**Table**: `allergens`
**Fields**: `id`, `name`, `created_at`
**Query Type**: SELECT (read-only)
**Ordering**: By `created_at` descending

## 6. Security Considerations

### Authentication & Authorization

- **No authentication required** - endpoint is publicly accessible
- Any user (authenticated or anonymous) can access allergen list
- This is intentional as allergens are reference data needed before user registration

### Data Exposure

- Allergen data is non-sensitive reference information
- Safe to expose publicly
- No user-specific data in response

### Input Validation

- No input parameters to validate
- No request body to sanitize
- No query parameters to parse

### Security Best Practices

- Follow principle of least privilege (read-only access)
- Don't expose database error details to client
- Log errors server-side for debugging
- Consider rate limiting at infrastructure/middleware level (not in endpoint code)

### Potential Threats

- **Risk Level**: Low
- **DOS/Rate Limiting**: Could be called repeatedly, but response is lightweight
- **Data Injection**: N/A (no user input)
- **Information Disclosure**: Minimal risk (public reference data)

## 7. Error Handling

### Error Scenarios

| Scenario                  | Status Code | Response              | Action                                  |
| ------------------------- | ----------- | --------------------- | --------------------------------------- |
| Successful retrieval      | 200         | Array of allergens    | Return data                             |
| Empty allergens table     | 200         | Empty array `[]`      | Return empty array (not an error)       |
| Database connection error | 500         | Generic error message | Log error, return 500                   |
| Supabase query error      | 500         | Generic error message | Log error with stack trace, return 500  |
| Unexpected exception      | 500         | Generic error message | Log error with full context, return 500 |

### Error Response Format

All errors return the same structure:

```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

### Logging Strategy

Log errors with the following information:

```typescript
console.error("[GET /api/allergens] Error:", {
  error: error instanceof Error ? error.message : "Unknown error",
  stack: error instanceof Error ? error.stack : undefined,
});
```

**Important**: Never expose internal error messages, stack traces, or database details to the client.

## 8. Performance Considerations

### Database Query Optimization

- Simple SELECT query on single table
- No joins, complex filters, or aggregations
- Allergens table expected to be small (< 100 rows typically)
- Query should execute in < 10ms

### Caching Opportunities

- Allergen data changes infrequently
- Consider HTTP caching headers (Cache-Control, ETag) in future
- Could implement server-side caching if needed (not in initial implementation)

### Response Size

- Minimal payload size (array of small objects)
- Typically < 5KB response
- No pagination needed due to small dataset

### Bottlenecks

- **Unlikely**: Database query is simple and fast
- **Database Connection**: Supabase connection already pooled via context.locals
- **Network Latency**: Minimal due to small response size

## 9. Implementation Steps

### Step 1: Add `getAllAllergens` function to allergen.service.ts

**File**: `src/lib/services/allergen.service.ts`

Add new function to the PUBLIC FUNCTIONS section:

```typescript
/**
 * Get all allergens
 * @param supabase - Supabase client instance from context.locals
 * @returns Array of AllergenDTO (empty array if no allergens)
 * @throws Error if database query fails
 */
export async function getAllAllergens(supabase: SupabaseClient): Promise<AllergenDTO[]> {
  const { data, error } = await supabase
    .from("allergens")
    .select("id, name, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    return [];
  }

  return data.map(mapAllergenToDTO);
}
```

Add helper type and mapping function:

```typescript
/**
 * Type for allergen query result from database
 */
interface AllergenQueryResult {
  id: string;
  name: string;
  created_at: string;
}

/**
 * Map database allergen entity to DTO
 * Converts snake_case to camelCase
 */
function mapAllergenToDTO(dbAllergen: AllergenQueryResult): AllergenDTO {
  return {
    id: dbAllergen.id,
    name: dbAllergen.name,
    createdAt: dbAllergen.created_at,
  };
}
```

**Location**: Add after line 221 in the PUBLIC FUNCTIONS section

### Step 2: Create the API route file

**File**: `src/pages/api/allergens.ts`

```typescript
import type { APIRoute } from "astro";
import { getAllAllergens } from "../../lib/services/allergen.service";

export const prerender = false;

/**
 * GET /api/allergens
 * Retrieves all allergens (publicly accessible)
 *
 * Returns:
 * - 200: Array of AllergenDTO wrapped in { allergens: [] }
 * - 500: Internal server error
 */
export const GET: APIRoute = async (context) => {
  try {
    // ========================================
    // FETCH ALL ALLERGENS
    // ========================================

    const allergens = await getAllAllergens(context.locals.supabase);

    // Success response
    return new Response(JSON.stringify({ allergens }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Log error with context
    console.error("[GET /api/allergens] Error:", {
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

**Location**: Create new file at `src/pages/api/allergens.ts`

### Step 3: Test the endpoint

1. **Start development server**: `npm run dev`
2. **Test with curl**:
   ```bash
   curl http://localhost:3000/api/allergens
   ```
3. **Expected response**:
   ```json
   {
     "allergens": [
       {
         "id": "uuid",
         "name": "Gluten",
         "createdAt": "2025-10-11T12:00:00Z"
       }
     ]
   }
   ```
4. **Verify**:
   - Status code is 200
   - Response contains `allergens` array
   - Each allergen has `id`, `name`, and `createdAt` fields
   - Allergens are ordered by creation date (newest first)

### Step 4: Test error scenarios

1. **Temporarily break database connection** to verify error handling
2. **Check logs** for proper error logging format
3. **Verify** client receives generic error message (no internal details exposed)

### Step 5: Code review checklist

- [ ] Service function follows existing patterns (similar to getAllTags)
- [ ] DTO mapping correctly converts snake_case to camelCase
- [ ] API route uses `context.locals.supabase` (not direct import)
- [ ] Error handling logs context without exposing details to client
- [ ] `export const prerender = false` is set
- [ ] HTTP method handler is uppercase (GET not get)
- [ ] Response includes proper Content-Type header
- [ ] Code follows project structure and conventions
- [ ] No linting errors (`npm run lint`)
- [ ] TypeScript compiles without errors
