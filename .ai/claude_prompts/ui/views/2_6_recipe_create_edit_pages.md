As a senior frontend developer, your task is to create a detailed implementation plan for a new view in a web application. This plan should be comprehensive and clear enough for another frontend developer to implement the view correctly and efficiently.

First, review the following information:

1. Product Requirements Document (PRD):
   <prd>
   `.ai/prd.md`
   </prd>

2. View Description:
   <view_description>

### 2.6 Recipe Create/Edit Pages

**Path:** `/recipes/new` (create), `/recipes/[id]/edit` (edit)

**Main Purpose:** Multi-step wizard for creating new recipes or editing existing ones. Collects all recipe data in organized, user-friendly steps.

**Key Information to Display:**

- Progress indicator showing current step (1 of 6)
- Form fields for current step
- Validation errors (inline and summary)
- Draft restoration prompt (if applicable)
- Navigation buttons (Previous, Next, Submit)

**Key View Components:**

**Layout Components:**

- `<RecipeFormWizard>` - Container managing multi-step state
- `<ProgressIndicator>` - Visual step indicator (1 of 6, progress bar, or breadcrumb-style)
- `<StepContainer>` - Content area for current step
- `<WizardNavigation>` - Previous/Next/Submit buttons at bottom

**Multi-Step Structure:**

**Step 1: Podstawowe informacje (Basic Info)**

`<BasicInfoStep>`

- Title input (text, required, 1-255 chars)
- Description textarea (optional, multiline)
- Servings input (number, required, min 1)
- Prep time input (number, optional, in minutes)
- "isPublic" checkbox (default: false)

Validation: Required fields on blur, character limits real-time with 500ms debounce

**Step 2: Składniki (Ingredients)**

`<IngredientsStep>`

- Dynamic ingredient list
- Each ingredient row: Name (text), Amount (number), Unit (text)
- Three-column layout on desktop, stacked on mobile
- "+ Dodaj składnik" button
- Remove button for each ingredient (trash icon)
- Minimum 1 ingredient required

Interaction: Add/remove ingredients dynamically
Validation: Each ingredient requires all three fields

**Step 3: Kroki przygotowania (Preparation Steps)**

`<StepsStep>`

- Dynamic ordered list
- Each step: Text area for instruction
- Auto-numbered (1, 2, 3...)
- "+ Dodaj krok" button
- Remove button for each step
- Minimum 1 step required

Interaction: Add/remove steps dynamically
Validation: Each step requires instruction text
Note: No drag-to-reorder for MVP (simple add/remove only)

**Step 4: Wartości odżywcze (Nutrition Values)**

`<NutritionStep>`

- 6 input fields in 2-column grid:
  - Kalorie (kcal) - number, required, ≥0
  - Białko (g) - number, required, ≥0
  - Tłuszcz (g) - number, required, ≥0
  - Węglowodany (g) - number, required, ≥0
  - Błonnik (g) - number, required, ≥0
  - Sól (g) - number, required, ≥0
- Info icon (ⓘ) with tooltip: "Wartości odżywcze podaj na jedną porcję. Możesz użyć kalkulatorów online lub tablic wartości odżywczych."
- All values per serving

Validation: Non-negative numbers, required fields

**Step 5: Tagi (Tags)**

`<TagsStep>`

- Checkbox grid (3 cols desktop, 2 tablet, 1 mobile)
- Shows all available tags (15-20 predefined + user-created custom tags)
- Maximum 5 tags selectable
- Visual indication when limit reached
- "+ Dodaj nowy tag" button below grid

`<CustomTagCreation>` (inline or dialog):

- Text input for tag name (1-100 chars)
- Auto-generate slug (lowercase, hyphens, no special chars)
- "Dodaj" / "Anuluj" buttons
- On submit: POST to API, add to list, auto-check new tag
- Duplicate handling: Error message if tag name exists

Validation: Max 5 tags, unique tag names

**Step 6: Przegląd i zapisz (Review & Submit)**

`<ReviewStep>`

- Summary of all entered data
- Sections: Basic Info, Ingredients, Steps, Nutrition, Tags
- Edit links for each section (navigate back to specific step)
- Final submit button: "Zapisz przepis" (create) or "Zapisz zmiany" (edit)

**Form State Management:**

**LocalStorage Draft Persistence:**

- Auto-save every 2-3 seconds
- Namespaced keys to prevent conflicts:
  - New recipe: `draft_recipe_new`
  - Edit recipe: `draft_recipe_edit_{recipeId}`
- Draft object structure:
  ```json
  {
    "timestamp": "2025-10-18T12:00:00Z",
    "step": 3,
    "data": {
      /* form data */
    }
  }
  ```
- Auto-expire drafts older than 24 hours
- Restoration prompt on form mount (if recent draft found):
  - Banner or toast: "Znaleziono niezapisany szkic z [date]. Przywrócić?" with Yes/No buttons
- Clear draft on successful submit or explicit discard
- Browser confirmation on navigate away with unsaved changes

**Validation Strategy (Progressive):**

- Required fields: Validate on blur
- Format validation (numbers, lengths): Real-time with 500ms debounce
- Cross-field validation: On next step or submit
- Display: Inline errors below fields (red text, error icon) using Shadcn/ui Field component
- Multiple errors: Summary alert at top of form with count
- Submit button remains enabled, shows errors on click if validation fails
- Front-end max length validation must match API/DB constraints

**Edit Mode Differences:**

- Pre-populate all fields with existing recipe data
- Load all user's tags (predefined + custom) with recipe's current tags pre-checked
- Same wizard interface
- Same validation and draft behavior
- Submit button: "Zapisz zmiany" instead of "Zapisz przepis"

**Interactive Components:**

- Step navigation (Previous/Next buttons)
- Dynamic add/remove for ingredients and steps
- Tag checkboxes with max limit enforcement
- Custom tag creation dialog/inline form
- Draft restoration banner
- Form validation feedback
- Loading state on submit

**UX Considerations:**

- Clear step progression indicator
- Ability to navigate back to previous steps
- Unsaved changes warning
- Draft restoration reduces data loss
- Visual feedback on tag limit (5 max)
- Help text and tooltips for guidance
- Loading spinner on submit (API call in progress)
- Success toast and redirect to recipe detail on successful save

**Accessibility Considerations:**

- Proper form labels (visible, not just placeholders)
- Helpful placeholder text for examples
- Error messages associated with fields (ARIA)
- Keyboard navigation between fields and steps
- Focus management when moving between steps
- Required field indicators (asterisk + label)

**Security Considerations:**

- Client-side validation matches server-side (Zod schemas)
- XSS protection in text inputs
- Recipe ownership verified on edit (server-side)
- CSRF protection on form submit

**Empty/Error States:**

- API error on submit: Toast notification with retry option
- Tag creation failure: Inline error in tag creation dialog
- Draft restoration failure: Silent fail, start fresh

**Future Enhancements (Post-MVP):**

- Ingredient autocomplete
- Drag-to-reorder steps
- Nutrition calculator integration
- Image upload
- Import recipe from URL
- Recipe templates

---

</view_description>

3. User Stories:
   <user_stories>

#### US-009: Adding a new recipe

As a user, I want to add a new recipe to save it in my collection.

Acceptance criteria:

1. The user can enter title, ingredients, preparation steps, preparation time
2. The system allows entering nutritional values (calories, protein, fat, carbohydrates, fiber, salt)
3. The system allows assigning hashtags
4. The system saves the recipe and assigns it to the user's account

#### US-011: Editing a recipe

As a user, I want to edit my recipes to update or correct their content.

Acceptance criteria:

1. The user can edit all elements of the recipe
2. The system saves the updated data
3. The system displays a confirmation message for the recipe update
   </user_stories>

4. Endpoint Description:
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

**Description**: Get recipe details (must be owner)

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

#### POST /api/recipes

**Description**: Create new recipe

**Authentication**: Required

**Request Payload**:

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

**Validation**:

- `title`: Required, 1-255 characters
- `description`: Optional, text
- `ingredients`: Required, array of objects with `name` (string), `amount` (number), `unit` (string)
- `steps`: Required, array of objects with `stepNumber` (number), `instruction` (string)
- `servings`: Required, integer > 0
- `nutritionPerServing`: Required, object with required fields: `calories`, `protein`, `fat`, `carbs`, `fiber`, `salt` (all numbers)
- `prepTimeMinutes`: Optional, integer > 0
- `isPublic`: Optional, boolean (default: false)
- `tagIds`: Optional, array of valid tag UUIDs

**Response** (201 Created):

```json
{
  "success": true,
  "recipe": {
    "id": "uuid",
    "userId": "uuid",
    "title": "Placki ziemniaczane",
    "description": "Tradycyjne polskie placki",
    "ingredients": [...],
    "steps": [...],
    "servings": 4,
    "nutritionPerServing": {...},
    "prepTimeMinutes": 30,
    "isPublic": false,
    "featured": false,
    "createdAt": "2025-10-11T12:00:00Z",
    "updatedAt": "2025-10-11T12:00:00Z"
  }
}
```

**Error Responses**:

- 400 Bad Request: Validation failed
- 401 Unauthorized: Not authenticated

#### PUT /api/recipes/{recipeId}

**Description**: Update recipe (must be owner)

**Authentication**: Required

**Request Payload**: Same as POST /api/recipes

**Response** (200 OK): Same structure as POST response

**Error Responses**:

- 400 Bad Request: Validation failed
- 401 Unauthorized: Not authenticated
- 403 Forbidden: User is not the owner
- 404 Not Found: Recipe not found

</endpoint_description>

1. Endpoint Implementation:
   <endpoint_implementation>
   `src/pages/api/profile.ts`
   `src/pages/api/recipes/[recipeId].ts`
   `src/pages/api/recipes.ts`
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

Begin analysis and planning now. Your final output should consist solely of the implementation plan in English in markdown format, which you will save in the .ai/claude*prompts/ui/views/2_6*{view-name}-view-implementation-plan.md file and should not duplicate or repeat any work done in the implementation breakdown.
