# API Endpoint Implementation Plan: POST /api/recipes/{recipeId}/modifications

## Analysis

<analysis>

### 1. API Specification Summary

**Endpoint**: POST /api/recipes/{recipeId}/modifications
**Purpose**: Create AI-powered recipe modifications with mocked AI responses for development
**Authentication**: Required (mocked userId: `a85d6d6c-b7d4-4605-9cc4-3743401b67a0`)
**Rate Limiting**: 10 requests per 5 minutes per user
**Success Response**: 201 Created

### 2. Parameters

**Path Parameters**:

- `recipeId` (required): UUID of the recipe to modify

**Request Body Parameters**:

- `modificationType` (required): One of 6 predefined types
- `parameters` (required): Object with type-specific parameters

**Modification Types**:

1. `reduce_calories`: Requires `{ targetCalories: number }` OR `{ reductionPercentage: number }`
2. `increase_calories`: Requires `{ targetCalories: number }` OR `{ increasePercentage: number }`
3. `increase_protein`: Requires `{ targetProtein: number }` OR `{ increasePercentage: number }`
4. `increase_fiber`: Requires `{ targetFiber: number }` OR `{ increasePercentage: number }`
5. `portion_size`: Requires `{ newServings: number }`
6. `ingredient_substitution`: Requires `{ originalIngredient: string, preferredSubstitute?: string }`

### 3. Required DTO Types and Command Models

**Existing Types** (from `src/types.ts`):

- `CreateModificationCommand`: Request payload type
- `ModificationDTO`: Response type
- `ModificationDataDTO`: Modified recipe data structure
- `ModificationParameters`: Parameters for different modification types
- `RecipeIngredientDTO`: Ingredient structure
- `RecipeStepDTO`: Step structure
- `NutritionDTO`: Nutrition information

**Database Types**:

- `DbModificationInsert`: For inserting into `recipe_modifications` table

### 4. Service Logic

**New Service**: `src/lib/services/modification.service.ts`

Functions needed:

- `createModification()`: Main function to create modification with mock AI response
- `generateMockModification()`: Private helper to generate realistic mock data based on modification type
- Helper functions for each modification type to generate appropriate mock data

The service will:

1. Accept recipe data and modification parameters
2. Generate mock modified recipe data based on modification type
3. Insert modification record into database
4. Return ModificationDTO

### 5. Input Validation

**Zod Schemas Required**:

1. `RecipeIdParamSchema`: Validate UUID format for recipeId
2. `ModificationParametersSchema`: Discriminated union based on modificationType
3. `CreateModificationCommandSchema`: Top-level request body validation

**Validation Rules**:

- recipeId must be valid UUID
- modificationType must be one of 6 allowed values
- parameters must match the requirements for the specific modification type
- Numeric values must be positive where applicable
- targetCalories/targetProtein/targetFiber must be reasonable ranges (e.g., 0-10000)
- reductionPercentage/increasePercentage must be 1-100
- newServings must be positive integer (1-100)
- originalIngredient must be non-empty string (1-100 chars)
- preferredSubstitute optional string (1-100 chars)

### 6. Error Logging

Errors should be logged to console with context:

- Endpoint identifier: `[POST /api/recipes/[recipeId]/modifications]`
- recipeId
- userId
- modificationType
- Error message and stack trace

No database error logging table exists yet, so console logging is sufficient.

### 7. Security Threats

**IDOR (Insecure Direct Object Reference)**:

- Attacker could try to modify recipes they don't own
- Mitigation: Verify user has access to recipe (owner OR recipe is public)

**Rate Limit Bypass**:

- Attacker could spam modification requests
- Mitigation: Implement 10 req/min rate limiting (placeholder for now)

**Invalid Parameter Injection**:

- Attacker could send malicious parameters
- Mitigation: Strict Zod validation with whitelisted values

**Database Injection**:

- Not a concern - using Supabase SDK with parameterized queries

**Information Disclosure**:

- Error messages could reveal system details
- Mitigation: Return generic error messages, log details server-side

### 8. Error Scenarios and Status Codes

- **400 Bad Request**: Invalid recipeId format, invalid modificationType, invalid parameters structure, missing required parameters
- **401 Unauthorized**: Not authenticated (production only)
- **403 Forbidden**: Recipe exists but user doesn't have access (private recipe, not owner)
- **404 Not Found**: Recipe doesn't exist
- **429 Too Many Requests**: Rate limit exceeded (placeholder comment)
- **500 Internal Server Error**: Database errors, unexpected errors
- **504 Gateway Timeout**: AI processing timeout (placeholder for future - mock is instant)

</analysis>

---

## 1. Endpoint Overview

**Endpoint**: POST /api/recipes/{recipeId}/modifications

**Purpose**: Creates an AI-powered modification of an existing recipe based on user-specified parameters. For the MVP phase, AI responses are mocked to allow development without AI integration costs.

**Key Features**:

- Supports 6 modification types: calorie reduction/increase, protein increase, fiber increase, portion adjustment, ingredient substitution
- Validates user access to recipe (IDOR protection)
- Stores modification separately from original recipe
- Returns complete modified recipe data with modification notes

---

## 2. Request Details

### HTTP Method

POST

### URL Structure

```
/api/recipes/{recipeId}/modifications
```

### Path Parameters

| Parameter | Type   | Required | Validation  | Description                               |
| --------- | ------ | -------- | ----------- | ----------------------------------------- |
| recipeId  | string | Yes      | UUID format | Unique identifier of the recipe to modify |

### Request Headers

```
Content-Type: application/json
```

### Request Body

```typescript
{
  "modificationType": "reduce_calories" | "increase_calories" | "increase_protein" | "increase_fiber" | "portion_size" | "ingredient_substitution",
  "parameters": {
    // Type-specific parameters (see table below)
  }
}
```

### Modification Types and Parameters

| Modification Type         | Required Parameters                       | Optional Parameters   | Constraints                                                       |
| ------------------------- | ----------------------------------------- | --------------------- | ----------------------------------------------------------------- |
| `reduce_calories`         | `targetCalories` OR `reductionPercentage` | -                     | targetCalories: 0-10000, reductionPercentage: 1-100               |
| `increase_calories`       | `targetCalories` OR `increasePercentage`  | -                     | targetCalories: 0-10000, increasePercentage: 1-100                |
| `increase_protein`        | `targetProtein` OR `increasePercentage`   | -                     | targetProtein: 0-1000, increasePercentage: 1-100                  |
| `increase_fiber`          | `targetFiber` OR `increasePercentage`     | -                     | targetFiber: 0-1000, increasePercentage: 1-100                    |
| `portion_size`            | `newServings`                             | -                     | newServings: 1-100 (integer)                                      |
| `ingredient_substitution` | `originalIngredient`                      | `preferredSubstitute` | originalIngredient: 1-100 chars, preferredSubstitute: 1-100 chars |

### Example Request Bodies

**Reduce Calories (target)**:

```json
{
  "modificationType": "reduce_calories",
  "parameters": {
    "targetCalories": 350
  }
}
```

**Reduce Calories (percentage)**:

```json
{
  "modificationType": "reduce_calories",
  "parameters": {
    "reductionPercentage": 20
  }
}
```

**Portion Size**:

```json
{
  "modificationType": "portion_size",
  "parameters": {
    "newServings": 6
  }
}
```

**Ingredient Substitution**:

```json
{
  "modificationType": "ingredient_substitution",
  "parameters": {
    "originalIngredient": "butter",
    "preferredSubstitute": "olive oil"
  }
}
```

---

## 3. Used Types

### DTOs (from `src/types.ts`)

```typescript
// Request Command
interface CreateModificationCommand {
  modificationType:
    | "reduce_calories"
    | "increase_calories"
    | "increase_protein"
    | "increase_fiber"
    | "portion_size"
    | "ingredient_substitution";
  parameters: ModificationParameters;
}

interface ModificationParameters {
  targetCalories?: number;
  reductionPercentage?: number;
  increasePercentage?: number;
  targetProtein?: number;
  targetFiber?: number;
  newServings?: number;
  originalIngredient?: string;
  preferredSubstitute?: string;
}

// Response DTO
interface ModificationDTO {
  id: string;
  originalRecipeId: string;
  userId: string;
  modificationType: string;
  modifiedData: ModificationDataDTO;
  createdAt: string;
}

interface ModificationDataDTO {
  ingredients?: RecipeIngredientDTO[];
  steps?: RecipeStepDTO[];
  nutritionPerServing?: NutritionDTO;
  servings?: number;
  modificationNotes?: string;
}
```

### Zod Validation Schemas (to be created in route file)

```typescript
// Path parameter validation
const RecipeIdParamSchema = z.object({
  recipeId: z.string().uuid("Recipe ID must be a valid UUID"),
});

// Base nutrition schema for reuse
const NutritionSchema = z.object({
  calories: z.number().min(0).max(10000),
  protein: z.number().min(0).max(1000),
  fat: z.number().min(0).max(1000),
  carbs: z.number().min(0).max(1000),
  fiber: z.number().min(0).max(1000),
  salt: z.number().min(0).max(100),
});

// Discriminated union for modification parameters
const CreateModificationCommandSchema = z.discriminatedUnion("modificationType", [
  z.object({
    modificationType: z.literal("reduce_calories"),
    parameters: z.union([
      z.object({ targetCalories: z.number().positive().max(10000) }),
      z.object({ reductionPercentage: z.number().min(1).max(100) }),
    ]),
  }),
  z.object({
    modificationType: z.literal("increase_calories"),
    parameters: z.union([
      z.object({ targetCalories: z.number().positive().max(10000) }),
      z.object({ increasePercentage: z.number().min(1).max(100) }),
    ]),
  }),
  z.object({
    modificationType: z.literal("increase_protein"),
    parameters: z.union([
      z.object({ targetProtein: z.number().positive().max(1000) }),
      z.object({ increasePercentage: z.number().min(1).max(100) }),
    ]),
  }),
  z.object({
    modificationType: z.literal("increase_fiber"),
    parameters: z.union([
      z.object({ targetFiber: z.number().positive().max(1000) }),
      z.object({ increasePercentage: z.number().min(1).max(100) }),
    ]),
  }),
  z.object({
    modificationType: z.literal("portion_size"),
    parameters: z.object({
      newServings: z.number().int().positive().max(100),
    }),
  }),
  z.object({
    modificationType: z.literal("ingredient_substitution"),
    parameters: z.object({
      originalIngredient: z.string().trim().min(1).max(100),
      preferredSubstitute: z.string().trim().min(1).max(100).optional(),
    }),
  }),
]);
```

---

## 4. Response Details

### Success Response (201 Created)

```json
{
  "success": true,
  "modification": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "originalRecipeId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "userId": "a85d6d6c-b7d4-4605-9cc4-3743401b67a0",
    "modificationType": "reduce_calories",
    "modifiedData": {
      "ingredients": [
        {
          "name": "oliwa z oliwek",
          "amount": 20,
          "unit": "ml"
        },
        {
          "name": "ziemniaki",
          "amount": 300,
          "unit": "g"
        }
      ],
      "steps": [
        {
          "stepNumber": 1,
          "instruction": "Rozgrzej piekarnik do 180°C."
        },
        {
          "stepNumber": 2,
          "instruction": "Obierz i pokrój ziemniaki na średnie kawałki."
        }
      ],
      "nutritionPerServing": {
        "calories": 350,
        "protein": 12,
        "fat": 10,
        "carbs": 50,
        "fiber": 6,
        "salt": 1.2
      },
      "servings": 4,
      "modificationNotes": "Zmniejszono kalorie przez zastąpienie masła oliwą z oliwek i zmniejszenie ilości ziemniaków"
    },
    "createdAt": "2025-10-11T12:00:00Z"
  }
}
```

### Error Responses

#### 400 Bad Request

```json
{
  "error": "Bad Request",
  "message": "Recipe ID must be a valid UUID"
}
```

```json
{
  "error": "Bad Request",
  "message": "Invalid modification type"
}
```

```json
{
  "error": "Bad Request",
  "message": "Invalid JSON in request body"
}
```

#### 401 Unauthorized (Production)

```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

#### 403 Forbidden

```json
{
  "error": "Forbidden",
  "message": "You don't have permission to modify this recipe"
}
```

#### 404 Not Found

```json
{
  "error": "Not Found",
  "message": "Recipe not found"
}
```

#### 429 Too Many Requests

```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Please try again later."
}
```

#### 500 Internal Server Error

```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

#### 504 Gateway Timeout (Future)

```json
{
  "error": "Gateway Timeout",
  "message": "AI processing took too long. Please try again."
}
```

---

## 5. Data Flow

### Request Flow

1. **Request Received**
   - Client sends POST request to `/api/recipes/{recipeId}/modifications`
   - Astro route handler receives request via `context`

2. **Path Parameter Validation**
   - Extract `recipeId` from `context.params`
   - Validate UUID format using Zod schema
   - Return 400 if validation fails

3. **Authentication** (Mocked for Development)
   - In production: Extract user from `context.locals.supabase.auth.getUser()`
   - In development: Use hardcoded userId `a85d6d6c-b7d4-4605-9cc4-3743401b67a0`
   - Return 401 if authentication fails (production only)

4. **Request Body Parsing & Validation**
   - Parse JSON body from `context.request.json()`
   - Validate using discriminated union Zod schema
   - Schema automatically validates correct parameters for modification type
   - Return 400 if validation fails

5. **Rate Limiting Check** (Placeholder)
   - TODO: Check rate limit for user (10 req/5min)
   - Return 429 if limit exceeded

6. **Recipe Retrieval**
   - Call `getRecipeById()` service function
   - Return 404 if recipe not found

7. **Authorization Check** (IDOR Protection)
   - Verify user has access: `recipe.isPublic === true OR recipe.userId === userId`
   - Return 403 if user doesn't have access

8. **Modification Generation**
   - Call `createModification()` service function
   - Service generates mock modified recipe data based on modification type
   - Service inserts modification record into `recipe_modifications` table

9. **Response**
   - Return 201 with modification data wrapped in success response

### Database Interactions

**Tables Involved**:

- `recipes` (read): Fetch original recipe data
- `recipe_modifications` (write): Insert modification record

**Queries**:

1. **Get Recipe** (via `getRecipeById` service):

```typescript
supabase
  .from("recipes")
  .select(
    `
    id, user_id, title, ingredients, steps,
    servings, nutrition_per_serving, is_public
  `
  )
  .eq("id", recipeId)
  .single();
```

2. **Insert Modification** (in new modification service):

```typescript
supabase
  .from("recipe_modifications")
  .insert({
    original_recipe_id: recipeId,
    user_id: userId,
    modification_type: modificationType,
    modified_data: {
      ingredients: [...],
      steps: [...],
      nutritionPerServing: {...},
      servings: number,
      modificationNotes: string
    }
  })
  .select()
  .single()
```

### Mock AI Response Generation

For MVP, the `generateMockModification()` helper function will:

1. **Reduce Calories**:
   - Adjust calorie value in nutrition
   - Proportionally reduce other macros
   - Add note about ingredient substitutions or portion adjustments

2. **Increase Calories**:
   - Adjust calorie value in nutrition
   - Proportionally increase other macros
   - Add note about ingredient additions

3. **Increase Protein**:
   - Adjust protein value in nutrition
   - Slightly adjust calories
   - Add note about protein-rich ingredient additions

4. **Increase Fiber**:
   - Adjust fiber value in nutrition
   - Slightly adjust carbs
   - Add note about high-fiber ingredient additions

5. **Portion Size**:
   - Keep nutrition per serving the same
   - Update servings value
   - Add note about portion adjustment

6. **Ingredient Substitution**:
   - Replace ingredient in ingredients array
   - Adjust nutrition based on substitution
   - Add note about substitution rationale

---

## 6. Security Considerations

### Authentication

- **Development**: Hardcoded userId for easier testing
- **Production**: Must extract user from Supabase auth session
- **Implementation**: Follow pattern from existing endpoints (`src/pages/api/recipes/[recipeId].ts`)

### Authorization (IDOR Protection)

- **Threat**: User attempts to modify recipe they don't own
- **Mitigation**: Verify user has access before allowing modification
- **Rules**:
  - Allow if recipe is public (anyone can create modifications of public recipes)
  - Allow if user is recipe owner (can modify their own private recipes)
  - Deny otherwise (403 Forbidden)

### Input Validation

- **Threat**: Malicious or malformed input
- **Mitigation**:
  - Strict Zod schemas with discriminated unions
  - Whitelist modification types (no arbitrary strings)
  - Numeric bounds checking (prevent extreme values)
  - String length limits (prevent DoS via large strings)
  - UUID format validation for recipeId

### Rate Limiting

- **Threat**: User spams modification requests
- **Requirement**: 10 requests per 5 minutes per user
- **Implementation**:
  - TODO: Add rate limiting middleware or service
  - Store request counts in Redis or Supabase with TTL
  - For MVP: Add placeholder comment where rate check should go

### Data Validation

- **Threat**: Invalid data in database
- **Mitigation**:
  - Database constraints on `recipe_modifications` table
  - JSONB structure validation
  - Foreign key constraints (CASCADE on recipe deletion)

### Error Handling

- **Threat**: Information disclosure through error messages
- **Mitigation**:
  - Return generic error messages to client
  - Log detailed errors server-side with context
  - Never expose stack traces or database errors to client

---

## 7. Error Handling

### Validation Errors (400)

**Scenarios**:

- Invalid UUID format for recipeId
- Invalid modification type (not in allowed list)
- Missing required parameters for modification type
- Invalid parameter values (negative numbers, out of range)
- Invalid JSON in request body

**Handling**:

```typescript
try {
  validatedParams = RecipeIdParamSchema.parse(rawParams);
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
```

### Authentication Errors (401)

**Scenarios** (Production only):

- Missing auth token
- Invalid auth token
- Expired auth token

**Handling**:

```typescript
const {
  data: { user },
  error: authError,
} = await context.locals.supabase.auth.getUser();
if (authError || !user) {
  return new Response(
    JSON.stringify({
      error: "Unauthorized",
      message: "Authentication required",
    }),
    { status: 401, headers: { "Content-Type": "application/json" } }
  );
}
```

### Authorization Errors (403)

**Scenarios**:

- Recipe exists but is private
- User is not the recipe owner
- User attempts to access recipe they don't have permission for

**Handling**:

```typescript
const hasAccess = recipe.isPublic || recipe.userId === user.id;
if (!hasAccess) {
  return new Response(
    JSON.stringify({
      error: "Forbidden",
      message: "You don't have permission to modify this recipe",
    }),
    { status: 403, headers: { "Content-Type": "application/json" } }
  );
}
```

### Not Found Errors (404)

**Scenarios**:

- Recipe with given recipeId doesn't exist

**Handling**:

```typescript
const recipe = await getRecipeById(context.locals.supabase, validatedParams.recipeId);
if (!recipe) {
  return new Response(
    JSON.stringify({
      error: "Not Found",
      message: "Recipe not found",
    }),
    { status: 404, headers: { "Content-Type": "application/json" } }
  );
}
```

### Rate Limit Errors (429)

**Scenarios**:

- User exceeds 10 requests per 5 minutes

**Handling** (Placeholder):

```typescript
// TODO: Implement rate limiting
// const isRateLimited = await checkRateLimit(userId);
// if (isRateLimited) {
//   return new Response(
//     JSON.stringify({
//       error: "Too Many Requests",
//       message: "Rate limit exceeded. Please try again later."
//     }),
//     { status: 429, headers: { "Content-Type": "application/json" } }
//   );
// }
```

### Server Errors (500)

**Scenarios**:

- Database connection failures
- Unexpected errors in service layer
- JSONB serialization errors

**Handling**:

```typescript
} catch (error) {
  console.error("[POST /api/recipes/[recipeId]/modifications] Error:", {
    recipeId: context.params.recipeId,
    userId: user?.id,
    modificationType: validatedCommand?.modificationType,
    error: error instanceof Error ? error.message : "Unknown error",
    stack: error instanceof Error ? error.stack : undefined
  });

  return new Response(
    JSON.stringify({
      error: "Internal Server Error",
      message: "An unexpected error occurred"
    }),
    { status: 500, headers: { "Content-Type": "application/json" } }
  );
}
```

### Timeout Errors (504)

**Scenarios** (Future - when real AI is integrated):

- AI processing takes longer than 5 seconds

**Handling** (Placeholder):

```typescript
// TODO: When integrating real AI
// Set timeout on AI API call
// Catch timeout and return 504
```

---

## 8. Performance Considerations

### Potential Bottlenecks

1. **Database Queries**:
   - Recipe lookup by ID (indexed on primary key - fast)
   - Modification insertion (single INSERT - fast)
   - No joins or complex queries needed

2. **Mock Data Generation**:
   - In-memory JavaScript operations
   - Negligible performance impact
   - No external API calls

3. **Future AI Integration**:
   - External API calls will be the primary bottleneck
   - Plan for 2-5 second response times
   - Implement timeout handling (5 seconds max)
   - Consider async processing with webhooks for complex modifications

### Optimization Strategies

1. **Caching**:
   - Not needed for MVP (each modification is unique)
   - Future: Cache common ingredient substitutions in `ingredient_substitutions` table

2. **Rate Limiting**:
   - Prevents abuse and protects backend resources
   - 10 req/5min is conservative for MVP
   - Consider increasing based on real usage patterns

3. **Database Indexes**:
   - Already indexed: `recipes.id` (primary key)
   - Consider adding index on `recipe_modifications.user_id` for user history queries
   - Consider adding index on `recipe_modifications.original_recipe_id` for recipe modification listings

4. **Response Size**:
   - Modification response includes complete modified recipe
   - Typical size: 2-5 KB per response
   - Acceptable for REST API
   - Consider pagination if fetching modification history

5. **Connection Pooling**:
   - Handled by Supabase SDK
   - No manual connection management needed

### Scalability Considerations

1. **Database Load**:
   - Simple queries with indexed lookups
   - Can handle thousands of concurrent requests
   - Supabase provides connection pooling

---

## 9. Implementation Steps

### Step 1: Create Modification Service

**File**: `src/lib/services/modification.service.ts`

**Tasks**:

1. Import necessary types from `src/types.ts`
2. Import SupabaseClient type
3. Define database query result interfaces
4. Create `createModification()` main function
5. Create `generateMockModification()` helper function with switch statement for each modification type
6. Implement mock data generators for each modification type:
   - `generateMockReduceCalories()`
   - `generateMockIncreaseCalories()`
   - `generateMockIncreaseProtein()`
   - `generateMockIncreaseFiber()`
   - `generateMockPortionSize()`
   - `generateMockIngredientSubstitution()`
7. Create `mapToModificationDTO()` helper to map database result to DTO
8. Add comprehensive JSDoc comments

**Key Logic**:

```typescript
export async function createModification(
  supabase: SupabaseClient,
  recipeId: string,
  userId: string,
  command: CreateModificationCommand
): Promise<ModificationDTO> {
  // 1. Generate mock modified data based on modification type
  const modifiedData = generateMockModification(recipe, command);

  // 2. Insert into database
  const { data, error } = await supabase
    .from("recipe_modifications")
    .insert({
      original_recipe_id: recipeId,
      user_id: userId,
      modification_type: command.modificationType,
      modified_data: modifiedData as any, // JSONB type assertion
    })
    .select()
    .single();

  // 3. Handle errors and map to DTO
  // ...

  return mapToModificationDTO(data);
}
```

### Step 2: Create API Route Handler

**File**: `src/pages/api/recipes/[recipeId]/modifications.ts`

**Tasks**:

1. Create directory: `src/pages/api/recipes/[recipeId]/`
2. Set `export const prerender = false`
3. Import necessary types and services
4. Define Zod validation schemas:
   - `RecipeIdParamSchema`
   - `CreateModificationCommandSchema` (with discriminated union)
5. Implement POST handler function
6. Follow error handling pattern from existing endpoints

**Structure**:

```typescript
export const prerender = false;

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const RecipeIdParamSchema = z.object({
  recipeId: z.string().uuid("Recipe ID must be a valid UUID"),
});

const CreateModificationCommandSchema = z.discriminatedUnion("modificationType", [
  // ... 6 modification type schemas
]);

// ============================================================================
// API ROUTE HANDLER
// ============================================================================

export const POST: APIRoute = async (context) => {
  try {
    // 1. Extract and validate path parameter
    // 2. Authentication (mocked)
    // 3. Rate limiting check (placeholder)
    // 4. Parse and validate request body
    // 5. Fetch recipe
    // 6. Authorization check (IDOR protection)
    // 7. Create modification via service
    // 8. Return 201 response
  } catch (error) {
    // Error handling
  }
};
```

### Step 3: Add Tests (Optional for MVP)

**File**: `src/pages/api/recipes/[recipeId]/modifications.test.ts` (if testing framework is set up)

**Test Cases**:

1. Successful modification creation (each type)
2. Invalid recipeId format (400)
3. Invalid modification type (400)
4. Missing required parameters (400)
5. Recipe not found (404)
6. Forbidden access (403)
7. Rate limit exceeded (429) - when implemented

### Step 4: Manual Testing

**Using curl or Postman**:

1. **Test reduce_calories**:

```bash
curl -X POST http://localhost:3000/api/recipes/{valid-recipe-id}/modifications \
  -H "Content-Type: application/json" \
  -d '{
    "modificationType": "reduce_calories",
    "parameters": {
      "targetCalories": 350
    }
  }'
```

2. **Test validation errors**:

```bash
# Invalid UUID
curl -X POST http://localhost:3000/api/recipes/invalid-uuid/modifications \
  -H "Content-Type: application/json" \
  -d '{"modificationType": "reduce_calories", "parameters": {"targetCalories": 350}}'

# Missing parameters
curl -X POST http://localhost:3000/api/recipes/{valid-recipe-id}/modifications \
  -H "Content-Type: application/json" \
  -d '{"modificationType": "reduce_calories", "parameters": {}}'
```

3. **Test authorization**:

```bash
# Try to modify recipe that doesn't exist (404)
curl -X POST http://localhost:3000/api/recipes/00000000-0000-0000-0000-000000000000/modifications \
  -H "Content-Type: application/json" \
  -d '{"modificationType": "reduce_calories", "parameters": {"targetCalories": 350}}'
```

### Step 5: Update Documentation

**Tasks**:

1. ✅ Implementation plan already created (this file)
2. Update API documentation if separate docs exist
3. Add endpoint to Postman collection if used
4. Update CHANGELOG.md if maintained

### Step 6: Future Enhancements (Post-MVP)

**When ready to integrate real AI**:

1. Create AI service with OpenRouter integration
2. Replace mock generation with real AI calls
3. Implement timeout handling (5 seconds)
4. Add error handling for AI API failures
5. Consider async processing for complex modifications
6. Implement rate limiting properly
7. Add caching for common modifications
8. Track AI API usage and costs

---

## Summary

This implementation plan provides a complete specification for the POST /api/recipes/{recipeId}/modifications endpoint. The endpoint will:

- Accept 6 types of recipe modifications with type-specific parameters
- Use mocked AI responses for MVP development
- Implement proper authentication and authorization (IDOR protection)
- Validate all inputs with strict Zod schemas
- Handle errors gracefully with appropriate status codes
- Store modifications separately from original recipes
- Return complete modified recipe data with modification notes

The implementation follows the project's architecture patterns, uses existing services where possible, and prepares for future AI integration while keeping the MVP simple and testable.
