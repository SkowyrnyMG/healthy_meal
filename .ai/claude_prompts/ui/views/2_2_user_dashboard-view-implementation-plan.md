# View Implementation Plan: User Dashboard

## 1. Overview

The User Dashboard is a post-login landing page that serves as the main navigation hub for authenticated users. It provides quick access to user's own recipes, favorited recipes, and public recipes for inspiration. The dashboard is designed to minimize the time needed to reach any destination in the application while providing personalized content based on user activity.

**Key Features:**
- Personalized welcome banner with user's name
- Display of last 4-6 user-created recipes
- Display of last 4-6 favorited recipes
- Display of 4-6 random public recipes (refreshed on each page load)
- Quick action button for adding new recipes
- Empty states with encouraging messages
- Optimistic UI for favorite toggles
- Responsive design with horizontal scrolling on mobile and grid layout on desktop

## 2. View Routing

**Path:** `/dashboard`

**Authentication:** Required (redirect to `/login` if not authenticated)

**Access:** Available to all authenticated users

## 3. Component Structure

```
src/pages/dashboard.astro (Server-rendered page)
└── Components:
    ├── WelcomeBanner (React)
    │   └── Button (Shadcn/ui)
    ├── RecipeSectionRow (React) - "Twoje przepisy"
    │   ├── RecipeCard[] (React)
    │   └── Link - "Zobacz wszystkie"
    ├── RecipeSectionRow (React) - "Ulubione"
    │   └── RecipeCard[] (React)
    └── RecipeSectionRow (React) - "Inspiracje"
        └── RecipeCard[] (React)
```

## 4. Component Details

### 4.1 DashboardPage (`src/pages/dashboard.astro`)

**Component Description:**
Server-rendered Astro page that fetches all required data in parallel and orchestrates the dashboard layout. Handles authentication, data fetching, error states, and passes data to React components.

**Main Elements:**
- HTML structure with proper semantic markup
- Main container with max-width constraint
- Section containers for different recipe categories
- Footer component

**Server-Side Logic:**
1. Check user authentication via Supabase session
2. Fetch user profile (for welcome name)
3. Fetch user's recent recipes (limit: 6)
4. Fetch user's favorite recipes (limit: 6)
5. Fetch public recipes (limit: 20 for randomization)
6. Handle errors gracefully
7. Transform data to appropriate formats
8. Pass data to client components

**Handled Events:**
- None (server-side only)

**Validation Conditions:**
- User must be authenticated (redirect to `/login` if not)
- Handle missing profile gracefully (null name)
- Handle empty recipe lists (show empty states)

**Types:**
- `DashboardData` (custom type for server data)
- `RecipeListItemDTO` (from types.ts)
- `FavoriteDTO` (from types.ts)
- `ProfileDTO` (from types.ts)

**Props:**
- None (this is a page component)

### 4.2 WelcomeBanner (`src/components/WelcomeBanner.tsx`)

**Component Description:**
React component displaying a personalized greeting message with the user's name and a prominent call-to-action button for adding new recipes.

**Main Elements:**
- Container `<div>` with padding and background
- Heading `<h1>` with greeting text: "Witaj, {name}!" or "Witaj!" if no name
- Subheading `<p>` with welcome message
- Button (Shadcn/ui) with "+ Dodaj przepis" text and plus icon

**Handled Events:**
- Button click: Navigate to `/recipes/new` using `window.location.href` or Next-style router

**Validation Conditions:**
- None

**Types:**
```typescript
interface WelcomeBannerProps {
  userName: string | null;
}
```

**Props:**
- `userName` (string | null): User's name from profile or auth metadata

### 4.3 RecipeSectionRow (`src/components/RecipeSectionRow.tsx`)

**Component Description:**
Reusable React component that displays a horizontal scrolling row of recipe cards with a section title and "View All" link. Handles empty states with custom messages.

**Main Elements:**
- Container `<div>` with section padding
- Header `<div>` with flex layout
  - Section title `<h2>`
  - "Zobacz wszystkie" link (conditional, only if recipes exist)
- Horizontal scroll container `<div>` with CSS scroll-snap
  - Recipe cards (mapped from recipes array)
- Empty state `<div>` (conditional, when no recipes)
  - Empty message `<p>`
  - Action button (conditional, based on section type)

**Handled Events:**
- Scroll: Native browser horizontal scroll with touch support
- Keyboard navigation: Arrow keys for scrolling (accessibility)

**Validation Conditions:**
- If `recipes.length === 0`, show empty state
- If `viewAllLink` is provided and recipes exist, show "Zobacz wszystkie" link

**Types:**
```typescript
interface RecipeSectionRowProps {
  title: string;
  recipes: RecipeCardData[];
  viewAllLink?: string;
  emptyMessage: string;
  emptyActionButton?: {
    text: string;
    href: string;
  };
  onFavoriteToggle: (recipeId: string) => Promise<void>;
  favoriteRecipeIds: Set<string>;
}

interface RecipeCardData {
  id: string;
  title: string;
  description: string | null;
  nutritionPerServing: NutritionDTO;
  prepTimeMinutes: number | null;
  primaryTag: TagDTO | null;
}
```

**Props:**
- `title`: Section heading text
- `recipes`: Array of recipe data for cards
- `viewAllLink`: Optional URL for "View All" link
- `emptyMessage`: Message to display when no recipes
- `emptyActionButton`: Optional button config for empty state
- `onFavoriteToggle`: Callback for favorite toggle
- `favoriteRecipeIds`: Set of recipe IDs that are favorited

### 4.4 RecipeCard (`src/components/RecipeCard.tsx`)

**Component Description:**
Interactive React component displaying a summarized recipe card with key information, favorite toggle, and navigation to recipe detail. Features a colored placeholder with recipe initial and icon, nutrition badges, and quick actions.

**Main Elements:**
- Card container `<div>` with shadow and hover effects
- Colored placeholder `<div>` with:
  - Recipe title initial letter
  - Recipe icon (from lucide-react)
  - Background color based on recipe title hash
- Content section `<div>`:
  - Recipe title `<h3>` with line-clamp-2 truncation
  - Calorie badge (Shadcn/ui Badge) with color coding
  - Protein amount `<span>` with icon
  - Prep time `<span>` with clock icon
  - Primary tag badge (Shadcn/ui Badge)
- Actions section `<div>`:
  - Favorite heart button (Shadcn/ui Button) - filled if favorited
  - Menu button (Shadcn/ui Button) with "..." icon

**Handled Events:**
- Card click: Navigate to `/recipes/{id}`
- Favorite button click: Call `onFavoriteToggle(recipeId)`, prevent event bubbling
- Menu button click: Open dropdown menu (future feature), prevent event bubbling

**Validation Conditions:**
- None (all data should be validated before reaching component)

**Types:**
```typescript
interface RecipeCardProps {
  recipe: RecipeCardData;
  isFavorited: boolean;
  onFavoriteToggle: (recipeId: string) => Promise<void>;
  isLoading?: boolean;
}
```

**Props:**
- `recipe`: Recipe data object
- `isFavorited`: Whether recipe is in user's favorites
- `onFavoriteToggle`: Callback for favorite toggle
- `isLoading`: Optional loading state for favorite toggle

## 5. Types

### 5.1 Existing DTOs (from `src/types.ts`)

**ProfileDTO**
```typescript
interface ProfileDTO {
  userId: string;
  weight: number | null;
  age: number | null;
  gender: string | null;
  activityLevel: string | null;
  dietType: string | null;
  targetGoal: string | null;
  targetValue: number | null;
  createdAt: string;
  updatedAt: string;
}
```

**RecipeListItemDTO**
```typescript
interface RecipeListItemDTO {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  servings: number;
  prepTimeMinutes: number | null;
  isPublic: boolean;
  featured: boolean;
  nutritionPerServing: NutritionDTO;
  tags: TagDTO[];
  createdAt: string;
  updatedAt: string;
}
```

**FavoriteDTO**
```typescript
interface FavoriteDTO {
  recipeId: string;
  recipe: {
    id: string;
    title: string;
    description: string | null;
    nutritionPerServing: NutritionDTO;
    prepTimeMinutes: number | null;
  };
  createdAt: string;
}
```

**NutritionDTO**
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

**TagDTO**
```typescript
interface TagDTO {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}
```

**PaginationDTO**
```typescript
interface PaginationDTO {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
```

### 5.2 New ViewModels

**DashboardData** - Server-side data structure
```typescript
interface DashboardData {
  userName: string | null;
  userRecipes: RecipeListItemDTO[];
  favoriteRecipes: FavoriteDTO[];
  publicRecipes: RecipeListItemDTO[];
  errors?: {
    profile?: string;
    userRecipes?: string;
    favorites?: string;
    publicRecipes?: string;
  };
}
```
- `userName`: User's display name from profile or auth, null if not available
- `userRecipes`: Array of user's recently created recipes (max 6)
- `favoriteRecipes`: Array of user's favorited recipes (max 6)
- `publicRecipes`: Array of random public recipes (20 fetched, 6 displayed after shuffle)
- `errors`: Optional error messages per data source for debugging/logging

**RecipeCardData** - Unified recipe card data
```typescript
interface RecipeCardData {
  id: string;
  title: string;
  description: string | null;
  nutritionPerServing: NutritionDTO;
  prepTimeMinutes: number | null;
  primaryTag: TagDTO | null;
}
```
- `id`: Recipe UUID
- `title`: Recipe title (truncated to 2 lines in UI)
- `description`: Recipe description (not displayed on card, but available)
- `nutritionPerServing`: Nutrition information (calories, protein, etc.)
- `prepTimeMinutes`: Preparation time in minutes, null if not specified
- `primaryTag`: First tag from recipe's tags array, null if no tags

This type unifies `RecipeListItemDTO` and `FavoriteDTO` for use in RecipeCard component.

## 6. State Management

### 6.1 Server State (Astro Page)

The dashboard page fetches all data server-side during page load:

```typescript
// Parallel data fetching
const [profileResult, userRecipesResult, favoritesResult, publicRecipesResult] =
  await Promise.allSettled([
    fetch('/api/profile'),
    fetch('/api/recipes?limit=6&sortBy=createdAt&sortOrder=desc'),
    fetch('/api/favorites?limit=6'),
    fetch('/api/recipes/public?limit=20&sortBy=createdAt&sortOrder=desc')
  ]);
```

**Data Transformations:**
1. Extract user name from profile (fallback to null if not available)
2. Transform RecipeListItemDTO to RecipeCardData (extract primary tag)
3. Transform FavoriteDTO to RecipeCardData (map nested recipe object)
4. Shuffle public recipes and take first 6
5. Create Set of favorite recipe IDs for quick lookup

### 6.2 Client State (React Hooks)

**Custom Hook: `useFavoriteToggle`**

Location: `src/components/hooks/useFavoriteToggle.ts`

```typescript
interface UseFavoriteToggleOptions {
  initialFavorites: Set<string>;
}

interface UseFavoriteToggleReturn {
  favorites: Set<string>;
  toggleFavorite: (recipeId: string) => Promise<void>;
  isTogglingRecipe: (recipeId: string) => boolean;
}

function useFavoriteToggle(options: UseFavoriteToggleOptions): UseFavoriteToggleReturn
```

**Purpose:**
- Manages optimistic UI updates for favorite toggle
- Handles API calls to add/remove favorites
- Rolls back state on API errors
- Tracks loading state per recipe

**Implementation:**
1. Initialize state with `initialFavorites` Set
2. On toggle:
   - Determine action (add or remove based on current state)
   - Optimistically update local state
   - Make API call (POST or DELETE)
   - On error: Rollback state, show error toast
   - On success: Keep optimistic update
3. Track loading recipes in separate Set
4. Provide `isTogglingRecipe(id)` helper for loading indicators

## 7. API Integration

### 7.1 GET /api/profile

**Purpose:** Fetch user's profile for display name in welcome banner

**Request:**
- Method: GET
- URL: `/api/profile`
- Headers: Authentication cookie (handled by Supabase client)
- Body: None

**Response (200 OK):**
```typescript
ProfileDTO
```

**Error Responses:**
- 401 Unauthorized: Not authenticated → Redirect to /login
- 404 Not Found: Profile not found → Use null for userName

**Frontend Handling:**
- Fetch server-side in Astro page
- Extract user name (note: ProfileDTO doesn't have name field, will need to check Supabase auth)
- Fallback to null if profile not found
- Pass to WelcomeBanner component

### 7.2 GET /api/recipes

**Purpose:** Fetch user's recently created recipes

**Request:**
- Method: GET
- URL: `/api/recipes?limit=6&sortBy=createdAt&sortOrder=desc`
- Query Parameters:
  - `limit=6`: Show last 6 recipes
  - `sortBy=createdAt`: Sort by creation date
  - `sortOrder=desc`: Newest first
- Headers: Authentication cookie

**Response (200 OK):**
```typescript
{
  recipes: RecipeListItemDTO[];
  pagination: PaginationDTO;
}
```

**Error Responses:**
- 400 Bad Request: Invalid parameters → Show error state
- 401 Unauthorized: Not authenticated → Redirect to /login

**Frontend Handling:**
- Fetch server-side in Astro page
- Transform RecipeListItemDTO[] to RecipeCardData[]
- Extract primary tag (first from tags array)
- Pass to RecipeSectionRow component
- Show empty state if recipes.length === 0

### 7.3 GET /api/favorites

**Purpose:** Fetch user's favorited recipes

**Request:**
- Method: GET
- URL: `/api/favorites?limit=6`
- Query Parameters:
  - `limit=6`: Show last 6 favorites
- Headers: Authentication cookie

**Response (200 OK):**
```typescript
{
  favorites: FavoriteDTO[];
  pagination: PaginationDTO;
}
```

**Error Responses:**
- 400 Bad Request: Invalid parameters → Show error state
- 401 Unauthorized: Not authenticated → Redirect to /login

**Frontend Handling:**
- Fetch server-side in Astro page
- Transform FavoriteDTO[] to RecipeCardData[]
- Extract recipe data from nested structure
- Create Set of favorite recipe IDs
- Pass to RecipeSectionRow component
- Show empty state if favorites.length === 0

### 7.4 GET /api/recipes/public

**Purpose:** Fetch public recipes for inspiration section

**Request:**
- Method: GET
- URL: `/api/recipes/public?limit=20&sortBy=createdAt&sortOrder=desc`
- Query Parameters:
  - `limit=20`: Fetch more for randomization
  - `sortBy=createdAt`: Sort by creation date
  - `sortOrder=desc`: Newest first
- Headers: Authentication cookie

**Response (200 OK):**
```typescript
{
  recipes: RecipeListItemDTO[];
  pagination: PaginationDTO;
}
```

**Error Responses:**
- 400 Bad Request: Invalid parameters → Show error state
- 401 Unauthorized: Not authenticated → Redirect to /login

**Frontend Handling:**
- Fetch server-side in Astro page (20 recipes)
- Shuffle array using Fisher-Yates algorithm
- Take first 6 recipes
- Transform to RecipeCardData[]
- Pass to RecipeSectionRow component
- Show empty state if no recipes (unlikely)

### 7.5 POST /api/favorites

**Purpose:** Add recipe to user's favorites

**Request:**
- Method: POST
- URL: `/api/favorites`
- Headers: Authentication cookie, Content-Type: application/json
- Body:
```typescript
{
  recipeId: string; // UUID
}
```

**Response (201 Created):**
```typescript
{
  success: true;
  favorite: {
    recipeId: string;
    createdAt: string;
  };
}
```

**Error Responses:**
- 400 Bad Request: Invalid recipeId format
- 401 Unauthorized: Not authenticated
- 403 Forbidden: Recipe is private and belongs to another user
- 404 Not Found: Recipe not found
- 409 Conflict: Recipe already in favorites

**Frontend Handling:**
- Call from useFavoriteToggle hook
- Optimistic update: Add to favorites Set immediately
- On error: Rollback, show toast with error message
- On success: Keep optimistic update

### 7.6 DELETE /api/favorites/{recipeId}

**Purpose:** Remove recipe from user's favorites

**Request:**
- Method: DELETE
- URL: `/api/favorites/{recipeId}`
- Path Parameters:
  - `recipeId`: Recipe UUID to remove
- Headers: Authentication cookie

**Response (204 No Content):**
- Empty response body

**Error Responses:**
- 400 Bad Request: Invalid recipeId format
- 401 Unauthorized: Not authenticated
- 403 Forbidden: Recipe belongs to another user
- 404 Not Found: Recipe not found or not in favorites

**Frontend Handling:**
- Call from useFavoriteToggle hook
- Optimistic update: Remove from favorites Set immediately
- On error: Rollback, show toast with error message
- On success: Keep optimistic update

## 8. User Interactions

### 8.1 View Dashboard

**Flow:**
1. User navigates to `/dashboard` or is redirected after login
2. Server checks authentication (redirect to `/login` if not authenticated)
3. Server fetches all data in parallel:
   - User profile
   - User's recent recipes (6)
   - User's favorite recipes (6)
   - Public recipes (20, shuffled to 6)
4. Server renders page with data
5. Browser displays dashboard with all sections
6. User sees personalized content

**Expected Outcome:**
- Dashboard loads with all sections populated
- Empty states shown for sections with no data
- Page is fully interactive

### 8.2 Toggle Favorite (Add)

**Flow:**
1. User clicks heart icon on unfavorited recipe card
2. useFavoriteToggle hook immediately updates local state (optimistic)
3. Heart icon fills with color
4. API call: POST /api/favorites with recipeId
5. On success: State remains updated
6. On error: State rolls back, heart unfills, error toast shows

**Expected Outcome:**
- Immediate visual feedback (filled heart)
- Recipe added to favorites
- Or error message if operation fails

### 8.3 Toggle Favorite (Remove)

**Flow:**
1. User clicks filled heart icon on favorited recipe card
2. useFavoriteToggle hook immediately updates local state (optimistic)
3. Heart icon unfills
4. API call: DELETE /api/favorites/{recipeId}
5. On success: State remains updated
6. On error: State rolls back, heart refills, error toast shows

**Expected Outcome:**
- Immediate visual feedback (unfilled heart)
- Recipe removed from favorites
- Or error message if operation fails

### 8.4 Navigate to Recipe Detail

**Flow:**
1. User clicks on recipe card (anywhere except heart/menu buttons)
2. Browser navigates to `/recipes/{recipeId}`
3. Recipe detail page loads

**Expected Outcome:**
- User views full recipe details

### 8.5 Add New Recipe

**Flow:**
1. User clicks "+ Dodaj przepis" button in WelcomeBanner
2. Browser navigates to `/recipes/new`
3. Recipe creation form loads

**Expected Outcome:**
- User can create a new recipe

### 8.6 View All Recipes in Section

**Flow:**
1. User clicks "Zobacz wszystkie" link in section header
2. Browser navigates to appropriate list page:
   - User recipes: `/recipes` (with user filter)
   - Favorites: `/favorites`
   - Public recipes: `/recipes/public`
3. Full list page loads with pagination

**Expected Outcome:**
- User sees complete list of recipes for that category

### 8.7 Horizontal Scroll on Mobile

**Flow:**
1. User swipes/drags horizontally on recipe section
2. Container scrolls to reveal more recipe cards
3. Scroll snaps to card boundaries for clean alignment

**Expected Outcome:**
- Smooth horizontal scrolling
- Cards align properly after scroll

### 8.8 Keyboard Navigation

**Flow:**
1. User focuses on recipe section (Tab key)
2. User presses Left/Right arrow keys
3. Section scrolls horizontally

**Expected Outcome:**
- Accessible navigation without mouse
- Smooth scrolling with keyboard

## 9. Conditions and Validation

### 9.1 Authentication

**Condition:** User must be authenticated to view dashboard

**Validation:**
- Server-side: Check Supabase session in Astro page
- If not authenticated: Redirect to `/login`
- If authenticated: Proceed with data fetching

**Affected Components:**
- dashboard.astro (page level)

**Interface Impact:**
- Unauthenticated users cannot access dashboard
- Automatic redirect to login page

### 9.2 Empty User Recipes

**Condition:** User has no created recipes yet

**Validation:**
- Check `userRecipes.length === 0`

**Affected Components:**
- RecipeSectionRow ("Twoje przepisy")

**Interface Impact:**
- Show empty state message: "Nie masz jeszcze przepisów"
- Show action button: "+ Dodaj pierwszy przepis" (links to `/recipes/new`)
- Hide "Zobacz wszystkie" link

### 9.3 Empty Favorite Recipes

**Condition:** User has no favorited recipes

**Validation:**
- Check `favoriteRecipes.length === 0`

**Affected Components:**
- RecipeSectionRow ("Ulubione")

**Interface Impact:**
- Show empty state message: "Nie masz ulubionych przepisów"
- Show suggestion: "Przeglądaj przepisy, aby dodać ulubione"
- Hide "Zobacz wszystkie" link

### 9.4 Empty Public Recipes

**Condition:** No public recipes available (unlikely)

**Validation:**
- Check `publicRecipes.length === 0`

**Affected Components:**
- RecipeSectionRow ("Inspiracje")

**Interface Impact:**
- Show empty state message: "Brak dostępnych przepisów publicznych"
- No action button
- Hide "Zobacz wszystkie" link

### 9.5 Missing User Name

**Condition:** User profile doesn't exist or doesn't contain name

**Validation:**
- Check `userName === null`

**Affected Components:**
- WelcomeBanner

**Interface Impact:**
- Show generic greeting: "Witaj!" instead of "Witaj, {name}!"

### 9.6 Calorie Badge Color

**Condition:** Color-code calorie badge based on value

**Validation:**
- Low (green): calories < 300
- Medium (yellow): 300 ≤ calories ≤ 600
- High (red): calories > 600

**Affected Components:**
- RecipeCard

**Interface Impact:**
- Badge background color changes based on calorie range
- Helps users quickly identify calorie content

### 9.7 Recipe Title Truncation

**Condition:** Recipe title is too long

**Validation:**
- Apply CSS `line-clamp-2` to title element

**Affected Components:**
- RecipeCard

**Interface Impact:**
- Title truncates to 2 lines with ellipsis
- Prevents card layout breaking

### 9.8 Missing Primary Tag

**Condition:** Recipe has no tags

**Validation:**
- Check `primaryTag === null`

**Affected Components:**
- RecipeCard

**Interface Impact:**
- Tag badge is not displayed
- No visual gap (conditional rendering)

### 9.9 Favorite Toggle Loading

**Condition:** Favorite API call is in progress

**Validation:**
- Check `isTogglingRecipe(recipeId)` from hook

**Affected Components:**
- RecipeCard

**Interface Impact:**
- Heart button shows loading spinner
- Button is disabled during operation
- Prevents double-clicks

## 10. Error Handling

### 10.1 Authentication Error

**Scenario:** User session is invalid or expired

**Detection:**
- Server-side: Supabase auth check fails
- API responses: 401 Unauthorized

**Handling:**
- Redirect to `/login` page
- Clear any stale session data
- Show message: "Sesja wygasła. Zaloguj się ponownie."

**User Experience:**
- Seamless redirect to login
- Preserve intended destination (redirect back to dashboard after login)

### 10.2 Network Error

**Scenario:** API request fails due to network issues

**Detection:**
- Fetch throws network error
- Timeout occurs

**Handling:**
- Log error to console
- Show error toast: "Błąd połączenia. Sprawdź internet."
- For server-side errors: Show error state in section
- For client-side errors: Keep existing state, allow retry

**User Experience:**
- Clear error message
- Retry option when applicable
- Degraded but functional UI

### 10.3 Profile Fetch Error

**Scenario:** GET /api/profile fails (404 or 500)

**Detection:**
- 404: Profile not found
- 500: Server error

**Handling:**
- Log error
- For 404: Use null userName (generic greeting)
- For 500: Use null userName, log error
- Don't block page load

**User Experience:**
- Dashboard loads normally
- Generic greeting instead of personalized

### 10.4 Recipe Fetch Error

**Scenario:** GET /api/recipes or /api/recipes/public fails

**Detection:**
- 400: Invalid parameters (shouldn't happen with hardcoded params)
- 500: Server error

**Handling:**
- Log error with context
- Show empty state in affected section
- Include error message in empty state
- Don't affect other sections

**User Experience:**
- Section shows empty state
- Error message: "Nie udało się załadować przepisów"
- Other sections load normally

### 10.5 Favorites Fetch Error

**Scenario:** GET /api/favorites fails

**Detection:**
- 400: Invalid parameters
- 500: Server error

**Handling:**
- Log error
- Show empty state in favorites section
- Initialize favoriteRecipeIds as empty Set
- Heart icons default to unfilled

**User Experience:**
- Favorites section shows empty state
- Heart icons still functional (can add favorites)
- Error message in section

### 10.6 Add Favorite Error

**Scenario:** POST /api/favorites fails

**Detection:**
- 400: Invalid recipeId
- 403: Recipe not accessible
- 404: Recipe not found
- 409: Already favorited (shouldn't happen with optimistic UI)
- 500: Server error

**Handling:**
- Rollback optimistic update (remove from Set)
- Show error toast with specific message:
  - 403: "Nie można dodać prywatnego przepisu innego użytkownika"
  - 404: "Przepis nie został znaleziony"
  - Other: "Nie udało się dodać do ulubionych"
- Log error with context

**User Experience:**
- Heart icon reverts to unfilled
- Clear error message
- Can retry operation

### 10.7 Remove Favorite Error

**Scenario:** DELETE /api/favorites/{recipeId} fails

**Detection:**
- 400: Invalid recipeId
- 403: Recipe not accessible
- 404: Recipe not found or not in favorites
- 500: Server error

**Handling:**
- Rollback optimistic update (add back to Set)
- Show error toast:
  - 404: "Przepis nie jest w ulubionych"
  - Other: "Nie udało się usunąć z ulubionych"
- Log error with context

**User Experience:**
- Heart icon reverts to filled
- Clear error message
- Can retry operation

### 10.8 Public Recipes Randomization Edge Case

**Scenario:** Less than 6 public recipes available

**Detection:**
- Check publicRecipes.length after fetch

**Handling:**
- Display all available recipes (no error)
- Don't attempt to shuffle to 6 if fewer exist
- Normal rendering

**User Experience:**
- Section shows whatever recipes are available
- No error message needed

### 10.9 Long Recipe Titles

**Scenario:** Recipe title exceeds card space

**Detection:**
- CSS line-clamp handles automatically

**Handling:**
- Title truncates to 2 lines
- Ellipsis indicates truncation
- Full title visible on hover (via title attribute)

**User Experience:**
- Clean card layout
- No overflow
- Tooltip shows full title

### 10.10 Missing Nutrition Data

**Scenario:** Recipe has null or incomplete nutrition data (shouldn't happen with API validation)

**Detection:**
- Check nutritionPerServing fields

**Handling:**
- Display "N/A" or "—" for missing values
- Don't break layout
- Log warning if data is missing

**User Experience:**
- Graceful degradation
- Clear indication of missing data

## 11. Implementation Steps

### Step 1: Create Custom Hook for Favorite Toggle

**File:** `src/components/hooks/useFavoriteToggle.ts`

**Tasks:**
1. Create TypeScript file with hook implementation
2. Define interfaces: `UseFavoriteToggleOptions`, `UseFavoriteToggleReturn`
3. Implement useState for favorites Set and loading Set
4. Implement toggleFavorite function:
   - Determine action (add/remove)
   - Optimistic update
   - API call with try/catch
   - Error handling with rollback
5. Implement isTogglingRecipe helper
6. Export hook
7. Add JSDoc comments

**Dependencies:**
- React (useState)
- Fetch API

### Step 2: Create RecipeCard Component

**File:** `src/components/RecipeCard.tsx`

**Tasks:**
1. Create React component with TypeScript
2. Define RecipeCardProps interface
3. Implement card layout with Tailwind classes
4. Create colored placeholder:
   - Extract first letter of title
   - Hash title to generate consistent color
   - Add recipe icon from lucide-react
5. Add nutrition badges:
   - Calorie badge with color coding (green/yellow/red)
   - Protein display with icon
   - Prep time with clock icon
6. Add primary tag badge (conditional)
7. Implement favorite button:
   - Heart icon (filled/unfilled based on isFavorited)
   - Click handler with event.stopPropagation()
   - Loading state
8. Implement card click handler (navigate to recipe detail)
9. Add responsive styles (mobile vs desktop)
10. Add accessibility attributes (ARIA labels, roles)
11. Export component

**Dependencies:**
- React
- Shadcn/ui (Button, Badge)
- lucide-react (Heart, Clock, icons)
- Tailwind CSS
- RecipeCardData type

### Step 3: Create RecipeSectionRow Component

**File:** `src/components/RecipeSectionRow.tsx`

**Tasks:**
1. Create React component with TypeScript
2. Define RecipeSectionRowProps interface
3. Implement section header:
   - Title heading
   - "Zobacz wszystkie" link (conditional)
4. Implement horizontal scroll container:
   - CSS scroll-snap
   - Overflow-x-auto
   - Touch-friendly scrolling
5. Map recipes to RecipeCard components
6. Implement empty state:
   - Empty message
   - Optional action button
   - Conditional rendering
7. Add keyboard navigation support (arrow keys)
8. Add responsive grid vs scroll (Tailwind breakpoints)
9. Export component

**Dependencies:**
- React
- RecipeCard component
- RecipeSectionRowProps interface

### Step 4: Create WelcomeBanner Component

**File:** `src/components/WelcomeBanner.tsx`

**Tasks:**
1. Create React component with TypeScript
2. Define WelcomeBannerProps interface
3. Implement greeting heading:
   - Conditional text based on userName
   - "Witaj, {name}!" or "Witaj!"
4. Add welcome subheading
5. Implement "+ Dodaj przepis" button:
   - Shadcn/ui Button
   - Plus icon
   - Click handler (navigate to /recipes/new)
6. Add styling with Tailwind
7. Export component

**Dependencies:**
- React
- Shadcn/ui (Button)
- lucide-react (Plus icon)

### Step 5: Create Helper Functions

**File:** `src/lib/utils/dashboard.ts`

**Tasks:**
1. Create utility file
2. Implement `shuffleArray<T>(array: T[]): T[]`:
   - Fisher-Yates shuffle algorithm
   - Return new array (don't mutate)
3. Implement `transformRecipeToCardData(recipe: RecipeListItemDTO): RecipeCardData`:
   - Extract primary tag (first from array)
   - Map fields to RecipeCardData
4. Implement `transformFavoriteToCardData(favorite: FavoriteDTO): RecipeCardData`:
   - Map nested recipe object
   - Set primaryTag to null (favorites don't include tags)
5. Implement `getCalorieBadgeColor(calories: number): string`:
   - Return Tailwind color class based on thresholds
6. Implement `getRecipeInitial(title: string): string`:
   - Return first character uppercased
7. Implement `getRecipePlaceholderColor(title: string): string`:
   - Hash title to number
   - Map to predefined color palette
   - Return Tailwind background class
8. Export all functions

**Dependencies:**
- TypeScript
- RecipeListItemDTO, FavoriteDTO, RecipeCardData types

### Step 6: Create Dashboard Page (Server-Side)

**File:** `src/pages/dashboard.astro`

**Tasks:**
1. Create Astro page file
2. Add authentication check:
   - Get Supabase client from Astro.locals
   - Check user session
   - Redirect to /login if not authenticated
3. Implement parallel data fetching:
   - GET /api/profile
   - GET /api/recipes?limit=6&sortBy=createdAt&sortOrder=desc
   - GET /api/favorites?limit=6
   - GET /api/recipes/public?limit=20&sortBy=createdAt&sortOrder=desc
   - Use Promise.allSettled for error resilience
4. Transform data:
   - Extract userName from profile (or null)
   - Transform userRecipes to RecipeCardData[]
   - Transform favorites to RecipeCardData[]
   - Shuffle publicRecipes and take first 6
   - Transform to RecipeCardData[]
5. Create favoriteRecipeIds Set
6. Handle errors gracefully (log, show empty states)
7. Render page structure:
   - Import React components
   - Add WelcomeBanner with userName
   - Add RecipeSectionRow for user recipes
   - Add RecipeSectionRow for favorites
   - Add RecipeSectionRow for public recipes
   - Pass data via props
8. Add client:load directive to React components
9. Add metadata (title, description)
10. Add layout wrapper

**Dependencies:**
- Astro
- Supabase client
- React components (WelcomeBanner, RecipeSectionRow)
- Utility functions
- Types

### Step 7: Style Components with Tailwind

**Tasks:**
1. Review Tailwind configuration (already set up)
2. Add custom colors if needed for calorie badges
3. Implement responsive breakpoints:
   - Mobile: horizontal scroll
   - Desktop: grid layout
4. Add hover effects for interactive elements
5. Add focus styles for accessibility
6. Test scroll-snap behavior
7. Verify color contrast (WCAG compliance)

**Files Affected:**
- RecipeCard.tsx
- RecipeSectionRow.tsx
- WelcomeBanner.tsx
- dashboard.astro

### Step 8: Add Accessibility Features

**Tasks:**
1. Add ARIA labels to icon-only buttons (favorite, menu)
2. Add role="region" to recipe sections with aria-label
3. Implement keyboard navigation for horizontal scroll
4. Add focus indicators (outline, ring)
5. Add screen reader announcements:
   - "X przepisów w sekcji"
   - Favorite toggle state
6. Ensure proper heading hierarchy (h1, h2, h3)
7. Add skip links if needed
8. Test with screen reader (VoiceOver/NVDA)

**Files Affected:**
- All component files

### Step 9: Implement Error Handling

**Tasks:**
1. Add error boundaries for React components
2. Implement toast notifications for client-side errors
3. Add error logging (console.error with context)
4. Create error state components for failed data fetches
5. Add retry mechanisms where appropriate
6. Test error scenarios:
   - Network failure
   - API errors (400, 403, 404, 500)
   - Missing data
   - Invalid data

**Files Affected:**
- useFavoriteToggle.ts
- dashboard.astro
- All components

### Step 10: Add Loading States

**Tasks:**
1. Implement skeleton loaders for server-side rendering (optional, SSR is fast)
2. Add loading indicators for favorite toggle
3. Add disabled state to buttons during operations
4. Test loading UX

**Files Affected:**
- RecipeCard.tsx
- useFavoriteToggle.ts

### Step 11: Test Dashboard Implementation

**Tasks:**
1. Test authentication flow:
   - Authenticated user can access
   - Unauthenticated user redirected
2. Test data loading:
   - All sections populate correctly
   - Empty states display properly
3. Test favorite toggle:
   - Add to favorites
   - Remove from favorites
   - Optimistic updates work
   - Error rollback works
4. Test navigation:
   - Recipe card click
   - "Zobacz wszystkie" links
   - "+ Dodaj przepis" button
5. Test responsive design:
   - Mobile horizontal scroll
   - Desktop grid layout
   - Touch gestures
6. Test keyboard navigation:
   - Tab order
   - Arrow key scrolling
   - Enter key activation
7. Test edge cases:
   - No recipes
   - No favorites
   - Long titles
   - Missing data
8. Test performance:
   - Page load time
   - API response times
   - Client-side interactions

### Step 12: Polish and Optimize

**Tasks:**
1. Review code for best practices
2. Add TypeScript strict mode compliance
3. Optimize bundle size (code splitting if needed)
4. Add performance monitoring
5. Review and improve error messages (Polish translations)
6. Add analytics tracking (optional)
7. Final accessibility audit
8. Cross-browser testing
9. Mobile device testing
10. Code review and cleanup

### Step 13: Documentation

**Tasks:**
1. Add JSDoc comments to all exported functions
2. Document component props with descriptions
3. Add usage examples in component files
4. Update README if needed
5. Document any configuration requirements
6. Add inline comments for complex logic

**Files Affected:**
- All TypeScript/TSX files
