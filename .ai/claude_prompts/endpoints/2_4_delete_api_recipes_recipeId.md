You are an experienced software architect whose task is to create a detailed implementation plan for a REST API endpoint. Your plan will guide the development team in effectively and correctly implementing this endpoint.

Before we begin, review the following information:

1. Route API specification:
   <route_api_specification>

#### DELETE /api/recipes/{recipeId}

**Description**: Delete recipe (must be owner)

**Authentication**: Required

**Response** (204 No Content)

**Error Responses**:

- 401 Unauthorized: Not authenticated
- 403 Forbidden: User is not the owner
- 404 Not Found: Recipe not found

</route_api_specification>

2. Related database resources:
   <related_db_resources>

## 2. Relationships Between Tables

### User → Profile (1:1)

- `profiles.user_id` → `auth.users.id` (CASCADE on delete)

### User ↔ Allergens (M:M via user_allergens)

- `user_allergens.user_id` → `profiles.user_id` (CASCADE on delete)
- `user_allergens.allergen_id` → `allergens.id` (RESTRICT on delete)

### User → Disliked Ingredients (1:M)

- `user_disliked_ingredients.user_id` → `profiles.user_id` (CASCADE on delete)

### User → Recipes (1:M)

- `recipes.user_id` → `profiles.user_id` (CASCADE on delete)

### Recipe ↔ Tags (M:M via recipe_tags)

- `recipe_tags.recipe_id` → `recipes.id` (CASCADE on delete)
- `recipe_tags.tag_id` → `tags.id` (RESTRICT on delete)

### Recipe → Modifications (1:M)

- `recipe_modifications.original_recipe_id` → `recipes.id` (CASCADE on delete)
- `recipe_modifications.user_id` → `profiles.user_id` (CASCADE on delete)

### User ↔ Recipes (M:M via favorites)

- `favorites.user_id` → `profiles.user_id` (CASCADE on delete)
- `favorites.recipe_id` → `recipes.id` (CASCADE on delete)

### User → Collections → Recipes (1:M:M)

- `collections.user_id` → `profiles.user_id` (CASCADE on delete)
- `collection_recipes.collection_id` → `collections.id` (CASCADE on delete)
- `collection_recipes.recipe_id` → `recipes.id` (CASCADE on delete)

### User ↔ Recipes (M:M via recipe_ratings)

- `recipe_ratings.user_id` → `profiles.user_id` (CASCADE on delete)
- `recipe_ratings.recipe_id` → `recipes.id` (CASCADE on delete)

### User ↔ Recipes (M:M via meal_plans)

- `meal_plans.user_id` → `profiles.user_id` (CASCADE on delete)
- `meal_plans.recipe_id` → `recipes.id` (CASCADE on delete)
  </related_db_resources>

3. Type definitions:
   <type_definitions>
   `src/types.ts`
   </type_definitions>

4. Tech stack:
   <tech_stack>
   `.ai/tech-stack.md`
   </tech_stack>

5. Implementation rules:
   <implementation_rules>
   `.ai/claude_rules/astro.md`
   `.ai/claude_rules/backend.md`
   `.ai/claude_rules/shared.md`
   </implementation_rules>

Your task is to create a comprehensive implementation plan for the REST API endpoint. Before delivering the final plan, use <analysis> tags to analyze the information and outline your approach. In this analysis, ensure that:

1. Summarize key points of the API specification.
2. List required and optional parameters from the API specification.
3. List necessary DTO types and Command Models.
4. Consider how to extract logic to a service (existing or new, if it doesn't exist).
5. Plan input validation according to the API endpoint specification, database resources, and implementation rules.
6. Determine how to log errors in the error table (if applicable).
7. Identify potential security threats based on the API specification and tech stack.
8. Outline potential error scenarios and corresponding status codes.

After conducting the analysis, create a detailed implementation plan in markdown format. The plan should contain the following sections:

1. Endpoint Overview
2. Request Details
3. Response Details
4. Data Flow
5. Security Considerations
6. Error Handling
7. Performance
8. Implementation Steps

Throughout the plan, ensure that you:

- Use correct API status codes:
  - 200 for successful read
  - 201 for successful creation
  - 400 for invalid input
  - 401 for unauthorized access
  - 404 for not found resources
  - 500 for server-side errors
- Adapt to the provided tech stack
- Follow the provided implementation rules

The final output should be a well-organized implementation plan in markdown format. Here's an example of what the output should look like:

``markdown

# API Endpoint Implementation Plan: [Endpoint Name]

## 1. Endpoint Overview

[Brief description of endpoint purpose and functionality]

## 2. Request Details

- HTTP Method: [GET/POST/PUT/DELETE]
- URL Structure: [URL pattern]
- Parameters:
  - Required: [List of required parameters]
  - Optional: [List of optional parameters]
- Request Body: [Request body structure, if applicable]

## 3. Used Types

[DTOs and Command Models necessary for implementation]

## 3. Response Details

[Expected response structure and status codes]

## 4. Data Flow

[Description of data flow, including interactions with external services or databases]

## 5. Security Considerations

[Authentication, authorization, and data validation details]

## 6. Error Handling

[List of potential errors and how to handle them]

## 7. Performance Considerations

[Potential bottlenecks and optimization strategies]

## 8. Implementation Steps

1. [Step 1]
2. [Step 2]
3. [Step 3]
   ...

```

The final output should consist solely of the implementation plan in markdown format and should not duplicate or repeat any work done in the analysis section.

Remember to save your implementation plan as `.ai/claude_prompts/endpoints/2_4_delete_api_recipes_recipeId_view_implementation_plan.md`. Ensure the plan is detailed, clear, and provides comprehensive guidance for the development team.

After completing the implementation plan stop and do not implement the endpoint.
```
