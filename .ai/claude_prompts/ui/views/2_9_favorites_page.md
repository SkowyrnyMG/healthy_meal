As a senior frontend developer, your task is to create a detailed implementation plan for a new view in a web application. This plan should be comprehensive and clear enough for another frontend developer to implement the view correctly and efficiently.

First, review the following information:

1. Product Requirements Document (PRD):
   <prd>
   `.ai/prd.md`
   </prd>

2. View Description:
   <view_description>

### 2.9 Favorites Page

**Path:** `/favorites`

**Main Purpose:** Display user's favorited recipes in simple list format. Quick access to most-liked recipes.

**Key Information to Display:**

- All favorited recipes
- Date added (for sorting)
- Recipe count

**Key View Components:**

**Layout Components:**

- `<FavoritesLayout>` - Main container
- `<PageHeader>` - Title "Ulubione przepisy", count
- `<RecipeGrid>` - Responsive grid (same as My Recipes)
- `<Pagination>` - 20 items per page

**Recipe Cards:**

`<FavoriteRecipeCard>` (same as RecipeCard)

- Heart icon filled (favorited state)
- All standard recipe card elements
- Actions: View, Unfavorite, Add to Collection, Edit (if own recipe), Delete (if own recipe)

**Sorting:**

- Default: Date added (most recent first)
- No search/filtering for MVP (simple paginated list)

**Interactive Components:**

- Favorite toggle (removes from list with optimistic UI)
- Recipe card actions menu
- Pagination

**UX Considerations:**

- Loading skeletons on initial load
- Empty state if no favorites
- Optimistic removal (unfavorite removes from list immediately)
- Undo option in toast after unfavorite
- Clear indication of favorited status (filled heart)

**Accessibility Considerations:**

- Heart toggle keyboard accessible
- Screen reader announcement: "Usunięto z ulubionych"

**Security Considerations:**

- Display user's own favorites only
- Can favorite any accessible recipe (own + public)

**Empty State:**

- No favorites: Heart icon, "Nie masz ulubionych przepisów", "Przeglądaj przepisy i dodaj do ulubionych" with link to public recipes

**Future Enhancements (Post-MVP):**

- Search within favorites
- Filter favorites by tags
- Sort by different criteria
- Favorite collections

</view_description>

3. User Stories:
   <user_stories>

#### US-FAV-01: Browsing Favorite Recipes

As a user, I want to browse my list of favorite recipes to quickly access the meals I like the most.

Acceptance Criteria:

1. The system displays a paginated list of all recipes the user has marked as favorite.
2. Each recipe card shows key information (title, nutrition, prep time) and indicates it is a favorite (e.g., filled heart icon).
3. Recipes are sorted by the date they were added to favorites, with the most recent first.
4. The user can click on a recipe to navigate to its detailed view.

#### US-FAV-02: Removing a Recipe from Favorites

As a user, I want to remove a recipe from my favorites directly from the favorites page.

Acceptance Criteria:

1. Each recipe card on the favorites page has a control to "unfavorite" the item.
2. Clicking the unfavorite control immediately removes the recipe from the list (optimistic UI update).
3. A toast notification appears confirming the removal, offering an "Undo" option.
4. If the user clicks "Undo", the recipe is restored to the favorites list.

#### US-FAV-03 (Post-MVP): Searching and Filtering Favorites

As a user with many favorite recipes, I want to search and filter my favorites to find a specific recipe quickly.

Acceptance Criteria:

1. The user can search their favorite recipes by title.
2. The user can filter their favorite recipes by tags.
3. The system updates the list to show only the recipes that match the search/filter criteria.

</user_stories>

1. Endpoint Description:
   <endpoint_description>

#### GET /api/profile

**Description**: Get current user's profile

**Authentication**: Required

**Response** (200 OK):

```json
{
  "userId": "uuid",
  "weight": 75.5,
  "age": 28,
  "gender": "male",
  "activityLevel": "moderately_active",
  "dietType": "high_protein",
  "targetGoal": "lose_weight",
  "targetValue": 5.0,
  "createdAt": "2025-10-11T12:00:00Z",
  "updatedAt": "2025-10-11T12:00:00Z"
}
```

**Error Responses**:

- 401 Unauthorized: Not authenticated
- 404 Not Found: Profile not found

#### GET /api/favorites

**Description**: List user's favorite recipes

**Authentication**: Required

**Query Parameters**:

- `page` (number): Page number (default: 1)
- `limit` (number): Results per page (default: 20)

**Validation**:

- `page`: Optional, positive integer (min: 1, default: 1)
- `limit`: Optional, positive integer (min: 1, max: 100, default: 20)

**Response** (200 OK):

```json
{
  "favorites": [
    {
      "recipeId": "uuid",
      "recipe": {
        "id": "uuid",
        "title": "Placki ziemniaczane",
        "description": "...",
        "nutritionPerServing": {...},
        "prepTimeMinutes": 30
      },
      "createdAt": "2025-10-11T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 12,
    "totalPages": 1
  }
}
```

**Error Responses**:

- 401 Unauthorized: Not authenticated

#### GET /api/tags

**Description**: Get all recipe tags (publicly accessible)

**Authentication**: Optional

**Response** (200 OK):

```json
{
  "tags": [
    {
      "id": "uuid",
      "name": "Śniadanie",
      "slug": "sniadanie",
      "createdAt": "2025-10-11T12:00:00Z"
    }
  ]
}
```

</endpoint_description>

1. Endpoint Implementation:
   <endpoint_implementation>
   `src/pages/api/profile.ts`
   `src/pages/api/favorites.ts`
   `src/pages/api/tags.ts`
   </endpoint_implementation>

1. Type Definitions:
   <type_definitions>
   `src/types.ts`
   </type_definitions>

1. Tech Stack:
   <tech_stack>
   `.ai/tech-stack.md`
   </tech_stack>

Before creating the final implementation plan, conduct analysis and planning inside <implementation_breakdown> tags in your thinking block. This section can be quite long, as it's important to be thorough.

In your implementation breakdown, execute the following steps:

1. For each input section (PRD, User Stories, Endpoint Description, Endpoint Implementation, Type Definitions, Tech Stack):

- Summarize key points
- List any requirements or constraints
- Note any potential challenges or important issues

2. Extract and list key requirements from the PRD
3. List all needed main components, along with a brief description of their purpose, needed types, handled events, and validation conditions
4. Create a high-level component tree diagram
5. Identify required DTOs and custom ViewModel types for each view component. Explain these new types in detail, breaking down their fields and associated types.
6. Identify potential state variables and custom hooks, explaining their purpose and how they'll be used
7. List required API calls and corresponding frontend actions
8. Map each user story to specific implementation details, components, or functions
9. List user interactions and their expected outcomes
10. List conditions required by the API and how to verify them at the component level
11. Identify potential error scenarios and suggest how to handle them
12. List potential challenges related to implementing this view and suggest possible solutions

After conducting the analysis, provide an implementation plan in Markdown format with the following sections:

1. Overview: Brief summary of the view and its purpose.
2. View Routing: Specify the path where the view should be accessible.
3. Component Structure: Outline of main components and their hierarchy.
4. Component Details: For each component, describe:

- Component description, its purpose and what it consists of
- Main HTML elements and child components that build the component
- Handled events
- Validation conditions (detailed conditions, according to API)
- Types (DTO and ViewModel) required by the component
- Props that the component accepts from parent (component interface)

5. Types: Detailed description of types required for view implementation, including exact breakdown of any new types or view models by fields and types.
6. State Management: Detailed description of how state is managed in the view, specifying whether a custom hook is required.
7. API Integration: Explanation of how to integrate with the provided endpoint. Precisely indicate request and response types.
8. User Interactions: Detailed description of user interactions and how to handle them.
9. Conditions and Validation: Describe what conditions are verified by the interface, which components they concern, and how they affect the interface state
10. Error Handling: Description of how to handle potential errors or edge cases.
11. Implementation Steps: Step-by-step guide for implementing the view.

Ensure your plan is consistent with the PRD, user stories, and includes the provided tech stack.

The final output should be in English and saved in a file named .ai/{view-name}-view-implementation-plan.md. Do not include any analysis and planning in the final output.

Here's an example of what the output file should look like (content is to be replaced):

```markdown
# View Implementation Plan [View Name]

## 1. Overview

[Brief description of the view and its purpose]

## 2. View Routing

[Path where the view should be accessible]

## 3. Component Structure

[Outline of main components and their hierarchy]

## 4. Component Details

### [Component Name 1]

- Component description [description]
- Main elements: [description]
- Handled interactions: [list]
- Handled validation: [list, detailed]
- Types: [list]
- Props: [list]

### [Component Name 2]

[...]

## 5. Types

[Detailed description of required types]

## 6. State Management

[Description of state management in the view]

## 7. API Integration

[Explanation of integration with provided endpoint, indication of request and response types]

## 8. User Interactions

[Detailed description of user interactions]

## 9. Conditions and Validation

[Detailed description of conditions and their validation]

## 10. Error Handling

[Description of handling potential errors]

## 11. Implementation Steps

1. [Step 1]
2. [Step 2]
3. [...]
```

Begin analysis and planning now. Your final output should consist solely of the implementation plan in English in markdown format, which you will save in the .ai/claude*prompts/ui/views/2_3*{view-name}-view-implementation-plan.md file and should not duplicate or repeat any work done in the implementation breakdown.
