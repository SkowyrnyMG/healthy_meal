# API Endpoint Implementation Plan: GET /api/tags

## 1. Endpoint Overview

This endpoint provides public access to all recipe tags available in the system. Tags are used for recipe categorization (e.g., "Śniadanie" for breakfast recipes). The endpoint is publicly accessible without authentication, making it suitable for both anonymous users browsing recipes and authenticated users creating or filtering recipes.

**Key Characteristics:**

- Read-only operation
- No authentication required
- Returns all tags from the database
- Simple response structure with tag metadata

## 2. Request Details

- **HTTP Method**: GET
- **URL Structure**: `/api/tags`
- **Parameters**:
  - Required: None
  - Optional: None
- **Request Body**: N/A (GET request)
- **Authentication**: Optional (endpoint is publicly accessible)
- **Headers**: No special headers required

## 3. Used Types

### Existing Types (from `src/types.ts`)

```typescript
/**
 * Tag DTO for recipe categorization
 * Mapped from tags table
 */
export interface TagDTO {
  id: string; // UUID
  name: string; // Polish name (e.g., "Śniadanie")
  slug: string; // URL-friendly slug (e.g., "sniadanie")
  createdAt: string; // ISO 8601 timestamp
}
```

### Response Type

```typescript
{
  tags: TagDTO[]
}
```

**Note**: No command models needed since this is a read-only GET endpoint with no input parameters.

## 4. Response Details

### Success Response (200 OK)

```json
{
  "tags": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Śniadanie",
      "slug": "sniadanie",
      "createdAt": "2025-10-11T12:00:00Z"
    },
    {
      "id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
      "name": "Obiad",
      "slug": "obiad",
      "createdAt": "2025-10-11T12:05:00Z"
    }
  ]
}
```

**Empty Response** (still 200 OK):

```json
{
  "tags": []
}
```

### Error Response (500 Internal Server Error)

```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

## 5. Data Flow

1. **Request Reception**: Astro API route receives GET request at `/api/tags`
2. **Service Invocation**: Route handler calls `getAllTags(supabase)` from tag service
3. **Database Query**: Service queries `tags` table via Supabase client
   - `SELECT id, name, slug, created_at FROM tags`
   - Ordered by `created_at` (descending) for consistent ordering
4. **Data Mapping**: Service maps database snake_case fields to camelCase DTOs
5. **Response**: Route handler wraps DTOs in response object and returns JSON

**Database Schema Reference**:

- Table: `tags`
- Fields: `id`, `name`, `slug`, `created_at`
- Relationships: Used in M:M relationship with recipes via `recipe_tags` junction table

## 6. Security Considerations

### Public Access

- **No Authentication Required**: Endpoint is intentionally public
- **Data Sensitivity**: Tags contain no sensitive information (just category names)
- **Use Case**: Required for anonymous users browsing public recipes

### Data Protection

- **SQL Injection**: Protected by Supabase SDK's parameterized queries
- **XSS Prevention**: JSON responses are automatically escaped by browser
- **CORS**: Handled by Astro middleware (if configured)

### Future Considerations

- **Rate Limiting**: Could implement if abuse is detected
- **Caching**: Consider adding HTTP cache headers (e.g., `Cache-Control: public, max-age=3600`)
- **CDN**: Tags change infrequently, could be cached at CDN level

## 7. Error Handling

### Error Scenarios

| Scenario                  | Status Code | Response              | Handling                               |
| ------------------------- | ----------- | --------------------- | -------------------------------------- |
| Successful retrieval      | 200         | `{ tags: TagDTO[] }`  | Return data (empty array is valid)     |
| Database connection error | 500         | Generic error message | Log error, return safe message         |
| Supabase query error      | 500         | Generic error message | Log error details with stack trace     |
| Unexpected exception      | 500         | Generic error message | Log error, prevent information leakage |

### Error Logging Strategy

```typescript
console.error("[GET /api/tags] Error:", {
  error: error instanceof Error ? error.message : "Unknown error",
  stack: error instanceof Error ? error.stack : undefined,
});
```

**Key Principles**:

- Structured logging with endpoint identifier
- Include error message and stack trace for debugging
- Never expose internal error details to client
- Log all errors even if they seem minor

## 8. Performance Considerations

### Potential Bottlenecks

- **Database Query**: Tags table is small, but should monitor query performance
- **Network Latency**: Consider geographic distribution of Supabase instance

### Optimization Strategies

1. **Database Indexing**
   - Ensure `created_at` has index for ordering
   - Primary key `id` already indexed

2. **Caching**
   - **Response Caching**: Add `Cache-Control` headers
   - **Database Caching**: Supabase provides connection pooling
   - **Application Caching**: Could cache in memory if tags rarely change

3. **Pagination**
   - Not needed initially (tags are limited in number)
   - Add if tag count exceeds 100

4. **Response Size**
   - Current response is minimal (only 4 fields per tag)
   - Consider compression for larger datasets

### Performance Targets

- **Response Time**: < 100ms for typical requests
- **Throughput**: Handle 1000+ requests/minute
- **Cache Hit Ratio**: > 90% if caching implemented

## 9. Implementation Steps

### Step 1: Create Tag Service (`src/lib/services/tag.service.ts`)

Create the service layer following the established pattern:

```typescript
import type { SupabaseClient } from "../../db/supabase.client";
import type { TagDTO } from "../../types";

/**
 * Get all recipe tags
 * @param supabase - Supabase client instance from context.locals
 * @returns Array of TagDTO (empty array if no tags)
 * @throws Error if database query fails
 */
export async function getAllTags(supabase: SupabaseClient): Promise<TagDTO[]> {
  const { data, error } = await supabase
    .from("tags")
    .select("id, name, slug, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    return [];
  }

  return data.map(mapToDTO);
}

/**
 * Type for tag query result from database
 */
interface TagQueryResult {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

/**
 * Map database tag entity to DTO
 * Converts snake_case to camelCase
 */
function mapToDTO(dbTag: TagQueryResult): TagDTO {
  return {
    id: dbTag.id,
    name: dbTag.name,
    slug: dbTag.slug,
    createdAt: dbTag.created_at,
  };
}
```

**Key Details**:

- Follow established service pattern from `allergen.service.ts`
- Use proper TypeScript types from `SupabaseClient` and `TagDTO`
- Order by `created_at` descending for consistent results
- Map snake_case database fields to camelCase DTO
- Return empty array instead of null for no results
- Let database errors bubble up to route handler

### Step 2: Create API Route (`src/pages/api/tags.ts`)

Create the API endpoint following Astro conventions:

```typescript
import type { APIRoute } from "astro";
import { getAllTags } from "../../lib/services/tag.service";

export const prerender = false;

/**
 * GET /api/tags
 * Retrieves all recipe tags (publicly accessible)
 *
 * Returns:
 * - 200: Array of TagDTO wrapped in { tags: [] }
 * - 500: Internal server error
 */
export const GET: APIRoute = async (context) => {
  try {
    // ========================================
    // FETCH ALL TAGS
    // ========================================

    const tags = await getAllTags(context.locals.supabase);

    // Success response
    return new Response(JSON.stringify({ tags }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Log error with context
    console.error("[GET /api/tags] Error:", {
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

**Key Details**:

- Use `export const prerender = false` for SSR
- Use uppercase `GET` method handler (Astro convention)
- Access Supabase via `context.locals.supabase`
- Follow error handling pattern from existing endpoints
- Use structured error logging
- Return generic error messages (don't leak internal details)
- No authentication check (public endpoint)

### Step 3: Test the Endpoint

**Manual Testing**:

```bash
# Test successful retrieval
curl -X GET http://localhost:3000/api/tags

# Expected response (example):
# {
#   "tags": [
#     {
#       "id": "...",
#       "name": "Śniadanie",
#       "slug": "sniadanie",
#       "createdAt": "2025-10-11T12:00:00Z"
#     }
#   ]
# }
```

**Test Cases**:

1. ✅ Returns 200 with array of tags
2. ✅ Returns 200 with empty array if no tags exist
3. ✅ Returns 500 if database connection fails
4. ✅ Returns proper Content-Type header
5. ✅ Tags are ordered by creation date (descending)

### Step 4: Verify Integration

**Integration Checklist**:

- [ ] Service function is properly exported
- [ ] Service uses correct SupabaseClient type
- [ ] API route uses context.locals.supabase
- [ ] Response matches API specification
- [ ] Error logging is structured and informative
- [ ] No TypeScript errors
- [ ] Follows project coding standards

### Step 5: Documentation and Review

**Documentation Tasks**:

- Implementation plan saved to `.ai/claude_prompts/endpoints/2_3_get_api_tags_view_implementation_plan.md`
- Code includes JSDoc comments
- Service functions are well-documented

**Code Review Checklist**:

- [ ] Follows established patterns from existing endpoints
- [ ] No hard-coded values or magic numbers
- [ ] Proper error handling with early returns
- [ ] TypeScript types are correct
- [ ] Consistent code formatting
- [ ] No security vulnerabilities

---

## Summary

This implementation plan provides a comprehensive guide for creating the GET /api/tags endpoint. The endpoint is straightforward due to being a read-only, public operation with no input parameters. The implementation follows established patterns in the codebase, ensuring consistency and maintainability.

**Key Implementation Points**:

1. Create `tag.service.ts` with `getAllTags()` function
2. Create `src/pages/api/tags.ts` with GET handler
3. Use `context.locals.supabase` for database access
4. Return `{ tags: TagDTO[] }` response structure
5. Handle errors gracefully with structured logging
6. No authentication required (public endpoint)

**Files to Create**:

- `src/lib/services/tag.service.ts` (new service)
- `src/pages/api/tags.ts` (new API route)

**Files Referenced**:

- `src/types.ts` (TagDTO already exists)
- `src/db/supabase.client.ts` (SupabaseClient type)
