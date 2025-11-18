# API Endpoint Implementation Plan: GET /api/recipes/{recipeId}/modifications

## 1. Endpoint Overview

This endpoint retrieves a paginated list of all modifications created for a specific recipe. The endpoint enforces proper authorization by ensuring that modifications can only be accessed if:

1. The recipe is public (any authenticated user can view modifications), OR
2. The authenticated user is the recipe owner

This endpoint provides essential functionality for users to review the history of AI-powered modifications they've created for their recipes, such as calorie reductions, protein increases, or ingredient substitutions.

## 2. Request Details

- **HTTP Method**: GET
- **URL Structure**: `/api/recipes/{recipeId}/modifications`
- **Parameters**:
  - **Required**:
    - `recipeId` (path parameter, UUID): The unique identifier of the recipe
  - **Optional**:
    - `page` (query parameter, number): Page number for pagination (default: 1, min: 1)
    - `limit` (query parameter, number): Number of results per page (default: 20, min: 1, max: 100)
- **Request Body**: None (GET request)
- **Headers**: Standard authentication headers (handled by Supabase middleware)

## 3. Used Types

**Existing DTOs from `src/types.ts`:**

```typescript
// Response DTO for a single modification
interface ModificationDTO {
  id: string;
  originalRecipeId: string;
  userId: string;
  modificationType: string;
  modifiedData: ModificationDataDTO;
  createdAt: string;
}

// Pagination metadata
interface PaginationDTO {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
```

**Response Structure:**

```typescript
{
  modifications: ModificationDTO[];
  pagination: PaginationDTO;
}
```

**Validation Schemas (to be created):**

```typescript
// Zod schema for path parameter
const RecipeIdParamSchema = z.object({
  recipeId: z.string().uuid("Recipe ID must be a valid UUID"),
});

// Zod schema for query parameters
const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});
```

## 4. Response Details

**Success Response (200 OK):**

```json
{
  "modifications": [
    {
      "id": "uuid",
      "originalRecipeId": "uuid",
      "userId": "uuid",
      "modificationType": "reduce_calories",
      "modifiedData": {
        "ingredients": [...],
        "steps": [...],
        "nutritionPerServing": {...},
        "servings": 4,
        "modificationNotes": "..."
      },
      "createdAt": "2025-10-14T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

**Error Responses:**

- **400 Bad Request**: `{ "error": "Bad Request", "message": "Recipe ID must be a valid UUID" }`
- **401 Unauthorized**: `{ "error": "Unauthorized", "message": "Authentication required" }`
- **403 Forbidden**: `{ "error": "Forbidden", "message": "You don't have permission to view modifications for this recipe" }`
- **404 Not Found**: `{ "error": "Not Found", "message": "Recipe not found" }`
- **500 Internal Server Error**: `{ "error": "Internal Server Error", "message": "An unexpected error occurred" }`

## 5. Data Flow

1. **Request Validation**:
   - Extract and validate `recipeId` from path parameters using Zod schema
   - Extract and validate `page` and `limit` from query parameters using Zod schema
   - Return 400 if validation fails

2. **Authentication**:
   - Extract user from Supabase auth session (mocked for development)
   - Return 401 if authentication fails (production only)

3. **Recipe Verification**:
   - Call `getRecipeById()` from recipe.service.ts to fetch the recipe
   - Return 404 if recipe doesn't exist

4. **Authorization Check (IDOR Protection)**:
   - Check if recipe is public OR user is the recipe owner
   - Return 403 if neither condition is met

5. **Fetch Modifications**:
   - Call new service function `getModificationsByRecipeId()` from modification.service.ts
   - Pass recipeId, page, and limit parameters
   - Service executes two parallel Supabase queries:
     - Count query: Total number of modifications for the recipe
     - Data query: Paginated modifications with range limits

6. **Map and Return**:
   - Service maps database results to DTOs (snake_case to camelCase)
   - Calculate pagination metadata (totalPages = Math.ceil(total / limit))
   - Return 200 with modifications array and pagination object

7. **Error Handling**:
   - Catch and log any unexpected errors
   - Return 500 with generic error message (don't expose internal details)

## 6. Security Considerations

### Authentication

- Development: Uses mocked user ID `a85d6d6c-b7d4-4605-9cc4-3743401b67a0`
- Production: Uncomment Supabase auth check to verify user session

### Authorization (IDOR Protection)

- **Critical**: Must verify recipe access before returning modifications
- Users can access modifications if:
  - Recipe is public (isPublic = true), OR
  - User is the recipe owner (recipe.userId === user.id)
- This prevents unauthorized access to private recipe modifications

### Data Validation

- All path and query parameters validated with Zod schemas
- UUID format enforced for recipeId
- Pagination parameters bounded (page >= 1, 1 <= limit <= 100)

### SQL Injection Prevention

- Supabase client uses parameterized queries
- No raw SQL construction with user input

### Rate Limiting

- Consider implementing rate limiting for production (placeholder in code)
- Suggested: 100 requests per 5 minutes per user

## 7. Error Handling

### Input Validation Errors (400)

- Invalid UUID format for recipeId
- Invalid pagination parameters (negative page, limit > 100)
- Non-numeric values for page/limit

### Authentication Errors (401)

- Missing or invalid authentication token (production only)
- Expired session

### Authorization Errors (403)

- Recipe exists but is private
- User is not the recipe owner
- Message: "You don't have permission to view modifications for this recipe"

### Not Found Errors (404)

- Recipe with specified recipeId doesn't exist
- Message: "Recipe not found"

### Server Errors (500)

- Database connection failures
- Unexpected Supabase errors
- Service layer exceptions
- All errors logged with context (recipeId, userId) for debugging

## 8. Performance Considerations

### Database Query Optimization

- Use parallel queries for count and data (Promise.all)
- Apply pagination at database level using .range() to limit data transfer
- Index on `original_recipe_id` column in `recipe_modifications` table recommended

### Pagination Strategy

- Default limit of 20 balances performance and user experience
- Maximum limit of 100 prevents excessive data transfer
- Offset-based pagination using Supabase .range() method

### Caching Opportunities (Future)

- Consider caching recipe authorization checks (public/private status)
- Cache total modification count for frequently accessed recipes
- Use Redis or similar for session-level caching

### Potential Bottlenecks

- Large JSONB modified_data fields in response
- Consider adding a "light" mode that excludes full modified_data if needed
- Monitor query performance for recipes with >1000 modifications

## 9. Implementation Steps

### Step 1: Add service function to modification.service.ts

1. Create `getModificationsByRecipeId()` function
2. Accept parameters: `supabase: SupabaseClient`, `recipeId: string`, `page: number`, `limit: number`
3. Build count query: `select('*', { count: 'exact', head: true }).eq('original_recipe_id', recipeId)`
4. Build data query: `select('*').eq('original_recipe_id', recipeId).order('created_at', { ascending: false }).range(offset, offset + limit - 1)`
5. Execute both queries in parallel with Promise.all
6. Map results using `mapToModificationDTO()` helper (already exists)
7. Calculate pagination metadata
8. Return `{ modifications: ModificationDTO[], pagination: PaginationDTO }`

### Step 2: Update modifications.ts endpoint file

1. Add GET handler function to existing POST handler
2. Import validation dependencies (z from 'zod')
3. Import `getRecipeById` from recipe.service.ts
4. Import new `getModificationsByRecipeId` function from modification.service.ts

### Step 3: Implement validation schemas

1. Create `RecipeIdParamSchema` for path parameter validation
2. Create `PaginationQuerySchema` for query parameter validation with coercion and defaults
3. Define TypeScript types for validated schemas

### Step 4: Implement GET route handler

1. Extract and validate path parameter (recipeId)
2. Extract and validate query parameters (page, limit) from context.url.searchParams
3. Implement authentication check (mocked for development)
4. Fetch recipe using `getRecipeById()`
5. Return 404 if recipe not found
6. Implement authorization check (IDOR protection)
7. Return 403 if user not authorized
8. Fetch modifications using service function
9. Return 200 with modifications and pagination

### Step 5: Implement error handling

1. Wrap entire handler in try-catch block
2. Handle Zod validation errors (400)
3. Handle recipe not found (404)
4. Handle authorization failures (403)
5. Log all errors with context (recipeId, userId, error details)
6. Return generic 500 error for unexpected failures

### Step 6: Test the endpoint

1. Test with valid recipeId and default pagination
2. Test with custom page and limit parameters
3. Test with invalid recipeId format (expect 400)
4. Test with non-existent recipeId (expect 404)
5. Test authorization for public recipes
6. Test authorization for private recipes (owner vs non-owner)
7. Test with recipe that has no modifications (expect empty array)
8. Test pagination across multiple pages
9. Test edge cases (page=0, limit=101, negative values)

### Step 7: Documentation

1. Add JSDoc comments to service function
2. Add JSDoc comments to GET handler
3. Document authorization logic clearly
4. Add inline comments for complex validation logic

### Step 8: Save implementation plan

1. Save this plan as `.ai/claude_prompts/endpoints/2_5_get_api_recipes_recipeId_modifications_view_implementation_plan.md`

---

**Implementation Notes:**

- Follow existing patterns from `GET /api/recipes/[recipeId]` endpoint
- Reuse validation patterns from `POST /api/recipes/[recipeId]/modifications` endpoint
- Use same authentication mock pattern as other endpoints
- Maintain consistent error response format across all endpoints
- Ensure proper TypeScript typing throughout

**Testing Checklist:**

- [ ] Valid requests return 200 with modifications array
- [ ] Empty result sets return empty array with pagination
- [ ] Invalid UUIDs return 400
- [ ] Non-existent recipes return 404
- [ ] Private recipes return 403 for non-owners
- [ ] Public recipes return 200 for any authenticated user
- [ ] Pagination works correctly across multiple pages
- [ ] Default pagination values apply when not specified
- [ ] Limit is capped at 100
- [ ] Database errors return 500
