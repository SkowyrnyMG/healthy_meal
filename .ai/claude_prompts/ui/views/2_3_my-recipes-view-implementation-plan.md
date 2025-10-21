# View Implementation Plan: My Recipes Page

## 1. Overview

The My Recipes Page is a comprehensive recipe management interface that allows users to browse, search, filter, and manage their personal recipe collection. The page displays recipes in a responsive grid layout with advanced filtering capabilities including search by title, filtering by tags, maximum calories, and preparation time. All filter states are persisted in URL query parameters to enable shareability and browser navigation support. The interface provides quick actions for favoriting, editing, deleting, and modifying recipes with AI.

**Key Features:**
- Responsive grid layout (1 column mobile, 2-3 tablet, 3-4 desktop)
- Real-time search with 500ms debounce
- Advanced filtering (tags, calories, prep time)
- URL-based state management
- Pagination (20 items per page)
- Loading states and empty state handling
- Keyboard navigation and accessibility support

## 2. View Routing

**Path:** `/recipes`

**Route Type:** Protected (requires authentication)

**URL State Example:**
```
/recipes?search=kurczak&tags=uuid1,uuid2&maxCalories=500&maxPrepTime=30&sortBy=prepTime&sortOrder=asc&page=2
```

## 3. Component Structure

```
RecipesPage (Astro page: src/pages/recipes.astro)
├── PageLayout (Astro layout)
│   ├── Header
│   ├── Navigation
│   └── Main Content
│       └── RecipeListLayout (React component)
│           ├── SearchBar (React component)
│           ├── FilterButton (React component, mobile only)
│           ├── FilterPanel (React component)
│           │   ├── TagFilterSection
│           │   │   └── TagCheckboxGroup
│           │   ├── CaloriesSlider
│           │   ├── PrepTimeSlider
│           │   ├── SortDropdown
│           │   └── FilterActions
│           │       ├── ApplyButton
│           │       └── ClearButton
│           ├── ContentArea
│           │   ├── ActiveFilterChips (React component)
│           │   ├── RecipeGrid (React component)
│           │   │   └── RecipeCard[] (React component)
│           │   │       ├── RecipeImage (placeholder)
│           │   │       ├── RecipeInfo
│           │   │       │   ├── Title
│           │   │       │   ├── Description
│           │   │       │   ├── NutritionBadges
│           │   │       │   ├── MetaInfo (prep time, servings)
│           │   │       │   └── TagBadges
│           │   │       └── RecipeActions
│           │   │           ├── FavoriteButton
│           │   │           └── MoreActionsMenu
│           │   ├── EmptyState (React component)
│           │   └── Pagination (React component)
│           └── LoadingSkeletons (React component)
```

## 4. Component Details

### RecipesPage (Astro)

**Description:** Server-side rendered page component that fetches initial data and renders the React client component.

**Responsibilities:**
- Authenticate user via Supabase session
- Redirect unauthenticated users to login (for now auth is mocked on backend)
- Pass initial data to client component
- Render page layout

**Main Elements:**
- Astro layout wrapper
- RecipeListLayout React component with client:load directive

**Server-side Logic:**
- Check authentication status
- No initial data fetch (client handles this for better URL state management)

**Props Passed to Client:**
- User ID (from session)

### RecipeListLayout (React)

**Description:** Main container component managing the entire recipe list interface with sidebar/top sections based on screen size.

**Main Elements:**
- `<div className="flex flex-col lg:flex-row gap-6 p-4 lg:p-6">` - Responsive container
- SearchBar component
- FilterButton component (visible on mobile only)
- FilterPanel component (sidebar on desktop, Sheet on mobile)
- ContentArea with grid and pagination

**Handled Interactions:**
- Initialize filters from URL on mount
- Sync filter state to URL
- Handle browser back/forward navigation
- Manage filter panel visibility (mobile)

**Handled Validation:**
- None (validation happens in child components)

**Types:**
- `RecipeListItemDTO[]` - Recipe data
- `PaginationDTO` - Pagination metadata
- `TagDTO[]` - Available tags
- `RecipeListFilters` - Current filter state (ViewModel)

**Props:**
- `userId: string` - Current authenticated user ID

**State Management:**
- Uses custom `useRecipeFilters` hook for filter state
- Uses `useRecipeList` hook for data fetching

### SearchBar (React)

**Description:** Search input with debounced text search functionality and search icon.

**Main Elements:**
- `<Input>` from Shadcn/ui with search icon
- Placeholder: "Szukaj przepisów..."
- Clear button (X) when text is present

**Handled Interactions:**
- Text input with 500ms debounce
- Clear search button click
- Enter key to trigger immediate search

**Handled Validation:**
- Min length: 1 character (trimmed)
- Max length: 255 characters
- Automatically trims whitespace

**Types:**
- `string | undefined` - Search query value

**Props:**
- `value: string | undefined` - Current search value
- `onChange: (value: string | undefined) => void` - Callback for search changes

### FilterButton (React)

**Description:** Mobile-only button that shows filter count and opens the filter panel as a Sheet.

**Main Elements:**
- `<Button variant="outline">` from Shadcn/ui
- Filter icon
- Badge with count when filters are active
- Text: "Filtry" or "Filtry (N)" where N is active filter count

**Handled Interactions:**
- Click to open/close filter panel Sheet

**Handled Validation:**
- None

**Types:**
- `number` - Active filter count

**Props:**
- `activeFilterCount: number` - Number of active filters
- `onClick: () => void` - Callback to toggle filter panel

### FilterPanel (React)

**Description:** Collapsible panel (desktop) or drawer/sheet (mobile) containing all filter controls. Uses Shadcn/ui Sheet component for mobile.

**Main Elements:**
- Desktop: `<aside className="w-64 space-y-6">`
- Mobile: `<Sheet>` component from Shadcn/ui
- TagFilterSection component
- CaloriesSlider component
- PrepTimeSlider component
- SortDropdown component
- Apply and Clear buttons

**Handled Interactions:**
- Tag selection/deselection
- Slider value changes
- Sort option selection
- Apply filters button click
- Clear all filters button click
- Close sheet (mobile)

**Handled Validation:**
- Tag UUIDs must be valid
- Max calories: 1-10000
- Max prep time: 1-1440 minutes
- Sort by: enum validation
- Sort order: "asc" | "desc"

**Types:**
- `RecipeFilters` - Current filter values (ViewModel)
- `TagDTO[]` - Available tags

**Props:**
- `filters: RecipeFilters` - Current filter state
- `tags: TagDTO[]` - Available tags for selection
- `onFiltersChange: (filters: RecipeFilters) => void` - Callback when filters change
- `onApply: () => void` - Callback when apply button clicked
- `onClear: () => void` - Callback when clear button clicked
- `isOpen: boolean` - Sheet open state (mobile only)
- `onOpenChange: (open: boolean) => void` - Sheet toggle callback (mobile only)

### TagFilterSection (React)

**Description:** Multi-select checkbox group for filtering by recipe tags.

**Main Elements:**
- Section label: "Kategorie"
- Checkbox list from Shadcn/ui
- Scrollable container for long tag lists

**Handled Interactions:**
- Checkbox toggle for each tag
- Select all / deselect all (optional)

**Handled Validation:**
- Selected tag IDs must exist in available tags
- Maximum 50 tags (per API)

**Types:**
- `TagDTO[]` - Available tags
- `string[]` - Selected tag IDs

**Props:**
- `tags: TagDTO[]` - Available tags
- `selectedTagIds: string[]` - Currently selected tag IDs
- `onChange: (tagIds: string[]) => void` - Callback when selection changes

### CaloriesSlider (React)

**Description:** Range slider for filtering recipes by maximum calories per serving.

**Main Elements:**
- `<Slider>` from Shadcn/ui
- Label: "Maksymalna kaloryczność"
- Current value display: "do X kcal"
- Range: 0-10000 kcal

**Handled Interactions:**
- Slider drag
- Value input (optional)

**Handled Validation:**
- Min: 1 kcal (when set)
- Max: 10000 kcal
- Integer values only

**Types:**
- `number | undefined` - Max calories value

**Props:**
- `value: number | undefined` - Current max calories
- `onChange: (value: number | undefined) => void` - Callback when value changes

### PrepTimeSlider (React)

**Description:** Range slider for filtering recipes by maximum preparation time.

**Main Elements:**
- `<Slider>` from Shadcn/ui
- Label: "Maksymalny czas przygotowania"
- Current value display: "do X min"
- Range: 0-1440 minutes (24 hours)

**Handled Interactions:**
- Slider drag
- Value input (optional)

**Handled Validation:**
- Min: 1 minute (when set)
- Max: 1440 minutes
- Integer values only

**Types:**
- `number | undefined` - Max prep time value

**Props:**
- `value: number | undefined` - Current max prep time
- `onChange: (value: number | undefined) => void` - Callback when value changes

### SortDropdown (React)

**Description:** Dropdown menu for selecting sort field and order.

**Main Elements:**
- `<Select>` from Shadcn/ui
- Label: "Sortowanie"
- Options:
  - "Najnowsze" (createdAt, desc)
  - "Najstarsze" (createdAt, asc)
  - "Tytuł A-Z" (title, asc)
  - "Tytuł Z-A" (title, desc)
  - "Czas przygotowania rosnąco" (prepTime, asc)
  - "Czas przygotowania malejąco" (prepTime, desc)

**Handled Interactions:**
- Select option from dropdown

**Handled Validation:**
- Sort by: "createdAt" | "updatedAt" | "title" | "prepTime"
- Sort order: "asc" | "desc"

**Types:**
- `SortOption` - Combined sort field and order (ViewModel)

**Props:**
- `value: SortOption` - Current sort selection
- `onChange: (value: SortOption) => void` - Callback when sort changes

### ActiveFilterChips (React)

**Description:** Displays active filters as removable chips for quick filter management.

**Main Elements:**
- Container: `<div className="flex flex-wrap gap-2">`
- `<Badge>` components from Shadcn/ui with X button
- Chips for: search query, selected tags, max calories, max prep time

**Handled Interactions:**
- Click X button to remove individual filter
- "Wyczyść wszystko" button to clear all filters

**Handled Validation:**
- None

**Types:**
- `RecipeFilters` - Current filter state

**Props:**
- `filters: RecipeFilters` - Active filters
- `tags: TagDTO[]` - All tags (for displaying tag names)
- `onRemoveFilter: (filterKey: string, value?: string) => void` - Callback to remove filter

### RecipeGrid (React)

**Description:** Responsive grid layout displaying recipe cards.

**Main Elements:**
- `<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">`
- RecipeCard components

**Handled Interactions:**
- None (interactions handled by child components)

**Handled Validation:**
- None

**Types:**
- `RecipeListItemDTO[]` - Recipe data

**Props:**
- `recipes: RecipeListItemDTO[]` - Recipes to display
- `onRecipeUpdate: (recipeId: string) => void` - Callback when recipe is updated/deleted

### RecipeCard (React)
Use existing RecipeCard component `src/components/RecipeCard.tsx` with minor adjustments for this view.
### EmptyState (React)

**Description:** Displays appropriate message when no recipes are found.

**Main Elements:**
- Icon (search or empty box)
- Heading text
- Description text
- CTA button

**States:**
- No recipes at all: "Nie masz jeszcze przepisów" + "+ Dodaj pierwszy przepis" button
- No results from filters: "Nie znaleziono przepisów pasujących do kryteriów" + "Wyczyść filtry" button

**Handled Interactions:**
- Click "Dodaj pierwszy przepis" to navigate to create recipe page
- Click "Wyczyść filtry" to clear all active filters

**Handled Validation:**
- None

**Types:**
- `EmptyStateType: "no-recipes" | "no-results"` (ViewModel)

**Props:**
- `type: EmptyStateType` - Type of empty state to display
- `onClearFilters?: () => void` - Callback to clear filters (for "no-results" type)
- `onAddRecipe?: () => void` - Callback to add recipe (for "no-recipes" type)

### Pagination (React)

**Description:** Page navigation controls with page numbers and prev/next buttons.

**Main Elements:**
- Previous button (disabled on page 1)
- Page number buttons (show current, adjacent pages, first/last with ellipsis)
- Next button (disabled on last page)
- Results count: "Wyświetlanie X-Y z Z przepisów"

**Handled Interactions:**
- Click page number to navigate to that page
- Click prev/next buttons
- Keyboard navigation (Arrow keys)

**Handled Validation:**
- Page number must be >= 1 and <= totalPages

**Types:**
- `PaginationDTO` - Pagination metadata

**Props:**
- `pagination: PaginationDTO` - Current pagination state
- `onPageChange: (page: number) => void` - Callback when page changes

### LoadingSkeletons (React)

**Description:** Placeholder skeletons displayed while recipes are being fetched.

**Main Elements:**
- Grid of skeleton cards matching RecipeCard layout
- Shimmer animation effect

**Handled Interactions:**
- None

**Handled Validation:**
- None

**Types:**
- None

**Props:**
- `count?: number` - Number of skeleton cards to display (default: 8)

## 5. Types

### Existing DTOs (from src/types.ts)

```typescript
// Used as-is from existing types
RecipeListItemDTO
TagDTO
NutritionDTO
PaginationDTO
RecipeQueryParams
```

### New ViewModels (to be added)

```typescript
/**
 * Recipe filter state managed in the view
 * Maps to RecipeQueryParams for API calls
 */
interface RecipeFilters {
  search?: string;           // Search query (1-255 chars, trimmed)
  tagIds?: string[];         // Selected tag UUIDs
  maxCalories?: number;      // Max calories per serving (1-10000)
  maxPrepTime?: number;      // Max prep time in minutes (1-1440)
  sortBy: 'createdAt' | 'updatedAt' | 'title' | 'prepTime';
  sortOrder: 'asc' | 'desc';
  page: number;              // Current page (min: 1)
}

/**
 * Combined sort option for dropdown
 */
interface SortOption {
  label: string;             // Display label in Polish
  sortBy: 'createdAt' | 'updatedAt' | 'title' | 'prepTime';
  sortOrder: 'asc' | 'desc';
}

/**
 * Recipe card view model with computed properties
 */
interface RecipeCardViewModel {
  id: string;
  title: string;
  description: string;
  initial: string;           // First letter of title for placeholder
  colorClass: string;        // Tailwind class for placeholder background
  calories: number;
  protein: number;
  prepTime: string;          // Formatted: "30 min" or "1 godz 15 min"
  servings: number;
  primaryTags: TagDTO[];     // First 1-2 tags for display
  totalTags: number;         // Total number of tags
  isFavorite: boolean;       // Whether recipe is in user's favorites
}

/**
 * Empty state type
 */
type EmptyStateType = 'no-recipes' | 'no-results';

/**
 * Filter chip item for active filters display
 */
interface FilterChip {
  key: string;               // Unique identifier for the filter
  label: string;             // Display label
  value?: string;            // Optional value (for tag removal)
  onRemove: () => void;      // Callback to remove this filter
}
```

### Type Mapping

**API to ViewModel:**
- `RecipeQueryParams` → `RecipeFilters`: Client-side filter state
- `RecipeListItemDTO` → `RecipeCardViewModel`: Enhanced with computed display properties
- `PaginationDTO`: Used directly, no transformation needed

**ViewModel to API:**
- `RecipeFilters` → `RecipeQueryParams`: Convert for API calls
- `tagIds: string[]` → `tags: string` (comma-separated)

## 6. State Management

### Custom Hooks

#### `useRecipeFilters()`

**Purpose:** Manage filter state synchronized with URL query parameters.

**Location:** `src/components/hooks/useRecipeFilters.ts`

**State:**
- `filters: RecipeFilters` - Current filter state
- `isFilterPanelOpen: boolean` - Filter panel visibility (mobile)

**Effects:**
- On mount: Parse URL query parameters and initialize filter state
- On filter change: Update URL query parameters (debounced)
- On popstate: Update filter state from URL (browser back/forward)

**Methods:**
```typescript
{
  filters: RecipeFilters;
  setSearch: (value: string | undefined) => void;
  setTagIds: (ids: string[]) => void;
  setMaxCalories: (value: number | undefined) => void;
  setMaxPrepTime: (value: number | undefined) => void;
  setSortBy: (field: string, order: string) => void;
  setPage: (page: number) => void;
  clearFilters: () => void;
  removeFilter: (key: string, value?: string) => void;
  activeFilterCount: number;
  isFilterPanelOpen: boolean;
  toggleFilterPanel: () => void;
}
```

#### `useRecipeList(filters: RecipeFilters)`

**Purpose:** Fetch and manage recipe list data based on current filters.

**Location:** `src/components/hooks/useRecipeList.ts`

**State:**
- `recipes: RecipeListItemDTO[]` - Recipe data
- `pagination: PaginationDTO | null` - Pagination metadata
- `isLoading: boolean` - Loading state
- `error: string | null` - Error message

**Effects:**
- On filter change: Fetch recipes from API
- Debounce search queries (500ms)

**Methods:**
```typescript
{
  recipes: RecipeListItemDTO[];
  pagination: PaginationDTO | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}
```

#### `useTags()`

**Purpose:** Fetch and cache available recipe tags.

**Location:** `src/components/hooks/useTags.ts`

**State:**
- `tags: TagDTO[]` - Available tags
- `isLoading: boolean` - Loading state
- `error: string | null` - Error message

**Effects:**
- On mount: Fetch tags from API (cached)

**Methods:**
```typescript
{
  tags: TagDTO[];
  isLoading: boolean;
  error: string | null;
}
```

#### `useFavorites()`

**Purpose:** Manage user's favorite recipes.

**Location:** `src/components/hooks/useFavorites.ts`

**State:**
- `favoriteIds: Set<string>` - Set of favorite recipe IDs
- `isLoading: boolean` - Loading state

**Effects:**
- On mount: Fetch user's favorites

**Methods:**
```typescript
{
  favoriteIds: Set<string>;
  toggleFavorite: (recipeId: string) => Promise<void>;
  isLoading: boolean;
}
```

### URL State Synchronization

All filter state is synchronized with URL query parameters to enable:
- Shareable filtered URLs
- Browser back/forward navigation
- Bookmark support
- Direct linking to filtered views

**Implementation Approach:**
1. Parse URL on mount using `URLSearchParams`
2. Update URL when filters change using `history.pushState` (not `replaceState` to support back button)
3. Listen to `popstate` event for browser navigation
4. Debounce URL updates for text search (500ms)

## 7. API Integration

### Required Endpoints

#### GET /api/tags

**Purpose:** Fetch all available recipe tags for filter options.

**Request:** None (GET request, no parameters)

**Response Type:**
```typescript
{
  tags: TagDTO[]
}
```

**Error Handling:**
- 500: Show error toast, use empty array as fallback

**Implementation:**
```typescript
const response = await fetch('/api/tags');
if (!response.ok) {
  throw new Error('Failed to fetch tags');
}
const { tags } = await response.json();
```

#### GET /api/recipes

**Purpose:** Fetch paginated, filtered recipe list.

**Request Type:** `RecipeQueryParams`

**Query Parameters:**
- `search`: string (optional, 1-255 chars)
- `tags`: string (optional, comma-separated UUIDs)
- `maxCalories`: number (optional, 1-10000)
- `maxPrepTime`: number (optional, 1-1440)
- `page`: number (default: 1)
- `limit`: number (default: 20, max: 100)
- `sortBy`: string (default: "createdAt")
- `sortOrder`: string (default: "desc")

**Response Type:**
```typescript
{
  recipes: RecipeListItemDTO[];
  pagination: PaginationDTO;
}
```

**Error Handling:**
- 400: Show validation error toast
- 401: Redirect to login
- 500: Show error toast, display error state

**Implementation:**
```typescript
const queryParams = new URLSearchParams();
if (filters.search) queryParams.set('search', filters.search);
if (filters.tagIds?.length) queryParams.set('tags', filters.tagIds.join(','));
if (filters.maxCalories) queryParams.set('maxCalories', filters.maxCalories.toString());
if (filters.maxPrepTime) queryParams.set('maxPrepTime', filters.maxPrepTime.toString());
queryParams.set('page', filters.page.toString());
queryParams.set('sortBy', filters.sortBy);
queryParams.set('sortOrder', filters.sortOrder);

const response = await fetch(`/api/recipes?${queryParams.toString()}`);
if (!response.ok) {
  if (response.status === 401) {
    window.location.href = '/login';
    return;
  }
  throw new Error('Failed to fetch recipes');
}
const data = await response.json();
```

#### GET /api/favorites (Future endpoint)

**Purpose:** Fetch user's favorite recipe IDs for marking favorites in UI.

**Note:** This endpoint is not yet implemented. For MVP, favorites can be managed client-side or added later.

**Temporary Solution:** Store favorites in local state and persist to API when favorite button is clicked.

## 8. User Interactions

### Search Interaction

**Flow:**
1. User types in search bar
2. Input is debounced (500ms)
3. After debounce, `setSearch` is called
4. Filter state updates
5. URL updates
6. Recipe list refetches with new search query
7. Loading skeleton displays during fetch
8. Results update in grid

**Edge Cases:**
- Empty search: Clears search filter
- Search with no results: Shows "no-results" empty state
- Search with filters: Combines with existing filters

### Filter Interaction

**Desktop Flow:**
1. User interacts with filter controls in sidebar
2. Filter state updates immediately (controlled inputs)
3. User clicks "Zastosuj" button
4. URL updates with new filter values
5. Recipe list refetches
6. Active filter chips appear

**Mobile Flow:**
1. User clicks "Filtry" button
2. Sheet opens with filter controls
3. User adjusts filters
4. User clicks "Zastosuj"
5. Sheet closes
6. URL updates
7. Recipe list refetches
8. Badge on filter button shows count

**Clear Filters:**
1. User clicks "Wyczyść filtry" in panel or on empty state
2. All filter values reset to defaults (except page)
3. URL updates
4. Recipe list refetches
5. Filter chips disappear

### Active Filter Chip Removal

**Flow:**
1. User clicks X on a filter chip
2. That specific filter is removed from state
3. URL updates
4. Recipe list refetches
5. Chip disappears

**Tag Chip Removal:**
- Removes only that specific tag
- Other tags remain active

### Pagination Interaction

**Flow:**
1. User clicks page number or prev/next button
2. Page number updates in filter state
3. URL updates
4. Recipe list refetches
5. Page scrolls to top
6. Loading skeleton displays during fetch
7. Results update

**Keyboard Navigation:**
- Left/Right arrows: Previous/Next page
- Tab: Navigate through page buttons

### Recipe Card Interactions

**Favorite Toggle:**
1. User clicks heart icon
2. Optimistic update: Icon fills/unfills immediately
3. API request sent to add/remove favorite
4. On error: Revert optimistic update, show error toast

**Recipe Card Click:**
1. User clicks anywhere on card (except action buttons)
2. Navigate to `/recipes/:id` detail page

**More Actions Menu:**
1. User clicks "..." menu button
2. Dropdown menu opens
3. User selects action:
   - **Edit:** Navigate to `/recipes/:id/edit`
   - **Delete:** Show confirmation dialog
     - On confirm: Delete recipe, remove from list, show success toast
     - On cancel: Close dialog
   - **View:** Navigate to `/recipes/:id`
   - **Add to Collection:** Show collection selection dialog (future feature)
   - **Modify with AI:** Navigate to `/recipes/:id/modify`

### Sort Interaction

**Flow:**
1. User opens sort dropdown
2. User selects sort option
3. Sort state updates
4. URL updates
5. Recipe list refetches with new sort order
6. Results reorder in grid

### Browser Navigation

**Back/Forward:**
1. User clicks browser back/forward button
2. `popstate` event fires
3. Filter state updates from URL
4. Recipe list refetches
5. UI updates to match URL state

## 9. Conditions and Validation

### Filter Value Validation

**Search Query:**
- **Condition:** Must be 1-255 characters after trimming
- **Component:** SearchBar
- **Validation:** Client-side trim and length check before API call
- **Effect:** Invalid values are rejected, user sees validation message

**Tag IDs:**
- **Condition:** Must be valid UUIDs from available tags list
- **Component:** TagFilterSection
- **Validation:** Client-side check against fetched tags
- **Effect:** Only valid tags can be selected

**Max Calories:**
- **Condition:** Must be integer between 1-10000
- **Component:** CaloriesSlider
- **Validation:** Slider component enforces range, API validates
- **Effect:** Values outside range are clamped

**Max Prep Time:**
- **Condition:** Must be integer between 1-1440 minutes
- **Component:** PrepTimeSlider
- **Validation:** Slider component enforces range, API validates
- **Effect:** Values outside range are clamped

**Page Number:**
- **Condition:** Must be >= 1 and <= totalPages
- **Component:** Pagination
- **Validation:** Client-side check, buttons disabled when out of range
- **Effect:** Invalid page numbers trigger reset to page 1

**Sort By:**
- **Condition:** Must be one of: "createdAt", "updatedAt", "title", "prepTime"
- **Component:** SortDropdown
- **Validation:** Dropdown only allows valid options
- **Effect:** Invalid values default to "createdAt"

**Sort Order:**
- **Condition:** Must be "asc" or "desc"
- **Component:** SortDropdown
- **Validation:** Dropdown only allows valid options
- **Effect:** Invalid values default to "desc"

### Recipe Ownership Validation

**Edit/Delete Actions:**
- **Condition:** User must own the recipe (recipe.userId matches current user)
- **Component:** RecipeCard more actions menu
- **Validation:** Server-side verification when action is performed
- **Effect:**
  - Client-side: Edit/Delete options only shown for user's recipes
  - Server-side: 403 Forbidden if ownership check fails
  - UI: Show error toast on 403

### Empty State Conditions

**No Recipes at All:**
- **Condition:** `recipes.length === 0 && activeFilterCount === 0`
- **Component:** EmptyState
- **Effect:** Show "Nie masz jeszcze przepisów" with add recipe CTA

**No Results from Filters:**
- **Condition:** `recipes.length === 0 && activeFilterCount > 0`
- **Component:** EmptyState
- **Effect:** Show "Nie znaleziono przepisów" with clear filters CTA

### Loading State Conditions

**Initial Load:**
- **Condition:** `isLoading === true && recipes.length === 0`
- **Component:** LoadingSkeletons
- **Effect:** Show full grid of skeleton cards

**Pagination Load:**
- **Condition:** `isLoading === true && recipes.length > 0`
- **Component:** Existing grid with opacity overlay + spinner
- **Effect:** Show existing recipes with loading overlay

### Filter Badge Visibility

**Filter Button Badge:**
- **Condition:** `activeFilterCount > 0`
- **Component:** FilterButton
- **Effect:** Badge with count appears on button text

**Active Filter Chips:**
- **Condition:** Individual filters are set
- **Component:** ActiveFilterChips
- **Effect:** Show chip for each active filter

## 10. Error Handling

### Network Errors

**Scenario:** API request fails due to network issue

**Handling:**
- Catch fetch errors
- Display error toast: "Nie udało się pobrać przepisów. Spróbuj ponownie."
- Show retry button in toast
- Keep previous data visible if available
- Log error to console for debugging

### API Validation Errors (400)

**Scenario:** Invalid query parameters sent to API

**Handling:**
- Parse error response
- Display specific validation error in toast
- Reset invalid filter to default value
- Retry request with corrected parameters
- Should rarely happen due to client-side validation

### Authentication Errors (401)

**Scenario:** User session expired or not authenticated

**Handling:**
- Redirect to login page: `window.location.href = '/login'`
- Preserve current URL in redirect query: `/login?redirect=/recipes?...`
- After login, redirect back to preserved URL

### Not Found Errors (404)

**Scenario:** Profile not found (edge case)

**Handling:**
- Display error toast: "Profil nie został znaleziony"
- Offer to create profile or contact support
- Should not happen in normal flow

### Server Errors (500)

**Scenario:** Internal server error

**Handling:**
- Display error toast: "Wystąpił błąd serwera. Spróbuj ponownie później."
- Show error state component with retry button
- Log full error details to console
- Consider automatic retry with exponential backoff

### Tag Fetch Failure

**Scenario:** Cannot fetch available tags

**Handling:**
- Show warning toast: "Nie udało się pobrać kategorii"
- Hide tag filter section or show with disabled state
- Allow other filters to work normally
- Retry in background after delay

### Favorite Toggle Failure

**Scenario:** API call to add/remove favorite fails

**Handling:**
- Revert optimistic UI update
- Display error toast: "Nie udało się zaktualizować ulubionych"
- Keep heart button interactive for retry
- Log error details

### Delete Recipe Failure

**Scenario:** Delete API call fails

**Handling:**
- Keep recipe in list (don't remove optimistically)
- Display error toast: "Nie udało się usunąć przepisu"
- Close confirmation dialog
- Log error details

### Empty State Errors

**Scenario:** No recipes found but unclear why

**Handling:**
- Check if filters are active
- Show appropriate empty state message
- Provide clear CTA to resolve (clear filters or add recipe)
- Log state for debugging

### URL Parameter Parsing Errors

**Scenario:** Invalid URL parameters (manually edited URL)

**Handling:**
- Validate each parameter during parsing
- Replace invalid values with defaults
- Clean URL by pushing corrected parameters
- Log warning about invalid parameters
- Continue with corrected state

### Debounce Edge Cases

**Scenario:** User types in search, then navigates away before debounce completes

**Handling:**
- Cancel pending debounced calls on unmount
- Use cleanup function in useEffect
- Prevent memory leaks from stale API calls

## 11. Implementation Steps

### Phase 1: Project Setup and Types (1-2 hours)

1. **Create type definitions**
   - Add ViewModels to `src/types.ts` or new `src/types/recipes.ts`
   - Define `RecipeFilters`, `SortOption`, `RecipeCardViewModel`, `FilterChip`, `EmptyStateType`
   - Export all new types

2. **Set up component directory structure**
   ```
   src/components/recipes/
   ├── RecipeListLayout.tsx
   ├── SearchBar.tsx
   ├── FilterButton.tsx
   ├── FilterPanel.tsx
   ├── TagFilterSection.tsx
   ├── CaloriesSlider.tsx
   ├── PrepTimeSlider.tsx
   ├── SortDropdown.tsx
   ├── ActiveFilterChips.tsx
   ├── RecipeGrid.tsx
   ├── RecipeCard.tsx
   ├── EmptyState.tsx
   ├── Pagination.tsx
   └── LoadingSkeletons.tsx
   ```

3. **Set up hooks directory**
   ```
   src/components/hooks/
   ├── useRecipeFilters.ts
   ├── useRecipeList.ts
   ├── useTags.ts
   └── useFavorites.ts
   ```

### Phase 2: Core Hooks Implementation (3-4 hours)

4. **Implement `useRecipeFilters` hook**
   - Initialize state with default values
   - Implement URL parameter parsing on mount
   - Implement URL update on filter change (with debounce for search)
   - Implement popstate listener for browser navigation
   - Implement filter manipulation methods
   - Calculate active filter count
   - Add mobile filter panel state

5. **Implement `useRecipeList` hook**
   - Set up state for recipes, pagination, loading, error
   - Implement API call to GET /api/recipes
   - Convert `RecipeFilters` to `RecipeQueryParams`
   - Handle response and update state
   - Implement error handling
   - Add refetch method
   - Add search debouncing (500ms)

6. **Implement `useTags` hook**
   - Set up state for tags, loading, error
   - Implement API call to GET /api/tags
   - Cache tags in state (fetch once)
   - Handle errors gracefully

7. **Implement `useFavorites` hook**
   - Set up state for favorite IDs
   - Implement toggle favorite method with optimistic updates
   - Handle API errors with rollback
   - (Note: API endpoint may need to be created)

### Phase 3: Utility Components (2-3 hours)

8. **Implement `LoadingSkeletons` component**
   - Create skeleton card matching RecipeCard layout
   - Add shimmer animation with Tailwind
   - Render grid of skeleton cards
   - Make responsive (1/2/3/4 columns)

9. **Implement `EmptyState` component**
   - Create two variants: "no-recipes" and "no-results"
   - Add appropriate icons (Lucide React)
   - Implement Polish text content
   - Add CTA buttons with callbacks
   - Style with Tailwind

10. **Implement `Pagination` component**
    - Use Shadcn/ui Button components
    - Calculate visible page numbers (show current, adjacent, first/last)
    - Implement ellipsis for skipped pages
    - Add prev/next buttons with disabled states
    - Add results count display
    - Implement keyboard navigation (arrows)
    - Add page change callback

### Phase 4: Filter Components (4-5 hours)

11. **Implement `SearchBar` component**
    - Use Shadcn/ui Input component
    - Add search icon (Lucide React)
    - Implement controlled input with debounce
    - Add clear button (X) when value present
    - Handle Enter key for immediate search
    - Add proper aria-label

12. **Implement `TagFilterSection` component**
    - Use Shadcn/ui Checkbox components
    - Map tags to checkbox list
    - Implement multi-select logic
    - Add scrollable container for long lists
    - Style with Tailwind
    - Add "Kategorie" label

13. **Implement `CaloriesSlider` component**
    - Use Shadcn/ui Slider component
    - Set range 0-10000
    - Display current value: "do X kcal"
    - Add label: "Maksymalna kaloryczność"
    - Implement onChange callback
    - Add optional reset button

14. **Implement `PrepTimeSlider` component**
    - Use Shadcn/ui Slider component
    - Set range 0-1440 minutes
    - Display current value: "do X min"
    - Add label: "Maksymalny czas przygotowania"
    - Implement onChange callback
    - Add optional reset button

15. **Implement `SortDropdown` component**
    - Use Shadcn/ui Select component
    - Define sort options with Polish labels
    - Map options to sortBy + sortOrder combinations
    - Implement onChange callback
    - Add label: "Sortowanie"

16. **Implement `ActiveFilterChips` component**
    - Use Shadcn/ui Badge component
    - Create chip for each active filter
    - Add X button for removal
    - Display tag names (not IDs)
    - Format calories and prep time values
    - Add "Wyczyść wszystko" button
    - Implement removal callbacks

17. **Implement `FilterButton` component (mobile only)**
    - Use Shadcn/ui Button component
    - Add filter icon
    - Display "Filtry" or "Filtry (N)" text
    - Show badge with count when active filters exist
    - Implement onClick callback
    - Hide on desktop with Tailwind responsive classes

18. **Implement `FilterPanel` component**
    - Create desktop sidebar layout
    - Create mobile Sheet variant (Shadcn/ui)
    - Integrate all filter subcomponents
    - Add "Zastosuj" and "Wyczyść filtry" buttons
    - Implement responsive switching
    - Add proper focus management for Sheet
    - Implement keyboard navigation (Tab, Escape)

### Phase 5: Recipe Display Components (3-4 hours)

19. **Implement `RecipeCard` component**
    - Create card layout with Shadcn/ui Card
    - Implement colored placeholder with initial
    - Add title with line-clamp-2
    - Add description with line-clamp-2
    - Display nutrition badges (calories, protein)
    - Add meta info row (prep time, servings) with icons
    - Display tag badges (limit to 1-2)
    - Add favorite heart button with toggle
    - Implement more actions menu with Shadcn/ui DropdownMenu
    - Add hover effects (desktop)
    - Implement click to view recipe
    - Add delete confirmation dialog

20. **Implement `RecipeGrid` component**
    - Create responsive grid container
    - Map recipes to RecipeCard components
    - Pass callbacks for updates/deletes
    - Handle empty recipes array
    - Make responsive (1/2/3/4 columns)

### Phase 6: Main Layout Component (2-3 hours)

21. **Implement `RecipeListLayout` component**
    - Set up component structure with hooks
    - Initialize `useRecipeFilters`, `useRecipeList`, `useTags`
    - Create responsive container (flex column on mobile, row on desktop)
    - Integrate SearchBar at top
    - Add FilterButton for mobile
    - Add FilterPanel (sidebar on desktop, Sheet on mobile)
    - Create content area with:
      - ActiveFilterChips
      - Conditional rendering: LoadingSkeletons | EmptyState | RecipeGrid
      - Pagination
    - Implement all callback handlers
    - Add error boundary
    - Handle loading states

### Phase 7: Page Integration (1-2 hours)

22. **Create `src/pages/recipes.astro` page**
    - Implement authentication check
    - Redirect if not authenticated
    - Extract user ID from session
    - Render layout with RecipeListLayout
    - Pass user ID as prop
    - Add page title and meta tags
    - Use client:load directive for RecipeListLayout

23. **Add navigation link**
    - Update main navigation to include "Moje Przepisy" link to `/recipes`
    - Add active state styling
    - Ensure link is only visible when authenticated

### Phase 8: Testing and Polish (2-3 hours)

24. **Manual testing**
    - Test all filter combinations
    - Test search with various queries
    - Test pagination
    - Test sort options
    - Test URL state persistence
    - Test browser back/forward navigation
    - Test responsive layouts (mobile, tablet, desktop)
    - Test keyboard navigation
    - Test empty states
    - Test error states
    - Test favorite toggle
    - Test recipe card actions

25. **Accessibility testing**
    - Verify keyboard navigation works throughout
    - Test with screen reader
    - Check ARIA labels and roles
    - Verify focus management in Sheet
    - Test color contrast
    - Ensure proper heading hierarchy

26. **Performance optimization**
    - Verify debouncing works correctly
    - Check for unnecessary re-renders (React DevTools)
    - Optimize filter state updates
    - Consider memoization for expensive computations
    - Test with large datasets (100+ recipes)

27. **Error handling testing**
    - Simulate network errors
    - Test with invalid URL parameters
    - Test API validation errors
    - Test authentication expiry
    - Verify error messages are user-friendly

28. **Final polish**
    - Review all Polish translations
    - Ensure consistent spacing and typography
    - Verify all icons are appropriate
    - Check loading states are smooth
    - Test on different browsers
    - Fix any visual inconsistencies

### Phase 9: Documentation and Handoff (1 hour)

29. **Code documentation**
    - Add JSDoc comments to all components
    - Document complex logic in hooks
    - Add inline comments for non-obvious code

30. **Usage documentation**
    - Document component props and usage
    - Add examples of filter state structure
    - Document URL parameter format
    - Note any limitations or known issues

**Total Estimated Time: 19-27 hours**

---

## Additional Notes

### Future Enhancements

- **Favorites API:** Currently favorites are mentioned but the full API integration may need to be implemented
- **Collections:** "Add to Collection" action in card menu requires collections feature
- **Bulk Actions:** Select multiple recipes for batch operations
- **Advanced Search:** Full-text search across ingredients and steps
- **Save Filter Presets:** Allow users to save commonly used filter combinations
- **Export/Share:** Share filtered recipe lists via URL or export

### Performance Considerations

- Consider implementing virtual scrolling for very large recipe lists (>100 items)
- Use React.memo for RecipeCard to prevent unnecessary re-renders
- Implement request cancellation for in-flight API calls when filters change rapidly
- Consider caching recipe list data in session storage or React Query

### Accessibility Reminders

- Ensure all interactive elements are keyboard accessible
- Provide screen reader announcements when filter results update
- Use semantic HTML (nav, main, aside, article)
- Ensure sufficient color contrast for all text
- Provide clear focus indicators
- Use ARIA live regions for dynamic content updates
