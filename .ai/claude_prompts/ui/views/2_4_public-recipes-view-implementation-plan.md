# View Implementation Plan: Public Recipes Page

## 1. Overview

The Public Recipes Page is a community recipe browsing interface that allows users to discover and explore recipes shared by other users in the HealthyMeal community. The page displays only public recipes (where `isPublic: true`) from all users, providing the same powerful search and filtering capabilities as the My Recipes page. Users can search recipes by title, filter by tags, calories, and preparation time, and save interesting recipes to their favorites for later reference.

**Key Features:**
- Responsive grid layout displaying public recipes from all users
- Real-time search with 500ms debounce
- Advanced filtering (tags, calories, prep time)
- URL-based state management for shareable filtered views
- Pagination (20 items per page default)
- Author badge to distinguish public recipes
- Favorite toggle for bookmarking community recipes
- No Edit/Delete actions (read-only for non-owners)
- Loading states and empty state handling
- Keyboard navigation and accessibility support

**Key Differences from My Recipes Page:**
- Displays recipes from ALL users (not just current user)
- Only shows recipes with `isPublic: true`
- Recipe cards include author badge to indicate community content
- Actions limited to: View, Favorite (no Edit/Delete)
- Empty state messaging focuses on community content

## 2. View Routing

**Path:** `/recipes/public`

**Route Type:** Protected (requires authentication)

**URL State Example:**
```
/recipes/public?search=kurczak&tags=uuid1,uuid2&maxCalories=500&maxPrepTime=30&sortBy=prepTime&sortOrder=asc&page=2
```

## 3. Component Structure

```
PublicRecipesPage (Astro page: src/pages/recipes/public.astro)
├── AppLayout (Astro layout)
│   ├── AppHeader
│   ├── Navigation
│   └── Main Content
│       └── RecipeListLayout (React component - reused with endpoint prop)
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
│           │   │   └── RecipeCard[] (React component with variant)
│           │   │       ├── RecipeImage (placeholder)
│           │   │       ├── RecipeInfo
│           │   │       │   ├── Title
│           │   │       │   ├── Description
│           │   │       │   ├── NutritionBadges
│           │   │       │   ├── MetaInfo (prep time, servings)
│           │   │       │   ├── AuthorBadge (NEW - indicates public recipe)
│           │   │       │   └── TagBadges
│           │   │       └── RecipeActions
│           │   │           └── FavoriteButton (NO Edit/Delete for public recipes)
│           │   ├── EmptyState (React component)
│           │   └── Pagination (React component)
│           └── LoadingSkeletons (React component)
```

## 4. Component Details

### PublicRecipesPage (Astro)

**Description:** Server-side rendered page component that authenticates users, fetches initial favorite IDs, and renders the React client component for public recipe browsing.

**Responsibilities:**
- Authenticate user via Supabase session
- Redirect unauthenticated users to login
- Fetch initial favorite recipe IDs for optimistic UI
- Pass endpoint identifier to RecipeListLayout to use public API
- Render page layout

**Main Elements:**
- AppLayout wrapper with authentication
- RecipeListLayout React component with `client:load` directive
- Title: "Publiczne przepisy - HealthyMeal"

**Server-side Logic:**
- Check authentication status
- Fetch user's favorite recipe IDs via GET /api/favorites
- Handle fetch errors gracefully (continue without favorites if fetch fails)

**Props Passed to Client:**
- `initialFavoriteIds: string[]` - Initial favorite recipe IDs
- `isPublicView: boolean` - Flag indicating this is public recipes view (for endpoint selection)

### RecipeListLayout (React) - Reused with Modifications

**Description:** Main container component managing the entire recipe list interface. This component is reused from My Recipes page but accepts a prop to determine which API endpoint to use.

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
- Fetch recipes from appropriate endpoint based on `isPublicView` prop

**Handled Validation:**
- None (validation happens in child components)

**Types:**
- `RecipeListItemDTO[]` - Recipe data
- `PaginationDTO` - Pagination metadata
- `TagDTO[]` - Available tags
- `RecipeFilters` - Current filter state (ViewModel)

**Props:**
- `initialFavoriteIds: string[]` - Initial favorite recipe IDs from server
- `isPublicView?: boolean` - Flag to determine API endpoint (default: false for My Recipes)

**State Management:**
- Uses custom `useRecipeFilters` hook for filter state
- Uses `useRecipeList` hook with endpoint parameter for data fetching
- Uses `useTags` hook for tag data
- Uses `useFavoriteToggle` hook for favorite management

**Modifications Needed:**
- Accept `isPublicView` prop to conditionally use `/api/recipes/public` endpoint
- Pass endpoint to `useRecipeList` hook

### useRecipeList Hook - Enhanced

**Modification Required:** Accept endpoint parameter to support both user recipes and public recipes.

**Enhanced Interface:**
```typescript
function useRecipeList(
  filters: RecipeFilters,
  options?: {
    endpoint?: '/api/recipes' | '/api/recipes/public';
  }
): {
  recipes: RecipeListItemDTO[];
  pagination: PaginationDTO | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}
```

**Implementation Change:**
- Default endpoint: `/api/recipes` (user's recipes)
- When endpoint is `/api/recipes/public`: Fetch public recipes from all users
- All other logic remains the same (query params, error handling, etc.)

### RecipeCard (React) - Enhanced for Author Display

**Description:** Recipe card component displaying recipe information with optional author badge for public recipes.

**Enhancements Needed:**
- Add optional `showAuthorBadge` prop to display "Publiczny" badge
- Remove Edit/Delete actions when `isPublicView` is true
- Keep only View and Favorite actions for public recipes

**Main Elements (No Changes to Layout):**
- Colored placeholder with recipe initial and icon
- Recipe title and description
- Nutrition badges (calories, protein)
- Prep time and servings with icons
- Tag badges (first 1-2 tags)
- **NEW:** Author badge ("Publiczny" or "Z Społeczności") when `showAuthorBadge` is true
- Favorite heart button
- **REMOVED for public:** Edit/Delete actions in more menu

**Handled Interactions:**
- Click card to view recipe details
- Click heart button to toggle favorite
- **NOT AVAILABLE for public:** Edit/Delete actions

**Handled Validation:**
- None (display only component)

**Types:**
- `RecipeListItemDTO` - Recipe data from API
- `boolean` - isFavorited state
- `boolean` - showAuthorBadge flag (NEW)
- `boolean` - isPublicView flag to hide Edit/Delete (NEW)

**Props:**
```typescript
interface RecipeCardProps {
  recipe: RecipeListItemDTO;
  isFavorited: boolean;
  onFavoriteToggle: (recipeId: string) => Promise<void>;
  isLoading?: boolean;
  showAuthorBadge?: boolean; // NEW - show "Publiczny" badge
  isPublicView?: boolean; // NEW - hide Edit/Delete actions
}
```

**Visual Changes:**
- Add badge below tags section: `<Badge variant="outline">Publiczny</Badge>` when `showAuthorBadge` is true
- Remove MoreActions menu entirely when `isPublicView` is true, OR
- Keep MoreActions but only show View and Add to Collection options (Edit/Delete hidden)

### SearchBar (React) - Reused As-Is

**Description:** Search input with debounced text search functionality and search icon.

**No changes needed** - Component works identically for public recipes.

### FilterPanel (React) - Reused As-Is

**Description:** Collapsible panel (desktop) or drawer/sheet (mobile) containing all filter controls.

**No changes needed** - All filters apply equally to public recipes.

### ActiveFilterChips (React) - Reused As-Is

**Description:** Displays active filters as removable chips for quick filter management.

**No changes needed** - Works identically for public recipes.

### RecipeGrid (React) - Enhanced Props

**Description:** Responsive grid layout displaying recipe cards.

**Enhancement:**
- Pass `showAuthorBadge` and `isPublicView` flags to RecipeCard components

**Props:**
```typescript
interface RecipeGridProps {
  recipes: RecipeListItemDTO[];
  favoriteRecipeIds: Set<string>;
  onFavoriteToggle: (recipeId: string) => Promise<void>;
  isTogglingRecipe: (recipeId: string) => boolean;
  showAuthorBadge?: boolean; // NEW
  isPublicView?: boolean; // NEW
}
```

### EmptyState (React) - Modified Messaging

**Description:** Displays appropriate message when no recipes are found.

**Modifications Needed:**
- Update empty state messages for public context:
  - No recipes at all: "Brak publicznych przepisów w społeczności" (unlikely)
  - No results from filters: "Nie znaleziono publicznych przepisów pasujących do kryteriów"

**States:**
- No public recipes available (very unlikely in production): "Brak publicznych przepisów w społeczności" + "Poczekaj, aż inni użytkownicy udostępnią przepisy" message
- No results from search/filter: "Nie znaleziono przepisów pasujących do kryteriów" + "Wyczyść filtry" button

**Types:**
- `EmptyStateType: "no-recipes" | "no-results"` (ViewModel)

**Props (No Change):**
- `type: EmptyStateType` - Type of empty state to display
- `onClearFilters?: () => void` - Callback to clear filters (for "no-results" type)
- `onAddRecipe?: () => void` - Callback not used for public recipes (hide button)

### Pagination (React) - Reused As-Is

**Description:** Page navigation controls with page numbers and prev/next buttons.

**No changes needed** - Works identically for public recipes.

### LoadingSkeletons (React) - Reused As-Is

**Description:** Placeholder skeletons displayed while recipes are being fetched.

**No changes needed** - Same loading pattern for public recipes.

## 5. Types

### Existing DTOs (from src/types.ts)

All existing types are reused without modification:

```typescript
// Used as-is from existing types
RecipeListItemDTO // Contains userId but not author name/avatar
TagDTO
NutritionDTO
PaginationDTO
RecipeQueryParams
RecipeFilters // ViewModel for filter state
SortOption // ViewModel for sort dropdown
EmptyStateType // ViewModel for empty state
FilterChip // ViewModel for filter chips
```

### Author Information Limitation

**Current State:**
- `RecipeListItemDTO` includes `userId: string` but not author name or avatar
- For MVP, displaying author name is not feasible without API changes

**MVP Solution:**
- Display generic "Publiczny" or "Z Społeczności" badge on all public recipe cards
- This badge distinguishes public recipes from user's own recipes
- Future enhancement: Extend API to join with profiles table and return author name

### No New Types Required

The Public Recipes Page reuses all existing types from My Recipes page. The only difference is the API endpoint and badge display, which don't require new type definitions.

## 6. State Management

### Custom Hooks (All Reused)

#### `useRecipeFilters()` - Reused As-Is

**Purpose:** Manage filter state synchronized with URL query parameters.

**Location:** `src/components/hooks/useRecipeFilters.ts`

**No changes needed** - Works identically for public recipes URL state.

#### `useRecipeList(filters, options)` - Enhanced

**Purpose:** Fetch and manage recipe list data based on current filters.

**Location:** `src/components/hooks/useRecipeList.ts`

**Modification Required:**

```typescript
interface UseRecipeListOptions {
  endpoint?: '/api/recipes' | '/api/recipes/public';
}

function useRecipeList(
  filters: RecipeFilters,
  options: UseRecipeListOptions = {}
): {
  recipes: RecipeListItemDTO[];
  pagination: PaginationDTO | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}
```

**Implementation:**
- Default `endpoint` to `/api/recipes` if not provided (backward compatible)
- When endpoint is `/api/recipes/public`, call public API
- All other logic (debouncing, error handling, pagination) remains unchanged

**State:**
- `recipes: RecipeListItemDTO[]` - Recipe data
- `pagination: PaginationDTO | null` - Pagination metadata
- `isLoading: boolean` - Loading state
- `error: string | null` - Error message

**Effects:**
- On filter change: Fetch recipes from specified endpoint
- Debounce search queries (500ms)

#### `useTags()` - Reused As-Is

**Purpose:** Fetch and cache available recipe tags.

**Location:** `src/components/hooks/useTags.ts`

**No changes needed** - Public recipes use the same tags.

#### `useFavoriteToggle()` - Reused As-Is

**Purpose:** Manage user's favorite recipes with optimistic updates.

**Location:** `src/components/hooks/useFavoriteToggle.ts`

**No changes needed** - Users can favorite public recipes using the same mechanism.

### URL State Synchronization

**No changes needed** - URL state management works identically for public recipes. All filter state is synchronized with URL query parameters to enable:
- Shareable filtered URLs
- Browser back/forward navigation
- Bookmark support
- Direct linking to filtered views

## 7. API Integration

### Required Endpoints

#### GET /api/recipes/public

**Status:** ✅ Already Implemented

**Purpose:** Fetch paginated, filtered list of public recipes from all users.

**Request Type:** `RecipeQueryParams` (excluding isPublic - always true)

**Query Parameters:**
- `search`: string (optional, 1-255 chars)
- `tags`: string (optional, comma-separated UUIDs)
- `maxCalories`: number (optional, 1-10000)
- `maxPrepTime`: number (optional, 1-1440)
- `page`: number (default: 1)
- `limit`: number (default: 20, max: 100)
- `sortBy`: string (default: "createdAt")
- `sortOrder`: string (default: "desc")

**Note:** `isPublic` parameter is NOT sent - endpoint automatically filters by `isPublic: true`

**Response Type:**
```typescript
{
  recipes: RecipeListItemDTO[];
  pagination: PaginationDTO;
}
```

**Error Handling:**
- 400: Show validation error toast
- 401: Redirect to login (authentication required even for public recipes)
- 500: Show error toast, display error state

**Implementation Example:**
```typescript
const queryParams = new URLSearchParams();
if (filters.search) queryParams.set('search', filters.search);
if (filters.tagIds?.length) queryParams.set('tags', filters.tagIds.join(','));
if (filters.maxCalories) queryParams.set('maxCalories', filters.maxCalories.toString());
if (filters.maxPrepTime) queryParams.set('maxPrepTime', filters.maxPrepTime.toString());
queryParams.set('page', filters.page.toString());
queryParams.set('sortBy', filters.sortBy);
queryParams.set('sortOrder', filters.sortOrder);

const response = await fetch(`/api/recipes/public?${queryParams.toString()}`);
if (!response.ok) {
  if (response.status === 401) {
    window.location.href = '/login';
    return;
  }
  throw new Error('Failed to fetch public recipes');
}
const data = await response.json();
```

#### GET /api/tags

**Status:** ✅ Already Implemented

**Purpose:** Fetch all available recipe tags for filter options.

**No changes needed** - Public recipes use the same tags as user recipes.

#### GET /api/favorites

**Status:** ✅ Already Implemented (assumed based on codebase patterns)

**Purpose:** Fetch user's favorite recipe IDs to show which public recipes are bookmarked.

**Usage:** Called on page load (server-side in Astro page) to get initial favorite state

**Error Handling:** Non-blocking - if fetch fails, continue without favorites (empty set)

#### POST /api/favorites (Future endpoint)

**Purpose:** Add a public recipe to user's favorites.

**Usage:** Called when user clicks heart button on non-favorited recipe

**Note:** Endpoint implementation may be needed if not already exists

#### DELETE /api/favorites/:recipeId (Future endpoint)

**Purpose:** Remove a recipe from user's favorites.

**Usage:** Called when user clicks heart button on favorited recipe

**Note:** Endpoint implementation may be needed if not already exists

## 8. User Interactions

### Page Load Flow

**Flow:**
1. User navigates to `/recipes/public`
2. Astro page authenticates user (redirect to login if not authenticated)
3. Server fetches user's favorite recipe IDs
4. Page renders with RecipeListLayout component
5. Client-side: useRecipeFilters parses URL parameters (if any)
6. Client-side: useRecipeList fetches public recipes from API
7. Loading skeletons display while fetching
8. Recipe grid renders with public recipes
9. Favorite buttons show correct state (filled/unfilled)

**Default State (No URL Params):**
- No search query
- No filters active
- Sort by: createdAt, desc
- Page: 1
- Limit: 20 recipes per page

### Search Interaction

**Flow:**
1. User types in search bar
2. Input is debounced (500ms)
3. After debounce, `setSearch` is called
4. Filter state updates
5. URL updates with search parameter
6. Recipe list refetches with new search query
7. Loading skeleton displays during fetch
8. Results update in grid
9. If no results: Show "no-results" empty state

**Edge Cases:**
- Empty search: Clears search filter, shows all public recipes
- Search with no results: Shows "Nie znaleziono przepisów pasujących do kryteriów"
- Search with filters: Combines with existing filters (AND logic)

### Filter Interaction

**Desktop Flow:**
1. User interacts with filter controls in sidebar
2. Filter state updates immediately (controlled inputs)
3. User clicks "Zastosuj" button
4. URL updates with new filter values
5. Recipe list refetches from /api/recipes/public
6. Active filter chips appear above grid
7. Results update in grid

**Mobile Flow:**
1. User clicks "Filtry" button
2. Sheet opens with filter controls
3. User adjusts filters (tags, sliders, sort)
4. User clicks "Zastosuj"
5. Sheet closes
6. URL updates
7. Recipe list refetches
8. Badge on filter button shows count
9. Active filter chips appear

**Clear Filters:**
1. User clicks "Wyczyść filtry" in panel or on empty state
2. All filter values reset to defaults (except page → 1)
3. URL updates to `/recipes/public`
4. Recipe list refetches all public recipes
5. Filter chips disappear

### Favorite Toggle Interaction

**Add to Favorites Flow:**
1. User clicks unfilled heart icon on recipe card
2. **Optimistic update:** Heart fills immediately (red color)
3. API request sent: `POST /api/favorites/:recipeId`
4. On success: State persists, heart remains filled
5. On error: **Rollback:** Heart unfills, show error toast "Nie udało się dodać do ulubionych"

**Remove from Favorites Flow:**
1. User clicks filled heart icon on recipe card
2. **Optimistic update:** Heart unfills immediately (gray color)
3. API request sent: `DELETE /api/favorites/:recipeId`
4. On success: State persists, heart remains unfilled
5. On error: **Rollback:** Heart fills, show error toast "Nie udało się usunąć z ulubionych"

### Recipe Card Click Interaction

**View Recipe Flow:**
1. User clicks anywhere on recipe card (except heart button)
2. Navigate to `/recipes/:id` detail page
3. Recipe detail page displays full recipe information
4. User can view ingredients, steps, nutrition, etc.
5. **Note:** User cannot edit/delete public recipes (only owner can)

**No Edit/Delete Actions:**
- Edit/Delete options are NOT shown in any menu for public recipes
- Only actions available: View, Favorite
- Future enhancement: Add to Collection action

### Pagination Interaction

**Flow:**
1. User clicks page number or prev/next button
2. Page number updates in filter state
3. URL updates with new page parameter
4. Recipe list refetches from API with new offset
5. Page scrolls to top automatically
6. Loading skeleton displays during fetch
7. New results render in grid
8. Pagination buttons update (disable prev on page 1, next on last page)

**Keyboard Navigation:**
- Left Arrow: Previous page (if not on page 1)
- Right Arrow: Next page (if not on last page)
- Tab: Navigate through page buttons
- Enter/Space: Activate focused page button

### Active Filter Chip Removal

**Flow:**
1. User clicks X button on a filter chip
2. That specific filter is removed from state
3. URL updates (filter parameter removed or updated)
4. Recipe list refetches
5. Chip disappears
6. If no more active filters, chips container hides

**Tag Chip Removal:**
- Removes only that specific tag from selection
- Other selected tags remain active
- Recipe list updates to exclude removed tag filter

### Sort Interaction

**Flow:**
1. User opens sort dropdown in filter panel
2. User selects sort option (e.g., "Czas przygotowania rosnąco")
3. Sort state updates (sortBy + sortOrder)
4. URL updates with sort parameters
5. Recipe list refetches with new sort order
6. Results reorder in grid
7. Visual feedback: Dropdown shows selected option

**Sort Options:**
- "Najnowsze" (createdAt, desc) - default
- "Najstarsze" (createdAt, asc)
- "Tytuł A-Z" (title, asc)
- "Tytuł Z-A" (title, desc)
- "Czas przygotowania rosnąco" (prepTime, asc)
- "Czas przygotowania malejąco" (prepTime, desc)

### Browser Navigation

**Back/Forward:**
1. User clicks browser back/forward button
2. `popstate` event fires
3. useRecipeFilters hook detects URL change
4. Filter state updates from URL parameters
5. Recipe list refetches with URL state
6. UI updates to match URL (filters, pagination, results)

**Bookmark/Share:**
- User can bookmark current filtered view
- Sharing URL preserves all filters and pagination
- Opening shared URL restores exact filter state

## 9. Conditions and Validation

### Filter Value Validation

**Search Query:**
- **Condition:** Must be 1-255 characters after trimming
- **Component:** SearchBar
- **Validation:** Client-side trim and length check before setting filter
- **Effect:** Invalid values are trimmed, empty string clears search filter

**Tag IDs:**
- **Condition:** Must be valid UUIDs from available tags list
- **Component:** TagFilterSection
- **Validation:** Client-side check against fetched tags (can only select existing tags)
- **Effect:** Only valid tags can be selected via checkbox UI

**Max Calories:**
- **Condition:** Must be integer between 1-10000
- **Component:** CaloriesSlider
- **Validation:** Slider component enforces range, API validates on server
- **Effect:** Values outside range are clamped by slider component

**Max Prep Time:**
- **Condition:** Must be integer between 1-1440 minutes (24 hours)
- **Component:** PrepTimeSlider
- **Validation:** Slider component enforces range, API validates on server
- **Effect:** Values outside range are clamped by slider component

**Page Number:**
- **Condition:** Must be >= 1 and <= totalPages
- **Component:** Pagination
- **Validation:** Client-side check, prev/next buttons disabled when out of range
- **Effect:** Invalid page numbers trigger reset to page 1

**Sort By:**
- **Condition:** Must be one of: "createdAt", "updatedAt", "title", "prepTime"
- **Component:** SortDropdown
- **Validation:** Dropdown only allows selecting predefined options
- **Effect:** Invalid values default to "createdAt"

**Sort Order:**
- **Condition:** Must be "asc" or "desc"
- **Component:** SortDropdown
- **Validation:** Dropdown only allows selecting predefined options
- **Effect:** Invalid values default to "desc"

### Recipe Access Validation

**View Access:**
- **Condition:** Recipe must have `isPublic: true` to appear in public list
- **Component:** API endpoint (server-side validation)
- **Validation:** Endpoint automatically filters by isPublic=true
- **Effect:** Only public recipes are returned; private recipes never shown

**Edit/Delete Actions:**
- **Condition:** User CANNOT edit/delete public recipes (not their own)
- **Component:** RecipeCard
- **Validation:** Client-side - Edit/Delete actions hidden when `isPublicView: true`
- **Effect:** UI does not show Edit/Delete options for public recipes
- **Note:** Server-side validation on Edit/Delete endpoints checks ownership (403 if attempted)

**Favorite Access:**
- **Condition:** User CAN favorite any public recipe (including their own public recipes)
- **Component:** RecipeCard favorite button
- **Validation:** No restrictions - all public recipes can be favorited
- **Effect:** Heart button always available and functional

### Empty State Conditions

**No Public Recipes at All:**
- **Condition:** `recipes.length === 0 && activeFilterCount === 0 && !isLoading && !error`
- **Component:** EmptyState
- **Effect:** Show "Brak publicznych przepisów w społeczności" message
- **Note:** Very unlikely in production (would require zero users sharing recipes)

**No Results from Filters:**
- **Condition:** `recipes.length === 0 && activeFilterCount > 0 && !isLoading && !error`
- **Component:** EmptyState
- **Effect:** Show "Nie znaleziono przepisów pasujących do kryteriów" with "Wyczyść filtry" button

### Loading State Conditions

**Initial Load:**
- **Condition:** `isLoading === true && recipes.length === 0`
- **Component:** LoadingSkeletons
- **Effect:** Show full grid of skeleton cards (12 skeletons)

**Pagination Load:**
- **Condition:** `isLoading === true && recipes.length > 0`
- **Component:** Existing grid with overlay
- **Effect:** Show existing recipes with reduced opacity + loading spinner overlay

### Filter Badge Visibility

**Filter Button Badge (Mobile):**
- **Condition:** `activeFilterCount > 0`
- **Component:** FilterButton
- **Effect:** Badge with count appears on button: "Filtry (N)"

**Active Filter Chips:**
- **Condition:** Individual filters are set (search, tags, calories, prepTime)
- **Component:** ActiveFilterChips
- **Effect:** Show chip for each active filter with remove button

## 10. Error Handling

### Network Errors

**Scenario:** API request fails due to network issue (connection lost, timeout, etc.)

**Handling:**
- Catch fetch errors in useRecipeList hook
- Set error state with user-friendly message
- Display error toast: "Nie udało się pobrać przepisów. Sprawdź połączenie internetowe."
- Show retry button in error state component
- Keep previous data visible if available (graceful degradation)
- Log error details to console for debugging

**User Recovery:**
- Click "Spróbuj ponownie" button to retry fetch
- Check internet connection
- Reload page if issue persists

### API Validation Errors (400 Bad Request)

**Scenario:** Invalid query parameters sent to API (malformed UUID, out-of-range values, etc.)

**Handling:**
- Parse error response from API
- Display specific validation error in toast: "Nieprawidłowe parametry filtrowania"
- Reset invalid filter to default value automatically
- Retry request with corrected parameters
- Log warning to console

**Prevention:**
- Client-side validation prevents most 400 errors
- Slider components enforce numeric ranges
- Tag checkboxes only allow valid UUID selection
- Should rarely happen in normal usage

### Authentication Errors (401 Unauthorized)

**Scenario:** User session expired or user is not authenticated

**Handling:**
- Detect 401 status code in API response
- Redirect to login page: `window.location.href = '/login'`
- Preserve current URL in redirect query: `/login?redirect=/recipes/public?search=...`
- After successful login, redirect back to preserved URL
- User resumes browsing with same filters

**Note:** Even public recipes require authentication to prevent abuse and enable features like favorites

### Server Errors (500 Internal Server Error)

**Scenario:** Internal server error or database connection issue

**Handling:**
- Catch 500 status code
- Display error toast: "Wystąpił błąd serwera. Spróbuj ponownie później."
- Show error state component with retry button
- Log full error details to console (include stack trace if available)
- Consider automatic retry with exponential backoff (1s, 2s, 4s)
- If retries fail, show persistent error state with support contact info

**User Recovery:**
- Wait and retry after a few seconds
- Contact support if issue persists
- Check service status page (future enhancement)

### Tag Fetch Failure

**Scenario:** Cannot fetch available tags from GET /api/tags

**Handling:**
- Show warning toast: "Nie udało się pobrać kategorii. Filtrowanie po kategoriach jest niedostępne."
- Hide tag filter section in FilterPanel OR show with disabled state
- Allow other filters (search, calories, prepTime) to work normally
- Retry tag fetch in background after 5 seconds
- Log error to console

**User Impact:**
- Minimal - user can still search and use other filters
- Tag filtering temporarily unavailable
- Page remains functional

### Favorite Fetch Failure (Page Load)

**Scenario:** Cannot fetch user's favorites on page load (server-side or client-side)

**Handling:**
- Log warning to console
- Continue page load with empty favorites set
- Heart buttons show unfilled state by default
- When user clicks heart, favorite will be added successfully
- Show warning toast: "Nie udało się załadować ulubionych. Funkcja dodawania ulubionych jest dostępna."

**User Impact:**
- Non-blocking error - page loads normally
- Favorite state unknown initially
- User can still add/remove favorites (state syncs on interaction)

### Favorite Toggle Failure

**Scenario:** API call to add/remove favorite fails (POST/DELETE request fails)

**Handling:**
- **Revert optimistic UI update** immediately
- If adding: Heart unfills, returns to gray color
- If removing: Heart fills, returns to red color
- Display error toast: "Nie udało się zaktualizować ulubionych. Spróbuj ponownie."
- Keep heart button interactive for manual retry
- Log error details to console
- Do NOT automatically retry (let user control retry)

**User Recovery:**
- Click heart button again to retry
- Check internet connection
- Reload page if issue persists

### Empty State Errors

**Scenario:** No recipes found but reason is unclear

**Handling:**
- Check activeFilterCount to determine empty state type
- If activeFilterCount > 0: Show "no-results" empty state with clear filters option
- If activeFilterCount === 0: Show "no-recipes" empty state (unlikely for public recipes)
- Provide clear call-to-action to resolve (clear filters or wait for community)
- Log state details to console for debugging

### URL Parameter Parsing Errors

**Scenario:** Invalid URL parameters (manually edited URL, corrupted bookmark, shared malformed URL)

**Handling:**
- Validate each parameter during parsing in useRecipeFilters hook
- Replace invalid values with defaults:
  - Invalid search: Empty string (clear search)
  - Invalid tags: Empty array (clear tag filter)
  - Invalid maxCalories: undefined (clear calorie filter)
  - Invalid maxPrepTime: undefined (clear prep time filter)
  - Invalid page: Reset to 1
  - Invalid sortBy: Default to "createdAt"
  - Invalid sortOrder: Default to "desc"
- Clean URL by pushing corrected parameters via history.replaceState
- Log warning about invalid parameters to console
- Continue with corrected state (no user-visible error)

**User Impact:**
- Seamless correction of invalid parameters
- Page loads with valid defaults
- No error message (silent correction for better UX)

### Debounce Edge Cases

**Scenario:** User types in search, then navigates away before debounce completes

**Handling:**
- Cancel pending debounced calls on component unmount
- Use cleanup function in useEffect:
  ```typescript
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(value);
    }, 500);

    return () => clearTimeout(timer);
  }, [value]);
  ```
- Abort in-flight API calls on unmount:
  ```typescript
  useEffect(() => {
    const controller = new AbortController();

    fetch(url, { signal: controller.signal });

    return () => controller.abort();
  }, [filters]);
  ```
- Prevent memory leaks from stale API calls
- Prevent state updates on unmounted components

## 11. Implementation Steps

### Phase 1: Project Setup and Analysis (1 hour)

1. **Review existing implementation**
   - Read My Recipes page code (`src/pages/recipes.astro`)
   - Review RecipeListLayout component (`src/components/recipes/RecipeListLayout.tsx`)
   - Review RecipeCard component (`src/components/RecipeCard.tsx`)
   - Review useRecipeList hook (`src/components/hooks/useRecipeList.ts`)
   - Verify API endpoint exists (`src/pages/api/recipes/public.ts`)

2. **Plan modifications**
   - Document which components can be reused as-is
   - Identify components that need modifications
   - List new functionality needed (author badge, endpoint switching)
   - Plan backward-compatible changes to hooks

### Phase 2: Hook Enhancements (1-2 hours)

3. **Enhance `useRecipeList` hook**
   - Add optional `endpoint` parameter to hook interface
   - Default to `/api/recipes` for backward compatibility
   - Support `/api/recipes/public` endpoint
   - Update fetch logic to use dynamic endpoint
   - Test with both endpoints to ensure backward compatibility
   - Update TypeScript types if needed

   **File:** `src/components/hooks/useRecipeList.ts`

   **Changes:**
   ```typescript
   interface UseRecipeListOptions {
     endpoint?: '/api/recipes' | '/api/recipes/public';
   }

   function useRecipeList(
     filters: RecipeFilters,
     options: UseRecipeListOptions = {}
   ) {
     const { endpoint = '/api/recipes' } = options;

     // ... existing logic

     const response = await fetch(`${endpoint}?${queryParams.toString()}`);

     // ... rest unchanged
   }
   ```

4. **Test hook modification**
   - Verify My Recipes page still works (uses default endpoint)
   - Test with `/api/recipes/public` endpoint manually
   - Check error handling works with both endpoints

### Phase 3: Component Enhancements (2-3 hours)

5. **Enhance `RecipeCard` component**
   - Add `showAuthorBadge?: boolean` prop
   - Add `isPublicView?: boolean` prop
   - Add author badge rendering when `showAuthorBadge` is true
   - Hide Edit/Delete actions when `isPublicView` is true
   - Position badge appropriately (below tags section or near metadata)
   - Style badge with Shadcn/ui Badge component (outline variant)
   - Test visual layout with and without badge

   **File:** `src/components/RecipeCard.tsx`

   **Changes:**
   ```typescript
   interface RecipeCardProps {
     recipe: RecipeListItemDTO;
     isFavorited: boolean;
     onFavoriteToggle: (recipeId: string) => Promise<void>;
     isLoading?: boolean;
     showAuthorBadge?: boolean; // NEW
     isPublicView?: boolean; // NEW
   }

   // In JSX:
   {showAuthorBadge && (
     <Badge variant="outline" className="text-xs">
       Publiczny
     </Badge>
   )}

   // Hide actions:
   {!isPublicView && (
     <MoreActionsMenu> {/* Edit/Delete */} </MoreActionsMenu>
   )}
   ```

6. **Enhance `RecipeGrid` component**
   - Add `showAuthorBadge?: boolean` prop
   - Add `isPublicView?: boolean` prop
   - Pass these props to all RecipeCard components
   - Ensure grid layout remains unchanged

   **File:** `src/components/recipes/RecipeGrid.tsx`

   **Changes:**
   ```typescript
   interface RecipeGridProps {
     recipes: RecipeListItemDTO[];
     favoriteRecipeIds: Set<string>;
     onFavoriteToggle: (recipeId: string) => Promise<void>;
     isTogglingRecipe: (recipeId: string) => boolean;
     showAuthorBadge?: boolean; // NEW
     isPublicView?: boolean; // NEW
   }

   // Pass to RecipeCard:
   <RecipeCard
     showAuthorBadge={showAuthorBadge}
     isPublicView={isPublicView}
   />
   ```

7. **Enhance `RecipeListLayout` component**
   - Add `isPublicView?: boolean` prop
   - Pass endpoint to useRecipeList based on isPublicView:
     - If `isPublicView: true` → endpoint: `/api/recipes/public`
     - If `isPublicView: false` or undefined → endpoint: `/api/recipes` (default)
   - Pass `showAuthorBadge` and `isPublicView` to RecipeGrid
   - Update empty state messaging for public context

   **File:** `src/components/recipes/RecipeListLayout.tsx`

   **Changes:**
   ```typescript
   interface RecipeListLayoutProps {
     initialFavoriteIds: string[];
     isPublicView?: boolean; // NEW
   }

   const RecipeListLayout = ({ initialFavoriteIds, isPublicView = false }) => {
     // ... existing hooks

     const { recipes, pagination, isLoading, error, refetch } = useRecipeList(
       filters,
       { endpoint: isPublicView ? '/api/recipes/public' : '/api/recipes' }
     );

     // ... pass to RecipeGrid
     <RecipeGrid
       showAuthorBadge={isPublicView}
       isPublicView={isPublicView}
     />
   }
   ```

8. **Update `EmptyState` component**
   - Modify messages for public recipe context
   - Update "no-recipes" message: "Brak publicznych przepisów w społeczności"
   - Update "no-results" message: "Nie znaleziono publicznych przepisów pasujących do kryteriów"
   - Option 1: Add `isPublicView` prop to conditionally show messages
   - Option 2: Create separate messages and pass as props
   - Option 3: Use same component, messages determined by parent

   **File:** `src/components/recipes/EmptyState.tsx`

   **Recommended approach:** Add optional `context` prop to customize messages

### Phase 4: Page Creation (1 hour)

9. **Create Astro page for Public Recipes**
   - Create new file: `src/pages/recipes/public.astro`
   - Copy structure from `src/pages/recipes.astro` as template
   - Use AppLayout for authentication and layout
   - Fetch user's favorite recipe IDs (same as My Recipes)
   - Pass `isPublicView: true` to RecipeListLayout
   - Set page title: "Publiczne przepisy - HealthyMeal"
   - Handle authentication (redirect if not logged in)

   **File:** `src/pages/recipes/public.astro`

   **Template:**
   ```astro
   ---
   import AppLayout from "@/layouts/AppLayout.astro";
   import RecipeListLayout from "@/components/recipes/RecipeListLayout";
   import type { FavoriteDTO, PaginationDTO } from "@/types";

   // Authentication handled by AppLayout
   // Mock userId for development
   const userId = "a85d6d6c-b7d4-4605-9cc4-3743401b67a0";

   // Fetch initial favorite recipe IDs
   let favoriteRecipeIds: string[] = [];

   try {
     const favoritesResponse = await fetch(`${Astro.url.origin}/api/favorites`, {
       headers: {
         Cookie: Astro.request.headers.get("Cookie") || "",
       },
     });

     if (favoritesResponse.ok) {
       const data: { favorites: FavoriteDTO[]; pagination: PaginationDTO } = await favoritesResponse.json();
       favoriteRecipeIds = data.favorites.map((f) => f.recipeId);
     } else {
       console.warn("[Public Recipes Page] Failed to fetch favorites:", favoritesResponse.status);
     }
   } catch (error) {
     console.error("[Public Recipes Page] Error fetching favorites:", error);
     // Continue without favorites - UI will still work
   }

   const title = "Publiczne przepisy - HealthyMeal";
   ---

   <AppLayout title={title}>
     <RecipeListLayout
       initialFavoriteIds={favoriteRecipeIds}
       isPublicView={true}
       client:load
     />
   </AppLayout>
   ```

10. **Add page header/description (optional)**
    - Add page heading: "Przepisy społeczności"
    - Add description: "Odkryj przepisy udostępnione przez innych użytkowników HealthyMeal"
    - Position above RecipeListLayout component
    - Style with Tailwind classes

### Phase 5: Navigation Integration (30 minutes)

11. **Add navigation link**
    - Locate main navigation component (AppHeader or Navigation)
    - Add "Publiczne Przepisy" link to navigation menu
    - Set href: `/recipes/public`
    - Add active state styling (highlight when on public recipes page)
    - Position after "Moje Przepisy" link in menu
    - Ensure responsive menu includes new link (mobile menu)
    - Test navigation flow

    **Example:**
    ```tsx
    <NavigationLink href="/recipes" label="Moje przepisy" />
    <NavigationLink href="/recipes/public" label="Publiczne przepisy" />
    ```

### Phase 6: Testing (2-3 hours)

12. **Functional testing**
    - Navigate to `/recipes/public` and verify page loads
    - Test that only public recipes are displayed (verify isPublic: true)
    - Verify search functionality with various queries
    - Test all filter combinations (tags, calories, prep time)
    - Test sort options (all 6 options)
    - Test pagination (navigate pages, check counts)
    - Verify URL state management (filters persist in URL)
    - Test browser back/forward navigation
    - Test filter chip removal
    - Test "clear all filters" button
    - Verify favorite toggle works (add/remove)
    - Verify optimistic updates for favorites
    - Click recipe card to view details
    - Verify Edit/Delete actions are hidden
    - Test empty state (clear all recipes with strict filter)

13. **Responsive testing**
    - Test on mobile viewport (320px-640px)
    - Test on tablet viewport (641px-1024px)
    - Test on desktop viewport (1025px+)
    - Verify filter panel switches to Sheet on mobile
    - Test FilterButton on mobile (shows/hides sheet)
    - Verify grid columns adjust (1/2/3/4 columns)
    - Test card layout on all viewports
    - Verify navigation menu works on mobile

14. **Error handling testing**
    - Simulate network error (disconnect internet)
    - Verify error toast appears with retry option
    - Simulate 401 error (clear cookies)
    - Verify redirect to login page
    - Simulate 500 error (mock server error)
    - Verify error state with retry button
    - Test favorite toggle failure (mock API error)
    - Verify optimistic update rollback
    - Test with invalid URL parameters
    - Verify graceful handling with defaults
    - Test tag fetch failure
    - Verify non-blocking error handling

15. **Accessibility testing**
    - Navigate page with keyboard only (Tab, Enter, Space, Arrows)
    - Verify all interactive elements are focusable
    - Test screen reader announcements (VoiceOver/NVDA)
    - Verify ARIA labels on buttons and inputs
    - Check focus indicators are visible
    - Verify color contrast meets WCAG AA standards
    - Test with keyboard shortcuts (if implemented)
    - Verify Sheet (mobile) focus trap works correctly
    - Test heading hierarchy (h1, h2, h3)
    - Verify form inputs have associated labels

16. **Cross-browser testing**
    - Test on Chrome (latest)
    - Test on Firefox (latest)
    - Test on Safari (latest)
    - Test on Edge (latest)
    - Verify consistent behavior across browsers
    - Check for any browser-specific issues

17. **Performance testing**
    - Verify debouncing works (search not firing on every keystroke)
    - Check for unnecessary re-renders (React DevTools Profiler)
    - Test with large dataset (100+ recipes, if available)
    - Measure page load time (should be < 2 seconds)
    - Check network waterfall (concurrent requests)
    - Verify no memory leaks (leave page open, check memory)

### Phase 7: Polish and Documentation (1 hour)

18. **Visual polish**
    - Review all Polish translations (correct grammar/spelling)
    - Verify consistent spacing and typography
    - Check icon usage is appropriate and consistent
    - Verify loading states are smooth (no janky animations)
    - Ensure hover states work correctly
    - Check badge styling matches design system
    - Verify empty states are centered and well-spaced

19. **Code documentation**
    - Add JSDoc comments to modified components
    - Document new props in component interfaces
    - Add inline comments for non-obvious logic
    - Update README if necessary (add /recipes/public route)

20. **Final review**
    - Code review (self-review or peer review)
    - Check for console errors/warnings
    - Verify no TypeScript errors
    - Run linter: `npm run lint`
    - Run formatter: `npm run format`
    - Test one more time end-to-end
    - Commit changes with descriptive commit message

**Total Estimated Time: 8-12 hours**

---

## Additional Notes

### Key Decisions

**Decision 1: Reuse RecipeListLayout vs. Create New Component**
- **Chosen:** Reuse RecipeListLayout with `isPublicView` prop
- **Rationale:** DRY principle, easier maintenance, consistent UX
- **Trade-off:** Slight increase in component complexity

**Decision 2: Author Information Display (MVP)**
- **Chosen:** Show generic "Publiczny" badge without author name
- **Rationale:** API doesn't return author name/avatar; extending API is out of scope for MVP
- **Future Enhancement:** Extend API to join with profiles table and return author display name

**Decision 3: Edit/Delete Action Visibility**
- **Chosen:** Completely hide Edit/Delete actions when `isPublicView: true`
- **Rationale:** Cleaner UI, prevents confusion, no dead actions
- **Alternative:** Gray out actions with tooltip explaining why disabled (more complex)

**Decision 4: Hook Modification Approach**
- **Chosen:** Add optional endpoint parameter to existing useRecipeList hook
- **Rationale:** Backward compatible, reuses all logic, flexible for future endpoints
- **Alternative:** Create separate usePublicRecipeList hook (more code duplication)

### Future Enhancements

**Phase 2 Enhancements (Post-MVP):**

1. **Author Profile Integration**
   - Extend API to return author name and avatar
   - Display author name instead of generic "Publiczny" badge
   - Make author name clickable (navigate to author profile)
   - Show author's recipe count and member since date

2. **Featured/Trending Recipes**
   - Add "featured" flag highlighting in UI (badge or visual indicator)
   - Implement trending algorithm (based on favorites, views, recency)
   - Add "Popularne" tab or filter option
   - Sort by popularity, rating, or most favorited

3. **Collections Support**
   - Add "Add to Collection" action to public recipe cards
   - Show collection modal with user's collections
   - Allow saving public recipes to personal collections
   - Display collection count on recipe cards

4. **Advanced Curation**
   - Personalized recipe recommendations based on user preferences
   - "For You" section with curated recipes
   - Dietary preference filtering (auto-apply from user profile)
   - Allergen warnings based on user's allergen list

5. **Social Features**
   - Recipe rating system (1-5 stars)
   - "Did you cook this?" prompt after viewing
   - User comments on recipes (with moderation)
   - Share recipe button (copy link, social media)

6. **Enhanced Search**
   - Full-text search across ingredients and steps (not just title/description)
   - Search suggestions/autocomplete
   - Search history
   - Saved searches

7. **Performance Optimizations**
   - Virtual scrolling for very large recipe lists (>100 items)
   - Image lazy loading and optimization
   - Recipe list caching (React Query or SWR)
   - Infinite scroll option instead of pagination

### Performance Considerations

**Current Implementation:**
- Page load: Fetch favorites + fetch recipes + fetch tags (3 requests)
- Filter change: Debounced API call (max 1 per 500ms for search)
- Pagination: New API call (expected behavior)

**Optimization Opportunities:**
- **Caching:** Implement client-side caching for recipe list (React Query)
- **Prefetching:** Prefetch next page when user is near bottom
- **Image Optimization:** Add image placeholders with blurhash or low-quality previews
- **Request Cancellation:** Cancel in-flight requests when filters change rapidly
- **Memoization:** Use React.memo for RecipeCard to prevent unnecessary re-renders

**Benchmarks (Goals):**
- Page load time: < 2 seconds (including API calls)
- Filter change response: < 500ms (including debounce)
- Favorite toggle: < 200ms (optimistic update feels instant)
- Search debounce: 500ms (balance between responsiveness and API load)

### Accessibility Reminders

**WCAG 2.1 AA Compliance:**
- ✅ All interactive elements keyboard accessible
- ✅ Sufficient color contrast (4.5:1 for text, 3:1 for UI components)
- ✅ Clear focus indicators (visible border/outline on focused elements)
- ✅ Semantic HTML (nav, main, article, button, input)
- ✅ ARIA labels where needed (icon buttons, complex widgets)
- ✅ ARIA live regions for dynamic content (filter results count)
- ✅ Focus management (Sheet modal focus trap)
- ✅ Screen reader announcements (search results, filter changes)

**Testing Tools:**
- axe DevTools browser extension
- Lighthouse accessibility audit
- NVDA or VoiceOver screen reader testing
- Keyboard-only navigation testing

### Security Considerations

**Frontend Security:**
- ✅ No sensitive data in URL parameters (just filter values)
- ✅ XSS protection via React's automatic escaping
- ✅ CSRF protection via Supabase authentication
- ✅ Input validation on all user inputs

**Backend Security (API):**
- ✅ Authentication required for all endpoints (even public recipes)
- ✅ Rate limiting to prevent abuse
- ✅ Query parameter validation (Zod schemas)
- ✅ IDOR protection (user can only edit/delete own recipes)
- ✅ SQL injection prevention (Supabase parameterized queries)

**Privacy:**
- ✅ Only recipes marked `isPublic: true` are visible
- ✅ User IDs exposed but not sensitive user data (email, password)
- ✅ Favorite data is private (not shown to other users)

### Monitoring and Analytics (Future)

**Key Metrics to Track:**
- Page views on /recipes/public
- Most popular filters (tags, calorie ranges)
- Search queries (to improve suggestions)
- Favorite adds/removes (engagement metric)
- Empty state frequency (indicates filter tuning needs)
- Error rates (API failures, network issues)
- Page load time (performance metric)
- Bounce rate (indicates UX quality)

**Tooling:**
- Google Analytics or Plausible for page views
- Sentry for error tracking
- Custom logging for search queries and filters
- Database queries for favorite counts

---

## Summary

The Public Recipes Page implementation follows a proven pattern from the My Recipes page while introducing minimal, focused modifications to support community recipe browsing. By reusing existing components and hooks with strategic prop additions, we maintain code consistency, reduce duplication, and ensure a coherent user experience across both recipe browsing contexts.

**Key Implementation Highlights:**
- ✅ Reuse 90% of existing components (minimal new code)
- ✅ Backward-compatible hook enhancements
- ✅ Clear visual distinction with author badge
- ✅ Simplified actions (no Edit/Delete for public recipes)
- ✅ Comprehensive error handling and loading states
- ✅ Full accessibility and responsive design support
- ✅ URL-based state for shareable filtered views

**Estimated Implementation Time: 8-12 hours**

This plan provides a solid foundation for MVP implementation while identifying clear paths for future enhancements like author profiles, social features, and advanced curation.
