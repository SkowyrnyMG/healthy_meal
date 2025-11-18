As a senior frontend developer, your task is to create a detailed implementation plan for a new view in a web application. This plan should be comprehensive and clear enough for another frontend developer to implement the view correctly and efficiently.

First, review the following information:

1. Product Requirements Document (PRD):
   <prd>
   `.ai/prd.md`
   </prd>

2. View Description:
   <view_description>

### 2.10 Profile Settings Page

**Path:** `/profile`

**Main Purpose:** Centralized settings page for user profile data, dietary preferences, allergens, and disliked ingredients. Organized into tabbed sections for clarity.

**Key Information to Display:**

- User profile data (weight, age, gender, activity level)
- Dietary preferences (diet type, target goal, target value)
- Selected allergens
- Disliked ingredients list
- Account settings (email, password change)

**Key View Components:**

**Layout Components:**

**Desktop:**

- `<SettingsLayout>` - Two-column layout
- Sidebar navigation (left): List of setting sections
- Content area (right): Active section content

**Mobile:**

- `<SettingsLayout>` - Single column
- `<TabNavigation>` (Shadcn/ui Tabs): Horizontal tabs for sections
- Content area: Active tab content

**Setting Sections (5 tabs):**

**1. Podstawowe dane (Basic Info) - Tab/Section**

`<BasicInfoSection>`

- Form fields:
  - Waga (kg) - number input, 40-200 range
  - Wiek - number input, 13-100 range
  - Płeć - select dropdown (male, female, other, prefer_not_to_say)
  - Poziom aktywności - select dropdown (sedentary, lightly_active, moderately_active, very_active, extremely_active)
- "Zapisz" button
- Success/error feedback via toast

**2. Preferencje żywieniowe (Dietary Preferences)**

`<DietaryPreferencesSection>`

- Form fields:
  - Typ diety - select dropdown (high_protein, keto, vegetarian, weight_gain, weight_loss, balanced)
  - Cel - select dropdown (lose_weight, gain_weight, maintain_weight)
  - Wartość docelowa - number input (target weight change in kg)
- "Zapisz" button
- Success/error feedback

**3. Alergeny (Allergens)**

`<AllergensSection>`

- Multi-select from predefined allergen list (fetched from API)
- Checkbox grid (3 cols desktop, 2 tablet, 1 mobile)
- Selected allergens highlighted/checked
- "Zapisz" button updates user_allergens

**4. Nielubiane składniki (Disliked Ingredients)**

`<DislikedIngredientsSection>`

- Dynamic list of disliked ingredients
- Each item: ingredient name, remove button (X icon)
- "+ Dodaj składnik" button
- Add ingredient: Text input (1-100 chars), "Dodaj" button
- List updates immediately on add/remove (optimistic UI)

**5. Konto (Account)**
The whole account management section is not yet implemented with Supabase Auth, so this is a placeholder for future features.
Leave some note to update this section once Auth is integrated.

`<AccountSection>`

- Display email (read-only or editable in future)
- "Zmień hasło" button → opens password change dialog
- "Wyloguj" button (secondary/destructive)
- "Usuń konto" button (destructive, future feature)

`<ChangePasswordDialog>` (Shadcn/ui Dialog)

- Current password input
- New password input (min 8 chars)
- Confirm new password input
- "Zmień hasło" / "Anuluj" buttons
- Validation: Password strength, confirmation match

**Interactive Components:**

- Tab/sidebar navigation
- Form inputs with validation
- Allergen checkboxes
- Dynamic ingredient list (add/remove)
- Password change dialog
- Save buttons per section
- Logout confirmation

**UX Considerations:**

- Auto-save on change (or explicit Save button per section for clarity)
- Loading states when saving
- Success toasts on save
- Error messages for validation failures
- Unsaved changes warning when navigating away
- Clear visual separation between sections

**Accessibility Considerations:**

- Tab navigation keyboard accessible
- Form labels visible and associated with inputs
- Helpful placeholder text
- ARIA announcements for add/remove ingredients
- Focus management in dialogs

**Security Considerations:**

- Password change requires current password
- Email change verification (future)
- Account deletion requires confirmation (future)
- Profile data only accessible to owner

**Empty States:**

- No allergens selected: Informational message, "Zaznacz alergeny, aby AI mogło je uwzględniać przy modyfikacjach"
- No disliked ingredients: "Nie masz nielubianych składników", "+ Dodaj pierwszy składnik"

**Future Enhancements (Post-MVP):**

- Email change with verification
- Account deletion
- Export user data (GDPR)
- Notification preferences
- Privacy settings

</view_description>

3. User Stories:
   <user_stories>

#### US-005: Uzupełnianie profilu o dane podstawowe

Jako nowy użytkownik, chcę uzupełnić mój profil o podstawowe dane, aby aplikacja mogła lepiej dopasować przepisy do moich potrzeb.

Kryteria akceptacji:

1. Użytkownik może wprowadzić podstawowe dane: waga, wiek, płeć, poziom aktywności
2. System zapisuje wprowadzone dane
3. System wyświetla komunikat potwierdzający zapisanie danych

#### US-006: Ustawianie preferencji żywieniowych

Jako użytkownik, chcę określić moje preferencje żywieniowe, aby otrzymywać dostosowane przepisy.

Kryteria akceptacji:

1. Użytkownik może wybrać preferowaną dietę (wysokobiałkowa, Keto, wegetariańska, na przybieranie wagi, na redukcję wagi)
2. Użytkownik może określić alergeny i nielubiane składniki
3. Użytkownik może określić preferowane proporcje makroskładników
4. System zapisuje preferencje i uwzględnia je przy generowaniu przepisów

#### US-007: Edycja danych profilu

Jako użytkownik, chcę edytować moje dane profilowe, aby aktualizować informacje o sobie.

Kryteria akceptacji:

1. Użytkownik może edytować wszystkie wprowadzone wcześniej dane
2. System zapisuje zaktualizowane dane
3. System wyświetla komunikat potwierdzający aktualizację danych

#### US-008: Określanie celów dietetycznych

Jako użytkownik, chcę określić moje cele dietetyczne, aby otrzymywać przepisy pomagające w ich osiągnięciu.

Kryteria akceptacji:

1. Użytkownik może wybrać cel (schudnąć, przytyć, utrzymać wagę)
2. Użytkownik może określić docelową wartość (np. schudnąć 5kg)
3. System zapisuje cele i uwzględnia je przy generowaniu przepisów

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

#### GET /api/profile/allergens

**Description**: Get user's selected allergens

**Authentication**: Required

**Response** (200 OK):

```json
{
  "allergens": [
    {
      "id": "uuid",
      "name": "Gluten",
      "createdAt": "2025-10-11T12:00:00Z"
    }
  ]
}
```

**Error Responses**:

- 404 Not Found: Allergen not found
- 401 Unauthorized: Not authenticated

#### GET /api/profile/disliked-ingredients

**Description**: Get user's disliked ingredients

**Authentication**: Required

**Response** (200 OK):

```json
{
  "dislikedIngredients": [
    {
      "id": "uuid",
      "ingredientName": "cebula",
      "createdAt": "2025-10-11T12:00:00Z"
    }
  ]
}
```

**Error Responses**:

- 401 Unauthorized: Not authenticated
  </endpoint_description>

1. Endpoint Implementation:
   <endpoint_implementation>
   `src/pages/api/profile.ts`
   `src/pages/api/profile/allergens.ts`
   `src/pages/api/dissliked-ingredients.ts`
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

Begin analysis and planning now. Your final output should consist solely of the implementation plan in English in markdown format, which you will save in the .ai/claude*prompts/ui/views/2_10*{view-name}-view-implementation-plan.md file and should not duplicate or repeat any work done in the implementation breakdown.
