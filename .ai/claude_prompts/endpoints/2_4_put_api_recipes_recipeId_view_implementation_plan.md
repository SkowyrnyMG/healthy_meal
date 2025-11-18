# API Endpoint Implementation Plan: PUT /api/recipes/{recipeId}

## 1. Endpoint Overview

This endpoint allows authenticated users to update their own recipes. The endpoint implements proper authorization to ensure users can only modify recipes they own (IDOR protection). The update operation replaces all recipe data including ingredients, steps, nutrition information, and tag associations.

**Key Features:**

- Full recipe update (not partial)
- Ownership verification before update
- Tag validation and management
- Transaction-like behavior for tag updates (delete old, insert new)

## 2. Request Details

- **HTTP Method**: PUT
- **URL Structure**: `/api/recipes/{recipeId}`
- **Authentication**: Required (mocked in development)
- **Content-Type**: application/json

### Parameters

**Path Parameters:**

- **recipeId** (required): UUID of the recipe to update

**Request Body (UpdateRecipeCommand):**

All fields replace existing values:

**Required:**

- `title`: string (1-255 chars, trimmed)
- `ingredients`: array of objects (1-100 items)
  - `name`: string (1-255 chars)
  - `amount`: positive number
  - `unit`: string (1-50 chars)
- `steps`: array of objects (1-100 items)
  - `stepNumber`: positive integer (must be sequential from 1)
  - `instruction`: string (1-2000 chars)
- `servings`: positive integer
- `nutritionPerServing`: object
  - `calories`: number (0-10000)
  - `protein`: number (0-1000)
  - `fat`: number (0-1000)
  - `carbs`: number (0-1000)
  - `fiber`: number (0-1000)
  - `salt`: number (0-100)

**Optional:**

- `description`: string (max 5000 chars)
- `prepTimeMinutes`: positive integer (max 1440)
- `isPublic`: boolean (default: false)
- `tagIds`: array of UUIDs (max 50)

## 3. Used Types

### DTOs (from src/types.ts)

```typescript
// Request payload
UpdateRecipeCommand = CreateRecipeCommand {
  title: string;
  description?: string;
  ingredients: RecipeIngredientDTO[];
  steps: RecipeStepDTO[];
  servings: number;
  nutritionPerServing: NutritionDTO;
  prepTimeMinutes?: number;
  isPublic?: boolean;
  tagIds?: string[];
}

// Response data
RecipeDetailDTO {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  ingredients: RecipeIngredientDTO[];
  steps: RecipeStepDTO[];
  servings: number;
  nutritionPerServing: NutritionDTO;
  prepTimeMinutes: number | null;
  isPublic: boolean;
  featured: boolean;
  tags: TagDTO[];
  createdAt: string;
  updatedAt: string;
}
```

### Validation Schemas (Zod)

Reuse existing schemas from POST /api/recipes:

- `RecipeIdParamSchema` - for path parameter validation
- `CreateRecipeCommandSchema` - for request body validation

## 4. Response Details

### Success Response (200 OK)

```json
{
  "success": true,
  "recipe": {
    "id": "uuid",
    "userId": "uuid",
    "title": "Recipe Title",
    "description": "Description",
    "ingredients": [...],
    "steps": [...],
    "servings": 4,
    "nutritionPerServing": {...},
    "prepTimeMinutes": 30,
    "isPublic": false,
    "featured": false,
    "tags": [...],
    "createdAt": "ISO timestamp",
    "updatedAt": "ISO timestamp"
  }
}
```

### Error Responses

**400 Bad Request** - Validation failure

```json
{
  "error": "Bad Request",
  "message": "Validation error message"
}
```

**401 Unauthorized** - Not authenticated (production only)

```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

**403 Forbidden** - User is not the owner

```json
{
  "error": "Forbidden",
  "message": "You don't have permission to update this recipe"
}
```

**404 Not Found** - Recipe not found

```json
{
  "error": "Not Found",
  "message": "Recipe not found"
}
```

**500 Internal Server Error** - Unexpected error

```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

## 5. Data Flow

1. **Request Reception**
   - Receive PUT request with recipeId and UpdateRecipeCommand body

2. **Authentication** (mocked in development)
   - Verify user authentication via Supabase
   - Extract userId from authenticated user

3. **Path Parameter Validation**
   - Validate recipeId is valid UUID format
   - Return 400 if invalid

4. **Request Body Validation**
   - Parse JSON body
   - Validate against CreateRecipeCommandSchema
   - Validate step numbers are sequential
   - Return 400 if validation fails

5. **Recipe Existence & Ownership Check**
   - Fetch recipe by recipeId
   - Return 404 if recipe doesn't exist
   - Verify recipe.userId matches authenticated userId
   - Return 403 if user is not owner

6. **Service Layer Processing** (updateRecipe)
   - Validate tagIds exist in database (if provided)
   - Update recipe record in database
   - Delete all existing recipe-tag associations
   - Insert new recipe-tag associations (if tagIds provided)
   - Fetch complete recipe with tags

7. **Response Generation**
   - Return 200 with updated RecipeDetailDTO

## 6. Security Considerations

### Authentication

- **Development**: Hardcoded userId for testing
- **Production**: Real Supabase authentication must be enabled
- **Failure handling**: Return 401 if authentication fails

### Authorization (IDOR Protection)

- **Ownership verification**: Critical security check
- **Check timing**: After recipe fetch, before update
- **Enforcement**: User must be recipe owner (recipe.userId === user.id)
- **Failure handling**: Return 403 if ownership check fails

### Input Validation

- **Path parameter**: UUID format validation prevents injection
- **Request body**: Zod schemas enforce type safety and constraints
- **String fields**: Trimming prevents whitespace-only values
- **Array fields**: Length limits prevent DOS attacks
- **Numeric fields**: Range validation prevents unrealistic values
- **Step numbers**: Sequential validation prevents logic errors

### Data Integrity

- **Tag validation**: Verify all tagIds exist before update
- **Transaction-like behavior**: Delete old tags → insert new tags
- **Foreign key constraints**: Database enforces referential integrity
- **Timestamp management**: updated_at automatically updated by database

### Additional Security

- **SQL Injection**: Mitigated by Supabase SDK parameterization
- **XSS**: JSON Content-Type header prevents script injection
- **Mass Assignment**: Explicit field mapping controls what can be updated
- **Rate Limiting**: Should be implemented at API gateway level

## 7. Error Handling

### Validation Errors (400)

- Invalid recipeId UUID format
- Malformed JSON body
- Missing required fields
- Field value out of valid range
- Step numbers not sequential
- Invalid tag UUID format
- Non-existent tag IDs

### Authentication Errors (401)

- Missing authentication token (production)
- Invalid or expired token (production)
- Authentication service failure (production)

### Authorization Errors (403)

- User is not the recipe owner
- User attempting to update featured flag (only admins can feature)

### Not Found Errors (404)

- Recipe with given recipeId doesn't exist

### Server Errors (500)

- Database connection failure
- Database query execution error
- Unexpected runtime errors
- Service layer exceptions

### Error Logging Strategy

```typescript
console.error("[PUT /api/recipes/[recipeId]] Error:", {
  recipeId: context.params.recipeId,
  userId: user?.id,
  error: error instanceof Error ? error.message : "Unknown error",
  stack: error instanceof Error ? error.stack : undefined,
});
```

## 8. Performance Considerations

### Potential Bottlenecks

1. **Tag validation query**: Fetching tags to validate IDs
2. **Recipe-tag deletion**: Deleting all existing associations
3. **Recipe-tag insertion**: Bulk inserting new associations
4. **Final fetch query**: Retrieving complete recipe with tags

### Optimization Strategies

**Database Queries**

- Use parallel queries where possible (tag validation can be separate)
- Leverage database indexes on recipe_id, user_id, tag_id
- Use single SELECT with joins for final fetch
- Bulk operations for recipe_tags (delete all, insert many)

**Validation**

- Early returns for validation failures (fail fast)
- Reuse validation schemas (no re-compilation)
- Validate existence before performing expensive operations

**Response Size**

- Recipe detail response is comprehensive but reasonable
- JSONB fields (ingredients, steps, nutrition) are efficient
- Tag array is limited to 50 items maximum

**Caching Opportunities**

- Tag validation could use cached tag list (if tags are relatively static)
- Not applicable for recipe data (must be fresh after update)

### Expected Performance

- **Typical case**: < 100ms (simple recipe, few tags)
- **Complex case**: < 300ms (100 ingredients/steps, 50 tags)
- **Network overhead**: Depends on payload size (1-50KB typical)

## 9. Implementation Steps

### Step 1: Add updateRecipe Service Function

**File**: `src/lib/services/recipe.service.ts`

1. **Function signature**

   ```typescript
   export async function updateRecipe(
     supabase: SupabaseClient,
     recipeId: string,
     userId: string,
     command: UpdateRecipeCommand
   ): Promise<RecipeDetailDTO>;
   ```

2. **Tag validation** (if tagIds provided)
   - Query tags table for provided tag IDs
   - Verify all IDs exist
   - Throw error if any invalid

3. **Update recipe record**
   - Build DbRecipeUpdate object with command data
   - Execute update query with recipeId filter
   - Handle database errors

4. **Update recipe-tag associations**
   - Delete all existing associations for this recipe
   - If tagIds provided, bulk insert new associations
   - Handle database errors

5. **Fetch complete recipe**
   - Use getRecipeById to fetch updated recipe with tags
   - Return RecipeDetailDTO

### Step 2: Add PUT Handler to Endpoint

**File**: `src/pages/api/recipes/[recipeId].ts`

1. **Import dependencies**
   - Import updateRecipe from service
   - Import CreateRecipeCommandSchema (reuse from /api/recipes.ts)

2. **Export PUT handler**
   - Wrap entire handler in try-catch block

3. **Validate path parameter**
   - Parse recipeId from context.params
   - Validate with RecipeIdParamSchema
   - Return 400 if invalid

4. **Authenticate user**
   - Use mock userId for development
   - Comment production auth code with TODO

5. **Parse and validate request body**
   - Parse JSON from request
   - Return 400 if JSON is malformed
   - Validate with CreateRecipeCommandSchema
   - Return 400 if validation fails

6. **Check recipe existence**
   - Fetch recipe using getRecipeById
   - Return 404 if recipe not found

7. **Verify ownership**
   - Check if recipe.userId === user.id
   - Return 403 if user is not owner

8. **Call service to update**
   - Call updateRecipe with validated data
   - Handle service errors

9. **Return success response**
   - Return 200 with { success: true, recipe }

10. **Error handling**
    - Catch invalid tag IDs error → 400
    - Catch other errors → 500
    - Log all errors with context

### Step 3: Testing Considerations

**Manual Testing**

1. Test successful update with all fields
2. Test update with minimal fields (only required)
3. Test update with new tags
4. Test update removing all tags
5. Test invalid recipeId format
6. Test non-existent recipeId
7. Test updating someone else's recipe (403)
8. Test malformed JSON body
9. Test validation errors (each field)
10. Test invalid tag IDs

**Integration Testing**

- Verify database state after update
- Verify old tags are removed
- Verify new tags are added
- Verify updated_at timestamp changed
- Verify response matches database state

**Security Testing**

- Attempt IDOR attack (update other user's recipe)
- Attempt to set featured flag
- Attempt SQL injection in string fields
- Attempt XSS in string fields

## 10. Additional Notes

### Relationship to Other Endpoints

- **GET /api/recipes/{recipeId}**: Shares getRecipeById service function
- **POST /api/recipes**: Shares validation schemas and tag handling logic
- **DELETE /api/recipes/{recipeId}**: Would share ownership verification pattern

### Future Enhancements

- Partial updates (PATCH) for efficiency
- Recipe versioning/history tracking
- Change notifications to favorited-by users
- Optimistic locking (prevent concurrent updates)
- Image upload support
- Validation of ingredient substitution compatibility

### Database Schema Dependencies

- **recipes table**: Main data storage
- **recipe_tags table**: Many-to-many relationship
- **tags table**: Tag reference data
- **CASCADE on delete**: Ensures orphaned tags are cleaned up
- **updated_at trigger**: Automatically updates timestamp

### Development vs Production Differences

- **Authentication**: Mocked userId vs real Supabase auth
- **Error messages**: Development may expose more details
- **Logging**: Production should use structured logging service
- **Rate limiting**: Production should have API rate limits
