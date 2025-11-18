# View Implementation Plan: Recipe Detail Page

## 1. Overview

The Recipe Detail Page is a comprehensive view that displays full recipe information including ingredients, preparation steps, and nutrition values. It serves as the primary interface for viewing, modifying with AI, and managing individual recipes. The page features a responsive two-column layout on desktop (main content + sidebar) and a single-column layout on mobile. A key feature is the tab interface that appears when a recipe has been modified with AI, allowing users to switch between the original and modified versions. The page includes real-time servings adjustment with automatic ingredient recalculation, nutrition visualization with a pie chart, and action buttons for editing, deleting, favoriting, and AI modification.

**Key Features:**

- Display complete recipe details with ingredients, steps, and nutrition
- Tab interface for original vs modified recipes (when modification exists)
- Real-time servings adjustment with ingredient amount recalculation
- Nutrition pie chart visualization
- Action buttons for recipe management (Edit, Delete, Favorite, Modify with AI, Add to Collection)
- Responsive layout (two-column desktop, single-column mobile)
- Authorization checks for public/private recipe access

## 2. View Routing

**Path:** `/recipes/[id]`

**Example:** `/recipes/a1b2c3d4-e5f6-7890-abcd-ef1234567890`

**Route Parameters:**

- `id` (required): UUID of the recipe to display

**Server-side File:** `src/pages/recipes/[id].astro`

**Authentication:** Required (currently mocked with hardcoded userId for MVP)

**Authorization:**

- Recipe must be public OR user must be the recipe owner
- 403 Forbidden if recipe is private and user is not the owner
- 404 Not Found if recipe doesn't exist

## 3. Component Structure

### Component Hierarchy

```
RecipeDetailPage (.astro)
└── RecipeDetailLayout (client:load)
    ├── LoadingState
    ├── ErrorState
    └── Content (when loaded)
        ├── TabNavigation (conditional: if has modification)
        │   ├── TabButton (Original)
        │   └── TabButton (Modified)
        │
        ├── InfoBanner (conditional: on Modified tab)
        │
        ├── DesktopLayout (hidden on mobile)
        │   ├── LeftColumn
        │   │   ├── RecipeHeader
        │   │   ├── ServingsAdjuster
        │   │   ├── IngredientsList
        │   │   └── PreparationSteps
        │   └── RightSidebar
        │       ├── NutritionCard
        │       │   └── NutritionPieChart
        │       └── ActionButtons
        │
        ├── MobileLayout (hidden on desktop)
        │   ├── RecipeHeader
        │   ├── NutritionCard
        │   │   └── NutritionPieChart
        │   ├── ServingsAdjuster
        │   ├── IngredientsList
        │   ├── PreparationSteps
        │   └── StickyActionButtons
        │
        └── Modals/Dialogs
            ├── ModifyWithAIModal
            ├── DeleteConfirmDialog
            ├── DeleteModificationDialog
            └── AddToCollectionDialog
```

### Layout Strategy

**Desktop (≥768px):**

- Two-column layout using CSS Grid
- Left column (main content): Header, Servings Adjuster, Ingredients, Steps
- Right sidebar (fixed width ~320px): Nutrition Card, Action Buttons
- Tabs appear above content if modification exists

**Mobile (<768px):**

- Single column, stacked vertically
- Order: Header → Nutrition Card → Servings Adjuster → Ingredients → Steps
- Action buttons sticky at bottom or in floating menu
- Tabs appear above content if modification exists

## 4. Component Details

### RecipeDetailPage (Astro)

**Component Description:**
Server-rendered Astro page that fetches initial data, performs authentication checks, and renders the RecipeDetailLayout React component. This component handles the initial recipe load and favorite status fetch on the server side.

**Main Elements:**

- `<Layout>` wrapper from layout system
- `<RecipeDetailLayout>` React component with `client:load` directive
- Server-side data fetching for recipe and initial favorite status

**Handled Interactions:**

- None (server-rendered only)

**Handled Validation:**

- Authentication check (redirects to /login if not authenticated)
- Recipe existence check (shows 404 if not found)
- Authorization check (shows 403 if forbidden)

**Types:**

- `RecipeDetailDTO` (from API response)
- `boolean` (isFavorited flag)

**Props:**

- None (Astro page component with route params)

### RecipeDetailLayout (React)

**Component Description:**
Main React component that manages the entire recipe detail view, including state management, tab switching, and responsive layout orchestration. Integrates the custom `useRecipeDetail` hook for data and state management.

**Main Elements:**

- Conditional rendering: `LoadingState` → `ErrorState` → Main content
- `<TabNavigation>` (if modification exists)
- `<div className="desktop-layout">` (two-column grid, hidden on mobile)
- `<div className="mobile-layout">` (single column, hidden on desktop)
- Modals for actions

**Handled Interactions:**

- Tab switching between original and modified
- All user actions via child component callbacks

**Handled Validation:**

- Loading state management
- Error state handling
- Conditional rendering based on modification existence

**Types:**

- `RecipeDetailDTO`
- `ModificationDTO | null`
- `RecipeViewState`
- `ActionLoadingStates`

**Props:**

```typescript
interface RecipeDetailLayoutProps {
  recipeId: string;
  initialIsFavorited: boolean;
}
```

### TabNavigation (React)

**Component Description:**
Tab switcher component that appears when a recipe has modifications. Displays two tabs: "Oryginalny" (Original) and "Zmodyfikowany" (Modified). Uses Shadcn/ui Tabs component for accessibility.

**Main Elements:**

- `<Tabs>` from Shadcn/ui
- `<TabsList>` containing tab triggers
- `<TabsTrigger value="original">Oryginalny</TabsTrigger>`
- `<TabsTrigger value="modified">Zmodyfikowany</TabsTrigger>`

**Handled Interactions:**

- Tab click to switch between original and modified views
- Keyboard navigation (arrow keys)

**Handled Validation:**

- Only renders if modification exists
- Tab state persisted in component state (not URL)

**Types:**

- `"original" | "modified"` (tab value)

**Props:**

```typescript
interface TabNavigationProps {
  activeTab: "original" | "modified";
  onTabChange: (tab: "original" | "modified") => void;
}
```

### InfoBanner (React)

**Component Description:**
Information banner that appears at the top of the Modified tab to inform users they are viewing a modified version and can switch to the original tab.

**Main Elements:**

- `<div>` with info styling (background color, padding, icon)
- Information icon
- Text: "To jest zmodyfikowana wersja. Oryginalny przepis możesz zobaczyć w zakładce 'Oryginalny'."

**Handled Interactions:**

- None (informational only)

**Handled Validation:**

- Only renders on Modified tab

**Types:**

- None (static component)

**Props:**

```typescript
interface InfoBannerProps {
  // No props - static informational component
}
```

### RecipeHeader (React)

**Component Description:**
Displays the recipe title, description, tags, preparation time, servings, and author information (for public recipes). Tags are clickable and navigate to recipe list filtered by that tag.

**Main Elements:**

- `<h1>` - Recipe title
- `<p>` - Description paragraph
- `<div>` - Tag badges container
  - Multiple `<Badge>` components (clickable)
- `<div>` - Metadata row
  - `<Clock>` icon + prep time in minutes
  - Author name (if public recipe)

**Handled Interactions:**

- Tag click: Navigate to `/recipes?tags={tagSlug}`

**Handled Validation:**

- Show "nie podano" if prep time is null
- Show author only for public recipes
- Handle empty description gracefully

**Types:**

- `RecipeDetailDTO` (for recipe data)
- `TagDTO[]` (for tags)

**Props:**

```typescript
interface RecipeHeaderProps {
  title: string;
  description: string | null;
  prepTimeMinutes: number | null;
  tags: TagDTO[];
  isPublic: boolean;
  // Optional: author info for public recipes
}
```

### ServingsAdjuster (React)

**Component Description:**
Interactive component that allows users to adjust the number of servings using increment/decrement buttons. Displays current servings in the format "X porcje/porcji" (Polish plural forms). Triggers real-time recalculation of ingredient amounts.

**Main Elements:**

- `<div>` - Horizontal flex container
- `<Button>` - Decrement button [-] (disabled at minimum)
- `<span>` - Current servings display with proper Polish pluralization
- `<Button>` - Increment button [+] (disabled at maximum)

**Handled Interactions:**

- Click [-]: Decrease servings by 1 (minimum 1)
- Click [+]: Increase servings by 1 (maximum 100)
- Keyboard support: Arrow keys or +/- keys

**Handled Validation:**

- Minimum servings: 1 (disable decrement button)
- Maximum servings: 100 (disable increment button)
- Immediate validation on each adjustment

**Types:**

- `number` (current servings value)

**Props:**

```typescript
interface ServingsAdjusterProps {
  currentServings: number;
  minServings: number; // Default: 1
  maxServings: number; // Default: 100
  onServingsChange: (newServings: number) => void;
}
```

### IngredientsList (React)

**Component Description:**
Displays the list of ingredients with amounts that update dynamically based on servings adjustment. Each ingredient shows amount, unit, and name. Supports responsive multi-column layout on larger screens.

**Main Elements:**

- `<div>` - Container with responsive grid (1 column mobile, 2 columns desktop)
- Multiple `<div>` - Ingredient items
  - `<span>` - Amount (formatted to 1-2 decimal places)
  - `<span>` - Unit
  - `<span>` - Ingredient name

**Handled Interactions:**

- None (display only, updates from parent state)

**Handled Validation:**

- Format amounts appropriately (avoid excessive decimals)
- Handle zero or very small amounts gracefully

**Types:**

- `AdjustedIngredientDTO[]`

**Props:**

```typescript
interface IngredientsListProps {
  ingredients: AdjustedIngredientDTO[];
}

interface AdjustedIngredientDTO {
  name: string;
  amount: number;
  unit: string;
}
```

### PreparationSteps (React)

**Component Description:**
Displays numbered preparation steps in a simple ordered list format. No interactive features for MVP (checkboxes and cooking mode excluded).

**Main Elements:**

- `<ol>` - Ordered list with CSS auto-numbering or explicit numbers
- Multiple `<li>` - Step items
  - `<p>` - Step instruction text

**Handled Interactions:**

- None (display only)

**Handled Validation:**

- Ensure step numbers are sequential
- Handle empty steps array

**Types:**

- `RecipeStepDTO[]`

**Props:**

```typescript
interface PreparationStepsProps {
  steps: RecipeStepDTO[];
}
```

### NutritionCard (React)

**Component Description:**
Card component that displays comprehensive nutrition information including total calories, a pie chart for macronutrients, and a detailed breakdown list. Uses Shadcn/ui Card component.

**Main Elements:**

- `<Card>` - Shadcn/ui card wrapper
- `<CardHeader>` - "Wartości odżywcze" title
- `<CardContent>`
  - `<div>` - Total calories (prominent display)
  - `<NutritionPieChart>` - Pie chart component
  - `<ul>` - Macronutrient breakdown list
    - Białko: Xg (Y%)
    - Tłuszcze: Xg (Y%)
    - Węglowodany: Xg (Y%)
    - Błonnik: Xg
    - Sól: Xg

**Handled Interactions:**

- None (display only)

**Handled Validation:**

- Calculate percentages for macros
- Format numbers appropriately
- Handle missing or zero values

**Types:**

- `NutritionDTO`

**Props:**

```typescript
interface NutritionCardProps {
  nutrition: NutritionDTO;
  servings: number; // For "per serving" display
}
```

### NutritionPieChart (React)

**Component Description:**
Pie chart visualization component that displays macronutrient distribution (protein, fat, carbs) using Recharts library. Provides visual representation with legend showing actual gram values and percentages.

**Main Elements:**

- `<ResponsiveContainer>` - From Recharts
- `<PieChart>` - Chart component
- `<Pie>` - Pie data with segments for each macro
- `<Legend>` - Chart legend with values
- `<Tooltip>` - Interactive hover tooltip

**Handled Interactions:**

- Hover to see detailed tooltip
- Legend click to highlight/filter segments (optional)

**Handled Validation:**

- Calculate percentages correctly
- Handle zero values (don't show segment)
- Ensure colors are distinguishable and accessible

**Types:**

- `NutritionDTO` (macros only: protein, fat, carbs)

**Props:**

```typescript
interface NutritionPieChartProps {
  protein: number;
  fat: number;
  carbs: number;
}
```

**Additional Notes:**

- Requires Recharts library installation: `npm install recharts`
- Use green for protein, yellow for carbs, orange for fats
- Responsive sizing based on container

### ActionButtons (React)

**Component Description:**
Collection of action buttons for recipe management. Button visibility and enabled state vary based on current tab (Original vs Modified) and recipe ownership. Primary action is "Modyfikuj z AI" with sparkles icon. All buttons include loading states.

**Main Elements:**

- `<div>` - Button container (vertical stack)
- `<Button variant="default">` - "Modyfikuj z AI" with sparkles icon (primary)
- `<Button variant="secondary">` - "Edytuj" (only Original tab, owner only)
- `<Button variant="destructive">` - "Usuń przepis" (owner only)
- `<Button variant="outline">` - "Dodaj do ulubionych" / "Usuń z ulubionych" (heart toggle)
- `<Button variant="outline">` - "Dodaj do kolekcji"
- `<Button variant="destructive">` - "Usuń modyfikację" (only Modified tab, if modification exists)

**Handled Interactions:**

- "Modyfikuj z AI": Opens ModifyWithAIModal
- "Edytuj": Navigates to `/recipes/{id}/edit`
- "Usuń przepis": Opens DeleteConfirmDialog
- "Dodaj do ulubionych": Toggles favorite status (optimistic UI)
- "Dodaj do kolekcji": Opens AddToCollectionDialog
- "Usuń modyfikację": Opens DeleteModificationDialog

**Handled Validation:**

- Show/hide "Edytuj" based on tab (Original only)
- Show/hide "Usuń modyfikację" based on tab (Modified only)
- Check recipe ownership for Edit/Delete actions
- Disable all buttons during loading states
- Check if modification exists before showing replacement warning

**Types:**

- `RecipeDetailDTO` (for ownership check)
- `ActionLoadingStates` (for button loading states)
- `boolean` (isFavorited, hasModification)

**Props:**

```typescript
interface ActionButtonsProps {
  recipeId: string;
  recipeUserId: string;
  currentUserId: string;
  activeTab: "original" | "modified";
  isFavorited: boolean;
  hasModification: boolean;
  actionStates: ActionLoadingStates;
  onModifyWithAI: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
  onAddToCollection: () => void;
  onDeleteModification: () => void;
}

interface ActionLoadingStates {
  favorite: boolean;
  delete: boolean;
  modify: boolean;
  addToCollection: boolean;
  deleteModification: boolean;
}
```

### ModifyWithAIModal (React)

**Component Description:**
Modal dialog for creating AI-powered recipe modifications. Displays modification type options and relevant input fields based on selected type. Shows replacement warning if recipe already has a modification.

**Main Elements:**

- `<Dialog>` - Shadcn/ui dialog component
- `<DialogHeader>` - Title: "Modyfikuj przepis z AI"
- `<DialogContent>`
  - Conditional warning banner (if has modification)
  - `<Select>` - Modification type selector
    - reduce_calories
    - increase_calories
    - increase_protein
    - increase_fiber
    - ingredient_substitution
  - Dynamic input fields based on type:
    - `<Input type="number">` for target values
    - `<Slider>` for percentages
    - `<Input type="text">` for ingredient substitution
- `<DialogFooter>`
  - `<Button variant="outline">` - Cancel
  - `<Button variant="default">` - Confirm (with loading state)

**Handled Interactions:**

- Modification type selection
- Input value changes
- Form submission
- Cancel action

**Handled Validation:**

- Required fields validation
- Number range validation (e.g., calories 1-10000)
- Percentage validation (1-100%)
- Show replacement warning if modification exists

**Types:**

- `CreateModificationCommand`
- `ModificationParameters`

**Props:**

```typescript
interface ModifyWithAIModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (command: CreateModificationCommand) => Promise<void>;
  hasExistingModification: boolean;
  isLoading: boolean;
}
```

### DeleteConfirmDialog (React)

**Component Description:**
Confirmation dialog for recipe deletion. Shows warning message and requires explicit confirmation before deleting.

**Main Elements:**

- `<AlertDialog>` - Shadcn/ui alert dialog
- `<AlertDialogHeader>`
  - Title: "Usuń przepis"
  - Description: Warning about permanent deletion
- `<AlertDialogFooter>`
  - `<Button variant="outline">` - Cancel
  - `<Button variant="destructive">` - Confirm deletion (with loading state)

**Handled Interactions:**

- Cancel action
- Confirm deletion action

**Handled Validation:**

- Disable confirm button during deletion
- Show loading state

**Types:**

- None (simple confirmation)

**Props:**

```typescript
interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isLoading: boolean;
}
```

### DeleteModificationDialog (React)

**Component Description:**
Confirmation dialog for deleting recipe modification. Similar to DeleteConfirmDialog but specific to modifications.

**Main Elements:**

- `<AlertDialog>` - Shadcn/ui alert dialog
- `<AlertDialogHeader>`
  - Title: "Usuń modyfikację"
  - Description: Warning about losing modified version
- `<AlertDialogFooter>`
  - `<Button variant="outline">` - Cancel
  - `<Button variant="destructive">` - Confirm deletion (with loading state)

**Handled Interactions:**

- Cancel action
- Confirm deletion action

**Handled Validation:**

- Disable confirm button during deletion
- Show loading state
- Switch to original tab after successful deletion

**Types:**

- None (simple confirmation)

**Props:**

```typescript
interface DeleteModificationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isLoading: boolean;
}
```

### AddToCollectionDialog (React)

**Component Description:**
Dialog for adding recipe to a collection. Displays list of user's collections with ability to select one or create a new collection.

**Main Elements:**

- `<Dialog>` - Shadcn/ui dialog
- `<DialogHeader>` - Title: "Dodaj do kolekcji"
- `<DialogContent>`
  - `<ScrollArea>` - List of collections
    - Multiple `<div>` - Collection items (clickable)
  - `<Button>` - "+ Nowa kolekcja" (creates new collection)
- `<DialogFooter>`
  - `<Button variant="outline">` - Cancel
  - `<Button variant="default">` - Add to selected collection

**Handled Interactions:**

- Collection selection
- New collection creation
- Add to collection action

**Handled Validation:**

- At least one collection selected
- Show loading state during addition

**Types:**

- `CollectionDTO[]`

**Props:**

```typescript
interface AddToCollectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (collectionId: string) => Promise<void>;
  collections: CollectionDTO[];
  isLoading: boolean;
}
```

### LoadingState (React)

**Component Description:**
Skeleton loader component displayed while recipe data is being fetched. Mimics the layout of the actual content.

**Main Elements:**

- `<div>` - Container matching main layout
- Multiple `<Skeleton>` components from Shadcn/ui
  - Header skeleton (title, description, tags)
  - Ingredients skeleton
  - Steps skeleton
  - Nutrition card skeleton

**Handled Interactions:**

- None (display only)

**Handled Validation:**

- None

**Types:**

- None

**Props:**

```typescript
interface LoadingStateProps {
  // No props - static skeleton
}
```

### ErrorState (React)

**Component Description:**
Error display component shown when recipe fails to load or user doesn't have access. Displays appropriate error message and action button.

**Main Elements:**

- `<div>` - Centered container
- Error icon
- `<h2>` - Error title
- `<p>` - Error message
- `<Button>` - Action button (back to recipes list)

**Handled Interactions:**

- Back button click: Navigate to `/recipes`

**Handled Validation:**

- Display appropriate message based on error type (404, 403, 500)

**Types:**

- Error type enum

**Props:**

```typescript
interface ErrorStateProps {
  errorType: "not_found" | "forbidden" | "server_error";
  message?: string;
  onBack: () => void;
}
```

## 5. Types

### Existing DTOs (from src/types.ts)

These types are already defined in the codebase and will be used as-is:

**RecipeDetailDTO:**

```typescript
interface RecipeDetailDTO {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  ingredients: RecipeIngredientDTO[];
  steps: RecipeStepDTO[];
  servings: number;
  nutritionPerServing: NutritionDTO;
  prepTimeMinutes: number | null;
  isPublic: boolean;
  featured: boolean;
  tags: TagDTO[];
  createdAt: string;
  updatedAt: string;
}
```

**RecipeIngredientDTO:**

```typescript
interface RecipeIngredientDTO {
  name: string;
  amount: number;
  unit: string;
}
```

**RecipeStepDTO:**

```typescript
interface RecipeStepDTO {
  stepNumber: number;
  instruction: string;
}
```

**NutritionDTO:**

```typescript
interface NutritionDTO {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  salt: number;
}
```

**TagDTO:**

```typescript
interface TagDTO {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}
```

**ModificationDTO:**

```typescript
interface ModificationDTO {
  id: string;
  originalRecipeId: string;
  userId: string;
  modificationType: string;
  modifiedData: ModificationDataDTO;
  createdAt: string;
}

interface ModificationDataDTO {
  ingredients?: RecipeIngredientDTO[];
  steps?: RecipeStepDTO[];
  nutritionPerServing?: NutritionDTO;
  servings?: number;
  modificationNotes?: string;
}
```

**CreateModificationCommand:**

```typescript
interface CreateModificationCommand {
  modificationType:
    | "reduce_calories"
    | "increase_calories"
    | "increase_protein"
    | "increase_fiber"
    | "portion_size"
    | "ingredient_substitution";
  parameters: ModificationParameters;
}

interface ModificationParameters {
  targetCalories?: number;
  reductionPercentage?: number;
  increasePercentage?: number;
  targetProtein?: number;
  targetFiber?: number;
  newServings?: number;
  originalIngredient?: string;
  preferredSubstitute?: string;
}
```

### New View Models (to be created)

These types are specific to the Recipe Detail Page view and should be created in a new file or within the component file:

**RecipeViewState:**

```typescript
interface RecipeViewState {
  // Current active tab (if modification exists)
  activeTab: "original" | "modified";

  // Current servings (adjusted by user)
  currentServings: number;

  // Original servings from recipe data (for ratio calculation)
  originalServings: number;

  // Loading state for initial data fetch
  isLoading: boolean;

  // Error state
  error: RecipeError | null;
}

type RecipeError = {
  type: "not_found" | "forbidden" | "server_error" | "modification_load_failed";
  message: string;
};
```

**ActionLoadingStates:**

```typescript
interface ActionLoadingStates {
  favorite: boolean;
  delete: boolean;
  modify: boolean;
  addToCollection: boolean;
  deleteModification: boolean;
}
```

**AdjustedIngredientDTO:**

```typescript
interface AdjustedIngredientDTO {
  name: string;
  amount: number;
  unit: string;
}
```

**RecipeDetailViewModel:**

```typescript
interface RecipeDetailViewModel {
  // Original recipe data
  recipe: RecipeDetailDTO | null;

  // Modification data (null if no modification exists)
  modification: ModificationDTO | null;

  // Favorite status
  isFavorited: boolean;

  // Computed flag for modification existence
  hasModification: boolean;

  // Current data being displayed (changes based on tab and servings)
  currentData: {
    ingredients: AdjustedIngredientDTO[];
    steps: RecipeStepDTO[];
    nutrition: NutritionDTO;
    servings: number;
  };
}
```

**PieChartDataItem:**

```typescript
interface PieChartDataItem {
  name: string; // "Białko", "Tłuszcze", "Węglowodany"
  value: number; // grams
  percentage: number; // percentage of total macros
  color: string; // hex color for pie segment
}
```

**TabType:**

```typescript
type TabType = "original" | "modified";
```

### Type Usage Summary

**Component Props Types:**

- All component props interfaces defined in Component Details section
- Use existing DTOs for data props
- Use new view models for state management props

**API Response Types:**

- `RecipeDetailDTO` - GET /api/recipes/{recipeId} response
- `{ modifications: ModificationDTO[], pagination: PaginationDTO }` - GET /api/recipes/{recipeId}/modifications response
- `{ success: true, modification: ModificationDTO }` - POST /api/recipes/{recipeId}/modifications response

**Request Types:**

- `CreateModificationCommand` - POST /api/recipes/{recipeId}/modifications request body
- `{ recipeId: string }` - POST /api/favorites request body

## 6. State Management

### Custom Hook: useRecipeDetail

The Recipe Detail Page uses a custom React hook `useRecipeDetail` to manage all state, data fetching, and user interactions. This hook encapsulates the complexity of managing recipe data, modifications, tab switching, servings adjustment, and action states.

**Hook Location:** `src/components/hooks/useRecipeDetail.ts`

**Hook Signature:**

```typescript
function useRecipeDetail(recipeId: string, initialIsFavorited: boolean): UseRecipeDetailReturn {
  // Implementation
}
```

**State Variables:**

1. **recipe** (`RecipeDetailDTO | null`)
   - Stores the original recipe data fetched from API
   - Null during initial load
   - Populated by GET /api/recipes/{recipeId}

2. **modification** (`ModificationDTO | null`)
   - Stores modification data if it exists
   - Null if recipe has no modifications
   - Populated by GET /api/recipes/{recipeId}/modifications

3. **viewState** (`RecipeViewState`)
   - Manages view-specific state
   - Fields:
     - `activeTab`: Current tab ("original" | "modified")
     - `currentServings`: User-adjusted servings count
     - `originalServings`: Base servings from recipe
     - `isLoading`: Loading state for initial fetch
     - `error`: Error object or null

4. **isFavorited** (`boolean`)
   - Tracks favorite status
   - Initialized from server-side prop
   - Updated optimistically on toggle

5. **actionStates** (`ActionLoadingStates`)
   - Tracks loading state for each action
   - Prevents duplicate requests
   - Shows loading spinners on buttons

6. **dialogStates** (`object`)
   - Manages open/closed state for each dialog
   - Fields: `modifyAI`, `deleteRecipe`, `deleteModification`, `addToCollection`

**Computed Values:**

1. **hasModification** (`boolean`)
   - `modification !== null`
   - Used to conditionally render tabs

2. **currentData** (`object`)
   - Dynamically computed based on `activeTab` and `currentServings`
   - Returns adjusted ingredients, steps, nutrition, servings
   - Calculation logic:

     ```typescript
     const currentData = useMemo(() => {
       if (!recipe) return null;

       // Determine base data (original or modified)
       const baseData =
         viewState.activeTab === "modified" && modification
           ? {
               ingredients: modification.modifiedData.ingredients || recipe.ingredients,
               steps: modification.modifiedData.steps || recipe.steps,
               nutrition: modification.modifiedData.nutritionPerServing || recipe.nutritionPerServing,
               servings: modification.modifiedData.servings || recipe.servings,
             }
           : {
               ingredients: recipe.ingredients,
               steps: recipe.steps,
               nutrition: recipe.nutritionPerServing,
               servings: recipe.servings,
             };

       // Calculate serving ratio
       const ratio = viewState.currentServings / viewState.originalServings;

       // Adjust ingredients
       const adjustedIngredients = baseData.ingredients.map((ing) => ({
         name: ing.name,
         amount: ing.amount * ratio,
         unit: ing.unit,
       }));

       return {
         ingredients: adjustedIngredients,
         steps: baseData.steps,
         nutrition: baseData.nutrition, // Nutrition is per serving, no adjustment needed
         servings: viewState.currentServings,
       };
     }, [recipe, modification, viewState.activeTab, viewState.currentServings, viewState.originalServings]);
     ```

**Functions:**

1. **fetchRecipe** (internal)
   - Fetches recipe data from GET /api/recipes/{recipeId}
   - Updates `recipe` state
   - Sets `originalServings` and `currentServings`
   - Handles errors (404, 403, 500)

2. **fetchModifications** (internal)
   - Fetches modifications from GET /api/recipes/{recipeId}/modifications
   - Takes first modification if exists (MVP: only one modification per recipe)
   - Updates `modification` state
   - Handles errors (logs but doesn't block)

3. **adjustServings**
   - Signature: `(delta: number) => void`
   - Adjusts current servings by delta (-1 or +1)
   - Constraints: min 1, max 100
   - Triggers re-calculation of `currentData`

4. **switchTab**
   - Signature: `(tab: TabType) => void`
   - Updates `activeTab` in `viewState`
   - Triggers re-calculation of `currentData`

5. **toggleFavorite**
   - Signature: `() => Promise<void>`
   - Optimistically updates `isFavorited`
   - Calls POST or DELETE /api/favorites
   - Reverts on error with toast notification
   - Sets `actionStates.favorite` during request

6. **deleteRecipe**
   - Signature: `() => Promise<void>`
   - Calls DELETE /api/recipes/{recipeId}
   - Redirects to /recipes on success
   - Shows error toast on failure
   - Sets `actionStates.delete` during request

7. **modifyWithAI**
   - Signature: `(command: CreateModificationCommand) => Promise<void>`
   - Calls POST /api/recipes/{recipeId}/modifications
   - Updates `modification` state with result
   - Switches to "modified" tab on success
   - Shows success toast
   - Sets `actionStates.modify` during request

8. **deleteModification**
   - Signature: `() => Promise<void>`
   - Calls DELETE /api/recipes/{recipeId}/modifications/{modificationId}
   - Sets `modification` to null
   - Switches to "original" tab
   - Shows success toast
   - Sets `actionStates.deleteModification` during request

9. **openDialog / closeDialog**
   - Signature: `(dialogName: string) => void`
   - Updates `dialogStates` for modal visibility

**Effects:**

1. **Initial Data Load** (on mount)

   ```typescript
   useEffect(() => {
     fetchRecipe();
     fetchModifications();
   }, [recipeId]);
   ```

2. **Servings Initialization**
   - When recipe loads, set `originalServings` and `currentServings`

**Return Value:**

```typescript
interface UseRecipeDetailReturn {
  // Data
  recipe: RecipeDetailDTO | null;
  modification: ModificationDTO | null;
  currentData: {
    ingredients: AdjustedIngredientDTO[];
    steps: RecipeStepDTO[];
    nutrition: NutritionDTO;
    servings: number;
  } | null;

  // State
  viewState: RecipeViewState;
  isFavorited: boolean;
  hasModification: boolean;
  actionStates: ActionLoadingStates;
  dialogStates: {
    modifyAI: boolean;
    deleteRecipe: boolean;
    deleteModification: boolean;
    addToCollection: boolean;
  };

  // Functions
  adjustServings: (delta: number) => void;
  switchTab: (tab: TabType) => void;
  toggleFavorite: () => Promise<void>;
  deleteRecipe: () => Promise<void>;
  modifyWithAI: (command: CreateModificationCommand) => Promise<void>;
  deleteModification: () => Promise<void>;
  openDialog: (dialogName: string) => void;
  closeDialog: (dialogName: string) => void;
}
```

### State Flow Diagram

```
Mount
  ↓
fetchRecipe() + fetchModifications()
  ↓
Set recipe, modification, originalServings, currentServings
  ↓
Render UI
  ↓
User Interactions:
  - Adjust Servings → adjustServings() → Recalculate currentData
  - Switch Tab → switchTab() → Update activeTab → Recalculate currentData
  - Toggle Favorite → toggleFavorite() → Optimistic update → API call → Revert on error
  - Delete Recipe → deleteRecipe() → API call → Redirect
  - Modify with AI → modifyWithAI() → API call → Update modification → Switch to modified tab
  - Delete Modification → deleteModification() → API call → Clear modification → Switch to original tab
```

### Local Storage (Optional Enhancement)

For future consideration (not MVP):

- Persist `currentServings` adjustment in localStorage
- Persist `activeTab` preference in localStorage
- Key format: `recipe_detail_{recipeId}_servings` and `recipe_detail_{recipeId}_tab`

## 7. API Integration

### API Endpoints Used

#### 1. GET /api/recipes/{recipeId}

**Purpose:** Fetch complete recipe details

**When Called:** On component mount, when recipeId changes

**Request:**

- Method: GET
- URL: `/api/recipes/{recipeId}`
- Headers: Standard (cookies for authentication)
- Body: None

**Response:**

- Status 200: Success
  ```typescript
  RecipeDetailDTO;
  ```
- Status 401: Unauthorized (not authenticated)
  ```typescript
  { error: "Unauthorized", message: "Authentication required" }
  ```
- Status 403: Forbidden (private recipe, not owner)
  ```typescript
  { error: "Forbidden", message: "You don't have permission to view this recipe" }
  ```
- Status 404: Not Found
  ```typescript
  { error: "Not Found", message: "Recipe not found" }
  ```
- Status 500: Server Error
  ```typescript
  { error: "Internal Server Error", message: "An unexpected error occurred" }
  ```

**Error Handling:**

- 401: Redirect to /login (handled by middleware)
- 403: Show ErrorState with "Nie masz dostępu do tego przepisu"
- 404: Show ErrorState with "Nie znaleziono przepisu"
- 500: Show ErrorState with "Wystąpił błąd serwera"

**Implementation:**

```typescript
const fetchRecipe = async () => {
  try {
    setViewState((prev) => ({ ...prev, isLoading: true }));

    const response = await fetch(`/api/recipes/${recipeId}`);

    if (response.status === 403) {
      setViewState((prev) => ({
        ...prev,
        isLoading: false,
        error: { type: "forbidden", message: "Nie masz dostępu do tego przepisu" },
      }));
      return;
    }

    if (response.status === 404) {
      setViewState((prev) => ({
        ...prev,
        isLoading: false,
        error: { type: "not_found", message: "Nie znaleziono przepisu" },
      }));
      return;
    }

    if (!response.ok) {
      throw new Error("Failed to fetch recipe");
    }

    const data: RecipeDetailDTO = await response.json();
    setRecipe(data);
    setViewState((prev) => ({
      ...prev,
      originalServings: data.servings,
      currentServings: data.servings,
      isLoading: false,
      error: null,
    }));
  } catch (error) {
    console.error("Error fetching recipe:", error);
    setViewState((prev) => ({
      ...prev,
      isLoading: false,
      error: { type: "server_error", message: "Wystąpił błąd podczas ładowania przepisu" },
    }));
  }
};
```

#### 2. GET /api/recipes/{recipeId}/modifications

**Purpose:** Fetch modifications for the recipe to check if modification exists

**When Called:** On component mount, after creating or deleting a modification

**Request:**

- Method: GET
- URL: `/api/recipes/{recipeId}/modifications?page=1&limit=1`
- Headers: Standard (cookies for authentication)
- Body: None

**Response:**

- Status 200: Success
  ```typescript
  {
    modifications: ModificationDTO[];
    pagination: PaginationDTO;
  }
  ```
- Status 401: Unauthorized
- Status 403: Forbidden
- Status 404: Recipe not found
- Status 500: Server Error

**Error Handling:**

- Log errors but don't block main view
- Show toast notification: "Nie udało się załadować modyfikacji"
- Hide tabs if modification load fails

**Implementation:**

```typescript
const fetchModifications = async () => {
  try {
    const response = await fetch(`/api/recipes/${recipeId}/modifications?page=1&limit=1`);

    if (!response.ok) {
      console.error("Failed to fetch modifications:", response.status);
      // Don't block the UI, just log the error
      return;
    }

    const data = await response.json();

    // Set first modification if exists (MVP: only one modification per recipe)
    if (data.modifications && data.modifications.length > 0) {
      setModification(data.modifications[0]);
    } else {
      setModification(null);
    }
  } catch (error) {
    console.error("Error fetching modifications:", error);
    // Show toast but don't block UI
    showToast({
      title: "Błąd",
      description: "Nie udało się załadować modyfikacji",
      variant: "destructive",
    });
  }
};
```

#### 3. POST /api/favorites

**Purpose:** Add recipe to favorites

**When Called:** User clicks favorite button (when not favorited)

**Request:**

- Method: POST
- URL: `/api/favorites`
- Headers: `Content-Type: application/json`
- Body:
  ```typescript
  {
    recipeId: string;
  }
  ```

**Response:**

- Status 201: Created
  ```typescript
  { success: true, favorite: FavoriteDTO }
  ```
- Status 400: Bad Request (validation error)
- Status 401: Unauthorized
- Status 409: Conflict (already favorited)
- Status 500: Server Error

**Error Handling:**

- Optimistic UI: Update immediately
- On error: Revert state, show toast
- On 409: Treat as success (already favorited)

#### 4. DELETE /api/favorites/{recipeId}

**Purpose:** Remove recipe from favorites

**When Called:** User clicks favorite button (when favorited)

**Request:**

- Method: DELETE
- URL: `/api/favorites/${recipeId}`
- Headers: Standard
- Body: None

**Response:**

- Status 204: No Content (success)
- Status 401: Unauthorized
- Status 404: Not Found (not favorited)
- Status 500: Server Error

**Error Handling:**

- Optimistic UI: Update immediately
- On error: Revert state, show toast
- On 404: Treat as success (already not favorited)

**Implementation (Toggle):**

```typescript
const toggleFavorite = async () => {
  // Optimistic update
  const previousState = isFavorited;
  setIsFavorited(!isFavorited);
  setActionStates((prev) => ({ ...prev, favorite: true }));

  try {
    const method = previousState ? "DELETE" : "POST";
    const url = previousState ? `/api/favorites/${recipeId}` : "/api/favorites";
    const body = previousState ? undefined : JSON.stringify({ recipeId });

    const response = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : {},
      body,
    });

    // Handle 409 (already favorited) or 404 (already not favorited) as success
    if (!response.ok && response.status !== 409 && response.status !== 404) {
      throw new Error("Failed to toggle favorite");
    }

    showToast({
      title: "Sukces",
      description: isFavorited ? "Dodano do ulubionych" : "Usunięto z ulubionych",
    });
  } catch (error) {
    console.error("Error toggling favorite:", error);
    // Revert optimistic update
    setIsFavorited(previousState);
    showToast({
      title: "Błąd",
      description: "Nie udało się zaktualizować ulubionych",
      variant: "destructive",
    });
  } finally {
    setActionStates((prev) => ({ ...prev, favorite: false }));
  }
};
```

#### 5. POST /api/recipes/{recipeId}/modifications

**Purpose:** Create AI-powered recipe modification

**When Called:** User submits ModifyWithAIModal form

**Request:**

- Method: POST
- URL: `/api/recipes/${recipeId}/modifications`
- Headers: `Content-Type: application/json`
- Body:
  ```typescript
  CreateModificationCommand;
  ```

**Response:**

- Status 201: Created
  ```typescript
  { success: true, modification: ModificationDTO }
  ```
- Status 400: Bad Request (validation error)
- Status 401: Unauthorized
- Status 403: Forbidden
- Status 404: Recipe not found
- Status 429: Too Many Requests (rate limit)
- Status 500: Server Error

**Error Handling:**

- Show loading state in modal
- On success: Close modal, update modification, switch to modified tab, show success toast
- On error: Show error message in modal
- On 429: Show specific rate limit message

**Implementation:**

```typescript
const modifyWithAI = async (command: CreateModificationCommand) => {
  setActionStates((prev) => ({ ...prev, modify: true }));

  try {
    const response = await fetch(`/api/recipes/${recipeId}/modifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(command),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to create modification");
    }

    const data = await response.json();
    setModification(data.modification);
    switchTab("modified");
    closeDialog("modifyAI");

    showToast({
      title: "Sukces",
      description: "Przepis został zmodyfikowany",
    });
  } catch (error) {
    console.error("Error creating modification:", error);
    showToast({
      title: "Błąd",
      description: error instanceof Error ? error.message : "Nie udało się zmodyfikować przepisu",
      variant: "destructive",
    });
  } finally {
    setActionStates((prev) => ({ ...prev, modify: false }));
  }
};
```

#### 6. DELETE /api/recipes/{recipeId}

**Purpose:** Delete the recipe

**When Called:** User confirms deletion in DeleteConfirmDialog

**Request:**

- Method: DELETE
- URL: `/api/recipes/${recipeId}`
- Headers: Standard
- Body: None

**Response:**

- Status 204: No Content (success)
- Status 401: Unauthorized
- Status 403: Forbidden (not owner)
- Status 404: Not Found
- Status 500: Server Error

**Error Handling:**

- Show loading state in button
- On success: Redirect to /recipes
- On error: Show error toast
- On 403: Show "You don't have permission" message

**Implementation:**

```typescript
const deleteRecipe = async () => {
  setActionStates((prev) => ({ ...prev, delete: true }));

  try {
    const response = await fetch(`/api/recipes/${recipeId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error("Nie masz uprawnień do usunięcia tego przepisu");
      }
      throw new Error("Failed to delete recipe");
    }

    // Redirect to recipes list
    window.location.href = "/recipes";
  } catch (error) {
    console.error("Error deleting recipe:", error);
    setActionStates((prev) => ({ ...prev, delete: false }));
    closeDialog("deleteRecipe");
    showToast({
      title: "Błąd",
      description: error instanceof Error ? error.message : "Nie udało się usunąć przepisu",
      variant: "destructive",
    });
  }
};
```

#### 7. DELETE /api/recipes/{recipeId}/modifications/{modificationId}

**Purpose:** Delete recipe modification

**When Called:** User confirms deletion in DeleteModificationDialog

**Request:**

- Method: DELETE
- URL: `/api/recipes/${recipeId}/modifications/${modificationId}`
- Headers: Standard
- Body: None

**Response:**

- Status 204: No Content (success)
- Status 401: Unauthorized
- Status 403: Forbidden (not owner)
- Status 404: Not Found
- Status 500: Server Error

**Error Handling:**

- Show loading state in button
- On success: Clear modification, switch to original tab, show success toast
- On error: Show error toast

**Implementation:**

```typescript
const deleteModification = async () => {
  if (!modification) return;

  setActionStates((prev) => ({ ...prev, deleteModification: true }));

  try {
    const response = await fetch(`/api/recipes/${recipeId}/modifications/${modification.id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete modification");
    }

    setModification(null);
    switchTab("original");
    closeDialog("deleteModification");

    showToast({
      title: "Sukces",
      description: "Modyfikacja została usunięta",
    });
  } catch (error) {
    console.error("Error deleting modification:", error);
    showToast({
      title: "Błąd",
      description: "Nie udało się usunąć modyfikacji",
      variant: "destructive",
    });
  } finally {
    setActionStates((prev) => ({ ...prev, deleteModification: false }));
  }
};
```

### API Call Summary

| Action              | Method | Endpoint                                | When                            | Optimistic UI |
| ------------------- | ------ | --------------------------------------- | ------------------------------- | ------------- |
| Fetch Recipe        | GET    | /api/recipes/{id}                       | Mount                           | No            |
| Fetch Modifications | GET    | /api/recipes/{id}/modifications         | Mount, after create/delete mod  | No            |
| Add Favorite        | POST   | /api/favorites                          | Toggle favorite (not favorited) | Yes           |
| Remove Favorite     | DELETE | /api/favorites/{id}                     | Toggle favorite (favorited)     | Yes           |
| Create Modification | POST   | /api/recipes/{id}/modifications         | Submit AI modification          | No            |
| Delete Recipe       | DELETE | /api/recipes/{id}                       | Confirm delete                  | No            |
| Delete Modification | DELETE | /api/recipes/{id}/modifications/{modId} | Confirm delete mod              | No            |

## 8. User Interactions

### 1. Servings Adjustment

**Trigger:** User clicks [-] or [+] button in ServingsAdjuster

**Flow:**

1. User clicks [-] button
2. `adjustServings(-1)` function called
3. Check minimum constraint (servings >= 1)
4. If valid: Update `currentServings` in viewState
5. Trigger recalculation of `currentData` via useMemo
6. Ingredients list re-renders with adjusted amounts
7. Button disabled state updates if at boundary (min/max)

**Edge Cases:**

- At minimum (1 serving): Disable [-] button
- At maximum (100 servings): Disable [+] button
- Rapid clicks: Debounce not necessary, calculations are fast

**Visual Feedback:**

- Button hover/active states
- Smooth number transition (optional CSS animation)
- Immediate ingredient amount updates

### 2. Tab Switching

**Trigger:** User clicks "Oryginalny" or "Zmodyfikowany" tab

**Flow:**

1. User clicks "Zmodyfikowany" tab
2. `switchTab("modified")` function called
3. Update `activeTab` in viewState
4. Trigger recalculation of `currentData` to use modification data
5. Components re-render with modified recipe data
6. Action buttons visibility updates (hide Edit, show Delete Modification)
7. InfoBanner appears at top

**Behavior:**

- Tab state not persisted in URL (simpler UX)
- Always defaults to "original" tab on page load
- Servings adjustment persists across tab switches

**Visual Feedback:**

- Active tab highlighted with underline and color
- Smooth transition (optional fade)
- InfoBanner slides in

### 3. Favorite Toggle

**Trigger:** User clicks heart button

**Flow:**

1. User clicks heart button (currently not favorited)
2. `toggleFavorite()` function called
3. Optimistic update: Set `isFavorited = true` immediately
4. Set `actionStates.favorite = true` (show loading spinner)
5. Call POST /api/favorites
6. On success:
   - Keep optimistic update
   - Show success toast
7. On error:
   - Revert to `isFavorited = false`
   - Show error toast
8. Set `actionStates.favorite = false`

**Edge Cases:**

- Double-click prevention: Disable button during loading
- Network error: Revert state, show toast
- 409 Conflict (already favorited): Treat as success

**Visual Feedback:**

- Immediate heart fill/unfill animation
- Loading spinner in button during request
- Toast notification on completion
- Color change: gray → red (favorited)

### 4. Edit Recipe

**Trigger:** User clicks "Edytuj" button (Original tab only)

**Flow:**

1. User clicks "Edytuj" button
2. Navigate to `/recipes/{recipeId}/edit`
3. (Edit page implementation is separate)

**Conditions:**

- Button only visible on Original tab
- Button only visible if user is recipe owner

**Visual Feedback:**

- Button hover state
- No loading state (instant navigation)

### 5. Delete Recipe

**Trigger:** User clicks "Usuń przepis" button

**Flow:**

1. User clicks "Usuń przepis" button
2. `openDialog("deleteRecipe")` called
3. DeleteConfirmDialog appears
4. User reads warning message
5. User clicks "Usuń" to confirm (or "Anuluj" to cancel)
6. If confirmed:
   - `deleteRecipe()` function called
   - Set `actionStates.delete = true` (loading state)
   - Call DELETE /api/recipes/{id}
   - On success: Redirect to /recipes
   - On error: Show error toast, close dialog
7. If cancelled:
   - `closeDialog("deleteRecipe")` called
   - Dialog closes, no action taken

**Edge Cases:**

- Only owner can delete (check on backend, hide button on frontend if not owner)
- Deletion is permanent, cannot be undone

**Visual Feedback:**

- Destructive button color (red)
- Modal with prominent warning
- Loading spinner in confirm button
- Toast on error

### 6. Modify with AI

**Trigger:** User clicks "Modyfikuj z AI" button

**Flow:**

1. User clicks "Modyfikuj z AI" button
2. Check if `hasModification === true`
3. If has modification: Show replacement warning in modal
4. `openDialog("modifyAI")` called
5. ModifyWithAIModal appears
6. User selects modification type from dropdown
7. Dynamic input fields appear based on type
8. User enters values (e.g., target calories, percentage)
9. User clicks "Zatwierdź" (or "Anuluj" to cancel)
10. If confirmed:
    - Validate inputs
    - `modifyWithAI(command)` function called
    - Set `actionStates.modify = true`
    - Call POST /api/recipes/{id}/modifications
    - On success:
      - Update `modification` state
      - Switch to "modified" tab
      - Close modal
      - Show success toast
    - On error:
      - Show error message in modal
11. If cancelled:
    - `closeDialog("modifyAI")` called
    - Modal closes, no action taken

**Modification Types:**

- reduce_calories: Target calories OR reduction percentage
- increase_calories: Target calories OR increase percentage
- increase_protein: Target protein OR increase percentage
- increase_fiber: Target fiber OR increase percentage
- portion_size: New servings count
- ingredient_substitution: Original ingredient, optional preferred substitute

**Edge Cases:**

- If recipe already has modification: Show warning "Ten przepis ma już modyfikację. Nowa modyfikacja zastąpi obecną. Kontynuować?"
- Validation errors: Show inline error messages
- Rate limit (429): Show "Zbyt wiele żądań, spróbuj później"
- AI generation failure: Show error toast

**Visual Feedback:**

- Primary button with sparkles icon
- Modal with form fields
- Warning banner if has modification
- Loading spinner in submit button
- Success toast + automatic tab switch
- Error messages inline or in toast

### 7. Delete Modification

**Trigger:** User clicks "Usuń modyfikację" button (Modified tab only)

**Flow:**

1. User clicks "Usuń modyfikację" button
2. `openDialog("deleteModification")` called
3. DeleteModificationDialog appears
4. User reads warning message
5. User clicks "Usuń" to confirm (or "Anuluj" to cancel)
6. If confirmed:
   - `deleteModification()` function called
   - Set `actionStates.deleteModification = true`
   - Call DELETE /api/recipes/{id}/modifications/{modId}
   - On success:
     - Set `modification = null`
     - Switch to "original" tab
     - Close dialog
     - Show success toast
   - On error:
     - Show error toast
     - Close dialog
7. If cancelled:
   - `closeDialog("deleteModification")` called
   - Dialog closes, no action taken

**Conditions:**

- Button only visible on Modified tab
- Button only visible if modification exists

**Visual Feedback:**

- Destructive button color
- Modal with warning
- Loading spinner in confirm button
- Automatic tab switch to original
- Success toast

### 8. Add to Collection

**Trigger:** User clicks "Dodaj do kolekcji" button

**Flow:**

1. User clicks "Dodaj do kolekcji" button
2. `openDialog("addToCollection")` called
3. Fetch user's collections (if not already loaded)
4. AddToCollectionDialog appears with list of collections
5. User selects a collection from list
6. User clicks "Dodaj" (or "Anuluj" to cancel)
7. If confirmed:
   - Call POST /api/collections/{collectionId}/recipes
   - On success:
     - Close dialog
     - Show success toast
   - On error:
     - Show error toast
8. If cancelled:
   - `closeDialog("addToCollection")` called
   - Dialog closes, no action taken

**Additional Actions:**

- User can click "+ Nowa kolekcja" to create new collection inline

**Edge Cases:**

- Empty collections list: Show message "Nie masz jeszcze żadnych kolekcji" + "Utwórz pierwszą kolekcję" button
- Recipe already in collection: Show "Już dodano" status or disable selection

**Visual Feedback:**

- Modal with scrollable collection list
- Selected collection highlighted
- Loading spinner in add button
- Success toast

### 9. Tag Click

**Trigger:** User clicks on a tag badge in RecipeHeader

**Flow:**

1. User clicks on tag badge (e.g., "Obiad")
2. Navigate to `/recipes?tags={tagSlug}`
3. Recipe list page filters by selected tag

**Visual Feedback:**

- Tag badge hover state (cursor pointer)
- Instant navigation

### 10. Back Navigation (Error State)

**Trigger:** User encounters error and clicks back button

**Flow:**

1. Error occurs (404, 403, 500)
2. ErrorState component renders
3. User clicks "Wróć do przepisów" button
4. Navigate to `/recipes`

**Visual Feedback:**

- Button hover state
- Instant navigation

## 9. Conditions and Validation

### Recipe Access Authorization

**Component Level: RecipeDetailLayout**

**Condition:** User can access recipe if:

- Recipe is public (`recipe.isPublic === true`), OR
- User is recipe owner (`recipe.userId === currentUserId`)

**Validation:**

- Checked on server-side (API returns 403 if unauthorized)
- Frontend displays appropriate error state

**Effect on UI:**

- 403 error: Show ErrorState with message "Nie masz dostępu do tego przepisu"
- 404 error: Show ErrorState with message "Nie znaleziono przepisu"

### Tab Display Condition

**Component Level: RecipeDetailLayout**

**Condition:** Show tabs if:

- `modification !== null` (modification exists)

**Validation:**

- Computed value: `hasModification = modification !== null`

**Effect on UI:**

- If `hasModification === true`: Show TabNavigation component
- If `hasModification === false`: Hide TabNavigation, only show original recipe

### Edit Button Visibility

**Component Level: ActionButtons**

**Condition:** Show "Edytuj" button if:

- `activeTab === "original"` (on Original tab only), AND
- `recipe.userId === currentUserId` (user is owner)

**Validation:**

```typescript
const showEditButton = activeTab === "original" && recipe.userId === currentUserId;
```

**Effect on UI:**

- Button rendered conditionally based on `showEditButton`
- Hidden completely on Modified tab

### Delete Modification Button Visibility

**Component Level: ActionButtons**

**Condition:** Show "Usuń modyfikację" button if:

- `activeTab === "modified"` (on Modified tab only), AND
- `hasModification === true` (modification exists), AND
- `modification.userId === currentUserId` (user is modification owner)

**Validation:**

```typescript
const showDeleteModButton = activeTab === "modified" && hasModification && modification?.userId === currentUserId;
```

**Effect on UI:**

- Button rendered conditionally based on `showDeleteModButton`
- Hidden completely on Original tab

### Servings Adjustment Constraints

**Component Level: ServingsAdjuster**

**Conditions:**

1. Minimum servings: 1
   - Disable [-] button when `currentServings <= minServings`
2. Maximum servings: 100
   - Disable [+] button when `currentServings >= maxServings`

**Validation:**

```typescript
const canDecrement = currentServings > minServings;
const canIncrement = currentServings < maxServings;
```

**Effect on UI:**

- [-] button disabled if `canDecrement === false`
- [+] button disabled if `canIncrement === false`
- Disabled buttons have reduced opacity and no-drop cursor

### Modification Replacement Warning

**Component Level: ModifyWithAIModal**

**Condition:** Show warning if:

- User opens ModifyWithAIModal, AND
- `hasModification === true` (recipe already has modification)

**Warning Message:**
"Ten przepis ma już modyfikację. Nowa modyfikacja zastąpi obecną. Kontynuować?"

**Validation:**

- Check `hasModification` prop when modal opens

**Effect on UI:**

- Warning banner appears at top of modal
- Different button text: "Zastąp modyfikację" instead of "Zatwierdź"
- User can still cancel

### Action Button Loading States

**Component Level: ActionButtons**

**Condition:** Disable all action buttons during any async operation

**Validation:**

```typescript
const isAnyActionLoading = Object.values(actionStates).some((state) => state === true);
```

**Effect on UI:**

- All buttons disabled if `isAnyActionLoading === true`
- Active button shows loading spinner
- Prevents duplicate requests

### Recipe Ownership Checks

**Component Level: Multiple**

**Condition:** User is recipe owner if:

- `recipe.userId === currentUserId`

**Validation:**

- Computed value: `isOwner = recipe.userId === currentUserId`

**Effect on UI:**

- Show/hide Edit button (owner only)
- Show/hide Delete button (owner only)
- Edit button on Original tab only
- Backend enforces, frontend just improves UX

### Modification Ownership Checks

**Component Level: ActionButtons**

**Condition:** User is modification owner if:

- `modification.userId === currentUserId`

**Validation:**

- Computed value: `isModificationOwner = modification?.userId === currentUserId`

**Effect on UI:**

- Show/hide Delete Modification button (owner only)
- Backend enforces, frontend just improves UX

### Loading State Validation

**Component Level: RecipeDetailLayout**

**Condition:** Show LoadingState if:

- `viewState.isLoading === true`

**Validation:**

- Set during initial data fetch
- Cleared after recipe and modifications loaded (or error)

**Effect on UI:**

- Render LoadingState component (skeleton)
- Hide all other content

### Error State Validation

**Component Level: RecipeDetailLayout**

**Condition:** Show ErrorState if:

- `viewState.error !== null`

**Validation:**

- Error set during fetch failures
- Error cleared on successful retry

**Effect on UI:**

- Render ErrorState component with appropriate message
- Show back button to return to recipes list
- Hide all other content

### Input Validation (ModifyWithAIModal)

**Component Level: ModifyWithAIModal**

**Conditions by Modification Type:**

1. **reduce_calories / increase_calories:**
   - `targetCalories`: 1 - 10000, OR
   - `reductionPercentage` / `increasePercentage`: 1 - 100

2. **increase_protein:**
   - `targetProtein`: 1 - 1000 grams, OR
   - `increasePercentage`: 1 - 100

3. **increase_fiber:**
   - `targetFiber`: 1 - 1000 grams, OR
   - `increasePercentage`: 1 - 100

4. **portion_size:**
   - `newServings`: 1 - 100 (integer)

5. **ingredient_substitution:**
   - `originalIngredient`: 1 - 100 characters (required)
   - `preferredSubstitute`: 1 - 100 characters (optional)

**Validation:**

- Client-side validation before submission
- Show inline error messages for invalid inputs
- Disable submit button until valid

**Effect on UI:**

- Error messages appear below inputs
- Submit button disabled if form invalid
- Error styling on input fields

## 10. Error Handling

### Recipe Load Failures

**Scenario 1: Recipe Not Found (404)**

- **Cause:** Recipe ID doesn't exist in database
- **Detection:** GET /api/recipes/{id} returns 404
- **Handling:**
  ```typescript
  setViewState((prev) => ({
    ...prev,
    isLoading: false,
    error: { type: "not_found", message: "Nie znaleziono przepisu" },
  }));
  ```
- **UI:** Show ErrorState with:
  - Icon: Search with X
  - Title: "Nie znaleziono przepisu"
  - Message: "Przepis, którego szukasz, nie istnieje lub został usunięty."
  - Action: "Wróć do przepisów" button → Navigate to /recipes

**Scenario 2: Access Denied (403)**

- **Cause:** Recipe is private and user is not the owner
- **Detection:** GET /api/recipes/{id} returns 403
- **Handling:**
  ```typescript
  setViewState((prev) => ({
    ...prev,
    isLoading: false,
    error: { type: "forbidden", message: "Nie masz dostępu do tego przepisu" },
  }));
  ```
- **UI:** Show ErrorState with:
  - Icon: Lock
  - Title: "Brak dostępu"
  - Message: "Nie masz uprawnień do przeglądania tego przepisu."
  - Action: "Wróć do przepisów" button → Navigate to /recipes

**Scenario 3: Server Error (500)**

- **Cause:** Database error, network failure, or other server issue
- **Detection:** GET /api/recipes/{id} returns 500 or network error
- **Handling:**
  ```typescript
  setViewState((prev) => ({
    ...prev,
    isLoading: false,
    error: { type: "server_error", message: "Wystąpił błąd podczas ładowania przepisu" },
  }));
  ```
- **UI:** Show ErrorState with:
  - Icon: Alert Triangle
  - Title: "Błąd serwera"
  - Message: "Wystąpił błąd podczas ładowania przepisu. Spróbuj ponownie później."
  - Action: "Spróbuj ponownie" button → Retry fetchRecipe(), OR "Wróć do przepisów"

### Modification Load Failures

**Scenario:** Failed to load modifications list

- **Cause:** API error, network failure
- **Detection:** GET /api/recipes/{id}/modifications fails
- **Handling:**
  ```typescript
  console.error("Error fetching modifications:", error);
  showToast({
    title: "Błąd",
    description: "Nie udało się załadować modyfikacji",
    variant: "destructive",
  });
  // Don't block UI, just hide tabs
  setModification(null);
  ```
- **UI:**
  - Log error to console
  - Show toast notification (non-blocking)
  - Hide tab navigation (show only original recipe)
  - Allow user to continue viewing original recipe

### Favorite Toggle Failures

**Scenario:** Failed to add/remove favorite

- **Cause:** Network error, server error, permission issue
- **Detection:** POST /api/favorites or DELETE /api/favorites/{id} fails
- **Handling:**
  ```typescript
  // Revert optimistic update
  setIsFavorited(previousState);
  showToast({
    title: "Błąd",
    description: "Nie udało się zaktualizować ulubionych",
    variant: "destructive",
  });
  ```
- **UI:**
  - Revert heart icon state (unfill if was filled, fill if was unfilled)
  - Show error toast
  - User can retry by clicking again

**Edge Case: Already Favorited (409)**

- **Handling:** Treat as success (idempotent operation)
- **UI:** Keep optimistic update, no error shown

**Edge Case: Already Not Favorited (404 on DELETE)**

- **Handling:** Treat as success (idempotent operation)
- **UI:** Keep optimistic update, no error shown

### Recipe Deletion Failures

**Scenario 1: Permission Denied (403)**

- **Cause:** User is not recipe owner
- **Detection:** DELETE /api/recipes/{id} returns 403
- **Handling:**
  ```typescript
  showToast({
    title: "Błąd",
    description: "Nie masz uprawnień do usunięcia tego przepisu",
    variant: "destructive",
  });
  closeDialog("deleteRecipe");
  ```
- **UI:**
  - Close delete dialog
  - Show error toast
  - User remains on recipe page

**Scenario 2: Server Error (500)**

- **Cause:** Database error, network failure
- **Detection:** DELETE /api/recipes/{id} returns 500 or network error
- **Handling:**
  ```typescript
  showToast({
    title: "Błąd",
    description: "Nie udało się usunąć przepisu. Spróbuj ponownie.",
    variant: "destructive",
  });
  closeDialog("deleteRecipe");
  ```
- **UI:**
  - Close delete dialog
  - Show error toast
  - User can retry by opening dialog again

### AI Modification Failures

**Scenario 1: Validation Error (400)**

- **Cause:** Invalid input parameters
- **Detection:** POST /api/recipes/{id}/modifications returns 400
- **Handling:**
  ```typescript
  const errorData = await response.json();
  // Show error in modal
  setModalError(errorData.message);
  ```
- **UI:**
  - Keep modal open
  - Show error message above form
  - User can correct inputs and retry

**Scenario 2: Rate Limit Exceeded (429)**

- **Cause:** User exceeded rate limit (10 requests per 5 minutes)
- **Detection:** POST /api/recipes/{id}/modifications returns 429
- **Handling:**
  ```typescript
  showToast({
    title: "Zbyt wiele żądań",
    description: "Przekroczyłeś limit żądań. Spróbuj ponownie za kilka minut.",
    variant: "destructive",
  });
  closeDialog("modifyAI");
  ```
- **UI:**
  - Close modal
  - Show specific rate limit toast
  - User must wait before retrying

**Scenario 3: AI Generation Failure (500)**

- **Cause:** AI service error, timeout
- **Detection:** POST /api/recipes/{id}/modifications returns 500
- **Handling:**
  ```typescript
  showToast({
    title: "Błąd generowania",
    description: "Nie udało się wygenerować modyfikacji. Spróbuj ponownie.",
    variant: "destructive",
  });
  closeDialog("modifyAI");
  ```
- **UI:**
  - Close modal
  - Show error toast
  - User can retry by opening modal again

### Modification Deletion Failures

**Scenario:** Failed to delete modification

- **Cause:** Permission error, server error
- **Detection:** DELETE /api/recipes/{id}/modifications/{modId} fails
- **Handling:**
  ```typescript
  showToast({
    title: "Błąd",
    description: "Nie udało się usunąć modyfikacji",
    variant: "destructive",
  });
  closeDialog("deleteModification");
  ```
- **UI:**
  - Close dialog
  - Show error toast
  - User remains on current tab (modified)
  - User can retry

### Network Failures

**Scenario:** Network connection lost

- **Cause:** User's internet connection drops, server unreachable
- **Detection:** Fetch throws network error
- **Handling:**
  ```typescript
  catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      showToast({
        title: "Brak połączenia",
        description: "Sprawdź połączenie internetowe i spróbuj ponownie",
        variant: "destructive",
      });
    }
  }
  ```
- **UI:**
  - Show network error toast
  - Provide retry mechanism where applicable
  - Disable actions that require network

### Graceful Degradation

**Missing Optional Data:**

1. **Prep Time Null:**
   - Show "nie podano" instead of minutes
   - Don't break layout

2. **Description Null:**
   - Hide description section entirely
   - Adjust spacing

3. **Empty Tags Array:**
   - Hide tags section
   - No error shown

4. **No Modifications:**
   - Hide tab navigation
   - Show only original recipe
   - No error shown (expected state)

**Calculation Edge Cases:**

1. **Zero Servings (should never happen):**
   - Fallback to 1 serving
   - Log warning

2. **Very Large Numbers:**
   - Format with appropriate units (K for thousands)
   - Prevent overflow

3. **Very Small Numbers (decimal amounts):**
   - Round to 2 decimal places
   - Show "< 0.01" for very small amounts

### Error Recovery Strategies

1. **Automatic Retry:**
   - Not implemented for MVP (manual retry only)
   - Future: Retry failed API calls with exponential backoff

2. **Cached Data:**
   - Not implemented for MVP
   - Future: Cache recipe data in localStorage/IndexedDB

3. **Offline Support:**
   - Not in MVP scope
   - Future: Service worker for offline viewing

4. **Error Logging:**
   - All errors logged to console with context
   - Future: Send to error tracking service (Sentry)

### User Communication

**Toast Notifications:**

- Success actions: Green toast, auto-dismiss after 3 seconds
- Error actions: Red toast, manual dismiss or auto-dismiss after 5 seconds
- Info/warnings: Blue/yellow toast, manual dismiss

**Error Messages:**

- Clear, user-friendly language (Polish)
- Actionable (e.g., "Spróbuj ponownie" instead of just "Błąd")
- No technical jargon or error codes in UI

**Loading States:**

- Skeleton loaders for initial content load
- Spinners for button actions
- Disabled state for inputs during processing
- Minimum display time to avoid flashing (100-200ms)

## 11. Implementation Steps

### Phase 1: Foundation and Setup (Day 1)

#### Step 1: Create Type Definitions

- [ ] Create `src/types/recipeDetail.types.ts` file
- [ ] Define `RecipeViewState` interface
- [ ] Define `ActionLoadingStates` interface
- [ ] Define `AdjustedIngredientDTO` interface
- [ ] Define `RecipeDetailViewModel` interface
- [ ] Define `PieChartDataItem` interface
- [ ] Define `TabType` type
- [ ] Export all types from types file

#### Step 2: Set Up Custom Hook Structure

- [ ] Create `src/components/hooks/useRecipeDetail.ts` file
- [ ] Import necessary dependencies (useState, useEffect, useMemo)
- [ ] Import type definitions
- [ ] Define hook signature and return type interface
- [ ] Initialize all state variables with proper types
- [ ] Set up basic structure for all functions (empty implementations)
- [ ] Export hook

#### Step 3: Create Component Files Structure

- [ ] Create `src/pages/recipes/[id].astro` (main page file)
- [ ] Create `src/components/recipes/detail/RecipeDetailLayout.tsx`
- [ ] Create component folders:
  - `src/components/recipes/detail/core/` (for core display components)
  - `src/components/recipes/detail/actions/` (for action components)
  - `src/components/recipes/detail/dialogs/` (for modals)
  - `src/components/recipes/detail/shared/` (for shared components)

### Phase 2: Core Components (Day 1-2)

#### Step 4: Implement LoadingState Component

- [ ] Create `src/components/recipes/detail/shared/LoadingState.tsx`
- [ ] Import Skeleton from Shadcn/ui
- [ ] Design skeleton layout matching final layout (header, ingredients, steps, nutrition)
- [ ] Test responsive behavior (desktop vs mobile skeletons)

#### Step 5: Implement ErrorState Component

- [ ] Create `src/components/recipes/detail/shared/ErrorState.tsx`
- [ ] Define ErrorStateProps with error type and message
- [ ] Import icons from lucide-react (AlertCircle, Lock, Search)
- [ ] Implement conditional icon/message based on error type
- [ ] Add "Wróć do przepisów" button with navigation
- [ ] Add "Spróbuj ponownie" button for server errors
- [ ] Style with Tailwind (centered, good spacing)

#### Step 6: Implement RecipeHeader Component

- [ ] Create `src/components/recipes/detail/core/RecipeHeader.tsx`
- [ ] Define RecipeHeaderProps interface
- [ ] Implement title (H1) with proper styling
- [ ] Implement description paragraph (handle null)
- [ ] Implement tags list with Badge components
- [ ] Add tag click handler for navigation
- [ ] Implement metadata row (prep time with Clock icon, author)
- [ ] Add responsive design (stack on mobile)
- [ ] Test with various data (long titles, many tags, null values)

#### Step 7: Implement ServingsAdjuster Component

- [ ] Create `src/components/recipes/detail/core/ServingsAdjuster.tsx`
- [ ] Define ServingsAdjusterProps interface
- [ ] Implement horizontal flex layout
- [ ] Add decrement button [-] with proper icon/text
- [ ] Add servings display with Polish pluralization logic
- [ ] Add increment button [+] with proper icon/text
- [ ] Implement disabled state logic (min/max constraints)
- [ ] Add onClick handlers calling onServingsChange
- [ ] Add keyboard support (optional)
- [ ] Style with Tailwind (buttons, spacing, disabled state)
- [ ] Test min/max boundaries

#### Step 8: Implement IngredientsList Component

- [ ] Create `src/components/recipes/detail/core/IngredientsList.tsx`
- [ ] Define IngredientsListProps interface
- [ ] Implement responsive grid layout (1 col mobile, 2 cols desktop)
- [ ] Map over ingredients array
- [ ] Display amount (formatted to 1-2 decimals), unit, name
- [ ] Handle empty array gracefully
- [ ] Add proper spacing and typography
- [ ] Test with various amounts (whole numbers, decimals, very small)

#### Step 9: Implement PreparationSteps Component

- [ ] Create `src/components/recipes/detail/core/PreparationSteps.tsx`
- [ ] Define PreparationStepsProps interface
- [ ] Implement ordered list (`<ol>`) with CSS auto-numbering
- [ ] Map over steps array
- [ ] Display instruction text in paragraphs
- [ ] Add proper spacing between steps
- [ ] Handle empty array gracefully
- [ ] Style with Tailwind (typography, spacing)

#### Step 10: Implement NutritionPieChart Component

- [ ] Install Recharts: `npm install recharts`
- [ ] Create `src/components/recipes/detail/core/NutritionPieChart.tsx`
- [ ] Define NutritionPieChartProps interface
- [ ] Import necessary Recharts components (PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip)
- [ ] Calculate macro percentages from protein/fat/carbs
- [ ] Transform data into PieChart format (array of {name, value, color})
- [ ] Define colors (green: protein, yellow: carbs, orange: fat)
- [ ] Implement responsive container (width: 100%, height: 250px)
- [ ] Add custom legend with grams and percentages
- [ ] Add tooltip with hover details
- [ ] Test with various nutrition data

#### Step 11: Implement NutritionCard Component

- [ ] Create `src/components/recipes/detail/core/NutritionCard.tsx`
- [ ] Define NutritionCardProps interface
- [ ] Import Card, CardHeader, CardContent from Shadcn/ui
- [ ] Implement card wrapper
- [ ] Add title "Wartości odżywcze" in CardHeader
- [ ] Add prominent calories display
- [ ] Integrate NutritionPieChart component
- [ ] Add macro breakdown list (Białko, Tłuszcze, Węglowodany, Błonnik, Sól)
- [ ] Format numbers with units (g, grams)
- [ ] Calculate percentages for macros
- [ ] Style with proper spacing and typography

### Phase 3: Tab System and State Management (Day 2-3)

#### Step 12: Implement TabNavigation Component

- [ ] Create `src/components/recipes/detail/core/TabNavigation.tsx`
- [ ] Define TabNavigationProps interface
- [ ] Import Tabs, TabsList, TabsTrigger from Shadcn/ui
- [ ] Implement two tabs: "Oryginalny" and "Zmodyfikowany"
- [ ] Add onValueChange handler calling onTabChange
- [ ] Style active/inactive states
- [ ] Test keyboard navigation (arrow keys)
- [ ] Test accessibility (screen reader)

#### Step 13: Implement InfoBanner Component

- [ ] Create `src/components/recipes/detail/shared/InfoBanner.tsx`
- [ ] Import Info icon from lucide-react
- [ ] Implement info styling (blue background, icon, text)
- [ ] Add message: "To jest zmodyfikowana wersja..."
- [ ] Style with Tailwind (padding, rounded, color)

#### Step 14: Implement useRecipeDetail Hook - Data Fetching

- [ ] Implement `fetchRecipe()` function
  - Add try-catch block
  - Set loading state
  - Call GET /api/recipes/{recipeId}
  - Handle 403, 404, 500 errors
  - Update recipe state on success
  - Set originalServings and currentServings
  - Clear loading state
- [ ] Implement `fetchModifications()` function
  - Add try-catch block
  - Call GET /api/recipes/{recipeId}/modifications
  - Set modification state (first item or null)
  - Handle errors gracefully (log, don't block UI)
- [ ] Add useEffect for initial load
  - Dependencies: [recipeId]
  - Call fetchRecipe() and fetchModifications()

#### Step 15: Implement useRecipeDetail Hook - Servings Adjustment

- [ ] Implement `adjustServings(delta)` function
  - Calculate new servings: currentServings + delta
  - Check min/max constraints (1-100)
  - Update viewState.currentServings
- [ ] Implement `currentData` computed value with useMemo
  - Determine base data (original or modified)
  - Calculate serving ratio
  - Map ingredients with adjusted amounts
  - Return object with ingredients, steps, nutrition, servings
  - Dependencies: [recipe, modification, viewState.activeTab, viewState.currentServings, viewState.originalServings]

#### Step 16: Implement useRecipeDetail Hook - Tab Switching

- [ ] Implement `switchTab(tab)` function
  - Update viewState.activeTab
  - Trigger currentData recalculation (via useMemo dependency)

### Phase 4: Action Components and Dialogs (Day 3-4)

#### Step 17: Implement useRecipeDetail Hook - Favorite Toggle

- [ ] Implement `toggleFavorite()` async function
  - Store previous state
  - Optimistically update isFavorited
  - Set actionStates.favorite = true
  - Determine method (POST or DELETE)
  - Call appropriate API endpoint
  - Handle 409 (already favorited) and 404 (already removed) as success
  - On error: revert state, show toast
  - Clear actionStates.favorite
- [ ] Add toast notification helper (or use existing toast system)

#### Step 18: Implement useRecipeDetail Hook - Recipe Deletion

- [ ] Implement `deleteRecipe()` async function
  - Set actionStates.delete = true
  - Call DELETE /api/recipes/{recipeId}
  - Handle 403 (permission denied)
  - On success: redirect to /recipes
  - On error: clear loading state, show toast
  - Clear actionStates.delete

#### Step 19: Implement useRecipeDetail Hook - AI Modification

- [ ] Implement `modifyWithAI(command)` async function
  - Set actionStates.modify = true
  - Call POST /api/recipes/{recipeId}/modifications
  - Handle 400 (validation), 429 (rate limit), 500 (AI failure)
  - On success: update modification state, switch to modified tab, show toast
  - On error: show toast with specific message
  - Clear actionStates.modify

#### Step 20: Implement useRecipeDetail Hook - Delete Modification

- [ ] Implement `deleteModification()` async function
  - Check modification exists
  - Set actionStates.deleteModification = true
  - Call DELETE /api/recipes/{recipeId}/modifications/{modificationId}
  - On success: set modification to null, switch to original tab, show toast
  - On error: show toast
  - Clear actionStates.deleteModification

#### Step 21: Implement useRecipeDetail Hook - Dialog Management

- [ ] Add dialogStates state variable
- [ ] Implement `openDialog(name)` function
- [ ] Implement `closeDialog(name)` function

#### Step 22: Finalize useRecipeDetail Hook

- [ ] Define complete UseRecipeDetailReturn interface
- [ ] Return all state, computed values, and functions
- [ ] Add JSDoc comments for documentation
- [ ] Test hook in isolation (optional: write unit tests)

#### Step 23: Implement ActionButtons Component

- [ ] Create `src/components/recipes/detail/actions/ActionButtons.tsx`
- [ ] Define ActionButtonsProps interface
- [ ] Implement vertical button stack container
- [ ] Add "Modyfikuj z AI" button (primary, sparkles icon)
  - Import Sparkles icon from lucide-react
  - Add onClick handler for openDialog("modifyAI")
- [ ] Add "Edytuj" button (conditional: Original tab only, owner only)
  - Add onClick handler for navigation
- [ ] Add "Usuń przepis" button (destructive, owner only)
  - Import Trash2 icon
  - Add onClick handler for openDialog("deleteRecipe")
- [ ] Add "Dodaj do ulubionych" / "Usuń z ulubionych" button (heart toggle)
  - Import Heart icon
  - Conditional text and icon fill based on isFavorited
  - Add onClick handler for toggleFavorite
  - Show loading spinner when actionStates.favorite is true
- [ ] Add "Dodaj do kolekcji" button (outline)
  - Import Plus icon
  - Add onClick handler for openDialog("addToCollection")
- [ ] Add "Usuń modyfikację" button (conditional: Modified tab only, destructive)
  - Add onClick handler for openDialog("deleteModification")
- [ ] Implement all conditional rendering logic
- [ ] Add loading states for all buttons
- [ ] Style with Tailwind (proper spacing, colors, hover states)
- [ ] Test all button interactions

#### Step 24: Implement DeleteConfirmDialog Component

- [ ] Create `src/components/recipes/detail/dialogs/DeleteConfirmDialog.tsx`
- [ ] Define DeleteConfirmDialogProps interface
- [ ] Import AlertDialog components from Shadcn/ui
- [ ] Implement dialog structure (header, description, footer)
- [ ] Add warning message about permanent deletion
- [ ] Add "Anuluj" button (calls onClose)
- [ ] Add "Usuń" button (destructive, calls onConfirm, shows loading)
- [ ] Test dialog open/close
- [ ] Test loading state

#### Step 25: Implement DeleteModificationDialog Component

- [ ] Create `src/components/recipes/detail/dialogs/DeleteModificationDialog.tsx`
- [ ] Define DeleteModificationDialogProps interface
- [ ] Import AlertDialog components from Shadcn/ui
- [ ] Implement dialog structure (similar to DeleteConfirmDialog)
- [ ] Add warning message about losing modified version
- [ ] Add cancel and confirm buttons
- [ ] Test dialog interactions

#### Step 26: Implement ModifyWithAIModal Component

- [ ] Create `src/components/recipes/detail/dialogs/ModifyWithAIModal.tsx`
- [ ] Define ModifyWithAIModalProps interface
- [ ] Import Dialog components from Shadcn/ui
- [ ] Import Select, Input, Slider components
- [ ] Add form state for modification type and parameters
- [ ] Implement modification type dropdown with 6 options
- [ ] Implement dynamic input fields based on selected type:
  - reduce_calories: Number input or slider
  - increase_calories: Number input or slider
  - increase_protein: Number input or slider
  - increase_fiber: Number input or slider
  - portion_size: Number input
  - ingredient_substitution: Text inputs
- [ ] Add conditional warning banner if hasExistingModification
- [ ] Implement form validation
- [ ] Add submit handler (calls onConfirm with CreateModificationCommand)
- [ ] Add cancel button (calls onClose)
- [ ] Show loading state on submit button
- [ ] Style with Tailwind (form layout, spacing, error messages)
- [ ] Test all modification types
- [ ] Test validation

#### Step 27: Implement AddToCollectionDialog Component (Stub)

- [ ] Create `src/components/recipes/detail/dialogs/AddToCollectionDialog.tsx`
- [ ] Define AddToCollectionDialogProps interface
- [ ] Import Dialog components from Shadcn/ui
- [ ] Implement basic dialog structure
- [ ] Add placeholder message: "Funkcja w budowie" (collections API not yet implemented)
- [ ] Add close button
- [ ] Note: Full implementation depends on collections API (future work)

### Phase 5: Layout and Integration (Day 4-5)

#### Step 28: Implement RecipeDetailLayout Component - Structure

- [ ] Create `src/components/recipes/detail/RecipeDetailLayout.tsx`
- [ ] Define RecipeDetailLayoutProps interface
- [ ] Import useRecipeDetail hook
- [ ] Import all child components
- [ ] Implement hook usage: `const { ... } = useRecipeDetail(recipeId, initialIsFavorited)`
- [ ] Implement conditional rendering:
  - If loading: show LoadingState
  - If error: show ErrorState
  - Else: show main content

#### Step 29: Implement RecipeDetailLayout - Content Structure

- [ ] Add TabNavigation (conditional: if hasModification)
- [ ] Add InfoBanner (conditional: if activeTab === "modified")
- [ ] Create two layout containers:
  - Desktop layout (hidden on mobile)
  - Mobile layout (hidden on desktop)

#### Step 30: Implement RecipeDetailLayout - Desktop Layout

- [ ] Create two-column grid container (CSS Grid or Flexbox)
  - Left column: Main content (flex-1)
  - Right sidebar: Fixed width (~320px)
- [ ] Populate left column:
  - RecipeHeader
  - ServingsAdjuster
  - IngredientsList
  - PreparationSteps
- [ ] Populate right sidebar:
  - NutritionCard (with NutritionPieChart inside)
  - ActionButtons
- [ ] Add responsive breakpoint (hidden below md: `hidden md:grid`)
- [ ] Test layout with various screen sizes

#### Step 31: Implement RecipeDetailLayout - Mobile Layout

- [ ] Create single-column stack container
- [ ] Populate in order:
  - RecipeHeader
  - NutritionCard
  - ServingsAdjuster
  - IngredientsList
  - PreparationSteps
  - ActionButtons (sticky at bottom or in floating menu)
- [ ] Add responsive breakpoint (visible only on mobile: `block md:hidden`)
- [ ] Implement sticky action buttons:
  - Fixed position at bottom
  - Backdrop for contrast
  - Proper z-index
  - Bottom padding on content to avoid overlap
- [ ] Test mobile layout on various devices

#### Step 32: Implement RecipeDetailLayout - Dialogs

- [ ] Add all dialog components at end of layout (outside content flow)
- [ ] Connect dialog open/close state to dialogStates from hook
- [ ] Pass appropriate props to each dialog
- [ ] Test all dialogs open/close

#### Step 33: Create Astro Page

- [ ] Create `src/pages/recipes/[id].astro`
- [ ] Add authentication check (currently mocked)
- [ ] Extract recipeId from Astro.params
- [ ] Optionally fetch initial favorite status on server (for optimistic UI)
  - Call GET /api/favorites with server-side fetch
  - Check if recipeId exists in favorites list
- [ ] Import Layout wrapper
- [ ] Import RecipeDetailLayout component
- [ ] Render: `<RecipeDetailLayout recipeId={recipeId} initialIsFavorited={isFavorited} client:load />`
- [ ] Add page title and metadata
- [ ] Test server-side rendering

### Phase 6: Styling and Polish (Day 5)

#### Step 34: Refine Typography and Spacing

- [ ] Review all components for consistent typography (font sizes, weights, line heights)
- [ ] Ensure consistent spacing (padding, margins, gaps)
- [ ] Use Tailwind spacing scale consistently (4, 6, 8, 12, 16, etc.)
- [ ] Test readability on various screen sizes

#### Step 35: Refine Colors and Theming

- [ ] Ensure consistent color usage (primary, secondary, destructive, muted)
- [ ] Use Shadcn/ui design tokens for colors
- [ ] Test color contrast for accessibility (WCAG AA)
- [ ] Add hover/focus states for all interactive elements

#### Step 36: Add Loading Transitions

- [ ] Add smooth transitions for:
  - Tab switches (fade or slide)
  - Modal open/close (fade + scale)
  - Button loading states (spinner fade in)
- [ ] Keep transitions subtle and fast (150-300ms)
- [ ] Test performance (no jank)

#### Step 37: Optimize Responsive Design

- [ ] Test all breakpoints (mobile, tablet, desktop, large desktop)
- [ ] Ensure touch targets are large enough on mobile (min 44x44px)
- [ ] Test landscape orientation on mobile
- [ ] Ensure no horizontal scroll at any breakpoint
- [ ] Test with various content lengths (short/long titles, many ingredients, etc.)

#### Step 38: Add Accessibility Features

- [ ] Ensure proper heading hierarchy (H1 → H2 → H3)
- [ ] Add ARIA labels for icon-only buttons
- [ ] Ensure keyboard navigation works (tab order, focus states)
- [ ] Test with screen reader (VoiceOver or NVDA)
- [ ] Ensure focus is managed for dialogs (trap focus, return on close)
- [ ] Add skip links if needed (skip to main content)

### Phase 7: Testing and Refinement (Day 6)

#### Step 39: Manual Testing - Happy Paths

- [ ] Test complete flow:
  1. Navigate to recipe detail page
  2. View original recipe
  3. Adjust servings up and down
  4. Add to favorites
  5. Create AI modification
  6. Switch to modified tab
  7. View modified data
  8. Remove from favorites
  9. Delete modification
  10. Switch back to original tab
- [ ] Test edit button (navigate to edit page)
- [ ] Test tag clicks (navigate to filtered recipes)
- [ ] Test delete recipe (confirm redirect)

#### Step 40: Manual Testing - Edge Cases

- [ ] Test with recipe that has no modifications (tabs hidden)
- [ ] Test with recipe that has null description
- [ ] Test with recipe that has null prep time
- [ ] Test with recipe that has no tags
- [ ] Test with recipe that has many tags (overflow behavior)
- [ ] Test with recipe that has very long title
- [ ] Test with recipe that has many ingredients (50+)
- [ ] Test with recipe that has very few ingredients (1-2)
- [ ] Test servings adjustment at boundaries (min 1, max 100)
- [ ] Test with very large ingredient amounts (e.g., 10000g)
- [ ] Test with very small ingredient amounts (e.g., 0.5g)

#### Step 41: Manual Testing - Error Scenarios

- [ ] Test with invalid recipe ID (404 error)
- [ ] Test with private recipe, not owner (403 error)
- [ ] Test with network error (disconnect during load)
- [ ] Test favorite toggle failure (simulate API error)
- [ ] Test AI modification failure (simulate 500 error)
- [ ] Test rate limit error (simulate 429)
- [ ] Test validation errors in ModifyWithAIModal

#### Step 42: Manual Testing - Different Users

- [ ] Test as recipe owner:
  - Edit button visible on Original tab
  - Delete button visible
  - All actions available
- [ ] Test as non-owner:
  - Edit button hidden
  - Delete button hidden
  - Favorite and Modify actions available

#### Step 43: Manual Testing - Responsive Design

- [ ] Test on mobile device (iPhone, Android)
- [ ] Test on tablet (iPad, Android tablet)
- [ ] Test on desktop (various browser widths)
- [ ] Test on large desktop (4K monitor)
- [ ] Test with browser zoom (125%, 150%, 200%)

#### Step 44: Performance Testing

- [ ] Test initial page load time (should be < 2 seconds)
- [ ] Test time to interactive (buttons clickable)
- [ ] Test servings adjustment performance (should be instant)
- [ ] Test tab switching performance (should be instant)
- [ ] Check for memory leaks (open/close dialogs multiple times)
- [ ] Check bundle size (use build analysis tools)

#### Step 45: Browser Compatibility Testing

- [ ] Test in Chrome/Chromium (latest)
- [ ] Test in Firefox (latest)
- [ ] Test in Safari (latest, if on Mac)
- [ ] Test in Edge (latest)
- [ ] Test in mobile browsers (Chrome Mobile, Safari iOS)

#### Step 46: Accessibility Testing

- [ ] Test keyboard navigation (tab through all elements)
- [ ] Test screen reader (VoiceOver on Mac/iOS, NVDA on Windows)
- [ ] Test with high contrast mode
- [ ] Test with reduced motion preference
- [ ] Run automated accessibility audit (Lighthouse, axe DevTools)
- [ ] Fix any accessibility issues found

### Phase 8: Final Refinements and Documentation (Day 6-7)

#### Step 47: Code Review and Cleanup

- [ ] Review all component code for consistency
- [ ] Remove console.logs used for debugging
- [ ] Remove commented-out code
- [ ] Ensure consistent code style (Prettier/ESLint)
- [ ] Add JSDoc comments to all exported functions/components
- [ ] Ensure all TODOs are addressed or documented

#### Step 48: Error Handling Review

- [ ] Ensure all API calls have try-catch blocks
- [ ] Ensure all errors are logged to console
- [ ] Ensure all errors show appropriate user messages
- [ ] Ensure no unhandled promise rejections
- [ ] Test all error scenarios one more time

#### Step 49: Performance Optimization

- [ ] Check for unnecessary re-renders (use React DevTools Profiler)
- [ ] Add useMemo/useCallback where appropriate (especially currentData)
- [ ] Ensure images are optimized (if any added later)
- [ ] Check bundle size, consider code splitting if too large
- [ ] Lazy load dialogs if bundle is large

#### Step 50: Documentation

- [ ] Add README.md for recipe detail feature (optional)
- [ ] Document any custom hooks with usage examples
- [ ] Document any complex calculations (servings ratio, macro percentages)
- [ ] Document known limitations or future enhancements
- [ ] Update main project README if needed

#### Step 51: Final Testing

- [ ] Run complete test suite one more time
- [ ] Test with fresh eyes (ask teammate or do tomorrow)
- [ ] Test with real data from database (not just mock data)
- [ ] Test with slow network connection (throttle in DevTools)
- [ ] Verify all acceptance criteria from user story US-016 are met

#### Step 52: Prepare for Production

- [ ] Remove mock authentication (uncomment real auth in Astro page and hook)
- [ ] Verify all environment variables are set
- [ ] Test in staging environment (if available)
- [ ] Prepare release notes/changelog
- [ ] Get stakeholder approval (if required)

### Phase 9: Deployment and Monitoring (Day 7)

#### Step 53: Deploy to Production

- [ ] Merge feature branch to main
- [ ] Trigger CI/CD pipeline (GitHub Actions)
- [ ] Monitor build for errors
- [ ] Verify Docker image builds successfully
- [ ] Deploy to DigitalOcean (or staging first)
- [ ] Verify deployment health checks

#### Step 54: Production Smoke Testing

- [ ] Test recipe detail page with real data
- [ ] Test all major flows (view, adjust servings, favorite, modify)
- [ ] Test on mobile device (real device, not just DevTools)
- [ ] Monitor for errors in browser console
- [ ] Monitor server logs for errors

#### Step 55: Monitor and Iterate

- [ ] Set up error tracking (if not already done)
- [ ] Monitor API response times
- [ ] Monitor user behavior (if analytics set up)
- [ ] Collect user feedback
- [ ] Create backlog items for improvements
- [ ] Plan next iteration

### Post-MVP Enhancements (Future)

Future enhancements to consider after MVP is complete and stable:

1. **Recipe Rating System:**
   - Add rating display (stars)
   - Add "Did you cook this?" question
   - Integrate with recipe_ratings table

2. **Comments Section:**
   - Add comment list below recipe
   - Add comment form
   - Real-time updates

3. **Print-Friendly View:**
   - Add print button
   - Create print stylesheet
   - Hide unnecessary elements (buttons, sidebar)

4. **Share Button:**
   - Add share to social media
   - Add copy link functionality
   - Generate shareable preview

5. **Cooking Mode:**
   - Add step checkboxes
   - Add timer functionality
   - Full-screen mode
   - Voice navigation

6. **Recipe Images:**
   - Add image upload
   - Display recipe image
   - Image gallery for steps

7. **Nutritional Visualizations:**
   - Add daily value percentages
   - Add comparison to user's goals
   - Add micronutrient breakdown

8. **Servings Persistence:**
   - Save adjusted servings in localStorage
   - Remember preferred serving size

9. **Multiple Modifications:**
   - Allow multiple modifications per recipe
   - Modification history
   - Compare modifications

10. **Offline Support:**
    - Service worker for offline viewing
    - Cache recipe data
    - Offline indicator

---

## Summary

This implementation plan provides a comprehensive, step-by-step guide to building the Recipe Detail Page for the HealthyMeal application. The plan is organized into 9 phases covering foundation, core components, state management, actions, layout, styling, testing, refinement, and deployment.

**Estimated Timeline:** 6-7 working days for MVP

**Key Deliverables:**

- Fully functional Recipe Detail Page at `/recipes/[id]`
- Responsive layout (desktop two-column, mobile single-column)
- Tab system for original vs modified recipes
- Real-time servings adjustment with ingredient recalculation
- Nutrition visualization with pie chart
- Action buttons with full functionality (Edit, Delete, Favorite, Modify with AI, Add to Collection)
- Comprehensive error handling
- Accessible and user-friendly UI

**Technologies Used:**

- Astro 5 (SSR page)
- React 19 (interactive components)
- TypeScript 5 (type safety)
- Tailwind 4 (styling)
- Shadcn/ui (UI components)
- Recharts (pie chart)
- Supabase SDK (data fetching)

The implementation follows best practices for React development, state management, error handling, and accessibility. Each step is clearly defined with checkboxes for tracking progress. The plan is designed to be followed sequentially, with each phase building on the previous one.
