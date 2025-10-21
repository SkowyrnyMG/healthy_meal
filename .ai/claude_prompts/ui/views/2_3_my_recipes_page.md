As a senior frontend developer, your task is to create a detailed implementation plan for a new view in a web application. This plan should be comprehensive and clear enough for another frontend developer to implement the view correctly and efficiently.

First, review the following information:

1. Product Requirements Document (PRD):
<prd>
`.ai/prd.md`
</prd>

2. View Description:
<view_description>
### 2.3 My Recipes Page

**Path:** `/recipes`

**Main Purpose:** Display user's personal recipe collection with search, filtering, and sorting capabilities. Primary interface for finding and managing recipes.

**Key Information to Display:**
- User's recipe collection in responsive grid
- Active search query and filters
- Recipe count and pagination info
- Sort order indicator

**Key View Components:**

**Layout Components:**
- `<RecipeListLayout>` - Main container with sidebar (desktop) or top sections (mobile)
- `<SearchBar>` - Prominent text input with search icon, placeholder: "Szukaj przepisów..."
- `<FilterButton>` - Button with count badge (e.g., "Filtry (3)") when filters active
- `<FilterPanel>` - Collapsible panel (desktop) or drawer/sheet (mobile, Shadcn/ui Sheet)
  - Tag multi-select checkboxes (predefined + custom tags)
  - Max calories slider (0-10000 kcal)
  - Max prep time slider (0-1440 minutes)
  - Sort dropdown (Najnowsze, Najstarsze, Tytuł A-Z, Czas przygotowania)
  - "Zastosuj" and "Wyczyść filtry" buttons
- `<ActiveFilterChips>` - Removable chips showing active filters
- `<RecipeGrid>` - Responsive grid (1 col mobile, 2-3 tablet, 3-4 desktop)
- `<Pagination>` - Page numbers, prev/next buttons (20 items per page)

**Recipe Cards:**
- `<RecipeCard>` (full version)
  - Colored placeholder with initial + icon
  - Title (line-clamp-2)
  - Description preview (line-clamp-2)
  - Nutrition summary (calories badge, protein)
  - Prep time, servings
  - Tag badges (primary 1-2 visible)
  - Actions: Favorite heart, "..." menu (Edit, Delete, View, Add to Collection, Modify with AI)

**Interactive Components:**
- Search input with 500ms debounce
- Filter panel slide-in/slide-out animation
- Active filter chip removal
- Recipe card hover states (desktop)
- Sort dropdown
- Pagination navigation

**UX Considerations:**
- All filter state persists in URL query parameters
- Shareable filtered URLs
- Browser back/forward navigation support
- Loading skeletons while fetching recipes
- Empty state when no recipes match filters: "Nie znaleziono przepisów" + "Wyczyść filtry" button
- Filter count badge visibility
- Clear visual feedback when filters applied
- Smooth transitions between filter changes

**Accessibility Considerations:**
- Search bar with proper label (visible or aria-label)
- Filter panel keyboard navigation (Tab, Enter, Escape)
- Checkbox/slider ARIA states
- Screen reader announcements for filter updates
- Focus management when opening/closing filter panel
- Keyboard-accessible pagination

**Security Considerations:**
- Display only user's own recipes
- Recipe ownership verification before Edit/Delete actions
- XSS protection in search query display

**Empty States:**
- No recipes at all: "Nie masz jeszcze przepisów" + "+ Dodaj pierwszy przepis" CTA
- No results from search/filter: "Nie znaleziono przepisów pasujących do kryteriów" + "Wyczyść filtry" button

**URL State Example:**
```
/recipes?search=kurczak&tags=uuid1,uuid2&maxCalories=500&maxPrepTime=30&sortBy=prepTime&sortOrder=asc&page=2
```
</view_description>

3. User Stories:
<user_stories>
#### US-010: Browsing Existing Recipes

As a user, I want to browse my recipes to find interesting items.

Acceptance Criteria:

1. The system displays a list of user's recipes
2. The list contains basic information about recipes (title, short description, nutritional values)
3. The user can select a recipe to see its details

#### US-013: Searching and Filtering Recipes

As a user, I want to search and filter recipes to quickly find interesting items.

Acceptance Criteria:

1. The user can search recipes by title
2. The user can filter recipes by hashtags
3. The user can filter recipes by calorie content (below/above X kcal)
4. The user can filter recipes by preparation time (up to X minutes)
5. The system displays results matching the search/filter criteria

#### US-014: Saving Recipes to Favorites

As a user, I want to save recipes as favorites to easily return to them.

Acceptance Criteria:

1. The user can mark a recipe as favorite
2. The user can remove a recipe from favorites
3. The system displays a separate list of favorite recipes

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
`src/pages/api/recipes.ts`
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

Begin analysis and planning now. Your final output should consist solely of the implementation plan in English in markdown format, which you will save in the .ai/claude_prompts/ui/views/2_3_{view-name}-view-implementation-plan.md file and should not duplicate or repeat any work done in the implementation breakdown.