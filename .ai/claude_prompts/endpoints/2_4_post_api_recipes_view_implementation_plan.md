# API Endpoint Implementation Plan: POST /api/recipes

## 1. Endpoint Overview

The POST /api/recipes endpoint allows authenticated users to create new recipes in the HealthyMeal application. Users can submit recipe details including title, description, ingredients, preparation steps, nutritional information, servings, preparation time, visibility status, and associated tags. The endpoint validates all inputs, stores the recipe in the database with proper user association, links it to specified tags, and returns the complete recipe details including auto-generated fields (id, timestamps, featured status).

**Key Features:**

- Authenticated user recipe creation
- Comprehensive input validation with Zod
- Support for multiple ingredients and preparation steps
- Nutritional information per serving
- Optional recipe categorization with tags
- Public/private visibility control
- Transaction-safe database operations

## 2. Request Details

- **HTTP Method**: POST
- **URL Structure**: `/api/recipes`
- **Authentication**: Required (Supabase Auth)
- **Content-Type**: application/json

### Parameters

**Required:**

- `title` (string): Recipe title, 1-255 characters
- `ingredients` (array): Array of ingredient objects, min 1 item, max 100 items
  - `name` (string): Ingredient name, 1-255 characters
  - `amount` (number): Quantity, must be positive
  - `unit` (string): Unit of measurement, 1-50 characters
- `steps` (array): Array of preparation step objects, min 1 item, max 100 items
  - `stepNumber` (number): Sequential step number starting from 1
  - `instruction` (string): Step instruction, 1-2000 characters
- `servings` (number): Number of servings, integer > 0
- `nutritionPerServing` (object): Nutritional information per serving
  - `calories` (number): Calories per serving, 0-10000
  - `protein` (number): Protein in grams, 0-1000
  - `fat` (number): Fat in grams, 0-1000
  - `carbs` (number): Carbohydrates in grams, 0-1000
  - `fiber` (number): Fiber in grams, 0-1000
  - `salt` (number): Salt in grams, 0-100

**Optional:**

- `description` (string): Recipe description, max 5000 characters
- `prepTimeMinutes` (number): Preparation time in minutes, integer > 0, max 1440 (24 hours)
- `isPublic` (boolean): Recipe visibility, default: false
- `tagIds` (array): Array of tag UUID strings, max 50 tags

### Request Body Example

```json
{
  "title": "Placki ziemniaczane",
  "description": "Tradycyjne polskie placki",
  "ingredients": [
    {
      "name": "ziemniaki",
      "amount": 1000,
      "unit": "g"
    },
    {
      "name": "jajka",
      "amount": 2,
      "unit": "sztuki"
    }
  ],
  "steps": [
    {
      "stepNumber": 1,
      "instruction": "Obrać i zetrzeć ziemniaki na tarce"
    },
    {
      "stepNumber": 2,
      "instruction": "Dodać jajka i wymieszać"
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
  "tagIds": ["uuid1", "uuid2"]
}
```

## 3. Used Types

### DTOs (from src/types.ts)

**Request Payload:**

- `CreateRecipeCommand` (lines 489-499): Represents the request body structure

**Response:**

- `RecipeDetailDTO` (lines 121-136): Complete recipe information with tags
- `TagDTO` (lines 58-63): Tag information included in response

**Nested Structures:**

- `RecipeIngredientDTO` (lines 72-76): Ingredient structure
- `RecipeStepDTO` (lines 81-84): Preparation step structure
- `NutritionDTO` (lines 89-96): Nutritional information structure

**Database Types:**

- `DbRecipeInsert` (line 600): Database insertion type for recipes table
- `DbRecipeTagInsert` (line 604): Database insertion type for recipe_tags junction table

### New Validation Schema

**CreateRecipeCommandSchema** (to be created with Zod):

- Validates all request body fields according to specification
- Enforces constraints on string lengths, numeric ranges, array sizes
- Validates nested objects and arrays
- Ensures data type correctness

## 4. Response Details

### Success Response (201 Created)

```json
{
  "success": true,
  "recipe": {
    "id": "uuid",
    "userId": "uuid",
    "title": "Placki ziemniaczane",
    "description": "Tradycyjne polskie placki",
    "ingredients": [
      {
        "name": "ziemniaki",
        "amount": 1000,
        "unit": "g"
      },
      {
        "name": "jajka",
        "amount": 2,
        "unit": "sztuki"
      }
    ],
    "steps": [
      {
        "stepNumber": 1,
        "instruction": "Obrać i zetrzeć ziemniaki na tarce"
      },
      {
        "stepNumber": 2,
        "instruction": "Dodać jajka i wymieszać"
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
        "id": "uuid1",
        "name": "Polish Cuisine",
        "slug": "polish-cuisine",
        "createdAt": "2025-10-11T12:00:00Z"
      },
      {
        "id": "uuid2",
        "name": "Vegetarian",
        "slug": "vegetarian",
        "createdAt": "2025-10-11T12:00:00Z"
      }
    ],
    "createdAt": "2025-10-11T12:00:00Z",
    "updatedAt": "2025-10-11T12:00:00Z"
  }
}
```

### Error Responses

**400 Bad Request** - Validation Failed

```json
{
  "error": "Bad Request",
  "message": "Validation error: [specific validation message]"
}
```

**401 Unauthorized** - Authentication Required

```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

**500 Internal Server Error** - Server Error

```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

## 5. Data Flow

### High-Level Flow

1. **Request Reception**: Astro API route receives POST request at /api/recipes
2. **Authentication** → Verify user authentication (mock for development)
3. **Input Validation**: Parse and validate request body with Zod schema
4. **Business Logic**: Call service layer to create recipe
5. **Database Operations**: Insert recipe and tag associations in transaction
6. **Response Formation**: Return 201 with RecipeDetailDTO
7. **Error Handling**: Catch and handle errors at each stage

### Detailed Data Flow

```
Client Request (POST /api/recipes)
  ↓
API Route Handler (src/pages/api/recipes.ts - POST function)
  ↓
Authentication Check (context.locals.supabase.auth.getUser())
  ↓ [if authenticated]
Request Body Parsing (await context.request.json())
  ↓
Input Validation (CreateRecipeCommandSchema.parse())
  ↓ [if valid]
Service Layer (createRecipe() in recipe.service.ts)
  ↓
Tag Validation (verify tagIds exist in tags table)
  ↓ [if valid or no tags]
Database Transaction:
  ├─ Insert Recipe (recipes table)
  └─ Insert Recipe-Tag Associations (recipe_tags table)
  ↓
Fetch Complete Recipe with Tags
  ↓
Map to RecipeDetailDTO
  ↓
Return 201 Response
```

### Database Interactions

**Tables Involved:**

1. `recipes` - Main recipe storage
   - INSERT operation with user_id, title, description, ingredients (JSON), steps (JSON), servings, nutrition_per_serving (JSON), prep_time_minutes, is_public, featured (default false)

2. `recipe_tags` - Many-to-many junction table
   - INSERT multiple rows for each tagId (recipe_id, tag_id)

3. `tags` - Tag validation (read-only)
   - SELECT to verify tagIds exist

**Relationships:**

- `recipes.user_id` → `profiles.user_id` (CASCADE on delete)
- `recipe_tags.recipe_id` → `recipes.id` (CASCADE on delete)
- `recipe_tags.tag_id` → `tags.id` (RESTRICT on delete)

**Transaction Flow:**

1. Begin transaction (implicit with Supabase)
2. Insert recipe record → get recipe.id
3. If tagIds provided: Insert recipe_tags records
4. Fetch complete recipe with tags via JOIN query
5. Commit transaction (implicit)

## 6. Security Considerations

### Authentication & Authorization

**Authentication:**

- Verify user authentication via `context.locals.supabase.auth.getUser()`
- Return 401 if not authenticated or auth error occurs
- Development: Use mock user ID with TODO comment for production

**Authorization:**

- Users can only create recipes for themselves (userId from auth, not request)
- Recipe ownership is enforced at creation time
- Supabase Row Level Security (RLS) policies provide additional layer

### Input Validation & Sanitization

**Zod Schema Validation:**

- Validate all required fields are present
- Enforce string length constraints (prevent buffer overflow)
- Validate numeric ranges (prevent invalid data)
- Ensure positive numbers where required
- Validate UUID format for tagIds
- Limit array sizes to prevent DoS attacks
  - Max 100 ingredients
  - Max 100 steps
  - Max 50 tags

**SQL Injection Protection:**

- Supabase SDK uses parameterized queries (automatic protection)
- No raw SQL construction with user input

**XSS Protection:**

- JSON responses are automatically escaped by browser
- Input validation ensures data type correctness
- String fields validated for length and content

### Data Integrity

**Foreign Key Validation:**

- Verify tagIds reference existing tags before insertion
- Handle non-existent tag references gracefully (return 400)

**User Association:**

- Set userId from authenticated session (never from request body)
- Prevents users from creating recipes for other users

**Default Values:**

- `isPublic`: default false (secure by default - private recipes)
- `featured`: default false (only admins can feature recipes)

### Rate Limiting & Resource Protection

**Recommendations (not implemented in endpoint, handle at infrastructure level):**

- Rate limit recipe creation per user (e.g., 10 per hour)
- Implement max request size limits (e.g., 1MB)
- Monitor for abuse patterns

## 7. Error Handling

### Error Scenarios & Status Codes

#### 400 Bad Request

**Validation Errors:**

- Missing required fields (title, ingredients, steps, servings, nutritionPerServing)
- Invalid data types (e.g., string for numeric field)
- Out-of-range values (e.g., negative servings, calories > 10000)
- String length violations (e.g., title > 255 characters)
- Empty arrays (ingredients or steps with 0 items)
- Invalid nested object structure
- Step numbers not sequential or not starting from 1
- Invalid UUID format in tagIds

**Business Logic Errors:**

- Referenced tagIds don't exist in tags table
- Array size limits exceeded (>100 ingredients, >100 steps, >50 tags)

**Response Format:**

```json
{
  "error": "Bad Request",
  "message": "[Specific validation error from Zod]"
}
```

**Handling:**

- Catch `z.ZodError` exceptions
- Return first error message from Zod errors array
- Log full error details for debugging
- Return user-friendly error message

#### 401 Unauthorized

**Authentication Errors:**

- No authentication token provided
- Invalid authentication token
- Expired authentication token
- Supabase auth service error

**Response Format:**

```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

**Development** (Current):

```typescript
// MOCK: Remove this in production
const userId = "a85d6d6c-b7d4-4605-9cc4-3743401b67a0";
```

**Handling:**

- Check for authError from `supabase.auth.getUser()` (mock for development)
- Check if user object is null
- Return 401 immediately without processing request
- Log authentication attempts for security monitoring

#### 500 Internal Server Error

**Database Errors:**

- Recipe insertion fails
- Recipe-tag association insertion fails
- Database connection errors
- Transaction failures
- Query fetch errors

**Application Errors:**

- Unexpected runtime errors
- Service layer exceptions
- JSON parsing errors (malformed request body)
- Supabase SDK errors

**Response Format:**

```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

**Handling:**

- Catch all unexpected errors in try-catch block
- Log full error details (message, stack trace, context)
- Return generic error message (don't leak internal details)
- Structure logs for easy debugging:
  ```javascript
  console.error("[POST /api/recipes] Error:", {
    error: error instanceof Error ? error.message : "Unknown error",
    stack: error instanceof Error ? error.stack : undefined,
    userId: userId, // if available
  });
  ```

### Error Logging Strategy

**Log Structure:**

- Prefix with endpoint path: `[POST /api/recipes]`
- Include error type and message
- Include stack trace for debugging
- Include relevant context (userId when available)
- Don't log sensitive data (passwords, tokens)

**Example:**

```javascript
console.error("[POST /api/recipes] Error:", {
  error: error instanceof Error ? error.message : "Unknown error",
  stack: error instanceof Error ? error.stack : undefined,
  userId: userId,
});
```

## 8. Performance Considerations

### Database Performance

**Query Optimization:**

- Use single INSERT for recipe creation (not multiple queries)
- Batch insert recipe_tags associations if multiple tags provided
- Use efficient JOIN query to fetch complete recipe with tags after creation
- Leverage database indexes (id, user_id already indexed)

**Transaction Management:**

- Keep transaction scope minimal (insert recipe + insert tags only)
- Supabase handles transactions implicitly
- Avoid long-running operations within transaction

**Potential Bottlenecks:**

- Large JSON fields (ingredients, steps arrays) - mitigated by array size limits
- Multiple tag associations - limited to 50 tags
- Tag validation query - use single query with IN clause

### API Performance

**Response Time:**

- Target: < 500ms for typical recipe creation
- Expected: ~200-300ms for recipe with 10-20 ingredients

**Payload Size:**

- Request: Typically 5-50KB (with array limits, max ~200KB)
- Response: Similar to request + additional fields (timestamps, ids, tags)

**Caching:**

- Not applicable for POST operations (cache invalidation only)
- Consider invalidating GET /api/recipes cache after creation

### Optimization Strategies

**Immediate Optimizations:**

- Validate tagIds in single query (use `IN` clause): `SELECT id FROM tags WHERE id IN ($1, $2, ...)`
- Use Supabase batch operations for recipe_tags insertion if supported
- Minimize data fetching - only fetch necessary fields for response

**Future Optimizations:**

- Implement async tag validation (if performance becomes issue)
- Consider denormalizing tag count on recipes table
- Add database index on recipe_tags (recipe_id, tag_id) for faster lookups
- Implement connection pooling for database (if not already configured)

**Monitoring:**

- Track recipe creation success/failure rates
- Monitor average response times
- Alert on error rate spikes
- Track validation failure patterns

## 9. Implementation Steps

### Step 1: Create Zod Validation Schema

**File**: `src/pages/api/recipes.ts`

**Tasks:**

1. Add Zod validation schema for `CreateRecipeCommand` at top of file (after imports, before existing schemas)
2. Define nested schemas for `RecipeIngredientDTO`, `RecipeStepDTO`, `NutritionDTO`
3. Implement custom validation for step numbers (sequential, starting from 1)
4. Set appropriate constraints:
   - String lengths (title 1-255, description 0-5000, ingredient name 1-255, unit 1-50, instruction 1-2000)
   - Numeric ranges (servings > 0, nutrition fields 0-10000 for calories, 0-1000 for macros, 0-100 for salt)
   - Array sizes (ingredients 1-100, steps 1-100, tagIds 0-50)
5. Define type inference: `type ValidatedCreateRecipeCommand = z.infer<typeof CreateRecipeCommandSchema>`

**Example Schema Structure:**

```typescript
const RecipeIngredientSchema = z.object({
  name: z.string().trim().min(1).max(255),
  amount: z.number().positive(),
  unit: z.string().trim().min(1).max(50),
});

const RecipeStepSchema = z.object({
  stepNumber: z.number().int().positive(),
  instruction: z.string().trim().min(1).max(2000),
});

const NutritionSchema = z.object({
  calories: z.number().min(0).max(10000),
  protein: z.number().min(0).max(1000),
  fat: z.number().min(0).max(1000),
  carbs: z.number().min(0).max(1000),
  fiber: z.number().min(0).max(1000),
  salt: z.number().min(0).max(100),
});

const CreateRecipeCommandSchema = z.object({
  title: z.string().trim().min(1).max(255),
  description: z.string().trim().max(5000).optional(),
  ingredients: z.array(RecipeIngredientSchema).min(1).max(100),
  steps: z
    .array(RecipeStepSchema)
    .min(1)
    .max(100)
    .refine(
      (steps) => {
        // Validate step numbers are sequential starting from 1
        const sorted = [...steps].sort((a, b) => a.stepNumber - b.stepNumber);
        return sorted.every((step, idx) => step.stepNumber === idx + 1);
      },
      { message: "Step numbers must be sequential starting from 1" }
    ),
  servings: z.number().int().positive(),
  nutritionPerServing: NutritionSchema,
  prepTimeMinutes: z.number().int().positive().max(1440).optional(),
  isPublic: z.boolean().optional().default(false),
  tagIds: z.array(z.string().uuid()).max(50).optional(),
});
```

### Step 2: Implement Service Layer Function

**File**: `src/lib/services/recipe.service.ts`

**Tasks:**

1. Add `createRecipe` function with signature: `createRecipe(supabase: SupabaseClient, userId: string, command: CreateRecipeCommand): Promise<RecipeDetailDTO>`
2. Import necessary types: `CreateRecipeCommand`, `RecipeDetailDTO`, `DbRecipeInsert`, `DbRecipeTagInsert`, `TagDTO`
3. Implement tag validation logic (if tagIds provided)
4. Insert recipe record into recipes table
5. Insert recipe_tags associations (if tagIds provided)
6. Fetch complete recipe with tags using JOIN query
7. Map database result to `RecipeDetailDTO`
8. Return `RecipeDetailDTO`

**Detailed Implementation Steps:**

**2.1 Tag Validation:**

```typescript
// If tagIds provided, validate they exist
if (command.tagIds && command.tagIds.length > 0) {
  const { data: existingTags, error: tagError } = await supabase.from("tags").select("id").in("id", command.tagIds);

  if (tagError) {
    throw tagError;
  }

  if (!existingTags || existingTags.length !== command.tagIds.length) {
    throw new Error("One or more tag IDs are invalid");
  }
}
```

**2.2 Recipe Insertion:**

```typescript
const recipeInsert: DbRecipeInsert = {
  user_id: userId,
  title: command.title,
  description: command.description || null,
  ingredients: command.ingredients as any, // JSONB field
  steps: command.steps as any, // JSONB field
  servings: command.servings,
  nutrition_per_serving: command.nutritionPerServing as any, // JSONB field
  prep_time_minutes: command.prepTimeMinutes || null,
  is_public: command.isPublic ?? false,
  featured: false, // Default value
};

const { data: recipe, error: recipeError } = await supabase.from("recipes").insert(recipeInsert).select().single();

if (recipeError || !recipe) {
  throw recipeError || new Error("Failed to create recipe");
}
```

**2.3 Recipe-Tag Associations:**

```typescript
if (command.tagIds && command.tagIds.length > 0) {
  const recipeTagInserts: DbRecipeTagInsert[] = command.tagIds.map((tagId) => ({
    recipe_id: recipe.id,
    tag_id: tagId,
  }));

  const { error: tagAssocError } = await supabase.from("recipe_tags").insert(recipeTagInserts);

  if (tagAssocError) {
    throw tagAssocError;
  }
}
```

**2.4 Fetch Complete Recipe with Tags:**

```typescript
const { data: completeRecipe, error: fetchError } = await supabase
  .from("recipes")
  .select(
    `
    id,
    user_id,
    title,
    description,
    ingredients,
    steps,
    servings,
    nutrition_per_serving,
    prep_time_minutes,
    is_public,
    featured,
    created_at,
    updated_at,
    recipe_tags (
      tag_id,
      tags (
        id,
        name,
        slug,
        created_at
      )
    )
  `
  )
  .eq("id", recipe.id)
  .single();

if (fetchError || !completeRecipe) {
  throw fetchError || new Error("Failed to fetch created recipe");
}
```

**2.5 Map to RecipeDetailDTO:**

```typescript
return mapToRecipeDetailDTO(completeRecipe);
```

**2.6 Helper Function:**

```typescript
// Add helper function to map database result to RecipeDetailDTO
function mapToRecipeDetailDTO(dbRecipe: any): RecipeDetailDTO {
  const tags: TagDTO[] =
    dbRecipe.recipe_tags
      ?.filter((rt: any) => rt.tags !== null)
      .map((rt: any) => ({
        id: rt.tags.id,
        name: rt.tags.name,
        slug: rt.tags.slug,
        createdAt: rt.tags.created_at,
      })) || [];

  return {
    id: dbRecipe.id,
    userId: dbRecipe.user_id,
    title: dbRecipe.title,
    description: dbRecipe.description,
    ingredients: dbRecipe.ingredients,
    steps: dbRecipe.steps,
    servings: dbRecipe.servings,
    nutritionPerServing: dbRecipe.nutrition_per_serving,
    prepTimeMinutes: dbRecipe.prep_time_minutes,
    isPublic: dbRecipe.is_public,
    featured: dbRecipe.featured,
    tags,
    createdAt: dbRecipe.created_at,
    updatedAt: dbRecipe.updated_at,
  };
}
```

### Step 3: Implement POST API Route Handler

**File**: `src/pages/api/recipes.ts`

**Tasks:**

1. Add POST function export to existing file (after GET handler)
2. Implement authentication check using `context.locals.supabase.auth.getUser()`
3. Parse and validate request body with `CreateRecipeCommandSchema`
4. Call `createRecipe` service function
5. Return 201 response with RecipeDetailDTO
6. Implement comprehensive error handling for all error types

**Implementation Structure:**

```typescript
/**
 * POST /api/recipes
 * Creates a new recipe for authenticated user
 *
 * Request Body: CreateRecipeCommand
 *
 * Returns:
 * - 201: { success: true, recipe: RecipeDetailDTO }
 * - 400: Invalid request body
 * - 401: Authentication required
 * - 500: Internal server error
 */
export const POST: APIRoute = async (context) => {
  try {
    // ========================================
    // AUTHENTICATION
    // ========================================

    // TODO: Production - Uncomment for real authentication
    // const { data: { user }, error: authError } = await context.locals.supabase.auth.getUser();
    // if (authError || !user) {
    //   return new Response(
    //     JSON.stringify({
    //       error: "Unauthorized",
    //       message: "Authentication required"
    //     }),
    //     { status: 401, headers: { "Content-Type": "application/json" } }
    //   );
    // }
    // const userId = user.id;

    // MOCK: Remove this in production
    const userId = "a85d6d6c-b7d4-4605-9cc4-3743401b67a0";

    // ========================================
    // PARSE AND VALIDATE REQUEST BODY
    // ========================================

    let requestBody: any;
    try {
      requestBody = await context.request.json();
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Invalid JSON in request body",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    let validatedCommand: ValidatedCreateRecipeCommand;
    try {
      validatedCommand = CreateRecipeCommandSchema.parse(requestBody);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return new Response(
          JSON.stringify({
            error: "Bad Request",
            message: error.errors[0].message,
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      throw error;
    }

    // ========================================
    // CREATE RECIPE
    // ========================================

    const recipe = await createRecipe(context.locals.supabase, userId, validatedCommand);

    // Success response
    return new Response(
      JSON.stringify({
        success: true,
        recipe,
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Handle business logic errors (e.g., invalid tagIds)
    if (error instanceof Error && error.message.includes("tag IDs are invalid")) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: error.message,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Log error with context
    console.error("[POST /api/recipes] Error:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      userId: userId,
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

### Step 4: Test the Implementation

**Manual Testing:**

1. **Test Authentication**
   - Send POST request without auth token → expect 401
   - Send POST request with valid auth token → proceed to validation

2. **Test Validation - Required Fields**
   - Omit `title` → expect 400 with "Required" message
   - Omit `ingredients` → expect 400
   - Omit `steps` → expect 400
   - Omit `servings` → expect 400
   - Omit `nutritionPerServing` → expect 400

3. **Test Validation - Field Constraints**
   - Send `title` with 256 characters → expect 400
   - Send empty `title` → expect 400
   - Send `servings` with 0 → expect 400
   - Send `servings` with negative value → expect 400
   - Send `calories` with 10001 → expect 400
   - Send empty `ingredients` array → expect 400
   - Send empty `steps` array → expect 400
   - Send 101 ingredients → expect 400
   - Send invalid UUID in `tagIds` → expect 400

4. **Test Validation - Step Numbers**
   - Send steps not starting from 1 → expect 400
   - Send steps with duplicate numbers → expect 400
   - Send steps with gaps in sequence → expect 400

5. **Test Business Logic**
   - Send non-existent tag UUID in `tagIds` → expect 400 with "invalid tag IDs" message
   - Send valid recipe without tags → expect 201 with empty tags array
   - Send valid recipe with valid tags → expect 201 with populated tags

6. **Test Success Cases**
   - Create recipe with all required fields only → expect 201
   - Create recipe with all fields including optional → expect 201
   - Verify response contains `success: true` and `recipe` object
   - Verify `recipe.id` is UUID
   - Verify `recipe.userId` matches authenticated user
   - Verify `recipe.featured` is false
   - Verify `recipe.createdAt` and `recipe.updatedAt` are timestamps
   - Verify `isPublic` defaults to false if not provided

7. **Test Database State**
   - Verify recipe exists in database after creation
   - Verify recipe_tags associations exist if tags provided
   - Verify recipes can be retrieved via GET /api/recipes

**Test Tools:**

- Use Postman, Insomnia, or curl for API testing
- Use Supabase dashboard to verify database state

### Step 5: Update Documentation and Review

**Tasks:**

1. Add JSDoc comments to service function
2. Review error handling completeness
3. Verify all validation constraints match specification
4. Ensure logging is structured and informative
5. Review security considerations checklist
6. Update API documentation if maintained separately
7. Consider adding unit tests for service layer (future improvement)
8. Consider adding integration tests for API endpoint (future improvement)

**Code Review Checklist:**

- [ ] Authentication implemented correctly
- [ ] All required fields validated
- [ ] All optional fields handled with defaults
- [ ] Nested objects (ingredients, steps, nutrition) validated
- [ ] Array size limits enforced
- [ ] Step numbers validated for sequence
- [ ] Tag validation implemented
- [ ] Recipe insertion handles all fields correctly
- [ ] Recipe-tag associations created properly
- [ ] Complete recipe fetched with tags
- [ ] Response format matches specification (201, success wrapper)
- [ ] Error responses use correct status codes
- [ ] Error messages are user-friendly
- [ ] Errors logged with sufficient detail
- [ ] No sensitive data logged
- [ ] Security considerations addressed
- [ ] Code follows project patterns and conventions
- [ ] Type safety maintained throughout

---

## Summary

This implementation plan provides comprehensive guidance for implementing the POST /api/recipes endpoint following the HealthyMeal application's architecture patterns. The plan emphasizes:

- **Type Safety**: Using existing DTOs and command models from types.ts
- **Validation**: Comprehensive Zod schema validation with appropriate constraints
- **Service Layer**: Business logic extraction to recipe.service.ts
- **Security**: Authentication, authorization, input validation, and secure defaults
- **Error Handling**: Clear error scenarios with appropriate status codes
- **Code Patterns**: Following existing patterns from recipes.ts and recipe.service.ts
- **Performance**: Efficient database operations with batch inserts and minimal queries
- **Maintainability**: Well-structured code with proper separation of concerns

The implementation should result in a robust, secure, and performant recipe creation endpoint that integrates seamlessly with the existing HealthyMeal application architecture.
