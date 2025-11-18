As a senior frontend developer, your task is to create a detailed implementation plan for a new view in a web application. This plan should be comprehensive and clear enough for another frontend developer to implement the view correctly and efficiently.

First, review the following information:

1. Product Requirements Document (PRD):
   <prd>
   `.ai/prd.md`
   </prd>

2. View Description:
   <view_description>

### 2.2 User Dashboard

**Path:** `/dashboard`

**Main Purpose:** Post-login landing page serving as navigation hub. Provides quick access to user's recipes, favorites, and public recipes. Designed to "shorten user time to reach any destination in the application."

**Key Information to Display:**

- Personalized welcome banner with user's name
- Last 4-6 user recipes (recent activity)
- Last 4-6 favorited recipes
- 4-6 random public recipes (refreshed on page load)
- Quick action button: "+ Dodaj przepis"

**Key View Components:**

**Layout Components:**

- `<DashboardLayout>` - Overall container with max-width constraint, responsive padding
- `<WelcomeBanner>` - Greeting message ("Witaj, [Name]!"), quick action CTA
- `<RecipeSectionRow>` - Reusable component for horizontally scrolling recipe rows
  - Props: title, recipes[], viewAllLink, emptyMessage
  - Horizontal scroll on mobile, grid on desktop
  - "Zobacz wszystkie/więcej" link
- `<Footer>` - Consistent app footer

**Recipe Cards:**

- `<RecipeCard>` (summarized version)
  - Colored placeholder image with recipe initial + icon
  - Recipe title (truncated with line-clamp-2)
  - Calorie badge (color-coded)
  - Protein amount
  - Prep time
  - Primary tag badge
  - Quick actions: Favorite heart icon, "..." menu

**Interactive Components:**

- Horizontal scroll containers with touch/swipe support
- Quick action "+ Dodaj przepis" button (fixed or prominent)
- Recipe card tap/click navigation
- Favorite toggle (optimistic UI)

**UX Considerations:**

- Immediate visual feedback on favorite toggle
- Loading skeletons for recipe sections (if >500ms load time)
- Empty state messages if user has no recipes/favorites
- Random public recipes refresh on each page visit
- Touch-friendly swipe for horizontal scrolling
- Clear visual separation between sections

**Accessibility Considerations:**

- Keyboard navigation for scrollable sections (arrow keys)
- Screen reader announcements for section counts
- Proper ARIA labels for icon-only actions
- Focus management when navigating between sections

**Security Considerations:**

- User authentication required
- Display only user's own recipes and favorites
- Public recipes filtered for appropriate content

**Empty States:**

- No recent recipes: "Nie masz jeszcze przepisów" + "+ Dodaj pierwszy przepis" button
- No favorites: "Nie masz ulubionych przepisów" + suggestion to browse recipes
- No public recipes available: Unlikely, but show placeholder message
  </view_description>

3. User Stories:
   <user_stories>

#### US-027: Viewing the User Dashboard

As a logged-in user, I want to see the dashboard to have quick access to my recipes, favorites, and discover new recipes.

Acceptance Criteria:

1.  After logging in, the system displays a personalized welcome message with the user's name.
2.  The dashboard displays a section with the user's most recently added recipes (4-6 recipes).
3.  The dashboard displays a section with the most recently favorited recipes (4-6 recipes).
4.  The dashboard displays a section with random public recipes (4-6 recipes) that refresh on each visit.
5.  The user sees a clear "+ Add Recipe" button for quickly adding a new recipe.
6.  If there are no personal recipes or favorites, the system displays appropriate messages and encourages action (e.g., "You don't have any recipes yet," "+ Add your first recipe").
    </user_stories>

7.  Endpoint Description:
    <endpoint_description>

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

---

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

#### GET /api/recipes

**Description**: List user's recipes with search and filtering

**Authentication**: Required

**Query Parameters**:

- `search` (string): Full-text search in title and description (uses Polish text search)
- `tags` (string): Comma-separated tag IDs
- `maxCalories` (number): Maximum calories per serving
- `maxPrepTime` (number): Maximum preparation time in minutes
- `isPublic` (boolean): Filter by public/private status
- `page` (number): Page number (default: 1)
- `limit` (number): Results per page (default: 20, max: 100)
- `sortBy` (string): "createdAt" | "updatedAt" | "title" | "prepTime" (default: "createdAt")
- `sortOrder` (string): "asc" | "desc" (default: "desc")

**Validation**:

- `search`: Optional, 1-255 characters, trimmed
- `tags`: Optional, comma-separated UUIDs (each UUID validated)
- `maxCalories`: Optional, positive number (min: 1, max: 10000)
- `maxPrepTime`: Optional, positive integer (min: 1, max: 1440)
- `isPublic`: Optional, boolean (parsed from string "true"/"false")
- `page`: Optional, positive integer (min: 1, default: 1)
- `limit`: Optional, positive integer (min: 1, max: 100, default: 20)
- `sortBy`: Optional, enum: "createdAt" | "updatedAt" | "title" | "prepTime" (default: "createdAt")
- `sortOrder`: Optional, enum: "asc" | "desc" (default: "desc")

**Response** (200 OK):

```json
{
  "recipes": [
    {
      "id": "uuid",
      "userId": "uuid",
      "title": "Placki ziemniaczane",
      "description": "Tradycyjne polskie placki",
      "servings": 4,
      "prepTimeMinutes": 30,
      "isPublic": false,
      "featured": false,
      "nutritionPerServing": {
        "calories": 450,
        "protein": 12,
        "fat": 15,
        "carbs": 60,
        "fiber": 6,
        "salt": 1.5
      },
      "tags": [
        {
          "id": "uuid",
          "name": "Obiad",
          "slug": "obiad"
        }
      ],
      "createdAt": "2025-10-11T12:00:00Z",
      "updatedAt": "2025-10-11T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

**Error Responses**:

- 400 Bad Request: Invalid query parameters
- 401 Unauthorized: Not authenticated

#### GET /api/recipes/public

**Description**: Browse public recipes from all users

**Authentication**: Required

**Query Parameters**: Same as GET /api/recipes (except `isPublic` is always true)

**Validation**:

- `search`: Optional, 1-255 characters, trimmed
- `tags`: Optional, comma-separated UUIDs (each UUID validated)
- `maxCalories`: Optional, positive number (min: 1, max: 10000)
- `maxPrepTime`: Optional, positive integer (min: 1, max: 1440)
- `page`: Optional, positive integer (min: 1, default: 1)
- `limit`: Optional, positive integer (min: 1, max: 100, default: 20)
- `sortBy`: Optional, enum: "createdAt" | "updatedAt" | "title" | "prepTime" (default: "createdAt")
- `sortOrder`: Optional, enum: "asc" | "desc" (default: "desc")

**Response**: Same structure as GET /api/recipes

**Error Responses**:

- 400 Bad Request: Invalid query parameters
- 401 Unauthorized: Not authenticated
  </endpoint_description>

1. Endpoint Implementation:
   <endpoint_implementation>
   `src/pages/api/favorites.ts`
   `src/pages/api/profile.ts`
   `src/pages/api/recipes.ts`
   `src/pages/api/recipes/public.ts`
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

Begin analysis and planning now. Your final output should consist solely of the implementation plan in English in markdown format, which you will save in the .ai/ui/views/2*2*{view-name}-view-implementation-plan.md file and should not duplicate or repeat any work done in the implementation breakdown.
