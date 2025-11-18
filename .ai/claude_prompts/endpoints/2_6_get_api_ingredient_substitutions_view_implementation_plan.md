# API Endpoint Implementation Plan: GET /api/ingredient-substitutions

## 1. Endpoint Overview

This endpoint retrieves ingredient substitution suggestions from the knowledge base (`ingredient_substitutions` table). It allows users to search for healthier or alternative ingredients to use in their recipes. The endpoint supports filtering to show only healthier alternatives and uses case-insensitive ingredient matching.

**Authentication**: Required (mocked for development)
**Database Table**: `ingredient_substitutions`
**Service Layer**: New service file required (`ingredient-substitution.service.ts`)

## 2. Request Details

- **HTTP Method**: GET
- **URL Structure**: `/api/ingredient-substitutions`
- **Parameters**:
  - **Required**:
    - `ingredient` (query parameter): String, 1-100 characters, trimmed, case-insensitive search
  - **Optional**:
    - `healthierOnly` (query parameter): Boolean (parsed from string "true"/"false"), default: false
- **Request Body**: None (GET request)

### Query Parameter Examples

```
GET /api/ingredient-substitutions?ingredient=masło
GET /api/ingredient-substitutions?ingredient=masło&healthierOnly=true
```

## 3. Used Types

The following types already exist in `src/types.ts` and will be used:

### IngredientSubstitutionDTO (lines 221-241)

```typescript
export interface IngredientSubstitutionDTO {
  id: string;
  originalIngredient: string;
  substituteIngredient: string;
  nutritionComparison: {
    original: {
      calories: number;
      protein: number;
      fat: number;
      carbs: number;
    };
    substitute: {
      calories: number;
      protein: number;
      fat: number;
      carbs: number;
    };
  };
  healthier: boolean;
  createdAt: string;
}
```

### SubstitutionQueryParams (lines 246-249)

```typescript
export interface SubstitutionQueryParams {
  ingredient: string;
  healthierOnly?: boolean;
}
```

### Validation Schema (New - to be created in API route)

```typescript
const SubstitutionQueryParamsSchema = z.object({
  ingredient: z.string().trim().min(1, "Ingredient is required").max(100, "Ingredient must be at most 100 characters"),
  healthierOnly: z.coerce.boolean().optional().default(false),
});

type ValidatedSubstitutionQueryParams = z.infer<typeof SubstitutionQueryParamsSchema>;
```

## 4. Response Details

### Success Response (200 OK)

```json
{
  "originalIngredient": "masło",
  "substitutions": [
    {
      "id": "uuid",
      "substituteIngredient": "oliwa z oliwek",
      "nutritionComparison": {
        "original": {
          "calories": 717,
          "protein": 0.9,
          "fat": 81,
          "carbs": 0.1
        },
        "substitute": {
          "calories": 884,
          "protein": 0,
          "fat": 100,
          "carbs": 0
        }
      },
      "healthier": true,
      "createdAt": "2025-10-11T12:00:00Z"
    }
  ]
}
```

### Error Responses

**400 Bad Request**:

```json
{
  "error": "Bad Request",
  "message": "Ingredient is required"
}
```

**401 Unauthorized** (Production only):

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

## 5. Data Flow

1. **Request Reception**:
   - Astro API route handler receives GET request
   - Extract query parameters from URL

2. **Authentication** (Mocked):
   - Use hardcoded userId: `a85d6d6c-b7d4-4605-9cc4-3743401b67a0`
   - In production, uncomment real authentication using `context.locals.supabase.auth.getUser()`

3. **Input Validation**:
   - Extract `ingredient` and `healthierOnly` from query parameters
   - Validate using Zod schema
   - Return 400 error if validation fails

4. **Service Layer Call**:
   - Call `getIngredientSubstitutions()` from ingredient-substitution.service
   - Pass Supabase client and validated parameters

5. **Database Query**:
   - Query `ingredient_substitutions` table
   - Use ILIKE for case-insensitive search on `original_ingredient` column
   - Apply `healthier` filter if `healthierOnly=true`
   - Order results by `created_at` descending

6. **Data Mapping**:
   - Convert snake_case database fields to camelCase DTO fields
   - Parse JSON fields (`nutrition_comparison`)
   - Return array of `IngredientSubstitutionDTO`

7. **Response Formatting**:
   - Wrap substitutions in response object with `originalIngredient` field
   - Return 200 OK with JSON response

8. **Error Handling**:
   - Catch and log any errors
   - Return 500 error with generic message

## 6. Security Considerations

### Authentication & Authorization

- **Development**: Use mocked userId for easier testing
- **Production**: Require valid authentication via Supabase Auth
- **User Scope**: This endpoint returns global knowledge base data (not user-specific), so no additional authorization checks needed beyond authentication

### Input Validation

- **Zod Schema**: Prevents malformed input, SQL injection attempts, and invalid data types
- **String Trimming**: Remove leading/trailing whitespace from ingredient name
- **Length Limits**: Enforce 1-100 character limit on ingredient name
- **Boolean Coercion**: Safely parse string "true"/"false" to boolean

### SQL Injection Prevention

- **Parameterized Queries**: Supabase SDK uses parameterized queries automatically
- **ILIKE Operator**: Safe for use with user input when parameterized

### Data Exposure

- **Public Knowledge Base**: Substitution data is not sensitive (public knowledge base)
- **No User Data**: Response doesn't include any user-specific information
- **Nutrition Data**: Publicly available nutrition information

### Rate Limiting

- **Future Consideration**: Could implement rate limiting if endpoint is abused
- **Current**: No rate limiting implemented

## 7. Error Handling

### Validation Errors (400 Bad Request)

**Scenario**: Missing or invalid query parameters

```typescript
// Missing ingredient parameter
GET /api/ingredient-substitutions

// Ingredient too long
GET /api/ingredient-substitutions?ingredient=[101+ characters]

// Invalid boolean value (handled by coerce, but malformed strings might fail)
```

**Handler**: Zod validation catches these and returns first error message

### Authentication Errors (401 Unauthorized)

**Scenario**: Missing or invalid authentication token (production only)

**Handler**: Return 401 with "Authentication required" message

### Database Errors (500 Internal Server Error)

**Scenario**:

- Supabase connection failure
- Table doesn't exist
- Query syntax errors
- Network timeouts

**Handler**:

- Log error with full context (error message, stack trace)
- Return generic 500 error to avoid exposing internal details

### Empty Results (Not an error)

**Scenario**: No substitutions found for the given ingredient

**Handler**: Return 200 OK with empty `substitutions` array

```json
{
  "originalIngredient": "exotic-ingredient",
  "substitutions": []
}
```

## 8. Performance Considerations

### Database Optimization

- **Index Recommendation**: Add index on `original_ingredient` column for faster ILIKE searches
- **Query Efficiency**: Filter in database rather than in application code
- **JSON Parsing**: Nutrition comparison data is stored as JSON - ensure efficient parsing

### Pagination (Future Enhancement)

- **Current**: Returns all matching substitutions
- **Consideration**: If ingredient has many substitutions, response could be large
- **Future**: Add optional `limit` parameter to restrict results

### Search Optimization

- **ILIKE Performance**: Case-insensitive search with ILIKE can be slow on large datasets
- **Recommendation**: Use PostgreSQL full-text search or trigram similarity for better performance
- **Current**: ILIKE is acceptable for knowledge base size

## 9. Implementation Steps

### Step 1: Create Service Layer

**File**: `src/lib/services/ingredient-substitution.service.ts`

1. Create service file with SupabaseClient import
2. Define database query result interface for type safety
3. Implement `mapSubstitutionToDTO()` helper function to convert snake_case to camelCase
4. Implement `getIngredientSubstitutions()` function:
   - Accept supabase client and validated parameters
   - Query `ingredient_substitutions` table with ILIKE search
   - Apply `healthier` filter if needed
   - Order by `created_at` DESC
   - Map results to DTOs
   - Handle empty results gracefully
5. Export public functions
6. Follow patterns from `allergen.service.ts` for consistency

### Step 2: Create API Route Handler

**File**: `src/pages/api/ingredient-substitutions.ts`

1. Create new API route file
2. Add `export const prerender = false`
3. Import dependencies (APIRoute, z, service functions, types)
4. Define Zod validation schema for query parameters
5. Implement GET handler function:
   - Add authentication block (mocked for development)
   - Extract query parameters from URL
   - Validate parameters with Zod schema
   - Handle validation errors (return 400)
   - Call service layer function
   - Format response with `originalIngredient` and `substitutions`
   - Return 200 with JSON response
6. Implement try-catch error handling:
   - Log errors with context
   - Return 500 for unexpected errors
7. Add JSDoc comments for documentation

### Step 3: Test the Endpoint

1. **Manual Testing**:
   - Test with valid ingredient name
   - Test with `healthierOnly=true`
   - Test with `healthierOnly=false`
   - Test with missing `ingredient` parameter (expect 400)
   - Test with empty `ingredient` (expect 400)
   - Test with `ingredient` > 100 chars (expect 400)
   - Test with non-existent ingredient (expect 200 with empty array)

2. **Integration Testing**:
   - Verify database queries are correct
   - Verify ILIKE search works case-insensitively
   - Verify healthier filter works correctly
   - Verify response structure matches specification

3. **Error Testing**:
   - Test with invalid Supabase connection (expect 500)
   - Test with malformed query parameters (expect 400)

### Step 4: Database Verification

1. Verify `ingredient_substitutions` table exists in Supabase
2. Verify table schema matches expected structure:
   - `id` (uuid, primary key)
   - `original_ingredient` (text)
   - `substitute_ingredient` (text)
   - `nutrition_comparison` (jsonb)
   - `healthier` (boolean)
   - `created_at` (timestamp)
3. Add sample data if needed for testing
4. Consider adding index on `original_ingredient` for performance

### Step 5: Code Review Checklist

- [ ] Service layer follows project patterns
- [ ] API route uses mocked authentication correctly
- [ ] Zod validation schema matches specification
- [ ] Error handling covers all scenarios
- [ ] Response format matches API specification exactly
- [ ] Code follows project coding practices (early returns, guard clauses)
- [ ] TypeScript types are properly defined
- [ ] JSDoc comments are present and accurate
- [ ] Console logging includes sufficient context
- [ ] No security vulnerabilities (SQL injection, etc.)

### Step 6: Documentation

1. Ensure JSDoc comments are comprehensive
2. Add example requests/responses in comments
3. Document any assumptions or limitations
4. Update this implementation plan if deviations occur

## Summary

This implementation plan provides comprehensive guidance for implementing the GET /api/ingredient-substitutions endpoint. The endpoint will:

1. Accept `ingredient` and optional `healthierOnly` query parameters
2. Authenticate users (mocked for development)
3. Query the `ingredient_substitutions` knowledge base table
4. Return ingredient substitution suggestions with nutrition comparisons
5. Follow established project patterns and best practices

**Important**: This document is an implementation plan only. The actual implementation should be done after this plan is reviewed and approved. Do not proceed with implementation until explicitly instructed to do so.
