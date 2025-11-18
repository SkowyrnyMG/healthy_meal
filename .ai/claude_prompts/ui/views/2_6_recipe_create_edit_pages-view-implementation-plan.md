# View Implementation Plan: Recipe Create/Edit Pages

## 1. Overview

The Recipe Create/Edit Pages implement a multi-step wizard interface for creating new recipes and editing existing ones. The view consists of 6 progressive steps that collect all recipe data in an organized, user-friendly manner. It features automatic draft persistence to localStorage, progressive validation, dynamic ingredient and step management, tag selection with custom tag creation, and a final review step before submission. The same wizard interface is used for both creating and editing recipes, with the edit mode pre-populating all fields with existing recipe data.

## 2. View Routing

- **Create Mode:** `/recipes/new` - Astro page that renders the RecipeFormWizard component
- **Edit Mode:** `/recipes/[id]/edit` - Astro page that fetches recipe data and renders the RecipeFormWizard component with pre-populated data

Both routes require authentication and should redirect unauthenticated users to the login page.

## 3. Component Structure

```
src/pages/
├── recipes/
│   ├── new.astro                    # Create recipe page
│   └── [id]/
│       └── edit.astro               # Edit recipe page

src/components/
├── recipe-wizard/
│   ├── RecipeFormWizard.tsx         # Main container component (React)
│   ├── ProgressIndicator.tsx        # Step progress indicator
│   ├── WizardNavigation.tsx         # Previous/Next/Submit buttons
│   ├── steps/
│   │   ├── BasicInfoStep.tsx        # Step 1: Basic information
│   │   ├── IngredientsStep.tsx      # Step 2: Ingredients list
│   │   ├── StepsStep.tsx            # Step 3: Preparation steps
│   │   ├── NutritionStep.tsx        # Step 4: Nutrition values
│   │   ├── TagsStep.tsx             # Step 5: Tag selection
│   │   └── ReviewStep.tsx           # Step 6: Review and submit
│   └── tag-creation/
│       └── CustomTagCreation.tsx    # Custom tag creation dialog
└── hooks/
    └── useRecipeFormWizard.ts       # Custom hook for form state management
```

## 4. Component Details

### RecipeFormWizard

**Description:** Main container component that manages the multi-step wizard state, draft persistence, and overall form flow. Orchestrates all child components and handles navigation between steps.

**Main elements:**

- Container div with max-width constraint (centered layout)
- ProgressIndicator component at top
- Current step component rendered dynamically based on state
- WizardNavigation component at bottom
- Draft restoration banner (conditional, shown when draft detected)
- Browser beforeunload event listener for unsaved changes warning

**Handled interactions:**

- Step navigation (next/previous)
- Draft restoration (accept/decline)
- Form submission
- Navigation away with unsaved changes

**Handled validation:**

- Step-level validation before allowing progression to next step
- Final validation before submission
- Cross-field validation (e.g., step numbers sequential)

**Types:**

- RecipeFormData (form state)
- RecipeFormErrors (validation errors)
- RecipeFormMode ('create' | 'edit')

**Props:**

```typescript
interface RecipeFormWizardProps {
  mode: "create" | "edit";
  initialData?: RecipeDetailDTO; // For edit mode
  recipeId?: string; // For edit mode
}
```

### ProgressIndicator

**Description:** Visual indicator showing the current step and overall progress through the wizard. Displays "Step X of 6" and a progress bar or breadcrumb-style indicator.

**Main elements:**

- Step counter text (e.g., "Krok 1 z 6")
- Progress bar (width based on current step)
- Optional: Breadcrumb-style step labels for desktop

**Handled interactions:**

- None (display only)

**Handled validation:**

- None

**Types:**

- RecipeFormStep (1-6)

**Props:**

```typescript
interface ProgressIndicatorProps {
  currentStep: RecipeFormStep;
  totalSteps: number;
}
```

### WizardNavigation

**Description:** Navigation buttons at the bottom of the wizard. Shows Previous, Next, and Submit buttons based on current step. Handles step navigation logic.

**Main elements:**

- Previous button (hidden on step 1)
- Next button (shown on steps 1-5)
- Submit button (shown on step 6)
- Loading spinner (during submission)

**Handled interactions:**

- Click Previous: Navigate to previous step
- Click Next: Validate current step, then navigate to next step
- Click Submit: Validate all data and submit form

**Handled validation:**

- Current step validation before allowing Next
- Complete form validation before Submit

**Types:**

- RecipeFormStep
- RecipeFormErrors

**Props:**

```typescript
interface WizardNavigationProps {
  currentStep: RecipeFormStep;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => Promise<void>;
  isSubmitting: boolean;
  canProceed: boolean; // Validation state for current step
}
```

### BasicInfoStep

**Description:** Step 1 component collecting basic recipe information: title, description, servings, prep time, and public visibility.

**Main elements:**

- Label + Input for title (required)
- Label + Textarea for description (optional)
- Label + Input (number) for servings (required)
- Label + Input (number) for prep time in minutes (optional)
- Label + Checkbox for isPublic (default: false)
- Inline error messages below each field
- Character counter for title (showing X/255)

**Handled interactions:**

- Text input with onChange handlers
- Real-time validation with 500ms debounce
- Validation on blur for required fields

**Handled validation:**

- Title: required, 1-255 characters
- Description: optional, max 5000 characters
- Servings: required, integer > 0
- PrepTimeMinutes: optional, integer > 0, max 1440 (24 hours)
- isPublic: boolean

**Types:**

- RecipeFormData
- RecipeFormErrors
- RecipeFormFieldName

**Props:**

```typescript
interface BasicInfoStepProps {
  data: {
    title: string;
    description?: string;
    servings: number;
    prepTimeMinutes?: number;
    isPublic: boolean;
  };
  errors: {
    title?: string;
    description?: string;
    servings?: string;
    prepTimeMinutes?: string;
  };
  onChange: (field: string, value: string | number | boolean) => void;
  onBlur: (field: string) => void;
}
```

### IngredientsStep

**Description:** Step 2 component for managing the dynamic list of recipe ingredients. Each ingredient has name, amount, and unit fields.

**Main elements:**

- List of ingredient rows (each with 3 inputs: name, amount, unit)
- Remove button (trash icon) for each ingredient
- "+ Dodaj składnik" button at bottom
- Error messages for incomplete ingredients
- Three-column layout on desktop, stacked on mobile

**Handled interactions:**

- Add ingredient: Append new empty ingredient to array
- Remove ingredient: Remove specific ingredient from array
- Input change: Update ingredient fields
- Validation on blur for each field

**Handled validation:**

- Minimum 1 ingredient required
- Each ingredient requires all three fields:
  - name: 1-255 characters
  - amount: positive number
  - unit: 1-50 characters

**Types:**

- RecipeIngredientDTO[]
- RecipeFormErrors

**Props:**

```typescript
interface IngredientsStepProps {
  data: RecipeIngredientDTO[];
  errors: {
    ingredients?: string;
    ingredientFields?: Array<{
      name?: string;
      amount?: string;
      unit?: string;
    }>;
  };
  onAdd: () => void;
  onRemove: (index: number) => void;
  onChange: (index: number, field: keyof RecipeIngredientDTO, value: string | number) => void;
}
```

### StepsStep

**Description:** Step 3 component for managing the dynamic list of preparation steps. Each step has an auto-generated number and instruction text.

**Main elements:**

- Ordered list of step items (auto-numbered 1, 2, 3...)
- Textarea for instruction text in each step
- Remove button (trash icon) for each step
- "+ Dodaj krok" button at bottom
- Error messages for incomplete steps

**Handled interactions:**

- Add step: Append new step with next sequential number
- Remove step: Remove specific step and renumber remaining steps
- Input change: Update step instruction
- Validation on blur

**Handled validation:**

- Minimum 1 step required
- Each step requires instruction text (1-2000 characters)
- Step numbers must be sequential starting from 1 (auto-managed)

**Types:**

- RecipeStepDTO[]
- RecipeFormErrors

**Props:**

```typescript
interface StepsStepProps {
  data: RecipeStepDTO[];
  errors: {
    steps?: string;
    stepFields?: Array<{
      instruction?: string;
    }>;
  };
  onAdd: () => void;
  onRemove: (index: number) => void;
  onChange: (index: number, value: string) => void;
}
```

### NutritionStep

**Description:** Step 4 component for entering nutrition values per serving. All 6 fields are required with specific validation rules.

**Main elements:**

- Two-column grid of 6 input fields:
  - Kalorie (kcal)
  - Białko (g)
  - Tłuszcz (g)
  - Węglowodany (g)
  - Błonnik (g)
  - Sól (g)
- Info icon with tooltip explaining values are per serving
- Error messages below each field

**Handled interactions:**

- Number input with onChange handlers
- Real-time validation with 500ms debounce
- Validation on blur

**Handled validation:**

- All fields required, must be numbers ≥ 0
- Specific maximums:
  - Calories: max 10000
  - Protein: max 1000g
  - Fat: max 1000g
  - Carbs: max 1000g
  - Fiber: max 1000g
  - Salt: max 100g

**Types:**

- NutritionDTO
- RecipeFormErrors

**Props:**

```typescript
interface NutritionStepProps {
  data: NutritionDTO;
  errors: {
    calories?: string;
    protein?: string;
    fat?: string;
    carbs?: string;
    fiber?: string;
    salt?: string;
  };
  onChange: (field: keyof NutritionDTO, value: number) => void;
  onBlur: (field: keyof NutritionDTO) => void;
}
```

### TagsStep

**Description:** Step 5 component for selecting tags from available options and creating custom tags. Maximum 5 tags can be selected.

**Main elements:**

- Checkbox grid (3 cols desktop, 2 tablet, 1 mobile)
- List of all available tags (predefined + user-created custom tags)
- Visual indication when 5-tag limit reached (remaining checkboxes disabled)
- Tag count indicator (e.g., "3/5 tagów")
- "+ Dodaj nowy tag" button below grid
- CustomTagCreation dialog (conditional)

**Handled interactions:**

- Checkbox toggle (select/deselect tag)
- Enforce 5-tag maximum (disable unchecked boxes when limit reached)
- Open custom tag creation dialog
- Handle newly created tag (add to list, auto-check)

**Handled validation:**

- Maximum 5 tags allowed
- No minimum required

**Types:**

- TagDTO[]
- RecipeFormErrors

**Props:**

```typescript
interface TagsStepProps {
  availableTags: TagDTO[];
  selectedTagIds: string[];
  errors: {
    tags?: string;
  };
  onToggle: (tagId: string) => void;
  onCustomTagCreated: (newTag: TagDTO) => void;
  isLoadingTags: boolean;
}
```

### CustomTagCreation

**Description:** Dialog component for creating custom tags. Allows user to input a tag name, automatically generates slug, and submits to API.

**Main elements:**

- Dialog/Modal overlay
- Input field for tag name (1-100 characters)
- Auto-generated slug preview (lowercase, hyphens, no special chars)
- "Dodaj" button (submit)
- "Anuluj" button (cancel/close)
- Error message display (e.g., duplicate tag name)
- Loading state during submission

**Handled interactions:**

- Text input for tag name
- Auto-generate slug on change
- Submit: POST to /api/tags endpoint
- Handle success: Close dialog, pass new tag to parent
- Handle error: Display error message inline

**Handled validation:**

- Tag name: required, 1-100 characters, trimmed
- Slug: auto-generated, validated format
- Duplicate check: Server-side, display error if duplicate

**Types:**

- TagDTO
- CreateTagCommand

**Props:**

```typescript
interface CustomTagCreationProps {
  isOpen: boolean;
  onClose: () => void;
  onTagCreated: (tag: TagDTO) => void;
}
```

### ReviewStep

**Description:** Step 6 component displaying a summary of all entered data with edit links to navigate back to specific steps. Final submit action.

**Main elements:**

- Section headers for each data category
- Summary cards/sections:
  - **Basic Info:** Title, description, servings, prep time, public status
  - **Ingredients:** List of all ingredients with amounts and units
  - **Steps:** Numbered list of all preparation steps
  - **Nutrition:** All nutrition values in a grid
  - **Tags:** Selected tag badges
- Edit link/button for each section (navigates back to specific step)
- Final submit button: "Zapisz przepis" (create) or "Zapisz zmiany" (edit)

**Handled interactions:**

- Edit links: Navigate to specific step (1-5)
- Submit: Trigger final form submission

**Handled validation:**

- Display-only, no validation (all validation done in previous steps)

**Types:**

- RecipeFormData

**Props:**

```typescript
interface ReviewStepProps {
  data: RecipeFormData;
  mode: "create" | "edit";
  onEdit: (step: RecipeFormStep) => void;
}
```

## 5. Types

### Form State Types

```typescript
/**
 * Current step in the wizard (1-6)
 */
export type RecipeFormStep = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Form mode (create or edit)
 */
export type RecipeFormMode = "create" | "edit";

/**
 * Complete recipe form data structure
 * Extends CreateRecipeCommand with additional UI state
 */
export interface RecipeFormData {
  // Basic Info (Step 1)
  title: string;
  description?: string;
  servings: number;
  prepTimeMinutes?: number;
  isPublic: boolean;

  // Ingredients (Step 2)
  ingredients: RecipeIngredientDTO[];

  // Steps (Step 3)
  steps: RecipeStepDTO[];

  // Nutrition (Step 4)
  nutritionPerServing: NutritionDTO;

  // Tags (Step 5)
  tagIds: string[];
}

/**
 * Validation errors for all form fields
 * Mirrors RecipeFormData structure with optional string error messages
 */
export interface RecipeFormErrors {
  // Basic Info errors
  title?: string;
  description?: string;
  servings?: string;
  prepTimeMinutes?: string;

  // Ingredients errors
  ingredients?: string; // General error (e.g., "At least one ingredient required")
  ingredientFields?: Array<{
    name?: string;
    amount?: string;
    unit?: string;
  }>;

  // Steps errors
  steps?: string; // General error (e.g., "At least one step required")
  stepFields?: Array<{
    instruction?: string;
  }>;

  // Nutrition errors
  calories?: string;
  protein?: string;
  fat?: string;
  carbs?: string;
  fiber?: string;
  salt?: string;

  // Tags errors
  tags?: string; // E.g., "Maximum 5 tags allowed"
}

/**
 * Draft data structure stored in localStorage
 */
export interface RecipeDraftData {
  timestamp: string; // ISO 8601 timestamp
  step: RecipeFormStep; // Current step when draft was saved
  data: RecipeFormData; // Complete form data
}

/**
 * localStorage keys for draft persistence
 */
export const DRAFT_KEYS = {
  NEW_RECIPE: "draft_recipe_new",
  EDIT_RECIPE: (recipeId: string) => `draft_recipe_edit_${recipeId}`,
} as const;

/**
 * Draft expiration time (24 hours in milliseconds)
 */
export const DRAFT_EXPIRATION_MS = 24 * 60 * 60 * 1000;
```

### Tag Creation Types

```typescript
/**
 * Command to create a new custom tag
 */
export interface CreateTagCommand {
  name: string; // 1-100 characters, trimmed
  slug: string; // Auto-generated: lowercase, hyphens, no special chars
}

/**
 * Response from POST /api/tags
 */
export interface CreateTagResponse {
  success: boolean;
  tag: TagDTO;
}
```

### API Response Types

```typescript
/**
 * Response from GET /api/tags
 */
export interface GetTagsResponse {
  tags: TagDTO[];
}

/**
 * Response from POST /api/recipes
 */
export interface CreateRecipeResponse {
  success: boolean;
  recipe: RecipeDetailDTO;
}

/**
 * Response from PUT /api/recipes/:recipeId
 */
export interface UpdateRecipeResponse {
  success: boolean;
  recipe: RecipeDetailDTO;
}

/**
 * Generic API error response
 */
export interface ApiErrorResponse {
  error: string;
  message: string;
}
```

## 6. State Management

### Custom Hook: useRecipeFormWizard

The form state management is centralized in a custom hook `useRecipeFormWizard` that handles:

**Responsibilities:**

1. **Form State:** Manages RecipeFormData across all steps
2. **Validation State:** Tracks RecipeFormErrors for all fields
3. **Step Navigation:** Current step state and navigation functions
4. **Draft Persistence:** Auto-save to localStorage every 2-3 seconds
5. **Draft Restoration:** Detect and restore saved drafts on mount
6. **Submit Logic:** API calls for create/edit operations
7. **Loading States:** Track submission and data fetching states
8. **Unsaved Changes Tracking:** Detect modifications for navigation warnings

**Hook Interface:**

```typescript
interface UseRecipeFormWizardParams {
  mode: RecipeFormMode;
  recipeId?: string; // Required for edit mode
  initialData?: RecipeDetailDTO; // Pre-populated data for edit mode
}

interface UseRecipeFormWizardReturn {
  // Form state
  formData: RecipeFormData;
  errors: RecipeFormErrors;
  currentStep: RecipeFormStep;

  // Loading states
  isSubmitting: boolean;
  isDraftRestoring: boolean;
  hasUnsavedChanges: boolean;

  // Data modification
  updateField: (field: keyof RecipeFormData, value: any) => void;
  updateIngredient: (index: number, field: keyof RecipeIngredientDTO, value: any) => void;
  addIngredient: () => void;
  removeIngredient: (index: number) => void;
  updateStep: (index: number, instruction: string) => void;
  addStep: () => void;
  removeStep: (index: number) => void;
  toggleTag: (tagId: string) => void;
  updateNutrition: (field: keyof NutritionDTO, value: number) => void;

  // Validation
  validateField: (field: string) => void;
  validateStep: (step: RecipeFormStep) => boolean;
  clearError: (field: string) => void;

  // Navigation
  goToStep: (step: RecipeFormStep) => void;
  nextStep: () => void;
  previousStep: () => void;
  canProceedToNextStep: boolean;

  // Draft management
  hasDraft: boolean;
  restoreDraft: () => void;
  discardDraft: () => void;

  // Submission
  submitForm: () => Promise<void>;
}

/**
 * Example hook implementation structure
 */
export function useRecipeFormWizard(params: UseRecipeFormWizardParams): UseRecipeFormWizardReturn {
  // State declarations
  const [formData, setFormData] = useState<RecipeFormData>(getInitialFormData(params));
  const [errors, setErrors] = useState<RecipeFormErrors>({});
  const [currentStep, setCurrentStep] = useState<RecipeFormStep>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Draft detection on mount
  useEffect(() => {
    const draftKey = params.mode === "create" ? DRAFT_KEYS.NEW_RECIPE : DRAFT_KEYS.EDIT_RECIPE(params.recipeId!);

    const savedDraft = detectDraft(draftKey);
    // Show restoration prompt if draft exists
  }, []);

  // Auto-save draft every 2-3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      saveDraft(formData, currentStep, params);
    }, 2500);

    return () => clearTimeout(timer);
  }, [formData, currentStep]);

  // Browser navigation warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Implementation of all hook methods
  // ...

  return {
    formData,
    errors,
    currentStep,
    isSubmitting,
    // ... all other return values
  };
}
```

**Helper Functions:**

```typescript
/**
 * Get initial form data based on mode
 */
function getInitialFormData(params: UseRecipeFormWizardParams): RecipeFormData {
  if (params.mode === "edit" && params.initialData) {
    // Map RecipeDetailDTO to RecipeFormData
    return {
      title: params.initialData.title,
      description: params.initialData.description || undefined,
      servings: params.initialData.servings,
      prepTimeMinutes: params.initialData.prepTimeMinutes || undefined,
      isPublic: params.initialData.isPublic,
      ingredients: params.initialData.ingredients,
      steps: params.initialData.steps,
      nutritionPerServing: params.initialData.nutritionPerServing,
      tagIds: params.initialData.tags.map((t) => t.id),
    };
  }

  // Default empty form for create mode
  return {
    title: "",
    servings: 1,
    isPublic: false,
    ingredients: [{ name: "", amount: 0, unit: "" }],
    steps: [{ stepNumber: 1, instruction: "" }],
    nutritionPerServing: {
      calories: 0,
      protein: 0,
      fat: 0,
      carbs: 0,
      fiber: 0,
      salt: 0,
    },
    tagIds: [],
  };
}

/**
 * Save draft to localStorage
 */
function saveDraft(data: RecipeFormData, step: RecipeFormStep, params: UseRecipeFormWizardParams): void {
  const draftKey = params.mode === "create" ? DRAFT_KEYS.NEW_RECIPE : DRAFT_KEYS.EDIT_RECIPE(params.recipeId!);

  const draft: RecipeDraftData = {
    timestamp: new Date().toISOString(),
    step,
    data,
  };

  try {
    localStorage.setItem(draftKey, JSON.stringify(draft));
  } catch (error) {
    console.error("Failed to save draft:", error);
  }
}

/**
 * Detect and validate existing draft
 */
function detectDraft(draftKey: string): RecipeDraftData | null {
  try {
    const saved = localStorage.getItem(draftKey);
    if (!saved) return null;

    const draft: RecipeDraftData = JSON.parse(saved);
    const age = Date.now() - new Date(draft.timestamp).getTime();

    // Check if draft is expired (older than 24 hours)
    if (age > DRAFT_EXPIRATION_MS) {
      localStorage.removeItem(draftKey);
      return null;
    }

    return draft;
  } catch (error) {
    console.error("Failed to load draft:", error);
    return null;
  }
}

/**
 * Generate slug from tag name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special chars
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Collapse multiple hyphens
    .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
}
```

## 7. API Integration

### Endpoints Used

#### 1. GET /api/tags

**Purpose:** Fetch all available tags (predefined + user-created custom tags)

**When:** On component mount in TagsStep

**Request:** None (public endpoint)

**Response:**

```typescript
{
  tags: TagDTO[]
}
```

**Error Handling:**

- 500: Display error message, allow form to continue with empty tags array

---

#### 2. POST /api/tags (Note: Currently not implemented, needs to be created)

**Purpose:** Create a new custom tag

**When:** User submits CustomTagCreation dialog

**Request:**

```typescript
{
  name: string; // 1-100 characters
  slug: string; // Auto-generated
}
```

**Response:**

```typescript
{
  success: boolean;
  tag: TagDTO;
}
```

**Error Handling:**

- 400: Validation error (e.g., duplicate tag name) - Display inline error
- 500: Server error - Display error toast, close dialog

---

#### 3. GET /api/recipes/:recipeId

**Purpose:** Fetch existing recipe data for edit mode

**When:** Edit page mounts, before rendering wizard

**Request:** Path parameter `recipeId` (UUID)

**Response:**

```typescript
RecipeDetailDTO;
```

**Error Handling:**

- 403: User not owner - Redirect to recipes list with error message
- 404: Recipe not found - Redirect to recipes list with error message
- 500: Server error - Display error page

---

#### 4. POST /api/recipes

**Purpose:** Create a new recipe

**When:** User submits form in create mode (step 6)

**Request:**

```typescript
CreateRecipeCommand {
  title: string;
  description?: string;
  ingredients: RecipeIngredientDTO[];
  steps: RecipeStepDTO[];
  servings: number;
  nutritionPerServing: NutritionDTO;
  prepTimeMinutes?: number;
  isPublic: boolean;
  tagIds?: string[];
}
```

**Response:**

```typescript
{
  success: boolean;
  recipe: RecipeDetailDTO;
}
```

**Error Handling:**

- 400: Validation error - Display errors in wizard, scroll to first error
- 401: Not authenticated - Redirect to login
- 500: Server error - Display error toast with retry option

**Success Flow:**

1. Clear draft from localStorage
2. Show success toast: "Przepis został zapisany"
3. Redirect to recipe detail page: `/recipes/{recipe.id}`

---

#### 5. PUT /api/recipes/:recipeId

**Purpose:** Update an existing recipe

**When:** User submits form in edit mode (step 6)

**Request:**

```typescript
UpdateRecipeCommand {
  // Same structure as CreateRecipeCommand
}
```

**Response:**

```typescript
{
  success: boolean;
  recipe: RecipeDetailDTO;
}
```

**Error Handling:**

- 400: Validation error - Display errors in wizard, scroll to first error
- 401: Not authenticated - Redirect to login
- 403: Not owner - Display error, redirect to recipes list
- 404: Recipe not found - Display error, redirect to recipes list
- 500: Server error - Display error toast with retry option

**Success Flow:**

1. Clear draft from localStorage
2. Show success toast: "Zmiany zostały zapisane"
3. Redirect to recipe detail page: `/recipes/{recipe.id}`

---

### API Integration Pattern in Hook

```typescript
async function submitForm(): Promise<void> {
  setIsSubmitting(true);

  try {
    // Final validation
    const isValid = validateAllSteps();
    if (!isValid) {
      // Scroll to first error
      setIsSubmitting(false);
      return;
    }

    // Prepare payload
    const payload: CreateRecipeCommand = {
      title: formData.title,
      description: formData.description,
      ingredients: formData.ingredients,
      steps: formData.steps,
      servings: formData.servings,
      nutritionPerServing: formData.nutritionPerServing,
      prepTimeMinutes: formData.prepTimeMinutes,
      isPublic: formData.isPublic,
      tagIds: formData.tagIds.length > 0 ? formData.tagIds : undefined,
    };

    // API call based on mode
    const response =
      params.mode === "create"
        ? await fetch("/api/recipes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch(`/api/recipes/${params.recipeId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

    if (!response.ok) {
      const errorData = await response.json();

      if (response.status === 400) {
        // Validation errors - display in form
        setErrors({
          /* map API errors to form errors */
        });
        scrollToFirstError();
        return;
      }

      throw new Error(errorData.message || "Wystąpił błąd podczas zapisywania przepisu");
    }

    const result = await response.json();

    // Success
    clearDraft();
    setHasUnsavedChanges(false);

    // Show success toast and redirect
    showSuccessToast(params.mode === "create" ? "Przepis został zapisany" : "Zmiany zostały zapisane");

    window.location.href = `/recipes/${result.recipe.id}`;
  } catch (error) {
    console.error("Submit error:", error);
    showErrorToast(error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd");
  } finally {
    setIsSubmitting(false);
  }
}
```

## 8. User Interactions

### 1. Step Navigation

**Interaction:** User clicks "Następny" (Next) button

- **Action:** Validate current step
- **If valid:** Increment currentStep, scroll to top
- **If invalid:** Display errors inline, scroll to first error, prevent navigation

**Interaction:** User clicks "Poprzedni" (Previous) button

- **Action:** Decrement currentStep, scroll to top
- **Note:** No validation required for going backwards

**Interaction:** User clicks "Edit" link in Review step

- **Action:** Navigate to specified step (1-5)

### 2. Ingredient Management

**Interaction:** User clicks "+ Dodaj składnik"

- **Action:** Append new empty ingredient to array: `{ name: '', amount: 0, unit: '' }`

**Interaction:** User clicks trash icon on ingredient

- **Action:** Remove ingredient at specific index from array
- **Validation:** Prevent removal if only 1 ingredient remains (show error)

**Interaction:** User changes ingredient field (name, amount, unit)

- **Action:** Update specific ingredient field in array
- **Validation:** Validate on blur

### 3. Step Management

**Interaction:** User clicks "+ Dodaj krok"

- **Action:** Append new step with next sequential number: `{ stepNumber: nextNumber, instruction: '' }`

**Interaction:** User clicks trash icon on step

- **Action:**
  1. Remove step at specific index
  2. Renumber all remaining steps sequentially (1, 2, 3...)
- **Validation:** Prevent removal if only 1 step remains (show error)

**Interaction:** User changes step instruction

- **Action:** Update step instruction in array
- **Validation:** Validate on blur

### 4. Tag Selection

**Interaction:** User toggles tag checkbox

- **Action:** Add/remove tag ID from selectedTagIds array
- **Validation:**
  - If selecting: Check if 5 tags already selected, if so prevent and show message
  - If deselecting: Always allow

**Interaction:** User clicks "+ Dodaj nowy tag"

- **Action:** Open CustomTagCreation dialog

**Interaction:** User creates custom tag successfully

- **Action:**
  1. Add new tag to availableTags list
  2. Automatically check the new tag (add to selectedTagIds)
  3. Close dialog

### 5. Draft Management

**Interaction:** Page loads with existing draft

- **Action:** Show restoration banner: "Znaleziono niezapisany szkic z {date}. Przywrócić?"
- **Options:**
  - "Tak" - Restore draft data and step, dismiss banner
  - "Nie" - Discard draft, dismiss banner, start fresh

**Interaction:** User navigates away with unsaved changes

- **Action:** Show browser confirmation dialog: "Masz niezapisane zmiany. Czy na pewno chcesz opuścić stronę?"

### 6. Form Submission

**Interaction:** User clicks "Zapisz przepis" (create) or "Zapisz zmiany" (edit)

- **Action:**
  1. Show loading state on button
  2. Validate all form data
  3. If invalid: Display errors, scroll to first error
  4. If valid: Submit to API
  5. On success: Clear draft, show toast, redirect
  6. On error: Display error message, allow retry

### 7. Field Validation

**Interaction:** User blurs a required field

- **Action:** Validate field, display inline error if invalid

**Interaction:** User types in field with real-time validation

- **Action:** Debounce 500ms, then validate, display/clear error

**Interaction:** User corrects an invalid field

- **Action:** Clear error immediately when field becomes valid

## 9. Conditions and Validation

### Step 1: Basic Info

| Field           | Validation Rules                | Timing                   | Error Messages                                                                                                  |
| --------------- | ------------------------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------- |
| Title           | Required, 1-255 chars, trimmed  | Blur + Debounced (500ms) | "Tytuł jest wymagany" / "Tytuł może mieć maksymalnie 255 znaków"                                                |
| Description     | Optional, max 5000 chars        | Debounced (500ms)        | "Opis może mieć maksymalnie 5000 znaków"                                                                        |
| Servings        | Required, integer > 0           | Blur                     | "Liczba porcji jest wymagana" / "Liczba porcji musi być większa niż 0"                                          |
| PrepTimeMinutes | Optional, integer > 0, max 1440 | Blur                     | "Czas przygotowania musi być większy niż 0" / "Czas przygotowania nie może przekroczyć 1440 minut (24 godziny)" |

**Step Validation:** All required fields filled, all values within bounds

### Step 2: Ingredients

| Validation        | Rules                          | Error Message                                                              |
| ----------------- | ------------------------------ | -------------------------------------------------------------------------- |
| Minimum count     | At least 1 ingredient          | "Wymagany jest co najmniej jeden składnik"                                 |
| Ingredient name   | Required, 1-255 chars, trimmed | "Nazwa składnika jest wymagana" / "Nazwa może mieć maksymalnie 255 znaków" |
| Ingredient amount | Required, positive number      | "Ilość jest wymagana" / "Ilość musi być większa niż 0"                     |
| Ingredient unit   | Required, 1-50 chars, trimmed  | "Jednostka jest wymagana" / "Jednostka może mieć maksymalnie 50 znaków"    |

**Step Validation:** At least 1 ingredient, all ingredients have all 3 fields filled correctly

### Step 3: Preparation Steps

| Validation       | Rules                            | Error Message                                                               |
| ---------------- | -------------------------------- | --------------------------------------------------------------------------- |
| Minimum count    | At least 1 step                  | "Wymagany jest co najmniej jeden krok przygotowania"                        |
| Step instruction | Required, 1-2000 chars, trimmed  | "Instrukcja jest wymagana" / "Instrukcja może mieć maksymalnie 2000 znaków" |
| Step numbering   | Sequential from 1 (auto-managed) | N/A (handled automatically)                                                 |

**Step Validation:** At least 1 step, all steps have instructions

### Step 4: Nutrition

| Field    | Validation Rules                | Error Message                                                                                                 |
| -------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Calories | Required, number ≥ 0, max 10000 | "Kalorie są wymagane" / "Kalorie nie mogą być ujemne" / "Kalorie muszą wynosić maksymalnie 10000"             |
| Protein  | Required, number ≥ 0, max 1000  | "Białko jest wymagane" / "Białko nie może być ujemne" / "Białko musi wynosić maksymalnie 1000g"               |
| Fat      | Required, number ≥ 0, max 1000  | "Tłuszcz jest wymagany" / "Tłuszcz nie może być ujemny" / "Tłuszcz musi wynosić maksymalnie 1000g"            |
| Carbs    | Required, number ≥ 0, max 1000  | "Węglowodany są wymagane" / "Węglowodany nie mogą być ujemne" / "Węglowodany muszą wynosić maksymalnie 1000g" |
| Fiber    | Required, number ≥ 0, max 1000  | "Błonnik jest wymagany" / "Błonnik nie może być ujemny" / "Błonnik musi wynosić maksymalnie 1000g"            |
| Salt     | Required, number ≥ 0, max 100   | "Sól jest wymagana" / "Sól nie może być ujemna" / "Sól musi wynosić maksymalnie 100g"                         |

**Step Validation:** All 6 nutrition fields filled with valid values

### Step 5: Tags

| Validation    | Rules      | Error Message                       |
| ------------- | ---------- | ----------------------------------- |
| Maximum count | Max 5 tags | "Możesz wybrać maksymalnie 5 tagów" |
| Tag ID format | Valid UUID | N/A (handled by checkbox selection) |

**Step Validation:** 0-5 tags selected (no minimum required)

### Step 6: Review

**Step Validation:** Display-only, no validation (all validation completed in previous steps)

### Cross-Step Validation (Before Submit)

1. **All step validations must pass**
2. **Step numbers are sequential** (auto-managed, verified before submit)
3. **Selected tag IDs exist** (frontend ensures this via checkbox selection)

## 10. Error Handling

### Validation Errors

**Field-level errors:**

- Display inline below the field in red text
- Include error icon (⚠️ or similar)
- Clear error when field becomes valid

**Step-level errors:**

- Display summary alert at top of step
- List all errors in the current step
- Scroll to first error on validation failure

**Form-level errors:**

- Show error count in summary: "Formularz zawiera 3 błędy"
- Highlight affected steps in progress indicator

### API Errors

**Network Errors:**

- Display toast notification: "Brak połączenia z serwerem. Sprawdź swoje połączenie internetowe."
- Provide retry button
- Keep form data intact

**400 Bad Request (Validation):**

- Map API error messages to form fields
- Display errors inline in wizard
- Scroll to first error field
- Highlight affected step

**401 Unauthorized:**

- Redirect to login page
- Show message: "Sesja wygasła. Zaloguj się ponownie."

**403 Forbidden (Edit mode):**

- Display error message: "Nie masz uprawnień do edycji tego przepisu"
- Redirect to recipes list

**404 Not Found (Edit mode):**

- Display error message: "Przepis nie został znaleziony"
- Redirect to recipes list

**500 Internal Server Error:**

- Display toast: "Wystąpił błąd serwera. Spróbuj ponownie później."
- Provide retry button
- Keep form data intact (draft saved)

### Tag Creation Errors

**Duplicate Tag Name:**

- Display inline error in dialog: "Tag o tej nazwie już istnieje"
- Keep dialog open for correction

**Tag Creation Failure:**

- Display toast: "Nie udało się utworzyć tagu. Spróbuj ponownie."
- Close dialog
- Allow user to select from existing tags

### Draft Errors

**Draft Save Failure:**

- Log error silently (don't interrupt user)
- Attempt to save on next change

**Draft Load Failure:**

- Log error silently
- Start with fresh form
- Don't show restoration prompt

**Draft Corruption:**

- Discard invalid draft
- Start with fresh form
- Log error for debugging

### Empty States

**No Available Tags (TagsStep):**

- Display message: "Brak dostępnych tagów. Możesz utworzyć własny tag."
- Show "+ Dodaj nowy tag" button prominently

**API Tag Fetch Failure:**

- Display error message: "Nie udało się pobrać tagów"
- Allow form to continue (tags are optional)
- Provide reload button

### Loading States

**Initial Load (Edit mode):**

- Show full-page skeleton/spinner while fetching recipe data
- Display error page if fetch fails

**Tag Loading:**

- Show skeleton checkboxes in TagsStep
- Disable tag selection until loaded

**Form Submission:**

- Disable submit button
- Show loading spinner on button
- Disable all form fields
- Prevent navigation

**Custom Tag Creation:**

- Show loading spinner on "Dodaj" button
- Disable form fields in dialog

## 11. Implementation Steps

### Phase 1: Setup and Types (1-2 hours)

1. **Create type definitions**
   - Add all form-related types to `src/types.ts` or create new `src/types/recipe-form.types.ts`
   - Define RecipeFormData, RecipeFormErrors, RecipeFormStep, RecipeDraftData
   - Add DRAFT_KEYS constant and helper type definitions

2. **Create directory structure**
   ```
   src/components/recipe-wizard/
   ├── RecipeFormWizard.tsx
   ├── ProgressIndicator.tsx
   ├── WizardNavigation.tsx
   ├── steps/
   │   ├── BasicInfoStep.tsx
   │   ├── IngredientsStep.tsx
   │   ├── StepsStep.tsx
   │   ├── NutritionStep.tsx
   │   ├── TagsStep.tsx
   │   └── ReviewStep.tsx
   └── tag-creation/
       └── CustomTagCreation.tsx
   ```

### Phase 2: Core Hook Implementation (3-4 hours)

3. **Implement useRecipeFormWizard hook**
   - Create `src/components/hooks/useRecipeFormWizard.ts`
   - Implement state management (formData, errors, currentStep)
   - Implement field update functions
   - Implement step navigation logic
   - Implement step validation functions
   - Add draft detection and restoration logic
   - Add auto-save draft functionality (useEffect with 2.5s debounce)
   - Add unsaved changes tracking
   - Add browser beforeunload listener

4. **Implement validation logic**
   - Create validation functions for each step
   - Implement field-level validation with proper error messages
   - Add debounced validation for real-time fields
   - Implement cross-field validation (e.g., sequential step numbers)

### Phase 3: Step Components (5-6 hours)

5. **Implement BasicInfoStep component**
   - Create form layout with labels and inputs
   - Add character counter for title field
   - Implement onChange and onBlur handlers
   - Display inline error messages
   - Style with Tailwind classes

6. **Implement IngredientsStep component**
   - Create dynamic ingredient list with three-column layout
   - Add "+ Dodaj składnik" button
   - Add remove button for each ingredient (with minimum 1 validation)
   - Implement add/remove/change handlers
   - Make responsive (stacked on mobile)
   - Display error messages

7. **Implement StepsStep component**
   - Create dynamic ordered list with auto-numbering
   - Add "+ Dodaj krok" button
   - Add remove button for each step (with minimum 1 validation)
   - Implement automatic renumbering on removal
   - Implement add/remove/change handlers
   - Display error messages

8. **Implement NutritionStep component**
   - Create two-column grid layout for 6 fields
   - Add info icon with tooltip explaining "per serving"
   - Implement number inputs with validation
   - Display error messages for each field
   - Add field labels in Polish

9. **Implement TagsStep component**
   - Create responsive checkbox grid (3/2/1 columns)
   - Fetch tags using useTags hook
   - Implement tag selection with 5-tag limit
   - Show tag counter (X/5 tagów)
   - Disable unchecked boxes when limit reached
   - Add "+ Dodaj nowy tag" button
   - Integrate CustomTagCreation component

10. **Implement ReviewStep component**
    - Create summary sections for all data categories
    - Display Basic Info, Ingredients, Steps, Nutrition, Tags
    - Add edit links for each section (navigate to step)
    - Style as read-only review format
    - Make visually distinct from editable steps

### Phase 4: Supporting Components (2-3 hours)

11. **Implement ProgressIndicator component**
    - Create step counter display (Krok X z 6)
    - Add progress bar visualization
    - Make responsive
    - Optional: Add breadcrumb-style labels for desktop

12. **Implement WizardNavigation component**
    - Create button layout (Previous / Next / Submit)
    - Implement conditional rendering based on step
    - Add loading state for submit button
    - Disable buttons appropriately
    - Style with Shadcn/ui Button component

13. **Implement CustomTagCreation component**
    - Create Dialog component using Shadcn/ui
    - Add tag name input field
    - Implement auto-slug generation
    - Show slug preview
    - Add submit/cancel buttons
    - Implement API call to POST /api/tags (note: endpoint needs to be created)
    - Handle errors (duplicate name, server error)
    - Show loading state

### Phase 5: Main Wizard Container (2-3 hours)

14. **Implement RecipeFormWizard component**
    - Initialize useRecipeFormWizard hook with props
    - Implement step rendering logic (switch on currentStep)
    - Add ProgressIndicator at top
    - Add WizardNavigation at bottom
    - Implement draft restoration banner
    - Connect all child components to hook
    - Add loading states for initial data fetch (edit mode)
    - Handle unsaved changes warning

### Phase 6: Page Integration (2 hours)

15. **Create /recipes/new page**
    - Create `src/pages/recipes/new.astro`
    - Add authentication check (redirect if not logged in)
    - Render RecipeFormWizard in create mode
    - Set page title and metadata

16. **Create /recipes/[id]/edit page**
    - Create `src/pages/recipes/[id]/edit.astro`
    - Add authentication check
    - Fetch recipe data using GET /api/recipes/:id
    - Verify user is recipe owner (authorization)
    - Render RecipeFormWizard in edit mode with initialData
    - Handle fetch errors (404, 403)

### Phase 7: API Integration (2-3 hours)

17. **Implement submit logic in hook**
    - Create submitForm function
    - Implement final validation
    - Prepare payload (map FormData to CreateRecipeCommand)
    - Implement API calls for create/edit
    - Handle success: clear draft, show toast, redirect
    - Handle errors: display messages, allow retry
    - Add proper error mapping for 400 validation errors

18. **Create POST /api/tags endpoint (if not exists)**
    - Create `src/pages/api/tags/index.ts` POST handler
    - Implement Zod validation for CreateTagCommand
    - Create tag in database
    - Return created tag
    - Handle duplicate name error
    - Add proper authentication

### Phase 8: Polish and Testing (2-3 hours)

19. **Add toast notifications**
    - Install/configure toast library (e.g., sonner)
    - Add success toasts for save operations
    - Add error toasts for API failures
    - Add info toast for draft restoration

20. **Implement accessibility features**
    - Add ARIA labels to all form fields
    - Ensure keyboard navigation works
    - Add focus management when changing steps
    - Associate error messages with fields using ARIA
    - Add screen reader announcements for step changes

21. **Add loading skeletons**
    - Create skeleton for tag loading
    - Create skeleton for edit mode initial load
    - Use Shadcn/ui Skeleton component

22. **Responsive design polish**
    - Test on mobile, tablet, desktop
    - Adjust ingredient/step layouts for mobile
    - Ensure touch targets are adequate
    - Test progress indicator on small screens

### Phase 9: Testing and Refinement (3-4 hours)

23. **Manual testing**
    - Test create flow end-to-end
    - Test edit flow end-to-end
    - Test draft save and restoration
    - Test all validation scenarios
    - Test error handling (network errors, API errors)
    - Test unsaved changes warning
    - Test tag creation and selection
    - Test ingredient/step add/remove
    - Test navigation between steps

24. **Edge case testing**
    - Test with expired draft
    - Test with corrupted draft data
    - Test with maximum field lengths
    - Test with 5 tags selected
    - Test removing last ingredient/step (should prevent)
    - Test edit mode with missing recipe
    - Test edit mode as non-owner

25. **Performance optimization**
    - Verify debouncing works correctly
    - Ensure draft saves don't impact performance
    - Check for memory leaks (useEffect cleanup)
    - Optimize re-renders if needed

26. **Final polish**
    - Review all error messages (Polish language, clarity)
    - Ensure consistent styling
    - Add helpful placeholder text
    - Verify all tooltips and help text
    - Check loading states
    - Verify success/error flows

---

## Estimated Total Implementation Time: 24-32 hours

This implementation can be broken down into daily tasks for a 1-week sprint or adjusted based on developer availability and project priorities.
