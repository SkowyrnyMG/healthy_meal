# View Implementation Plan: Favorites Page

## 1. Overview

The Favorites Page is a dedicated view for displaying the user's favorited recipes in a simple, paginated list format. Unlike the My Recipes page with its comprehensive filtering and search capabilities, the Favorites Page focuses on providing quick access to recipes the user has marked as favorites. The page supports unfavoriting recipes with optimistic UI updates and an undo option via toast notifications, creating a smooth and forgiving user experience.

Key features include:
- Paginated display of favorited recipes (20 per page)
- Sorting by date added (most recent first)
- One-click unfavorite with undo option
- Loading states with skeletons
- Meaningful empty state with call-to-action
- Responsive grid layout
- Full keyboard accessibility

## 2. View Routing

**Path:** `/favorites`

**Access Level:** Authenticated users only

**Astro File:** `src/pages/favorites.astro`

## 3. Component Structure

```
FavoritesPage.astro (Server-side Astro component)
└── AppLayout
    └── FavoritesLayout (client:load)
        ├── PageHeader
        │   ├── Title: "Ulubione przepisy"
        │   ├── Count Badge (displaying total favorites)
        │   └── Description text (optional)
        │
        ├── LoadingSkeletons (shown during data fetch)
        │   └── 12 skeleton cards in grid layout
        │
        ├── EmptyFavoritesState (shown when no favorites exist)
        │   ├── Heart icon (empty state)
        │   ├── Heading: "Nie masz ulubionych przepisów"
        │   ├── Description text
        │   └── Link to public recipes page
        │
        ├── RecipeGrid (shown when favorites exist)
        │   └── RecipeCard[] (existing component, reused)
        │       ├── Recipe placeholder with color and icon
        │       ├── Recipe title
        │       ├── Nutrition badges (calories, protein)
        │       ├── Prep time
        │       ├── Primary tag (optional)
        │       └── Favorite button (filled heart, can unfavorite)
        │
        └── Pagination (shown when multiple pages exist)
            ├── Previous button
            ├── Page numbers
            └── Next button

Toaster (Sonner) - Global component for toast notifications
└── Toast (for undo notifications)
    ├── Message: "Usunięto z ulubionych"
    └── Action button: "Cofnij"
```

## 4. Component Details

### 4.1 FavoritesPage.astro

**Component Description:**
Server-side Astro component that serves as the entry point for the Favorites Page. It wraps the client-side FavoritesLayout component within AppLayout, which handles authentication and provides the navigation header.

**Main Elements:**
- `<AppLayout>` wrapper with page title
- `<FavoritesLayout>` React component with `client:load` directive
- No initial data fetching (handled client-side for simplicity)

**Handled Interactions:**
None (static server-side component)

**Handled Validation:**
None (authentication is handled by AppLayout)

**Types:**
- None (minimal props)

**Props:**
- None

### 4.2 FavoritesLayout (React Component)

**Component Description:**
Main client-side container component that manages the favorites list state, pagination, and user interactions. It orchestrates data fetching, handles unfavorite actions with undo functionality, and renders appropriate UI states (loading, empty, content).

**Main Elements:**
- `<div>` container with padding and responsive layout
- `<PageHeader>` displaying title and count
- `<LoadingSkeletons>` for loading state
- `<EmptyFavoritesState>` for empty state
- `<RecipeGrid>` with recipe cards
- `<Pagination>` for page navigation

**Handled Interactions:**
- Page navigation (via pagination controls)
- Unfavorite action (via recipe card heart button)
- Undo unfavorite (via toast action button)
- Recipe card click (navigate to detail page)

**Handled Validation:**
- Validates page number is within valid range (1 to totalPages)
- Handles empty results gracefully

**Types:**
- `FavoriteDTO[]` - Array of favorite recipes from API
- `PaginationDTO` - Pagination metadata
- `UseFavoritesReturn` - Return type from useFavorites hook
- `Set<string>` - Set of currently favorited recipe IDs

**Props:**
None (self-contained with internal state)

### 4.3 PageHeader (New Component)

**Component Description:**
Displays the page title "Ulubione przepisy" along with a count badge showing the total number of favorited recipes. Provides visual context about the page content.

**Main Elements:**
- `<div>` container with flexbox layout
- `<h1>` for page title
- `<Badge>` component showing recipe count
- Optional `<p>` for description text

**Handled Interactions:**
None (static display component)

**Handled Validation:**
None

**Types:**
- `number` - total count of favorites

**Props:**
```typescript
interface PageHeaderProps {
  count: number;
}
```

### 4.4 EmptyFavoritesState (New Component)

**Component Description:**
Displays a friendly empty state when the user has no favorited recipes. Encourages users to explore public recipes and add favorites.

**Main Elements:**
- `<div>` container with centered content
- `<Heart>` icon from lucide-react (large, outlined)
- `<h2>` heading: "Nie masz ulubionych przepisów"
- `<p>` description: "Przeglądaj przepisy i dodaj do ulubionych"
- `<Button>` or `<a>` link to `/recipes/public` with text "Przeglądaj przepisy"

**Handled Interactions:**
- Click on button/link navigates to public recipes page

**Handled Validation:**
None

**Types:**
None

**Props:**
None

### 4.5 RecipeCard (Existing Component, Reused)

**Component Description:**
Displays individual recipe information in a card format. Shows recipe placeholder, title, nutrition info, prep time, and a favorite toggle button. The component is reused from the existing codebase with all recipes on this page showing as favorited (filled heart).

**Main Elements:**
- Card container with hover effects
- Colored placeholder with recipe initial and utensils icon
- Recipe title
- Calorie badge (color-coded)
- Protein amount
- Prep time with clock icon
- Primary tag badge (optional)
- Favorite button (filled heart icon)

**Handled Interactions:**
- Card click: Navigate to recipe detail page (`/recipes/{id}`)
- Heart button click: Toggle favorite status (unfavorite action)

**Handled Validation:**
None

**Types:**
- `RecipeCardData` - Recipe display data
- `boolean` - isFavorited flag
- `boolean` - isLoading flag

**Props:**
```typescript
interface RecipeCardProps {
  recipe: RecipeCardData;
  isFavorited: boolean;
  onFavoriteToggle: (recipeId: string) => Promise<void>;
  isLoading?: boolean;
  showAuthorBadge?: boolean;
  isPublicView?: boolean;
}
```

### 4.6 RecipeGrid (Existing Component, Reused)

**Component Description:**
Responsive grid container that displays multiple recipe cards. Adapts to different screen sizes with appropriate column counts.

**Main Elements:**
- Grid container with responsive columns
- RecipeCard components for each recipe

**Handled Interactions:**
- Passes through interactions to child RecipeCard components

**Handled Validation:**
None

**Types:**
- `RecipeCardData[]` - Array of recipes
- `Set<string>` - Set of favorited recipe IDs
- Function callbacks

**Props:**
```typescript
interface RecipeGridProps {
  recipes: RecipeCardData[];
  favoriteRecipeIds: Set<string>;
  onFavoriteToggle: (recipeId: string) => Promise<void>;
  isTogglingRecipe: (recipeId: string) => boolean;
  showAuthorBadge?: boolean;
  isPublicView?: boolean;
}
```

### 4.7 Pagination (Existing Component, Reused)

**Component Description:**
Displays pagination controls for navigating between pages of favorites. Shows page numbers, previous/next buttons, and current page indicator.

**Main Elements:**
- Previous button
- Page number buttons
- Next button
- Current page highlight

**Handled Interactions:**
- Click on page number: Navigate to specific page
- Click previous/next: Navigate to adjacent page

**Handled Validation:**
- Disables previous button on first page
- Disables next button on last page
- Validates page number is within valid range

**Types:**
- `PaginationDTO` - Pagination metadata

**Props:**
```typescript
interface PaginationProps {
  pagination: PaginationDTO;
  onPageChange: (page: number) => void;
}
```

### 4.8 LoadingSkeletons (Existing Component, Reused)

**Component Description:**
Displays skeleton loading cards while data is being fetched from the API. Provides visual feedback that content is loading.

**Main Elements:**
- Grid of skeleton cards matching RecipeCard layout
- Shimmer animation effect

**Handled Interactions:**
None

**Handled Validation:**
None

**Types:**
- `number` - count of skeletons to display

**Props:**
```typescript
interface LoadingSkeletonsProps {
  count: number;
}
```

## 5. Types

### 5.1 Existing DTOs (from src/types.ts)

```typescript
/**
 * Favorite recipe DTO with embedded recipe information
 * Returned by GET /api/favorites
 */
interface FavoriteDTO {
  recipeId: string;
  recipe: {
    id: string;
    title: string;
    description: string | null;
    nutritionPerServing: NutritionDTO;
    prepTimeMinutes: number | null;
  };
  createdAt: string; // ISO 8601 timestamp when favorited
}

/**
 * Pagination metadata
 */
interface PaginationDTO {
  page: number; // Current page (1-indexed)
  limit: number; // Results per page
  total: number; // Total number of favorites
  totalPages: number; // Total number of pages
}

/**
 * Nutrition information per serving
 */
interface NutritionDTO {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  salt: number;
}
```

### 5.2 New View Models and Types

```typescript
/**
 * Recipe card data structure for display
 * Adapted from RecipeListItemDTO with additional fields
 */
interface RecipeCardData {
  id: string;
  title: string;
  description: string | null;
  nutritionPerServing: NutritionDTO;
  prepTimeMinutes: number | null;
  primaryTag: TagDTO | null; // First tag for display (optional)
}

/**
 * State for favorites page
 */
interface FavoritesPageState {
  favorites: FavoriteDTO[];
  pagination: PaginationDTO | null;
  isLoading: boolean;
  error: string | null;
  currentPage: number;
}

/**
 * Undo operation context for toast notifications
 */
interface UndoOperation {
  recipeId: string;
  recipeTitle: string;
  action: 'unfavorite';
  timestamp: number;
}

/**
 * Return type for useFavorites hook
 */
interface UseFavoritesReturn {
  favorites: FavoriteDTO[];
  pagination: PaginationDTO | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  goToPage: (page: number) => void;
}

/**
 * Props for PageHeader component
 */
interface PageHeaderProps {
  count: number;
}
```

## 6. State Management

### 6.1 Custom Hook: useFavorites

**Purpose:**
Manages fetching and pagination of user's favorite recipes. Syncs page state with URL query parameters for shareable links and browser back/forward navigation.

**Location:** `src/components/hooks/useFavorites.ts`

**State Variables:**
```typescript
const [favorites, setFavorites] = useState<FavoriteDTO[]>([]);
const [pagination, setPagination] = useState<PaginationDTO | null>(null);
const [isLoading, setIsLoading] = useState<boolean>(true);
const [error, setError] = useState<string | null>(null);
const [currentPage, setCurrentPage] = useState<number>(1);
```

**Methods:**
```typescript
// Fetch favorites for current page
const fetchFavorites = async (page: number): Promise<void>

// Manually refetch favorites (after error)
const refetch = async (): Promise<void>

// Navigate to specific page
const goToPage = (page: number): void
```

**Side Effects:**
- Fetches favorites on component mount
- Fetches new data when page changes
- Updates URL with current page number
- Reads initial page from URL query parameter

**Return Value:**
```typescript
{
  favorites: FavoriteDTO[];
  pagination: PaginationDTO | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  goToPage: (page: number) => void;
}
```

### 6.2 Custom Hook: useFavoriteToggle (Existing, Extended)

**Purpose:**
Manages favorite/unfavorite actions with optimistic UI updates. Extended to support undo functionality via toast notifications.

**Location:** `src/components/hooks/useFavoriteToggle.ts` (existing)

**Extension Needed:**
Add undo operation tracking and toast integration with Sonner library.

```typescript
// Additional state for undo
const [lastUnfavorited, setLastUnfavorited] = useState<UndoOperation | null>(null);

// Modified toggleFavorite to show undo toast
const toggleFavorite = async (recipeId: string): Promise<void> => {
  // ... existing optimistic update logic ...

  if (action === 'remove') {
    // Show undo toast
    toast('Usunięto z ulubionych', {
      action: {
        label: 'Cofnij',
        onClick: () => handleUndo(recipeId)
      },
      duration: 5000
    });
  }
}

// New undo handler
const handleUndo = async (recipeId: string): Promise<void> => {
  // Re-favorite the recipe
  // ...
}
```

### 6.3 Toast State (via Sonner Library)

**Purpose:**
Display temporary notifications for unfavorite actions with undo option.

**Library:** `sonner` (React toast library)

**Setup:**
Add `<Toaster />` component to AppLayout for global toast management.

**Usage:**
```typescript
import { toast } from 'sonner';

// Show undo toast
toast('Usunięto z ulubionych', {
  action: {
    label: 'Cofnij',
    onClick: () => handleUndo(recipeId)
  },
  duration: 5000
});

// Show error toast
toast.error('Nie udało się usunąć z ulubionych');

// Show success toast (for undo)
toast.success('Przywrócono do ulubionych');
```

## 7. API Integration

### 7.1 GET /api/favorites

**Description:**
Retrieves paginated list of authenticated user's favorite recipes sorted by date added (most recent first).

**Request:**
```http
GET /api/favorites?page=1&limit=20
```

**Query Parameters:**
- `page` (optional): Page number, positive integer, default: 1
- `limit` (optional): Results per page, 1-100, default: 20

**Request Types:**
```typescript
interface FavoritesQueryParams {
  page?: number;
  limit?: number;
}
```

**Response (200 OK):**
```typescript
{
  favorites: FavoriteDTO[];
  pagination: PaginationDTO;
}
```

**Response Types:**
- `FavoriteDTO[]` - Array of favorite recipes with embedded recipe details
- `PaginationDTO` - Pagination metadata

**Error Responses:**
- `400 Bad Request`: Invalid query parameters
- `401 Unauthorized`: Authentication required (when enabled)
- `500 Internal Server Error`: Server error

**Usage in Hook:**
```typescript
const response = await fetch(
  `/api/favorites?page=${page}&limit=20`,
  {
    headers: {
      'Content-Type': 'application/json'
    }
  }
);

if (!response.ok) {
  throw new Error('Failed to fetch favorites');
}

const data: { favorites: FavoriteDTO[]; pagination: PaginationDTO } =
  await response.json();
```

### 7.2 DELETE /api/favorites (via useFavoriteToggle)

**Description:**
Removes a recipe from authenticated user's favorites list.

**Request:**
```http
DELETE /api/favorites
Content-Type: application/json

{
  "recipeId": "uuid"
}
```

**Request Types:**
```typescript
interface RemoveFavoriteRequest {
  recipeId: string; // UUID format
}
```

**Response (200 OK):**
```typescript
{
  success: true;
  message: "Recipe removed from favorites";
}
```

**Error Responses:**
- `400 Bad Request`: Invalid recipe ID format
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Cannot unfavorite private recipes from other users
- `404 Not Found`: Recipe not found or not in favorites
- `500 Internal Server Error`: Server error

**Usage in Hook:**
```typescript
const response = await fetch('/api/favorites', {
  method: 'DELETE',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ recipeId })
});

if (!response.ok) {
  const errorData = await response.json();
  throw new Error(errorData.message || 'Failed to remove from favorites');
}
```

### 7.3 POST /api/favorites (for Undo)

**Description:**
Adds a recipe to authenticated user's favorites list. Used for undo functionality.

**Request:**
```http
POST /api/favorites
Content-Type: application/json

{
  "recipeId": "uuid"
}
```

**Request Types:**
```typescript
interface AddFavoriteRequest {
  recipeId: string; // UUID format
}
```

**Response (201 Created):**
```typescript
{
  success: true;
  favorite: {
    recipeId: string;
    createdAt: string; // ISO 8601 timestamp
  };
}
```

**Error Responses:**
- `400 Bad Request`: Invalid recipe ID format
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Cannot favorite private recipes from other users
- `404 Not Found`: Recipe not found
- `409 Conflict`: Recipe already in favorites
- `500 Internal Server Error`: Server error

**Usage in Hook:**
```typescript
const response = await fetch('/api/favorites', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ recipeId })
});

if (!response.ok) {
  const errorData = await response.json();
  throw new Error(errorData.message || 'Failed to add to favorites');
}

const data = await response.json();
```

## 8. User Interactions

### 8.1 Initial Page Load

**Interaction Flow:**
1. User navigates to `/favorites`
2. Browser loads `favorites.astro` page
3. AppLayout verifies authentication (redirects if not authenticated when enabled)
4. FavoritesLayout mounts and triggers `useFavorites` hook
5. Hook sets `isLoading = true` and fetches from GET `/api/favorites?page=1&limit=20`
6. During fetch, LoadingSkeletons (12 cards) are displayed
7. On successful response:
   - Hook updates `favorites` and `pagination` state
   - Sets `isLoading = false`
   - FavoritesLayout renders PageHeader with count
   - RecipeGrid displays favorites
   - Pagination appears if `totalPages > 1`
8. On error:
   - Hook sets `error` state with message
   - Error UI displays with retry button

**Expected Outcome:**
User sees their favorited recipes in a grid layout with pagination controls.

### 8.2 Unfavorite Recipe

**Interaction Flow:**
1. User clicks filled heart icon on a recipe card
2. `onFavoriteToggle` callback is invoked with `recipeId`
3. `useFavoriteToggle` hook executes:
   - Checks if recipe is not already toggling (prevent double-click)
   - Sets recipe as "toggling" (shows spinner)
   - Performs optimistic update: removes from favorites set
   - Recipe card fades out or is removed from grid
   - Sends DELETE request to `/api/favorites`
   - Shows toast: "Usunięto z ulubionych" with "Cofnij" button
4. On API success:
   - Keeps optimistic update
   - Recipe remains removed
   - Toast stays visible for 5 seconds
5. On API failure:
   - Rolls back optimistic update
   - Recipe reappears in grid
   - Shows error toast: "Nie udało się usunąć z ulubionych"
6. Recipe removed from "toggling" state

**Special Cases:**
- If last recipe on page is removed and page > 1: Navigate to previous page
- If all favorites are removed: Show empty state
- Update total count in PageHeader

**Expected Outcome:**
Recipe is immediately removed from the display, with option to undo within 5 seconds.

### 8.3 Undo Unfavorite

**Interaction Flow:**
1. Within 5 seconds of unfavorite, user clicks "Cofnij" button in toast
2. `handleUndo` function is called with `recipeId`
3. Function executes:
   - Dismisses the current toast
   - Performs optimistic update: adds back to favorites set
   - Recipe card reappears in grid (possibly at different position)
   - Sends POST request to `/api/favorites` with `recipeId`
4. On API success:
   - Keeps optimistic update
   - Shows success toast: "Przywrócono do ulubionych"
   - Recipe remains in favorites
5. On API failure:
   - Rolls back optimistic update (removes recipe again)
   - Shows error toast: "Nie udało się przywrócić"

**Special Cases:**
- Undo is only available within toast duration (5 seconds)
- Only one undo operation can be active at a time
- If user navigates away, undo is no longer available

**Expected Outcome:**
Recipe is immediately restored to the favorites list.

### 8.4 Paginate Through Favorites

**Interaction Flow:**
1. User sees pagination controls (if `totalPages > 1`)
2. User clicks on a page number or next/previous button
3. `onPageChange` callback is invoked with new page number
4. `useFavorites` hook executes `goToPage`:
   - Updates URL query parameter: `?page={newPage}`
   - Sets `isLoading = true`
   - Fetches from GET `/api/favorites?page={newPage}&limit=20`
5. During fetch, LoadingSkeletons are displayed
6. On successful response:
   - Updates `favorites` and `pagination` state
   - Sets `isLoading = false`
   - RecipeGrid displays new page of recipes
   - Pagination updates current page indicator
   - Page scrolls to top
7. On error:
   - Shows error UI with retry option

**Special Cases:**
- Previous button disabled on page 1
- Next button disabled on last page
- Invalid page number: fetch page 1 instead
- Browser back/forward: reads page from URL and fetches

**Expected Outcome:**
User sees a different page of favorites with updated pagination controls.

### 8.5 View Recipe Details

**Interaction Flow:**
1. User clicks anywhere on recipe card (except heart button)
2. `onClick` handler on card is triggered
3. Browser navigates to `/recipes/{recipeId}`
4. Recipe detail page loads

**Expected Outcome:**
User is taken to the full recipe detail view.

### 8.6 Navigate to Public Recipes (Empty State)

**Interaction Flow:**
1. User has no favorited recipes
2. EmptyFavoritesState component is displayed
3. Component shows:
   - Empty heart icon
   - Message: "Nie masz ulubionych przepisów"
   - Description: "Przeglądaj przepisy i dodaj do ulubionych"
   - Button/link: "Przeglądaj przepisy"
4. User clicks button/link
5. Browser navigates to `/recipes/public`

**Expected Outcome:**
User is taken to the public recipes page where they can discover and favorite recipes.

### 8.7 Retry After Error

**Interaction Flow:**
1. API fetch fails (network error, server error, etc.)
2. Error UI is displayed with error message
3. "Spróbuj ponownie" button is shown
4. User clicks button
5. `refetch` function is called from `useFavorites` hook
6. Sets `error = null` and `isLoading = true`
7. Repeats fetch attempt
8. Shows either favorites or error UI based on result

**Expected Outcome:**
User can retry the failed operation without refreshing the page.

## 9. Conditions and Validation

### 9.1 Display Conditions

#### Loading State
**Condition:** `isLoading === true && error === null`

**Components Shown:**
- PageHeader (with count = 0 or previous count)
- LoadingSkeletons (12 skeleton cards)

**Components Hidden:**
- RecipeGrid
- Pagination
- EmptyFavoritesState
- Error UI

#### Error State
**Condition:** `error !== null`

**Components Shown:**
- PageHeader (with count = 0 or previous count)
- Error message container
- Error icon
- Error text (from `error` state)
- "Spróbuj ponownie" button

**Components Hidden:**
- LoadingSkeletons
- RecipeGrid
- Pagination
- EmptyFavoritesState

#### Empty State
**Condition:** `!isLoading && error === null && favorites.length === 0`

**Components Shown:**
- PageHeader (with count = 0)
- EmptyFavoritesState component

**Components Hidden:**
- LoadingSkeletons
- RecipeGrid
- Pagination
- Error UI

#### Recipe List State
**Condition:** `!isLoading && error === null && favorites.length > 0`

**Components Shown:**
- PageHeader (with actual count from `pagination.total`)
- RecipeGrid with recipe cards
- Pagination (if `pagination.totalPages > 1`)

**Components Hidden:**
- LoadingSkeletons
- EmptyFavoritesState
- Error UI

### 9.2 Recipe Card Conditions

#### Favorite Status
**Condition:** Always `true` on Favorites page

**Effect:**
- Heart icon is filled (red color)
- Clicking toggles to unfavorite action

#### Loading/Toggling Status
**Condition:** `isTogglingRecipe(recipeId) === true`

**Effect:**
- Heart icon replaced with spinner
- Card click events disabled
- Prevents multiple simultaneous toggles

### 9.3 Pagination Conditions

#### Show Pagination
**Condition:** `pagination !== null && pagination.totalPages > 1`

**Effect:**
- Pagination component is rendered

#### Previous Button State
**Condition:** `pagination.page === 1`

**Effect:**
- Previous button disabled
- Previous button has reduced opacity

#### Next Button State
**Condition:** `pagination.page === pagination.totalPages`

**Effect:**
- Next button disabled
- Next button has reduced opacity

#### Current Page Highlight
**Condition:** `pageNumber === pagination.page`

**Effect:**
- Page button has active styling (background color, font weight)

### 9.4 Toast Notification Conditions

#### Show Undo Toast
**Condition:** Recipe was just unfavorited

**Trigger:** After successful optimistic unfavorite update

**Content:**
- Message: "Usunięto z ulubionych"
- Action button: "Cofnij"
- Duration: 5 seconds (auto-dismiss)

#### Show Success Toast (Undo)
**Condition:** Recipe successfully re-favorited via undo

**Trigger:** After successful POST /api/favorites from undo action

**Content:**
- Message: "Przywrócono do ulubionych"
- No action button
- Duration: 3 seconds

#### Show Error Toast
**Condition:** API error during unfavorite or undo

**Trigger:** After API call fails

**Content:**
- Message: Error-specific message (e.g., "Nie udało się usunąć z ulubionych")
- No action button
- Duration: 5 seconds

### 9.5 Page Navigation Validation

#### Valid Page Number
**Validation:** `page >= 1 && page <= pagination.totalPages`

**On Valid:**
- Fetch data for requested page

**On Invalid:**
- Fetch page 1 instead
- Update URL to reflect page 1

#### URL Sync
**Validation:** URL query parameter matches current page state

**On Load:**
- Read `?page=N` from URL
- Validate page number
- Fetch appropriate page

**On Navigation:**
- Update URL with new page number
- Maintain browser history for back/forward navigation

## 10. Error Handling

### 10.1 API Fetch Errors (GET /api/favorites)

#### Network Error (No Connection)
**Scenario:** User is offline or network is unavailable

**Error Message:** "Nie udało się pobrać ulubionych przepisów. Sprawdź połączenie internetowe."

**Handling:**
- Set `error` state with message
- Display error UI with retry button
- Keep previous data if any (show stale data with error banner)

#### 401 Unauthorized
**Scenario:** User session expired or not authenticated

**Error Message:** "Sesja wygasła. Zaloguj się ponownie."

**Handling:**
- When authentication is fully implemented: Redirect to `/login`
- For now: Show error message with login link

#### 500 Internal Server Error
**Scenario:** Server error or database issue

**Error Message:** "Wystąpił błąd serwera. Spróbuj ponownie później."

**Handling:**
- Set `error` state with message
- Display error UI with retry button
- Log error details to console for debugging

#### Timeout Error
**Scenario:** Request takes too long (>30s)

**Error Message:** "Żądanie przekroczyło limit czasu. Spróbuj ponownie."

**Handling:**
- Abort fetch request
- Display error UI with retry button

#### JSON Parse Error
**Scenario:** Invalid response format from server

**Error Message:** "Otrzymano nieprawidłową odpowiedź z serwera."

**Handling:**
- Catch JSON parsing error
- Display generic error UI with retry button
- Log raw response for debugging

### 10.2 Unfavorite Errors (DELETE /api/favorites)

#### Network Error
**Scenario:** Network failure during unfavorite request

**Handling:**
- Rollback optimistic update (recipe reappears)
- Show error toast: "Nie udało się usunąć z ulubionych. Sprawdź połączenie."
- Recipe returns to previous position in grid

#### 404 Not Found
**Scenario:** Recipe was deleted or doesn't exist

**Handling:**
- Keep optimistic update (recipe stays removed)
- Show info toast: "Przepis nie istnieje już w systemie."
- Don't allow undo
- Refresh favorites list to sync with server

#### 403 Forbidden
**Scenario:** Recipe access changed (became private)

**Handling:**
- Keep optimistic update (recipe stays removed)
- Show info toast: "Nie masz już dostępu do tego przepisu."
- Don't allow undo

#### 409 Conflict
**Scenario:** Recipe not in favorites (edge case, shouldn't happen)

**Handling:**
- Keep optimistic update (recipe stays removed)
- Don't show error (expected state achieved)
- Silently succeed

#### 500 Server Error
**Scenario:** Database error or server issue

**Handling:**
- Rollback optimistic update (recipe reappears)
- Show error toast: "Nie udało się usunąć z ulubionych. Spróbuj ponownie."
- Allow retry by clicking heart again

### 10.3 Undo Errors (POST /api/favorites)

#### 409 Conflict (Already Favorited)
**Scenario:** Recipe is already in favorites (edge case from race condition)

**Handling:**
- Keep optimistic update (recipe stays visible)
- Show info toast: "Przepis jest już w ulubionych."
- Consider this a success

#### 404 Not Found (Recipe Deleted)
**Scenario:** Recipe was deleted between unfavorite and undo

**Handling:**
- Rollback optimistic update (remove recipe)
- Show error toast: "Przepis został usunięty i nie można go przywrócić."
- Refresh favorites list

#### 403 Forbidden
**Scenario:** Recipe became private or access was revoked

**Handling:**
- Rollback optimistic update (remove recipe)
- Show error toast: "Nie masz już dostępu do tego przepisu."

#### Network/Server Error
**Scenario:** Network failure or server error during undo

**Handling:**
- Rollback optimistic update (remove recipe again)
- Show error toast: "Nie udało się przywrócić. Spróbuj ponownie."
- Allow manual re-favorite by navigating to recipe and clicking heart

### 10.4 Edge Cases

#### All Favorites Removed
**Scenario:** User unfavorites the last recipe on the page

**Handling:**
1. Recipe is removed via optimistic update
2. Check if `favorites.length === 0`
3. If page > 1: Navigate to previous page
4. If page === 1: Show EmptyFavoritesState
5. Update count in PageHeader to 0

#### Last Recipe on Page Removed
**Scenario:** User unfavorites the only recipe on the current page (not last overall)

**Handling:**
1. Recipe is removed
2. Check if current page is now empty
3. Fetch previous page: `goToPage(currentPage - 1)`
4. Update URL to reflect new page
5. Display new page of favorites

#### Page Number Exceeds Total Pages
**Scenario:** URL contains `?page=10` but only 3 pages exist

**Handling:**
1. Validate page number in `useFavorites` hook
2. If `page > totalPages`: Set page to 1
3. Fetch page 1 data
4. Update URL to `?page=1`
5. Display first page

#### Concurrent Unfavorite/Undo Operations
**Scenario:** User rapidly clicks unfavorite and undo multiple times

**Handling:**
1. Check `isTogglingRecipe(recipeId)` before any operation
2. If already toggling: Return early, ignore click
3. Set toggling state at start of operation
4. Clear toggling state at end (in finally block)
5. Prevents race conditions and duplicate requests

#### Undo After Page Navigation
**Scenario:** User unfavorites recipe, navigates to another page, then tries to undo

**Handling:**
1. Toast notification is tied to component lifecycle
2. Navigating away dismisses active toasts
3. Undo is not available after navigation
4. User must manually re-favorite recipe if needed

#### Browser Back/Forward with Undo Toast Active
**Scenario:** Undo toast is visible when user clicks browser back

**Handling:**
1. Toast component auto-dismisses on route change
2. Undo operation is cancelled
3. Previous page state is restored from API fetch
4. No inconsistency as API is source of truth

#### Recipe Deleted by Owner During View
**Scenario:** Viewing favorites while recipe owner deletes the recipe

**Handling:**
1. Recipe appears in favorites (stale data)
2. On unfavorite attempt: API returns 404
3. Handle as in 10.2 (keep removed, show info toast)
4. On page refresh: Recipe won't appear (API filters it out)

### 10.5 Error Logging

**Client-Side Logging:**
```typescript
console.error('[Favorites Page] Error:', {
  operation: 'fetch|unfavorite|undo',
  recipeId: string | undefined,
  error: error.message,
  stack: error.stack,
  timestamp: new Date().toISOString()
});
```

**User-Friendly Messages:**
- Always show Polish messages to users
- Keep technical details in console logs only
- Provide actionable recovery options (retry buttons, links)

## 11. Implementation Steps

### Step 1: Set Up Toast Library
1. Install Sonner: `npm install sonner`
2. Import Toaster component
3. Add `<Toaster />` to `src/layouts/AppLayout.astro`:
   ```astro
   ---
   // ... existing imports ...
   import { Toaster } from 'sonner';
   ---
   <body>
     <AppHeader ... />
     <main>
       <slot />
     </main>
     <Toaster richColors position="bottom-right" client:load />
   </body>
   ```

### Step 2: Create useFavorites Hook
1. Create file: `src/components/hooks/useFavorites.ts`
2. Implement state management:
   - favorites array
   - pagination metadata
   - loading state
   - error state
3. Implement fetchFavorites function:
   - Call GET /api/favorites with page param
   - Handle response and errors
   - Update state accordingly
4. Implement goToPage function:
   - Update URL query parameter
   - Call fetchFavorites with new page
5. Implement useEffect to:
   - Read page from URL on mount
   - Fetch initial data
6. Export UseFavoritesReturn interface and hook

### Step 3: Create PageHeader Component
1. Create file: `src/components/favorites/PageHeader.tsx`
2. Accept `count: number` as prop
3. Render:
   - Container div with flexbox layout
   - h1 with "Ulubione przepisy"
   - Badge component showing count
   - Optional description paragraph
4. Style with Tailwind classes for responsive layout
5. Export component

### Step 4: Create EmptyFavoritesState Component
1. Create file: `src/components/favorites/EmptyFavoritesState.tsx`
2. Import Heart icon from lucide-react
3. Render centered layout:
   - Large Heart icon (outlined)
   - h2: "Nie masz ulubionych przepisów"
   - p: "Przeglądaj przepisy i dodaj do ulubionych"
   - Button/link to `/recipes/public`: "Przeglądaj przepisy"
4. Style with Tailwind for centered, attractive empty state
5. Export component

### Step 5: Extend useFavoriteToggle Hook for Undo
1. Open `src/components/hooks/useFavoriteToggle.ts`
2. Add undo state tracking:
   ```typescript
   const [lastUnfavorited, setLastUnfavorited] = useState<{
     recipeId: string;
     title: string;
   } | null>(null);
   ```
3. Modify toggleFavorite function:
   - On unfavorite action:
     - Show toast with undo button
     - Store unfavorited recipe info
   - Use Sonner's action API:
     ```typescript
     import { toast } from 'sonner';

     toast('Usunięto z ulubionych', {
       action: {
         label: 'Cofnij',
         onClick: () => handleUndo(recipeId, recipeTitle)
       },
       duration: 5000
     });
     ```
4. Implement handleUndo function:
   - Dismiss current toast
   - Perform optimistic update (add back to favorites)
   - Call POST /api/favorites
   - Show success/error toast based on result
   - Handle errors with rollback
5. Update error handling to show toast.error() for failures

### Step 6: Create FavoritesLayout Component
1. Create file: `src/components/favorites/FavoritesLayout.tsx`
2. Import all necessary components and hooks
3. Implement component:
   ```typescript
   const FavoritesLayout = () => {
     // Initialize hooks
     const {
       favorites,
       pagination,
       isLoading,
       error,
       refetch,
       goToPage
     } = useFavorites();

     const {
       favorites: favoriteIds,
       toggleFavorite,
       isTogglingRecipe
     } = useFavoriteToggle({
       initialFavorites: new Set(favorites.map(f => f.recipeId))
     });

     // Transform FavoriteDTO to RecipeCardData
     const recipeCards: RecipeCardData[] = favorites.map(fav => ({
       id: fav.recipe.id,
       title: fav.recipe.title,
       description: fav.recipe.description,
       nutritionPerServing: fav.recipe.nutritionPerServing,
       prepTimeMinutes: fav.recipe.prepTimeMinutes,
       primaryTag: null // MVP: tags not included in FavoriteDTO
     }));

     // Render based on state
     return (
       <div className="container mx-auto p-4 lg:p-6">
         <PageHeader count={pagination?.total ?? 0} />

         {isLoading && !error && (
           <LoadingSkeletons count={12} />
         )}

         {error && (
           <ErrorState error={error} onRetry={refetch} />
         )}

         {!isLoading && !error && favorites.length === 0 && (
           <EmptyFavoritesState />
         )}

         {!isLoading && !error && favorites.length > 0 && (
           <>
             <RecipeGrid
               recipes={recipeCards}
               favoriteRecipeIds={favoriteIds}
               onFavoriteToggle={toggleFavorite}
               isTogglingRecipe={isTogglingRecipe}
               showAuthorBadge={false}
               isPublicView={false}
             />

             {pagination && pagination.totalPages > 1 && (
               <Pagination
                 pagination={pagination}
                 onPageChange={goToPage}
               />
             )}
           </>
         )}
       </div>
     );
   };
   ```
4. Export component

### Step 7: Create Astro Page
1. Create file: `src/pages/favorites.astro`
2. Import AppLayout and FavoritesLayout
3. Implement page:
   ```astro
   ---
   import AppLayout from "@/layouts/AppLayout.astro";
   import FavoritesLayout from "@/components/favorites/FavoritesLayout";

   const title = "Ulubione przepisy - HealthyMeal";
   ---

   <AppLayout title={title}>
     <FavoritesLayout client:load />
   </AppLayout>
   ```

### Step 8: Create Error State Component (Optional)
1. Create file: `src/components/favorites/ErrorState.tsx`
2. Accept error message and retry callback as props
3. Render:
   - Error icon
   - Error message
   - "Spróbuj ponownie" button
4. Style with red/error theme colors
5. Export component

### Step 9: Test All States
1. **Loading State:**
   - Navigate to `/favorites`
   - Observe loading skeletons
   - Verify smooth transition to content

2. **Empty State:**
   - Ensure no favorites exist
   - Verify EmptyFavoritesState displays
   - Test link to public recipes page

3. **Favorites List:**
   - Add several favorites
   - Verify grid display
   - Check recipe card information accuracy
   - Test responsive layout on mobile/tablet/desktop

4. **Unfavorite Action:**
   - Click heart on recipe card
   - Verify immediate removal (optimistic update)
   - Verify toast appears with undo button
   - Wait for toast to auto-dismiss

5. **Undo Action:**
   - Unfavorite a recipe
   - Click "Cofnij" in toast before it dismisses
   - Verify recipe reappears immediately
   - Verify success toast appears

6. **Pagination:**
   - Add 21+ favorites (more than one page)
   - Verify pagination controls appear
   - Test page navigation
   - Verify URL updates with page parameter
   - Test browser back/forward buttons
   - Test previous/next buttons
   - Verify disabled states on first/last page

7. **Error Scenarios:**
   - Simulate network error (disconnect)
   - Verify error message and retry button
   - Test retry functionality
   - Simulate 500 error
   - Test unfavorite error handling
   - Test undo error handling

8. **Edge Cases:**
   - Unfavorite last recipe on page 2+ (should go to previous page)
   - Unfavorite all recipes (should show empty state)
   - Rapid clicking heart button (should prevent duplicate requests)
   - Invalid page in URL (should redirect to page 1)

### Step 10: Accessibility Testing
1. **Keyboard Navigation:**
   - Tab through all interactive elements
   - Verify focus indicators are visible
   - Test Enter/Space on recipe cards
   - Test Enter/Space on heart button
   - Test pagination with keyboard

2. **Screen Reader:**
   - Test with VoiceOver (Mac) or NVDA (Windows)
   - Verify page title is announced
   - Verify recipe count is announced
   - Verify "Usunięto z ulubionych" is announced
   - Verify empty state message is read
   - Verify pagination controls are labeled

3. **ARIA Attributes:**
   - Verify heart button has aria-label
   - Verify loading spinner has aria-live region
   - Verify toast notifications are announced

### Step 11: Performance Optimization
1. **Memoization:**
   - Memoize recipeCards transformation with useMemo
   - Memoize expensive computations

2. **Lazy Loading:**
   - Ensure recipe cards use lazy loading for any images (future)
   - Consider virtual scrolling if performance issues arise

3. **API Optimization:**
   - Verify API returns minimal necessary data
   - Consider caching favorites in React Query (future enhancement)

### Step 12: Polish and Refinement
1. Review all Polish language strings for correctness
2. Ensure consistent styling with rest of application
3. Verify all Tailwind classes follow project conventions
4. Add loading animations/transitions if needed
5. Test on various screen sizes and devices
6. Verify print stylesheet (if applicable)

### Step 13: Documentation
1. Add JSDoc comments to all components
2. Document props interfaces thoroughly
3. Add usage examples in component files
4. Update project README if needed
5. Document any new environment variables or configuration

### Step 14: Code Review Preparation
1. Run linter: `npm run lint`
2. Fix any linting issues: `npm run lint:fix`
3. Format code: `npm run format`
4. Run type checker: `npx tsc --noEmit`
5. Test build: `npm run build`
6. Review git diff before committing
7. Write descriptive commit message

---

## Summary

This implementation plan provides a complete blueprint for creating the Favorites Page view. The page will be simpler than the My Recipes page, focusing on displaying favorited recipes with pagination and unfavorite functionality with undo support. The implementation leverages existing components (RecipeCard, Pagination, LoadingSkeletons) while creating new focused components (FavoritesLayout, PageHeader, EmptyFavoritesState) and custom hooks (useFavorites) to manage state and API interactions.

Key architectural decisions:
- Dedicated FavoritesLayout instead of reusing RecipeListLayout (simpler, focused component)
- Custom useFavorites hook for clean separation of concerns
- Sonner toast library for undo notifications
- Optimistic UI updates for smooth user experience
- URL-based pagination for shareable links and browser navigation
- Comprehensive error handling at each layer

The implementation follows established patterns in the codebase, maintains consistency with existing components, and prioritizes user experience with loading states, error recovery, and accessibility support.
