As a senior frontend developer, your task is to create a detailed implementation plan for a new view in a web application. This plan should be comprehensive and clear enough for another frontend developer to implement the view correctly and efficiently.

First, review the following information:

1. Product Requirements Document (PRD):
   <prd>
   `.ai/prd.md`
   </prd>

2. View Description:
   <view_description>

### 2.5 Recipe Detail Page

**Path:** `/recipes/[id]`

**Main Purpose:** Display full recipe information including ingredients, preparation steps, nutrition values. Primary interface for viewing, modifying with AI, and managing individual recipes.

**Key Information to Display:**

- Complete recipe data (title, description, tags, prep time, servings)
- Full ingredients list with amounts
- Step-by-step preparation instructions
- Detailed nutrition information with pie chart
- Original vs Modified tabs (if modification exists)
- Action buttons (Edit, Delete, Modify with AI, Favorite, Add to Collection)

**Key View Components:**

**Layout Components:**

**Desktop Layout (Two-Column):**

- Left column (main content):
  - `<RecipeHeader>` - Title, description, tags, metadata (prep time, servings)
  - `<ServingsAdjuster>` - [−] **4 porcje** [+] buttons
  - `<IngredientsList>` - Formatted list with amounts that update with servings adjustment
  - `<PreparationSteps>` - Simple numbered list (no checkboxes for MVP)
- Right sidebar:
  - `<NutritionCard>` - Card with pie chart, macros breakdown, calorie count
  - `<ActionButtons>` - Stacked action buttons

**Mobile Layout (Single Column):**

- All sections stacked vertically
- Nutrition card appears after recipe header
- Action buttons sticky at bottom or in floating action menu

**Tab Interface (when modification exists):**

- `<TabNavigation>` - "Oryginalny" | "Zmodyfikowany" tabs
- **Original Tab:**
  - Shows original recipe data
  - All actions available: Edit, Delete, Modify with AI, Favorite, Add to Collection
- **Modified Tab:**
  - Shows modified recipe data (ingredients, steps, nutrition from `recipe_modifications` table)
  - Info banner: "To jest zmodyfikowana wersja. Oryginalny przepis możesz zobaczyć w zakładce 'Oryginalny'."
  - Actions: Modify with AI (shows replacement warning), Usuń modyfikację, Favorite, Add to Collection
  - **Edit button HIDDEN** (edit only from Original tab)

**Core Components:**

`<RecipeHeader>`

- Title (H1)
- Description paragraph
- Tag badges (clickable to filter)
- Prep time icon + minutes
- Author name (if public recipe)

`<ServingsAdjuster>`

- Decrement button [−]
- Current servings display: "4 porcje"
- Increment button [+]
- Real-time ingredient amount recalculation using ratio: `newAmount = originalAmount × (newServings / originalServings)`

`<IngredientsList>`

- Each ingredient shows: amount, unit, name
- Amounts update dynamically with servings adjustment
- Responsive layout (multi-column on desktop if space allows)

`<PreparationSteps>`

- Simple numbered list (auto-numbered with CSS or explicit)
- Each step as paragraph
- No checkboxes or cooking mode features (excluded from MVP)

`<NutritionCard>`

- Total calories prominently displayed
- `<NutritionPieChart>` - Pie chart for macros (see section 5.4 for details)
- Macronutrient breakdown list:
  - Białko: Xg (Y%)
  - Tłuszcz: Xg (Y%)
  - Węglowodany: Xg (Y%)
  - Błonnik: Xg
  - Sól: Xg

`<ActionButtons>`

- Primary: "Modyfikuj z AI" (prominent button with sparkles icon)
- Secondary actions:
  - "Edytuj" (only on Original tab)
  - "Usuń przepis" (destructive)
  - "Dodaj do ulubionych" / "Usuń z ulubionych" (heart toggle)
  - "Dodaj do kolekcji" (dropdown menu)
  - "Usuń modyfikację" (only on Modified tab, if modification exists)

**Interactive Components:**

- Tab switching (if modification exists)
- Servings increment/decrement with real-time updates
- Favorite toggle (optimistic UI)
- "Modyfikuj z AI" button opens modal
- "Dodaj do kolekcji" opens dropdown/dialog
- Delete confirmation dialog
- Delete modification confirmation

**UX Considerations:**

- Responsive layout shift (two-column to single-column)
- Ingredient amounts update smoothly with servings changes
- Clear visual distinction between Original and Modified tabs
- Replacement warning when modifying recipe that already has modification: "Ten przepis ma już modyfikację. Nowa modyfikacja zastąpi obecną. Kontynuować?"
- Loading state for initial recipe fetch
- Error handling if recipe not found (404)
- Breadcrumb navigation excluded for MVP
- Tab state not persisted in URL (simpler UX)

**Accessibility Considerations:**

- Proper heading hierarchy (H1 recipe title, H2 for sections)
- Tab panel accessibility (ARIA tabs pattern from Shadcn/ui)
- Servings adjuster keyboard support (arrow keys or +/- keys)
- Ingredient list semantically marked (unordered list)
- Steps semantically marked (ordered list)
- Chart has text alternative (legend with actual values)

**Security Considerations:**

- Recipe ownership check for Edit/Delete actions
- Public recipes viewable by all authenticated users
- Private recipes only viewable by owner
- Modification ownership verified before deletion

**Empty/Error States:**

- Recipe not found: "Nie znaleziono przepisu" with back button
- Recipe access denied: "Nie masz dostępu do tego przepisu"
- Failed to load modification: Toast error, show original only

**Future Enhancements (Post-MVP):**

- Recipe rating display (stars, "Did you cook this?" status)
- Comments section
- Print-friendly view
- Share button (social media, copy link)
- Cooking mode with step checkboxes and timer

</view_description>

3. User Stories:
   <user_stories>
   US-016: Displaying Recipe Details
   As a user, I want to see the full details of a recipe to learn all the information needed for preparation.

Acceptance Criteria:

The system displays the recipe title, ingredients, and preparation steps.
The system shows nutritional values (calories, macronutrients) per serving.
The system displays preparation time and number of servings.
The system shows assigned hashtags.
The user can see a visualization of macronutrients (pie chart).
As a user, I can change the number of servings using a slider/buttons +/-, and the system automatically recalculates the amount of ingredients and nutritional values per serving.

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

#### GET /api/recipes/{recipeId}

**Description**: Get recipe details (must be owner or recipe must be public)

**Authentication**: Required

**Response** (200 OK):

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
      "slug": "obiad"
    }
  ],
  "createdAt": "2025-10-11T12:00:00Z",
  "updatedAt": "2025-10-11T12:00:00Z"
}
```

**Error Responses**:

- 401 Unauthorized: Not authenticated
- 403 Forbidden: Recipe is private and user is not the owner
- 404 Not Found: Recipe not found

</endpoint_description>

1. Endpoint Implementation:
   <endpoint_implementation>
   `src/pages/api/profile.ts`
   `src/pages/api/recipes/[recipeId].ts`
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

Begin analysis and planning now. Your final output should consist solely of the implementation plan in English in markdown format, which you will save in the .ai/claude*prompts/ui/views/2_5*{view-name}-view-implementation-plan.md file and should not duplicate or repeat any work done in the implementation breakdown.
