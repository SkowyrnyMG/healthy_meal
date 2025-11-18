# API Endpoint Implementation Plan: GET /api/recipes/{recipeId}

## 1. Endpoint Overview

This endpoint retrieves detailed information about a specific recipe by its ID. The endpoint implements proper authentication and authorization - only the recipe owner or any authenticated user (if the recipe is public) can view recipe details. The response includes complete recipe information including ingredients, preparation steps, nutritional data, and associated tags.

## 2. Request Details

- **HTTP Method**: GET
- **URL Structure**: `/api/recipes/[recipeId].ts` (Astro dynamic route)
- **Path Parameters**:
  - **Required**: `recipeId` (string, UUID format) - Unique identifier of the recipe
- **Query Parameters**: None
- **Request Body**: None
- **Authentication**: Required (via Supabase auth session)

## 3. Used Types

### Existing DTOs (from `src/types.ts`):

- **RecipeDetailDTO**: Complete recipe information response type
- **RecipeIngredientDTO**: Individual ingredient structure
- **RecipeStepDTO**: Cooking step structure
- **NutritionDTO**: Nutritional information per serving
- **TagDTO**: Recipe category tag

### New Validation Schema (in route file):

```typescript
const RecipeIdParamSchema = z.object({
  recipeId: z.string().uuid("Recipe ID must be a valid UUID"),
});
```

### Service Function (added to recipe.service.ts):

```typescript
getRecipeById(
  supabase: SupabaseClient,
  recipeId: string
): Promise<RecipeDetailDTO | null>
```

## 4. Response Details

### Success Response (200 OK):

```json
{
  "id": "uuid",
  "userId": "uuid",
  "title": "Placki ziemniaczane",
  "description": "Tradycyjne polskie placki",
  "ingredients": [
    {
      "name": "ziemniaki",
      "amount": 1000,
      "unit": "g"
    }
  ],
  "steps": [
    {
      "stepNumber": 1,
      "instruction": "Obrać i zetrzeć ziemniaki na tarce"
    }
  ],
  "servings": 4,
  "nutritionPerServing": {
    "calories": 450,
    "protein": 12,
    "fat": 15,
    "carbs": 60,
    "fiber": 6,
    "salt": 1.5
  },
  "prepTimeMinutes": 30,
  "isPublic": false,
  "featured": false,
  "tags": [
    {
      "id": "uuid",
      "name": "Obiad",
      "slug": "obiad",
      "createdAt": "2025-10-11T12:00:00Z"
    }
  ],
  "createdAt": "2025-10-11T12:00:00Z",
  "updatedAt": "2025-10-11T12:00:00Z"
}
```

### Error Responses:

- **400 Bad Request**: Invalid recipeId format
- **401 Unauthorized**: Not authenticated
- **403 Forbidden**: Recipe is private and user is not the owner
- **404 Not Found**: Recipe does not exist
- **500 Internal Server Error**: Unexpected server error

## 5. Data Flow

1. **Route Handler** (`/api/recipes/[recipeId].ts`):
   - Extract `recipeId` from Astro context params
   - Validate recipeId format using Zod
   - Authenticate user via `context.locals.supabase.auth.getUser()` (currently mocked)
   - Call `getRecipeById` service function
   - If recipe not found, return 404
   - Check authorization: `recipe.isPublic === true OR recipe.userId === user.id`
   - If unauthorized, return 403
   - If authorized, return 200 with recipe data

2. **Service Layer** (`recipe.service.ts`):
   - Execute Supabase query with joins for recipe_tags and tags
   - Select all recipe fields including JSONB fields (ingredients, steps, nutrition_per_serving)
   - Use `.single()` to get one result
   - Handle PostgreSQL error code PGRST116 (not found) gracefully
   - Map database result to RecipeDetailDTO using existing `mapToRecipeDetailDTO` helper
   - Return RecipeDetailDTO or null if not found

3. **Database Query**:
   - Query `recipes` table by `id`
   - Join with `recipe_tags` and `tags` tables for tag information
   - Return complete recipe data with embedded tag objects

## 6. Security Considerations

### Authentication

- Verify user session exists via `context.locals.supabase.auth.getUser()`
- Return 401 if authentication fails
- All requests must have valid Supabase auth token
- **Note**: Currently mocked for development using hardcoded userId

### Authorization (IDOR Protection)

- Implement proper access control: `recipe.isPublic === true OR recipe.userId === user.id`
- Return 403 Forbidden if user tries to access private recipe they don't own
- Return 404 if recipe doesn't exist (don't leak existence information)

### Input Validation

- Validate `recipeId` is valid UUID format before database query
- Prevents SQL injection and invalid query attempts
- Use Zod schema for type-safe validation

### Information Disclosure Prevention

- Don't reveal whether private recipes exist in error messages
- Use appropriate HTTP status codes (403 vs 404)
- Log errors server-side without exposing internal details to client

## 7. Error Handling

### Validation Errors (400):

```json
{
  "error": "Bad Request",
  "message": "Recipe ID must be a valid UUID"
}
```

### Authentication Errors (401):

```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

### Authorization Errors (403):

```json
{
  "error": "Forbidden",
  "message": "You don't have permission to view this recipe"
}
```

### Not Found Errors (404):

```json
{
  "error": "Not Found",
  "message": "Recipe not found"
}
```

### Server Errors (500):

```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

**Error Logging Pattern:**

```typescript
console.error("[GET /api/recipes/[recipeId]] Error:", {
  recipeId: context.params.recipeId,
  error: error instanceof Error ? error.message : "Unknown error",
  stack: error instanceof Error ? error.stack : undefined,
});
```

## 8. Performance Considerations

### Database Optimization

- Single query with joins for recipe and tags (no N+1 problem)
- Use `.single()` for direct single-row fetch
- Index on `recipes.id` (primary key, automatically indexed)

### Caching Opportunities

- Consider caching public featured recipes at CDN/application level
- Private recipes should not be cached
- Use appropriate Cache-Control headers for public recipes

### Query Efficiency

- Select only needed fields (no `*` wildcard)
- Use Supabase's efficient join syntax for related data
- JSONB fields (ingredients, steps, nutrition) stored efficiently in PostgreSQL

## 9. Implementation Steps

1. **Add Service Function** to `src/lib/services/recipe.service.ts`:
   - [ ] Created `getRecipeById` function
   - [ ] Accepts `supabase: SupabaseClient` and `recipeId: string`
   - [ ] Builds query with recipe_tags and tags joins
   - [ ] Uses existing `RecipeDetailQueryResult` interface
   - [ ] Maps result with existing `mapToRecipeDetailDTO` helper
   - [ ] Returns `Promise<RecipeDetailDTO | null>`
   - [ ] Handles PGRST116 error code (not found) gracefully

2. **Create API Route File** at `src/pages/api/recipes/[recipeId].ts`:
   - [ ] Added `export const prerender = false`
   - [ ] Defined Zod validation schema for recipeId parameter
   - [ ] Implemented GET handler following existing patterns

3. **Implement GET Handler**:
   - [ ] Extract and validate recipeId from `context.params.recipeId`
   - [ ] Validate using Zod schema, return 400 if invalid
   - [ ] Authenticate user via `context.locals.supabase.auth.getUser()` (mocked)
   - [ ] Return 401 if authentication fails (commented for development)
   - [ ] Call `getRecipeById(supabase, recipeId)`
   - [ ] Return 404 if recipe is null
   - [ ] Check authorization: `recipe.isPublic || recipe.userId === user.id`
   - [ ] Return 403 if authorization fails
   - [ ] Return 200 with recipe data if authorized

4. **Implement Error Handling**:
   - [ ] Wrapped handler in try-catch block
   - [ ] Log errors with context information
   - [ ] Return appropriate error responses with status codes
   - [ ] Follow existing error handling patterns from `public.ts`

5. **Testing Checklist**:
   - [ ] Test with valid UUID for existing public recipe
   - [ ] Test with valid UUID for existing private recipe (as owner)
   - [ ] Test with valid UUID for existing private recipe (as non-owner) → 403
   - [ ] Test with valid UUID for non-existent recipe → 404
   - [ ] Test with invalid UUID format → 400
   - [ ] Test without authentication → 401
   - [ ] Test featured vs non-featured recipes
   - [ ] Verify all response fields match RecipeDetailDTO structure
   - [ ] Verify tags are properly included in response

## 10. Implementation Status

**Status**: [ ] Not Started

**Files Created/Modified**:

- [ ] `src/lib/services/recipe.service.ts` - Added `getRecipeById` function
- [ ] `src/pages/api/recipes/[recipeId].ts` - Created API route handler

**Notes**:

- Authentication is currently mocked for development using hardcoded userId `a85d6d6c-b7d4-4605-9cc4-3743401b67a0`
- Production authentication code is commented out with TODO markers
- Service function properly handles PostgreSQL "not found" errors (PGRST116)
- Authorization logic implements IDOR protection
