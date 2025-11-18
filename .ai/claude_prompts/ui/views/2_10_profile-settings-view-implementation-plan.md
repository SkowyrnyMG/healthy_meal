# View Implementation Plan - Profile Settings Page

## 1. Overview

The Profile Settings Page is a centralized settings interface for users to manage their profile data, dietary preferences, allergens, and disliked ingredients. The page is organized into 5 tabbed sections for clarity and ease of use. It features a responsive layout with sidebar navigation on desktop and horizontal tabs on mobile. This view fulfills user stories US-005 through US-008, enabling users to set up and modify their profile information to personalize their recipe recommendations.

## 2. View Routing

**Path:** `/profile`

The page requires authentication. Unauthenticated users should be redirected to the login page.

## 3. Component Structure

```
ProfileSettingsPage (Astro)
└── ProfileSettingsLayout (React)
    ├── SettingsSidebar (desktop only)
    │   └── SidebarNavItem (x5)
    ├── SettingsTabs (mobile only)
    │   └── TabsTrigger (x5)
    └── SectionContent
        ├── BasicInfoSection
        │   ├── Form with Input/Select fields
        │   └── SaveButton
        ├── DietaryPreferencesSection
        │   ├── Form with Select/Input fields
        │   └── SaveButton
        ├── AllergensSection
        │   ├── AllergenGrid
        │   │   └── AllergenCheckbox (multiple)
        │   ├── EmptyState (conditional)
        │   └── SaveButton
        ├── DislikedIngredientsSection
        │   ├── IngredientsList
        │   │   └── IngredientItem (multiple)
        │   ├── AddIngredientForm
        │   ├── EmptyState (conditional)
        │   └── (no save button - immediate updates)
        └── AccountSection
            ├── EmailDisplay
            ├── ChangePasswordButton (placeholder)
            ├── LogoutButton (placeholder)
            └── DeleteAccountButton (placeholder)
```

## 4. Component Details

### ProfileSettingsLayout

- **Description:** Main container component that manages the overall layout and active section state. Renders different navigation patterns based on screen size (sidebar vs tabs).
- **Main elements:**
  - Container div with responsive grid/flex layout
  - SettingsSidebar (hidden on mobile, shown on md+ breakpoint)
  - SettingsTabs (shown on mobile, hidden on md+ breakpoint)
  - Content area with active section component
- **Handled interactions:**
  - Section navigation (click on sidebar item or tab)
  - Initial data fetching on mount
- **Handled validation:** None at this level
- **Types:**
  - `ProfileSettingsViewModel` (form data for all sections)
  - `SettingsSection` (enum: 'basic-info' | 'dietary-preferences' | 'allergens' | 'disliked-ingredients' | 'account')
- **Props:** None (root component)

### SettingsSidebar

- **Description:** Vertical navigation sidebar for desktop view. Displays list of section links with active state highlighting.
- **Main elements:**
  - nav element with list of buttons
  - Each button shows section icon and label
  - Active section highlighted with background color
- **Handled interactions:**
  - Click on section item → update active section
- **Handled validation:** None
- **Types:**
  - `SettingsSection`
- **Props:**
  - `activeSection: SettingsSection`
  - `onSectionChange: (section: SettingsSection) => void`

### SettingsTabs

- **Description:** Horizontal tab navigation for mobile view using Shadcn/ui Tabs component.
- **Main elements:**
  - Tabs container with horizontal scroll if needed
  - TabsList with 5 TabsTrigger items
- **Handled interactions:**
  - Tab selection → update active section
- **Handled validation:** None
- **Types:**
  - `SettingsSection`
- **Props:**
  - `activeSection: SettingsSection`
  - `onSectionChange: (section: SettingsSection) => void`

### BasicInfoSection

- **Description:** Form section for user's basic physical data: weight, age, gender, and activity level. Used by AI for recipe personalization.
- **Main elements:**
  - Form with 4 fields in responsive grid
  - Input for weight (number, kg)
  - Input for age (number)
  - Select for gender
  - Select for activity level
  - Save button with loading state
- **Handled interactions:**
  - Input changes → update local form state
  - Form submit → save to API
- **Handled validation:**
  - Weight: required, number, 40-200 range
  - Age: required, number, 13-100 range
  - Gender: required, one of predefined values
  - Activity level: required, one of predefined values
- **Types:**
  - `BasicInfoFormData`
  - `BasicInfoFormErrors`
- **Props:**
  - `initialData: BasicInfoFormData`
  - `onSave: (data: BasicInfoFormData) => Promise<void>`
  - `isSaving: boolean`

### DietaryPreferencesSection

- **Description:** Form section for dietary preferences: diet type, target goal, and target value. Used by AI for recipe modifications.
- **Main elements:**
  - Form with 3 fields
  - Select for diet type
  - Select for target goal
  - Input for target value (number, kg)
  - Save button with loading state
- **Handled interactions:**
  - Input/select changes → update local form state
  - Form submit → save to API
- **Handled validation:**
  - Diet type: required, one of predefined values
  - Target goal: required, one of predefined values
  - Target value: optional, number, 0.1-100 range if provided
- **Types:**
  - `DietaryPreferencesFormData`
  - `DietaryPreferencesFormErrors`
- **Props:**
  - `initialData: DietaryPreferencesFormData`
  - `onSave: (data: DietaryPreferencesFormData) => Promise<void>`
  - `isSaving: boolean`

### AllergensSection

- **Description:** Multi-select section for allergens. Displays all available allergens as checkboxes in a responsive grid layout.
- **Main elements:**
  - Grid of checkboxes (3 cols desktop, 2 tablet, 1 mobile)
  - Each checkbox with allergen name label
  - Empty state message when no allergens selected
  - Save button with loading state
- **Handled interactions:**
  - Checkbox toggle → update selected allergens set
  - Save button click → sync with API (add/remove allergens)
- **Handled validation:**
  - At least valid allergen IDs (UUIDs)
- **Types:**
  - `AllergenDTO[]` (all allergens)
  - `UserAllergenDTO[]` (selected allergens)
  - `Set<string>` (selected allergen IDs)
- **Props:**
  - `allAllergens: AllergenDTO[]`
  - `selectedAllergenIds: Set<string>`
  - `onSelectionChange: (ids: Set<string>) => void`
  - `onSave: () => Promise<void>`
  - `isSaving: boolean`
  - `isLoading: boolean`

### DislikedIngredientsSection

- **Description:** Dynamic list section for managing disliked ingredients with immediate add/remove functionality (optimistic UI).
- **Main elements:**
  - List of ingredient items with remove button
  - Add ingredient form (input + add button)
  - Empty state when no ingredients
- **Handled interactions:**
  - Add ingredient → POST to API (optimistic)
  - Remove ingredient → DELETE to API (optimistic)
  - Input change → update new ingredient name
- **Handled validation:**
  - Ingredient name: required, 1-100 characters, trimmed
  - No duplicates
- **Types:**
  - `DislikedIngredientDTO[]`
  - `AddDislikedIngredientCommand`
- **Props:**
  - `ingredients: DislikedIngredientDTO[]`
  - `onAdd: (name: string) => Promise<void>`
  - `onRemove: (id: string) => Promise<void>`
  - `isAdding: boolean`
  - `removingId: string | null`

### AccountSection

- **Description:** Placeholder section for account management features. Currently displays informational content about future features since Supabase Auth is not yet integrated.
- **Main elements:**
  - Alert/info box explaining that features are coming soon
  - Email display (read-only, placeholder)
  - Disabled buttons for: Change password, Logout, Delete account
  - TODO comment in code for future Auth integration
- **Handled interactions:** None (all actions are placeholders)
- **Handled validation:** None
- **Types:** None
- **Props:** None

### AddIngredientForm

- **Description:** Inline form for adding new disliked ingredients.
- **Main elements:**
  - Text input (1-100 chars)
  - Add button ("+ Dodaj składnik")
- **Handled interactions:**
  - Input change → update value
  - Form submit → call onAdd
  - Enter key → submit
- **Handled validation:**
  - Non-empty string
  - Max 100 characters
- **Types:**
  - `string` (input value)
- **Props:**
  - `onAdd: (name: string) => Promise<void>`
  - `isAdding: boolean`

### IngredientItem

- **Description:** Single ingredient item in the disliked ingredients list with remove functionality.
- **Main elements:**
  - Ingredient name text
  - Remove button (X icon)
- **Handled interactions:**
  - Click remove → call onRemove
- **Handled validation:** None
- **Types:**
  - `DislikedIngredientDTO`
- **Props:**
  - `ingredient: DislikedIngredientDTO`
  - `onRemove: (id: string) => void`
  - `isRemoving: boolean`

## 5. Types

### New Types to Add

```typescript
// ============================================================================
// PROFILE SETTINGS VIEW TYPES
// ============================================================================

/**
 * Settings section identifiers
 */
export type SettingsSection = "basic-info" | "dietary-preferences" | "allergens" | "disliked-ingredients" | "account";

/**
 * Gender options for profile
 */
export type Gender = "male" | "female";

/**
 * Activity level options for profile
 */
export type ActivityLevel = "sedentary" | "lightly_active" | "moderately_active" | "very_active" | "extremely_active";

/**
 * Diet type options for profile
 */
export type DietType = "high_protein" | "keto" | "vegetarian" | "weight_gain" | "weight_loss" | "balanced";

/**
 * Target goal options for profile
 */
export type TargetGoal = "lose_weight" | "gain_weight" | "maintain_weight";

/**
 * Basic info form data
 */
export interface BasicInfoFormData {
  weight: number | null;
  age: number | null;
  gender: Gender | null;
  activityLevel: ActivityLevel | null;
}

/**
 * Basic info form validation errors
 */
export interface BasicInfoFormErrors {
  weight?: string;
  age?: string;
  gender?: string;
  activityLevel?: string;
}

/**
 * Dietary preferences form data
 */
export interface DietaryPreferencesFormData {
  dietType: DietType | null;
  targetGoal: TargetGoal | null;
  targetValue: number | null;
}

/**
 * Dietary preferences form validation errors
 */
export interface DietaryPreferencesFormErrors {
  dietType?: string;
  targetGoal?: string;
  targetValue?: string;
}

/**
 * Complete profile settings state
 */
export interface ProfileSettingsState {
  // Data
  profile: ProfileDTO | null;
  allAllergens: AllergenDTO[];
  userAllergens: UserAllergenDTO[];
  dislikedIngredients: DislikedIngredientDTO[];

  // Loading states
  isLoadingProfile: boolean;
  isLoadingAllergens: boolean;
  isLoadingDislikedIngredients: boolean;

  // Saving states
  isSavingBasicInfo: boolean;
  isSavingDietaryPreferences: boolean;
  isSavingAllergens: boolean;
  isAddingIngredient: boolean;
  removingIngredientId: string | null;

  // Error states
  error: string | null;
}
```

### Existing Types Used

- `ProfileDTO` - User profile data from API
- `AllergenDTO` - Allergen from master list
- `UserAllergenDTO` - User's selected allergen
- `DislikedIngredientDTO` - User's disliked ingredient
- `UpdateProfileCommand` - Profile update request payload
- `AddAllergenCommand` - Add allergen request payload
- `AddDislikedIngredientCommand` - Add ingredient request payload

## 6. State Management

### Custom Hook: `useProfileSettings`

A comprehensive custom hook to manage all profile settings state and API interactions.

```typescript
interface UseProfileSettingsReturn {
  // State
  state: ProfileSettingsState;

  // Basic Info Actions
  saveBasicInfo: (data: BasicInfoFormData) => Promise<void>;

  // Dietary Preferences Actions
  saveDietaryPreferences: (data: DietaryPreferencesFormData) => Promise<void>;

  // Allergens Actions
  saveAllergens: (selectedIds: Set<string>) => Promise<void>;

  // Disliked Ingredients Actions
  addDislikedIngredient: (name: string) => Promise<void>;
  removeDislikedIngredient: (id: string) => Promise<void>;

  // Utility
  refetchAll: () => Promise<void>;
}
```

**State Flow:**

1. **Initial Load:** On mount, fetch profile, all allergens, user allergens, and disliked ingredients in parallel
2. **Basic Info Save:** PATCH /api/profile → update profile state → show success toast
3. **Dietary Preferences Save:** PATCH /api/profile → update profile state → show success toast
4. **Allergens Save:** Compare current vs selected, POST new ones, DELETE removed ones → update state → show success toast
5. **Disliked Ingredients Add:** POST /api/profile/disliked-ingredients → optimistic update → show success toast
6. **Disliked Ingredients Remove:** DELETE /api/profile/disliked-ingredients/{id} → optimistic update → show success toast

### Local Form State

Each section manages its own form state internally:

- `useState` for form field values
- `useState` for validation errors
- Reset to API data when section becomes active
- Dirty checking for unsaved changes warning (future enhancement)

## 7. API Integration

### Existing Endpoints

| Endpoint                                 | Method | Request                      | Response                                                       | Description              |
| ---------------------------------------- | ------ | ---------------------------- | -------------------------------------------------------------- | ------------------------ |
| `/api/profile`                           | GET    | -                            | `ProfileDTO`                                                   | Get user profile         |
| `/api/allergens`                         | GET    | -                            | `{ allergens: AllergenDTO[] }`                                 | Get all allergens        |
| `/api/profile/allergens`                 | GET    | -                            | `{ allergens: UserAllergenDTO[] }`                             | Get user's allergens     |
| `/api/profile/allergens`                 | POST   | `{ allergenId: string }`     | `{ success: true, allergen: UserAllergenDTO }`                 | Add allergen             |
| `/api/profile/allergens/{id}`            | DELETE | -                            | 204 No Content                                                 | Remove allergen          |
| `/api/profile/disliked-ingredients`      | GET    | -                            | `{ dislikedIngredients: DislikedIngredientDTO[] }`             | Get disliked ingredients |
| `/api/profile/disliked-ingredients`      | POST   | `{ ingredientName: string }` | `{ success: true, dislikedIngredient: DislikedIngredientDTO }` | Add ingredient           |
| `/api/profile/disliked-ingredients/{id}` | DELETE | -                            | 204 No Content                                                 | Remove ingredient        |

### New Endpoint Required

| Endpoint       | Method | Request                | Response     | Description    |
| -------------- | ------ | ---------------------- | ------------ | -------------- |
| `/api/profile` | PUT    | `UpdateProfileCommand` | `ProfileDTO` | Update profile |

**PUT /api/profile Request Schema (Zod):**

```typescript
const UpdateProfileSchema = z.object({
  weight: z.number().min(40).max(200).nullable().optional(),
  age: z.number().int().min(13).max(100).nullable().optional(),
  gender: z.enum(["male", "female"]).nullable().optional(),
  activityLevel: z
    .enum(["sedentary", "lightly_active", "moderately_active", "very_active", "extremely_active"])
    .nullable()
    .optional(),
  dietType: z
    .enum(["high_protein", "keto", "vegetarian", "weight_gain", "weight_loss", "balanced"])
    .nullable()
    .optional(),
  targetGoal: z.enum(["lose_weight", "gain_weight", "maintain_weight"]).nullable().optional(),
  targetValue: z.number().min(0.1).max(100).nullable().optional(),
});
```

### API Call Patterns

```typescript
// Profile fetching
const fetchProfile = async (): Promise<ProfileDTO> => {
  const response = await fetch("/api/profile");
  if (!response.ok) throw new Error("Failed to fetch profile");
  return response.json();
};

// Profile updating
const updateProfile = async (data: UpdateProfileCommand): Promise<ProfileDTO> => {
  const response = await fetch("/api/profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update profile");
  }
  return response.json();
};

// Allergen syncing (diff-based)
const syncAllergens = async (current: Set<string>, selected: Set<string>): Promise<void> => {
  const toAdd = [...selected].filter((id) => !current.has(id));
  const toRemove = [...current].filter((id) => !selected.has(id));

  await Promise.all([
    ...toAdd.map((id) =>
      fetch("/api/profile/allergens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allergenId: id }),
      })
    ),
    ...toRemove.map((id) => fetch(`/api/profile/allergens/${id}`, { method: "DELETE" })),
  ]);
};
```

## 8. User Interactions

### Navigation

- **Click sidebar item (desktop):** Change active section, scroll content to top
- **Click tab (mobile):** Change active section
- **Keyboard navigation:** Tab through sidebar/tabs, Enter to select

### Basic Info Section

- **Edit field:** Update local form state, clear field error
- **Click "Zapisz":** Validate form → show errors or save to API → show success/error toast
- **Tab between fields:** Standard form navigation

### Dietary Preferences Section

- **Select option:** Update local form state, clear field error
- **Edit target value:** Update local form state, clear field error
- **Click "Zapisz":** Validate form → show errors or save to API → show success/error toast

### Allergens Section

- **Toggle checkbox:** Add/remove allergen ID from selected set
- **Click "Zapisz":** Calculate diff → add new allergens → remove deselected → show toast
- **Loading state:** Show skeleton grid while fetching

### Disliked Ingredients Section

- **Type ingredient name:** Update input value
- **Click "+ Dodaj składnik" or press Enter:** Validate → POST to API → optimistic add to list → clear input → show toast
- **Click remove button (X):** DELETE from API → optimistic remove from list → show toast
- **Duplicate attempt:** Show error toast, keep input value

### Account Section

- **View only:** All buttons are disabled/placeholder
- **Informational:** Shows message about upcoming features

## 9. Conditions and Validation

### Basic Info Section Validation

| Field          | Condition    | Error Message                       |
| -------------- | ------------ | ----------------------------------- |
| Weight         | Required     | "Waga jest wymagana"                |
| Weight         | 40-200 range | "Waga musi być między 40 a 200 kg"  |
| Weight         | Number       | "Waga musi być liczbą"              |
| Age            | Required     | "Wiek jest wymagany"                |
| Age            | 13-100 range | "Wiek musi być między 13 a 100 lat" |
| Age            | Integer      | "Wiek musi być liczbą całkowitą"    |
| Gender         | Required     | "Płeć jest wymagana"                |
| Gender         | Valid enum   | "Nieprawidłowa wartość płci"        |
| Activity Level | Required     | "Poziom aktywności jest wymagany"   |
| Activity Level | Valid enum   | "Nieprawidłowy poziom aktywności"   |

### Dietary Preferences Section Validation

| Field        | Condition                         | Error Message                                |
| ------------ | --------------------------------- | -------------------------------------------- |
| Diet Type    | Required                          | "Typ diety jest wymagany"                    |
| Diet Type    | Valid enum                        | "Nieprawidłowy typ diety"                    |
| Target Goal  | Required                          | "Cel jest wymagany"                          |
| Target Goal  | Valid enum                        | "Nieprawidłowy cel"                          |
| Target Value | Optional but if provided: 0.1-100 | "Wartość docelowa musi być między 0.1 a 100" |
| Target Value | Number                            | "Wartość docelowa musi być liczbą"           |

### Disliked Ingredients Validation

| Field           | Condition   | Error Message                                     |
| --------------- | ----------- | ------------------------------------------------- |
| Ingredient Name | Required    | "Nazwa składnika jest wymagana"                   |
| Ingredient Name | 1-100 chars | "Nazwa składnika nie może przekraczać 100 znaków" |
| Ingredient Name | Unique      | "Ten składnik już jest na liście"                 |

### Component State Conditions

| Condition                  | Affected Component         | Effect                                      |
| -------------------------- | -------------------------- | ------------------------------------------- |
| Loading profile            | All sections               | Show skeleton/loading state                 |
| Saving basic info          | BasicInfoSection           | Disable form, show loading on button        |
| Saving dietary preferences | DietaryPreferencesSection  | Disable form, show loading on button        |
| Saving allergens           | AllergensSection           | Disable checkboxes, show loading on button  |
| Adding ingredient          | DislikedIngredientsSection | Disable add button, show loading            |
| Removing ingredient        | IngredientItem             | Show loading on remove button               |
| No allergens selected      | AllergensSection           | Show empty state message                    |
| No disliked ingredients    | DislikedIngredientsSection | Show empty state message                    |
| API error                  | Any section                | Show error toast, maintain last known state |

## 10. Error Handling

### API Errors

| Error Code | Scenario                  | User Message                               | Recovery               |
| ---------- | ------------------------- | ------------------------------------------ | ---------------------- |
| 401        | Unauthorized              | "Sesja wygasła. Zaloguj się ponownie."     | Redirect to login      |
| 404        | Profile not found         | "Profil nie został znaleziony."            | Show empty state       |
| 409        | Allergen already exists   | "Ten alergen jest już dodany."             | Ignore silently        |
| 409        | Ingredient already exists | "Ten składnik już jest na liście."         | Keep input, show toast |
| 400        | Invalid input             | API error message                          | Show validation errors |
| 500        | Server error              | "Wystąpił błąd serwera. Spróbuj ponownie." | Show error toast       |

### Network Errors

- **Timeout:** "Przekroczono limit czasu. Sprawdź połączenie."
- **Offline:** "Brak połączenia z internetem."
- **General fetch error:** "Nie udało się połączyć z serwerem."

### Optimistic Update Rollback

For disliked ingredients (immediate add/remove):

1. Optimistically update local state
2. Make API call
3. On error: revert local state, show error toast
4. On success: keep local state, show success toast

### Error Display

- **Field validation errors:** Inline below input field in red
- **API errors:** Toast notification (destructive variant)
- **Success messages:** Toast notification (default variant)

### Toast Messages

```typescript
// Success messages
"Dane podstawowe zostały zapisane.";
"Preferencje żywieniowe zostały zapisane.";
"Alergeny zostały zaktualizowane.";
"Składnik został dodany.";
"Składnik został usunięty.";

// Error messages (examples)
"Nie udało się zapisać danych podstawowych.";
"Nie udało się zaktualizować alergenów.";
"Ten składnik już jest na liście.";
```

## 11. Implementation Steps

### Phase 1: Backend Preparation

1. **Add profile update service function**
   - File: `src/lib/services/profile.service.ts`
   - Function: `updateProfileByUserId(supabase, userId, data)`
   - Handle partial updates (only update provided fields)

2. **Add PUT endpoint for profile**
   - File: `src/pages/api/profile.ts`
   - Add PUT handler with Zod validation
   - Return updated ProfileDTO

### Phase 2: Types and Hook

3. **Add new types to types.ts**
   - Add all types from Section 5 (SettingsSection, form data interfaces, etc.)

4. **Create useProfileSettings hook**
   - File: `src/components/hooks/useProfileSettings.ts`
   - Implement all state management and API calls
   - Handle loading, error, and saving states
   - Implement optimistic updates for disliked ingredients

### Phase 3: Page and Layout

5. **Create Astro page**
   - File: `src/pages/profile.astro`
   - Use AppLayout
   - Render ProfileSettingsLayout React component

6. **Create ProfileSettingsLayout component**
   - File: `src/components/profile/ProfileSettingsLayout.tsx`
   - Responsive layout (sidebar desktop, tabs mobile)
   - Section content switching
   - Initialize useProfileSettings hook

7. **Create navigation components**
   - File: `src/components/profile/SettingsSidebar.tsx`
   - File: `src/components/profile/SettingsTabs.tsx`
   - Section labels in Polish

### Phase 4: Section Components

8. **Create BasicInfoSection**
   - File: `src/components/profile/sections/BasicInfoSection.tsx`
   - Form with 4 fields (weight, age, gender, activity level)
   - Local validation
   - Save button

9. **Create DietaryPreferencesSection**
   - File: `src/components/profile/sections/DietaryPreferencesSection.tsx`
   - Form with 3 fields (diet type, target goal, target value)
   - Local validation
   - Save button

10. **Create AllergensSection**
    - File: `src/components/profile/sections/AllergensSection.tsx`
    - Checkbox grid with responsive columns
    - Empty state
    - Save button

11. **Create DislikedIngredientsSection**
    - File: `src/components/profile/sections/DislikedIngredientsSection.tsx`
    - Dynamic list with add/remove
    - Optimistic UI
    - Empty state

12. **Create AccountSection**
    - File: `src/components/profile/sections/AccountSection.tsx`
    - Placeholder content
    - TODO comment for Auth integration

### Phase 5: Supporting Components

13. **Create IngredientItem component**
    - File: `src/components/profile/IngredientItem.tsx`
    - Display ingredient name
    - Remove button with loading state

14. **Create AddIngredientForm component**
    - File: `src/components/profile/AddIngredientForm.tsx`
    - Input with validation
    - Add button

### Phase 6: Testing and Polish

15. **Add empty states and loading skeletons**
    - Skeleton components for initial load
    - Empty state messages with CTAs

16. **Test all interactions**
    - Form validation
    - API error handling
    - Optimistic updates and rollbacks
    - Responsive layout

17. **Accessibility review**
    - ARIA labels on form fields
    - Focus management
    - Keyboard navigation
    - Screen reader announcements

### File Structure Summary

```
src/
├── pages/
│   ├── api/
│   │   └── profile.ts (add PUT handler)
│   └── profile.astro (new)
├── lib/
│   └── services/
│       └── profile.service.ts (add updateProfileByUserId)
├── components/
│   ├── hooks/
│   │   └── useProfileSettings.ts (new)
│   └── profile/ (new directory)
│       ├── ProfileSettingsLayout.tsx
│       ├── SettingsSidebar.tsx
│       ├── SettingsTabs.tsx
│       ├── IngredientItem.tsx
│       ├── AddIngredientForm.tsx
│       └── sections/
│           ├── BasicInfoSection.tsx
│           ├── DietaryPreferencesSection.tsx
│           ├── AllergensSection.tsx
│           ├── DislikedIngredientsSection.tsx
│           └── AccountSection.tsx
└── types.ts (add new types)
```
