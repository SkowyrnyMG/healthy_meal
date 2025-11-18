As a senior frontend developer, your task is to create a detailed implementation plan for a new view in a web application. This plan should be comprehensive and clear enough for another frontend developer to implement the view correctly and efficiently.

First, review the following information:

1. Product Requirements Document (PRD):
   <prd>
   `.ai/prd.md`
   </prd>

2. View Description:
   <view_description>

### 2.7 Collections List Page

**Path:** `/collections`

**Main Purpose:** Display user's recipe collections. Provides organizational structure for grouping related recipes.

**Key Information to Display:**

- All user's collections in grid layout
- Collection name, recipe count, preview thumbnails
- Quick actions for each collection (Edit, Delete)
- Create new collection button

**Key View Components:**

**Layout Components:**

- `<CollectionsLayout>` - Main container with max-width
- `<PageHeader>` - Title "Moje Kolekcje", "+ Nowa kolekcja" button
- `<CollectionGrid>` - Responsive grid (1 col mobile, 2 tablet, 3-4 desktop)

**Collection Cards:**

`<CollectionCard>`

- Collection name (H3)
- Recipe count: "X przepisów"
- Thumbnail grid of first 3-4 recipes (colored placeholders)
- Created date
- Hover overlay (desktop): Edit icon, Delete icon
- Mobile: "..." menu button with Edit/Delete options

**Create Collection Dialog:**

`<CreateCollectionDialog>` (Shadcn/ui Dialog)

- Text input for collection name (1-100 chars, unique per user)
- "Utwórz" / "Anuluj" buttons
- Validation: Required, max length, uniqueness

**Edit Collection Dialog:**

`<EditCollectionDialog>` (same as Create)

- Pre-populated with current name
- "Zapisz" / "Anuluj" buttons
- Validation: Same as create

**Delete Collection Confirmation:**

`<DeleteCollectionDialog>` (Shadcn/ui AlertDialog)

- Title: "Usuń kolekcję?"
- Message: "Ta akcja jest nieodwracalna. Kolekcja '[name]' zostanie trwale usunięta."
- Context: "Kolekcja zawiera X przepisów" (recipes remain, only collection deleted)
- Buttons: "Usuń" (destructive red), "Anuluj"

**Interactive Components:**

- Collection card click → navigate to collection detail
- "+ Nowa kolekcja" button → open create dialog
- Edit icon → open edit dialog
- Delete icon → open delete confirmation
- Mobile "..." menu with actions

**UX Considerations:**

- Loading skeletons for collections (if >500ms)
- Empty state when no collections
- Success toasts on create/edit/delete
- Visual feedback on hover (desktop)
- Touch-friendly tap targets (mobile)
- Thumbnail preview gives visual context

**Accessibility Considerations:**

- Collection cards keyboard accessible (Enter to open)
- Edit/Delete actions keyboard accessible
- Dialog focus management (Shadcn/ui handles)
- Screen reader announcements for collection count

**Security Considerations:**

- Display only user's own collections
- Collection ownership verified before edit/delete

**Empty State:**

- No collections: Large icon, "Nie masz jeszcze kolekcji", "+ Utwórz pierwszą kolekcję" CTA

**Future Enhancements (Post-MVP):**

- Collection sharing (public collections)
- Collection categories/tags
- Sort collections (alphabetical, date, recipe count)
- Collection cover image
  </view_description>

3. User Stories:
   <user_stories>

#### US-015: Organizing Recipes into Collections

As a user, I want to organize recipes into collections to better categorize them.

Acceptance Criteria:

1. The user can create collections with a name.
2. The user can add recipes to collections.
3. The user can remove recipes from collections.
4. The user can view collections and the recipes contained within them.
   </user_stories>

5. Endpoint Description:
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

#### GET /api/collections

**Description**: List user's collections

**Authentication**: Required

**Response** (200 OK):

```json
{
  "collections": [
    {
      "id": "uuid",
      "userId": "uuid",
      "name": "Szybkie kolacje",
      "recipeCount": 8,
      "createdAt": "2025-10-11T12:00:00Z"
    }
  ]
}
```

**Error Responses**:

- 401 Unauthorized: Not authenticated

#### POST /api/collections

**Description**: Create new collection

**Authentication**: Required

**Request Payload**:

```json
{
  "name": "Szybkie kolacje"
}
```

**Validation**:

- `name`: Required, 1-100 characters, unique per user

**Response** (201 Created):

```json
{
  "success": true,
  "collection": {
    "id": "uuid",
    "userId": "uuid",
    "name": "Szybkie kolacje",
    "recipeCount": 0,
    "createdAt": "2025-10-11T12:00:00Z"
  }
}
```

**Error Responses**:

- 400 Bad Request: Invalid name
- 401 Unauthorized: Not authenticated
- 409 Conflict: Collection with this name already exists

#### GET /api/collections/{collectionId}

**Description**: Get collection with recipes

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
  "id": "uuid",
  "userId": "uuid",
  "name": "Szybkie kolacje",
  "recipes": [
    {
      "recipeId": "uuid",
      "recipe": {
        "id": "uuid",
        "title": "Placki ziemniaczane",
        "description": "...",
        "nutritionPerServing": {...}
      },
      "createdAt": "2025-10-11T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 8,
    "totalPages": 1
  },
  "createdAt": "2025-10-11T12:00:00Z"
}
```

**Error Responses**:

- 400 Bad Request: Invalid query parameters
- 401 Unauthorized: Not authenticated
- 403 Forbidden: Collection belongs to another user
- 404 Not Found: Collection not found

#### PUT /api/collections/{collectionId}

**Description**: Update collection name

**Authentication**: Required

**Request Payload**:

```json
{
  "name": "Szybkie i zdrowe kolacje"
}
```

**Response** (200 OK):

```json
{
  "success": true,
  "collection": {
    "id": "uuid",
    "name": "Szybkie i zdrowe kolacje",
    "updatedAt": "2025-10-11T12:30:00Z"
  }
}
```

**Error Responses**:

- 401 Unauthorized: Not authenticated
- 403 Forbidden: Collection belongs to another user
- 404 Not Found: Collection not found
- 409 Conflict: Collection with this name already exists

#### DELETE /api/collections/{collectionId}

**Description**: Delete collection

**Authentication**: Required

**Response** (204 No Content)

**Error Responses**:

- 401 Unauthorized: Not authenticated
- 403 Forbidden: Collection belongs to another user
- 404 Not Found: Collection not found

#### POST /api/collections/{collectionId}/recipes

**Description**: Add recipe to collection

**Authentication**: Required

**Request Payload**:

```json
{
  "recipeId": "uuid"
}
```

**Validation**:

- `recipeId`: Required, valid UUID

**Response** (201 Created):

```json
{
  "success": true,
  "collectionRecipe": {
    "collectionId": "uuid",
    "recipeId": "uuid",
    "createdAt": "2025-10-11T12:00:00Z"
  }
}
```

**Error Responses**:

- 401 Unauthorized: Not authenticated
- 403 Forbidden: Collection belongs to another user
- 404 Not Found: Collection or recipe not found
- 409 Conflict: Recipe already in collection

#### DELETE /api/collections/{collectionId}/recipes/{recipeId}

**Description**: Remove recipe from collection

**Authentication**: Required

**Response** (204 No Content)

**Error Responses**:

- 401 Unauthorized: Not authenticated
- 403 Forbidden: Collection belongs to another user
- 404 Not Found: Recipe not in collection

</endpoint_description>

1. Endpoint Implementation:
   <endpoint_implementation>
   `src/pages/api/profile.ts`
   `src/pages/api/collections/index.ts`
   `src/pages/api/collections/[collectionId].ts`
   `src/pages/api/collections/[collectionId]/recipes.ts`
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

Begin analysis and planning now. Your final output should consist solely of the implementation plan in English in markdown format, which you will save in the .ai/claude*prompts/ui/views/2_7*{view-name}-view-implementation-plan.md file and should not duplicate or repeat any work done in the implementation breakdown.
