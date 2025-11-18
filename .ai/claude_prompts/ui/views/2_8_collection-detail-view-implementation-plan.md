# View Implementation Plan: Collection Detail Page

## 1. Overview

The Collection Detail Page displays recipes within a specific user collection. Users can view their collection's recipes in a paginated grid, edit the collection name, remove recipes from the collection, toggle favorites, and delete the entire collection. The page supports responsive design with mobile-first approach, includes loading states, empty states, and provides user feedback through toast notifications. All interactions maintain consistency with existing application patterns.

## 2. View Routing

**Path:** `/collections/[id]`

**Route Parameters:**
- `id` (string, required): Collection UUID

**Access:** Authenticated users only (verified by AppLayout)

**Example URLs:**
- `/collections/123e4567-e89b-12d3-a456-426614174000`

## 3. Component Structure

```
src/pages/collections/[id].astro (Astro page)
└── CollectionDetailLayout.tsx (React client:load)
    ├── CollectionHeader.tsx
    │   ├── EditCollectionNameDialog.tsx
    │   └── DeleteCollectionDialog.tsx
    ├── CollectionRecipeGrid.tsx
    │   ├── RecipeCard.tsx (reused, multiple instances)
    │   │   └── RemoveFromCollectionDialog.tsx
    │   └── Pagination (from shadcn/ui or custom)
    └── EmptyState.tsx (conditional)
```

**File Structure:**
```
src/
├── pages/
│   └── collections/
│       └── [id].astro
├── components/
│   ├── collections/
│   │   ├── detail/
│   │   │   ├── CollectionDetailLayout.tsx
│   │   │   ├── CollectionHeader.tsx
│   │   │   ├── CollectionRecipeGrid.tsx
│   │   │   ├── EditCollectionNameDialog.tsx
│   │   │   ├── DeleteCollectionDialog.tsx
│   │   │   ├── RemoveFromCollectionDialog.tsx
│   │   │   └── EmptyState.tsx
│   ├── hooks/
│   │   ├── useCollectionDetail.ts (new)
│   │   ├── useRemoveFromCollection.ts (new)
│   │   ├── useEditCollectionName.ts (new)
│   │   ├── useDeleteCollection.ts (new)
│   │   └── useFavoriteToggle.ts (existing)
```

## 4. Component Details

### 4.1 CollectionDetailPage.astro

**Component Description:**
Server-side Astro page component responsible for initial data fetching and rendering. Fetches collection data on the server, handles authentication through AppLayout, and passes initial data to the React client component. Implements error handling for collection not found scenarios.

**Main Elements:**
- `<AppLayout>` wrapper for authentication and layout
- `<CollectionDetailLayout>` client component with `client:load` directive

**Handled Events:**
None (server-side component)

**Validation:**
- Route parameter `id` must be valid UUID (handled by API)
- Redirects to `/collections` if collection not found (404)
- Redirects to `/collections` if unauthorized (403)

**Types:**
- Input: `Astro.params.id` (string)
- API Response: `CollectionDetailDTO`
- Pass to client: `CollectionDetailDTO`, initial favorites `Set<string>`

**Props:**
None (page component uses Astro.params)

**Implementation Notes:**
- Fetch collection from `GET /api/collections/{id}?page=1&limit=20`
- Extract favorite recipe IDs from API response
- Handle fetch errors gracefully (empty state for errors)
- Pass cookies for authentication

### 4.2 CollectionDetailLayout

**Component Description:**
Main React container component managing all client-side state and interactions for the collection detail view. Orchestrates data fetching, pagination, favorites, and recipe removal. Provides loading states and coordinates between child components.

**Main Elements:**
- Loading skeleton (initial load)
- `<CollectionHeader>` component
- `<CollectionRecipeGrid>` component
- `<EmptyState>` component (conditional)

**Handled Events:**
- Collection name update
- Collection deletion
- Page navigation
- Recipe removal from the collection
- Favorite toggle

**Validation:**
None (delegates to child components)

**Types:**
- `CollectionDetailDTO` - Current collection data
- `Set<string>` - Favorited recipe IDs
- `number` - Current page number

**Props:**
```typescript
interface CollectionDetailLayoutProps {
  initialCollection: CollectionDetailDTO;
  initialFavorites: Set<string>;
}
```

**State Management:**
- `collection` (CollectionDetailDTO | null) - Current collection data
- `currentPage` (number) - Active page number
- `isLoadingPage` (boolean) - Loading state for pagination
- Uses `useCollectionDetail` hook
- Uses `useFavoriteToggle` hook

**Child Component Coordination:**
- Passes collection data to CollectionHeader
- Passes recipes and pagination to CollectionRecipeGrid
- Passes favorites state to RecipeCard instances
- Refreshes data after recipe removal or name edit

### 4.3 CollectionHeader

**Component Description:**
Displays collection metadata including name (editable), recipe count, and action buttons for editing name and deleting collection. Handles opening edit and delete dialogs.

**Main Elements:**
- `<h1>` - Collection name (text-2xl font-bold)
- `<p>` - Recipe count display: "X przepisów w kolekcji"
- `<Button>` - "Edytuj nazwę" with Pencil icon
- `<Button>` - "Usuń kolekcję" with Trash2 icon (variant="destructive")
- `<EditCollectionNameDialog>` modal
- `<DeleteCollectionDialog>` modal

**Handled Events:**
- Edit button click → opens EditCollectionNameDialog
- Delete button click → opens DeleteCollectionDialog
- Dialog submit events (passed from dialogs)

**Validation:**
None (handled in dialogs)

**Types:**
- `string` - Collection name
- `number` - Recipe count
- `string` - Collection ID

**Props:**
```typescript
interface CollectionHeaderProps {
  collectionId: string;
  collectionName: string;
  recipeCount: number;
  onNameUpdated: (newName: string) => void;
  onCollectionDeleted: () => void;
}
```

**Layout:**
- Desktop: Header with buttons on the right
- Mobile: Stacked layout, full-width buttons
- Sticky positioning (optional, for better UX)

### 4.4 CollectionRecipeGrid

**Component Description:**
Displays recipes in a responsive grid layout with pagination controls. Renders RecipeCard components for each recipe with collection-specific actions.

**Main Elements:**
- `<div>` grid container (responsive columns)
- Multiple `<RecipeCard>` components
- `<Pagination>` component (bottom)
- Loading skeletons during page changes

**Handled Events:**
- Page change (pagination controls)
- Recipe card interactions (delegated to RecipeCard)

**Validation:**
None

**Types:**
- `CollectionRecipeDTO[]` - Array of recipes
- `PaginationDTO` - Pagination metadata

**Props:**
```typescript
interface CollectionRecipeGridProps {
  collectionId: string;
  collectionName: string;
  recipes: CollectionRecipeDTO[];
  pagination: PaginationDTO;
  favorites: Set<string>;
  onPageChange: (page: number) => void;
  onFavoriteToggle: (recipeId: string) => Promise<void>;
  onRecipeRemoved: () => void;
  isLoadingPage: boolean;
  isTogglingRecipe: (recipeId: string) => boolean;
}
```

**Grid Layout:**
- Mobile (< 640px): 1 column
- Tablet (640px - 1024px): 2 columns
- Desktop (> 1024px): 3-4 columns
- Gap: 4-6 spacing units
- Min card width: 280px

### 4.5 RecipeCard (Reused Component)

**Component Description:**
Existing RecipeCard component reused with collection-specific behavior. Displays recipe information with actions for viewing, favoriting, and removing from collection.

**Main Elements:**
- Colored placeholder with recipe initial
- Recipe title
- Nutrition information (calories, protein)
- Prep time and primary tag
- Favorite button (heart icon)
- Remove from collection button (new action)

**Handled Events:**
- Card click → navigate to `/recipes/{id}`
- Favorite button click → toggle favorite
- Remove from collection → opens RemoveFromCollectionDialog

**Validation:**
None

**Types:**
- `RecipeCardData` - Recipe display data
- `boolean` - Is favorited
- `boolean` - Is loading

**Props:**
```typescript
interface RecipeCardProps {
  recipe: RecipeCardData;
  isFavorited: boolean;
  onFavoriteToggle: (recipeId: string) => Promise<void>;
  isLoading?: boolean;
  showAuthorBadge?: boolean;
  isCollectionView?: boolean; // New prop
  collectionId?: string; // New prop
  collectionName?: string; // New prop
  onRemoveFromCollection?: () => void; // New prop
}
```

**Modifications Needed:**
- Add "Usuń z kolekcji" button when `isCollectionView={true}`
- Button positioned in card footer or dropdown menu
- Opens RemoveFromCollectionDialog on click

### 4.6 RemoveFromCollectionDialog

**Component Description:**
Confirmation dialog (AlertDialog) for removing a recipe from the collection. Displays recipe and collection names with clear messaging that only the association is removed, not the recipe itself.

**Main Elements:**
- `<AlertDialog>` wrapper
- `<AlertDialogContent>`
  - `<AlertDialogHeader>`
    - `<AlertDialogTitle>` - "Usuń z kolekcji?"
    - `<AlertDialogDescription>` - Message explaining action
  - `<AlertDialogFooter>`
    - `<AlertDialogCancel>` - "Anuluj"
    - `<AlertDialogAction>` - "Usuń z kolekcji" (destructive variant)

**Handled Events:**
- Cancel button → closes dialog
- Confirm button → calls API to remove recipe, closes dialog, shows toast

**Validation:**
None (confirmation only)

**Types:**
- `string` - Recipe ID
- `string` - Recipe title
- `string` - Collection ID
- `string` - Collection name

**Props:**
```typescript
interface RemoveFromCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipeId: string;
  recipeTitle: string;
  collectionId: string;
  collectionName: string;
  onRemoved: () => void;
}
```

**Dialog Message:**
"Przepis '[recipeTitle]' zostanie usunięty z kolekcji '[collectionName]'. Sam przepis nie zostanie usunięty."

**Success Toast:**
"Usunięto z kolekcji" with undo button (5 second duration)

### 4.7 EditCollectionNameDialog

**Component Description:**
Dialog for editing the collection name with validation. Uses controlled input with real-time validation feedback.

**Main Elements:**
- `<Dialog>` wrapper
- `<DialogContent>`
  - `<DialogHeader>` - "Edytuj nazwę kolekcji"
  - `<form>` element
    - `<Input>` - Text input for name
    - Error message display
  - `<DialogFooter>`
    - `<Button>` type="button" variant="outline" - "Anuluj"
    - `<Button>` type="submit" - "Zapisz" (disabled when invalid/submitting)

**Handled Events:**
- Form submit → validates, calls API, updates name
- Cancel button → closes dialog
- Input change → validates on change

**Validation:**
- Name required: "Nazwa jest wymagana"
- Name length: 1-100 characters - "Nazwa musi mieć od 1 do 100 znaków"
- Name trimmed before validation
- Unique constraint (API): "Kolekcja o tej nazwie już istnieje"

**Types:**
- `string` - Current name
- `string` - New name (form state)

**Props:**
```typescript
interface EditCollectionNameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collectionId: string;
  currentName: string;
  onNameUpdated: (newName: string) => void;
}
```

**Form State:**
- `name` (string) - Input value
- `errors` (string | null) - Validation error message
- `isSubmitting` (boolean) - Submission state

**Success Toast:**
"Nazwa kolekcji została zaktualizowana"

### 4.8 DeleteCollectionDialog

**Component Description:**
Confirmation dialog for permanently deleting the entire collection. Uses AlertDialog with destructive styling to emphasize the critical nature of the action.

**Main Elements:**
- `<AlertDialog>` wrapper
- `<AlertDialogContent>`
  - `<AlertDialogHeader>`
    - `<AlertDialogTitle>` - "Usuń kolekcję?"
    - `<AlertDialogDescription>` - Warning message
  - `<AlertDialogFooter>`
    - `<AlertDialogCancel>` - "Anuluj"
    - `<AlertDialogAction>` variant="destructive" - "Usuń kolekcję"

**Handled Events:**
- Cancel button → closes dialog
- Confirm button → calls API, redirects to /collections

**Validation:**
None (confirmation only)

**Types:**
- `string` - Collection ID
- `string` - Collection name

**Props:**
```typescript
interface DeleteCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collectionId: string;
  collectionName: string;
  onDeleted: () => void;
}
```

**Dialog Message:**
"Czy na pewno chcesz usunąć kolekcję '[collectionName]'? Wszystkie przepisy zostaną zachowane, ale stracisz tę organizację. Tej operacji nie można cofnąć."

**Success Behavior:**
- Redirect to `/collections`
- Toast: "Kolekcja została usunięta"

### 4.9 EmptyState

**Component Description:**
Displays when collection has no recipes. Provides friendly message and call-to-action to add recipes.

**Main Elements:**
- Icon (folder or empty box icon)
- Heading: "Ta kolekcja jest pusta"
- Description: "Dodaj przepisy, aby zorganizować swoje ulubione posiłki"
- `<Button>` or `<Link>` - "Przeglądaj przepisy" → `/recipes/browse`

**Handled Events:**
- Button click → navigate to browse recipes

**Validation:**
None

**Types:**
None

**Props:**
```typescript
interface EmptyStateProps {
  collectionName: string;
}
```

**Conditional Rendering:**
Show when `collection.recipes.length === 0 && !isLoading`

## 5. Types

### 5.1 Existing Types (from src/types.ts)

**CollectionDetailDTO** - Complete collection with recipes and pagination
```typescript
interface CollectionDetailDTO {
  id: string;                      // UUID
  userId: string;                  // UUID
  name: string;                    // 1-100 characters
  recipes: CollectionRecipeDTO[];  // Array of recipes in collection
  pagination: PaginationDTO;       // Pagination metadata
  createdAt: string;              // ISO 8601 timestamp
}
```

**CollectionRecipeDTO** - Recipe within a collection
```typescript
interface CollectionRecipeDTO {
  recipeId: string;                // UUID
  recipe: {
    id: string;                    // UUID
    title: string;                 // Recipe title
    description: string | null;    // Optional description
    nutritionPerServing: NutritionDTO; // Nutrition data
  };
  createdAt: string;               // ISO 8601 timestamp (when added to collection)
}
```

**PaginationDTO** - Pagination metadata
```typescript
interface PaginationDTO {
  page: number;      // Current page (min: 1)
  limit: number;     // Items per page (default: 20, max: 100)
  total: number;     // Total number of items
  totalPages: number; // Total number of pages
}
```

**NutritionDTO** - Nutrition information
```typescript
interface NutritionDTO {
  calories: number;  // Kilocalories
  protein: number;   // Grams
  fat: number;       // Grams
  carbs: number;     // Grams
  fiber: number;     // Grams
  salt: number;      // Grams
}
```

### 5.2 View Models

**RecipeCardData** - Recipe data for card display (from utils)
```typescript
interface RecipeCardData {
  id: string;
  title: string;
  nutritionPerServing: NutritionDTO;
  prepTimeMinutes: number | null;
  primaryTag: { name: string } | null;
}
```

**Transform from CollectionRecipeDTO to RecipeCardData:**
```typescript
const toRecipeCardData = (cr: CollectionRecipeDTO): RecipeCardData => ({
  id: cr.recipe.id,
  title: cr.recipe.title,
  nutritionPerServing: cr.recipe.nutritionPerServing,
  prepTimeMinutes: null, // Not available in CollectionRecipeDTO
  primaryTag: null,      // Not available in CollectionRecipeDTO
});
```

Note: API response may need to be extended to include prepTimeMinutes and tags for proper display.

### 5.3 Command Types (Request Payloads)

**UpdateCollectionCommand** - Update collection name
```typescript
interface UpdateCollectionCommand {
  name: string; // 1-100 characters, trimmed
}
```

No command type needed for DELETE operations (no body).

### 5.4 API Response Types

**UpdateCollectionResponse**
```typescript
interface UpdateCollectionResponse {
  success: boolean;
  collection: {
    id: string;
    name: string;
    updatedAt: string;
  };
}
```

**ErrorResponse**
```typescript
interface ErrorResponse {
  error: string;      // Error type
  message: string;    // User-friendly message
}
```

## 6. State Management

### 6.1 Overview

State is managed primarily through custom React hooks that encapsulate API calls and state updates. The main CollectionDetailLayout component coordinates between multiple hooks:

1. **useCollectionDetail** - Fetches and manages collection data
2. **useFavoriteToggle** - Handles favorite toggling (reused)
3. **useRemoveFromCollection** - Handles recipe removal
4. **useEditCollectionName** - Handles name updates
5. **useDeleteCollection** - Handles collection deletion

Each hook provides:
- Loading states
- Error handling
- Optimistic updates where appropriate
- Toast notifications

### 6.2 Custom Hook: useCollectionDetail

**Purpose:** Fetch and manage collection data with pagination support

**File:** `src/components/hooks/useCollectionDetail.ts`

**Interface:**
```typescript
interface UseCollectionDetailOptions {
  collectionId: string;
  initialCollection: CollectionDetailDTO | null;
  initialPage?: number;
}

interface UseCollectionDetailReturn {
  collection: CollectionDetailDTO | null;
  isLoading: boolean;
  error: Error | null;
  currentPage: number;
  goToPage: (page: number) => Promise<void>;
  refreshCollection: () => Promise<void>;
}

function useCollectionDetail(
  options: UseCollectionDetailOptions
): UseCollectionDetailReturn;
```

**State Variables:**
- `collection: CollectionDetailDTO | null` - Current collection data
- `isLoading: boolean` - Loading state for page changes
- `error: Error | null` - Error state
- `currentPage: number` - Current page number

**Methods:**
- `goToPage(page: number)` - Navigate to specific page
- `refreshCollection()` - Refresh current page data

**API Calls:**
- `GET /api/collections/{collectionId}?page={page}&limit=20`

**Error Handling:**
- 404 → Redirect to `/collections` with toast "Kolekcja nie została znaleziona"
- 403 → Redirect to `/collections` with toast "Nie masz dostępu do tej kolekcji"
- Network errors → Show error toast, keep current data

### 6.3 Custom Hook: useFavoriteToggle (Existing)

**Purpose:** Toggle favorite status with optimistic updates

**File:** `src/components/hooks/useFavoriteToggle.ts` (already exists)

**Interface:**
```typescript
interface UseFavoriteToggleOptions {
  initialFavorites: Set<string>;
}

interface UseFavoriteToggleReturn {
  favorites: Set<string>;
  toggleFavorite: (recipeId: string) => Promise<void>;
  isTogglingRecipe: (recipeId: string) => boolean;
}
```

**No changes needed** - hook already implements required functionality

### 6.4 Custom Hook: useRemoveFromCollection

**Purpose:** Remove recipe from collection with undo support

**File:** `src/components/hooks/useRemoveFromCollection.ts`

**Interface:**
```typescript
interface UseRemoveFromCollectionOptions {
  collectionId: string;
  onRemoved: () => void; // Callback to refresh collection
}

interface UseRemoveFromCollectionReturn {
  removeRecipe: (recipeId: string, recipeTitle: string) => Promise<void>;
  isRemoving: (recipeId: string) => boolean;
}

function useRemoveFromCollection(
  options: UseRemoveFromCollectionOptions
): UseRemoveFromCollectionReturn;
```

**State Variables:**
- `removingRecipes: Set<string>` - Set of recipe IDs being removed

**Methods:**
- `removeRecipe(recipeId, recipeTitle)` - Remove recipe from collection
- `isRemoving(recipeId)` - Check if recipe is being removed

**API Calls:**
- `DELETE /api/collections/{collectionId}/recipes/{recipeId}`
- `POST /api/collections/{collectionId}/recipes` (for undo)

**Toast Notifications:**
- Success: "Usunięto z kolekcji" with undo button (5s duration)
- Error: "Nie udało się usunąć przepisu z kolekcji"
- Undo success: "Przywrócono do kolekcji"

**Undo Implementation:**
```typescript
const handleUndo = async (recipeId: string) => {
  // POST /api/collections/{collectionId}/recipes
  // Body: { recipeId }
  // On success: refresh collection, show success toast
};
```

### 6.5 Custom Hook: useEditCollectionName

**Purpose:** Update collection name with validation

**File:** `src/components/hooks/useEditCollectionName.ts`

**Interface:**
```typescript
interface UseEditCollectionNameOptions {
  collectionId: string;
  onNameUpdated: (newName: string) => void;
}

interface UseEditCollectionNameReturn {
  updateName: (newName: string) => Promise<void>;
  isUpdating: boolean;
  error: string | null;
}

function useEditCollectionName(
  options: UseEditCollectionNameOptions
): UseEditCollectionNameReturn;
```

**State Variables:**
- `isUpdating: boolean` - Updating state
- `error: string | null` - Validation/API error

**Methods:**
- `updateName(newName)` - Update collection name

**API Calls:**
- `PUT /api/collections/{collectionId}`
- Body: `{ name: string }`

**Validation:**
- Client-side: 1-100 characters, trimmed
- Server-side: Unique per user (409 conflict)

**Toast Notifications:**
- Success: "Nazwa kolekcji została zaktualizowana"
- Error 409: "Kolekcja o tej nazwie już istnieje"
- Error 400: Validation error message from API

### 6.6 Custom Hook: useDeleteCollection

**Purpose:** Delete entire collection with redirect

**File:** `src/components/hooks/useDeleteCollection.ts`

**Interface:**
```typescript
interface UseDeleteCollectionOptions {
  collectionId: string;
  onDeleted: () => void; // Callback for navigation
}

interface UseDeleteCollectionReturn {
  deleteCollection: () => Promise<void>;
  isDeleting: boolean;
}

function useDeleteCollection(
  options: UseDeleteCollectionOptions
): UseDeleteCollectionReturn;
```

**State Variables:**
- `isDeleting: boolean` - Deletion state

**Methods:**
- `deleteCollection()` - Delete the collection

**API Calls:**
- `DELETE /api/collections/{collectionId}`

**Success Behavior:**
- Call `onDeleted()` callback
- Parent component redirects to `/collections`
- Toast: "Kolekcja została usunięta"

**Error Handling:**
- Show error toast
- Keep user on current page
- Toast: "Nie udało się usunąć kolekcji"

## 7. API Integration

### 7.1 GET /api/collections/{collectionId}

**Purpose:** Fetch collection with paginated recipes

**When Called:**
- Initial page load (server-side in .astro)
- Page navigation (client-side)
- After recipe removal (to refresh)
- After undo operation

**Request:**
```typescript
GET /api/collections/{collectionId}?page=1&limit=20
Headers: {
  Cookie: "..." // Authentication
}
```

**Query Parameters:**
- `page` (number, optional): Page number (default: 1, min: 1)
- `limit` (number, optional): Items per page (default: 20, min: 1, max: 100)

**Response Type:** `CollectionDetailDTO`

**Response (200 OK):**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "name": "Szybkie kolacje",
  "recipes": [
    {
      "recipeId": "uuid",
      "recipe": {
        "id": "uuid",
        "title": "Placki ziemniaczane",
        "description": "...",
        "nutritionPerServing": {
          "calories": 450,
          "protein": 12,
          "fat": 15,
          "carbs": 60,
          "fiber": 5,
          "salt": 1.2
        }
      },
      "createdAt": "2025-10-11T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 8,
    "totalPages": 1
  },
  "createdAt": "2025-10-11T12:00:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid query parameters
  ```json
  { "error": "Bad Request", "message": "page must be at least 1" }
  ```
- `401 Unauthorized` - Not authenticated
  ```json
  { "error": "Unauthorized", "message": "Authentication required" }
  ```
- `403 Forbidden` - Collection belongs to another user
  ```json
  { "error": "Forbidden", "message": "You don't have permission to access this collection" }
  ```
- `404 Not Found` - Collection not found
  ```json
  { "error": "Not Found", "message": "Collection not found" }
  ```

**Error Handling:**
- 404/403 → Redirect to `/collections` with error toast
- 400 → Reset to page 1
- 500 → Show error toast, keep current data

### 7.2 PUT /api/collections/{collectionId}

**Purpose:** Update collection name

**When Called:**
- User submits edit name form

**Request:**
```typescript
PUT /api/collections/{collectionId}
Headers: {
  "Content-Type": "application/json",
  Cookie: "..."
}
Body: {
  "name": "Szybkie i zdrowe kolacje"
}
```

**Request Type:** `UpdateCollectionCommand`

**Response Type:** `UpdateCollectionResponse`

**Response (200 OK):**
```json
{
  "success": true,
  "collection": {
    "id": "uuid",
    "name": "Szybkie i zdrowe kolacje",
    "updatedAt": "2025-10-11T12:30:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Validation error
  ```json
  { "error": "Bad Request", "message": "Name must be 100 characters or less" }
  ```
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Collection belongs to another user
- `404 Not Found` - Collection not found
- `409 Conflict` - Name already exists
  ```json
  { "error": "Conflict", "message": "Collection with this name already exists" }
  ```

**Success Handling:**
- Update local collection state
- Close dialog
- Toast: "Nazwa kolekcji została zaktualizowana"

**Error Handling:**
- 409 → Display error in dialog: "Kolekcja o tej nazwie już istnieje"
- 400 → Display validation error in dialog
- 404/403 → Close dialog, show error toast, refresh page

### 7.3 DELETE /api/collections/{collectionId}

**Purpose:** Delete entire collection

**When Called:**
- User confirms deletion in DeleteCollectionDialog

**Request:**
```typescript
DELETE /api/collections/{collectionId}
Headers: {
  Cookie: "..."
}
```

**Response (204 No Content):**
Empty response body

**Error Responses:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Collection belongs to another user
- `404 Not Found` - Collection not found

**Success Handling:**
- Redirect to `/collections`
- Toast: "Kolekcja została usunięta"

**Error Handling:**
- 404 → Redirect anyway (already deleted)
- 403/500 → Show error toast, stay on page

### 7.4 DELETE /api/collections/{collectionId}/recipes/{recipeId}

**Purpose:** Remove recipe from collection

**When Called:**
- User confirms removal in RemoveFromCollectionDialog

**Request:**
```typescript
DELETE /api/collections/{collectionId}/recipes/{recipeId}
Headers: {
  Cookie: "..."
}
```

**Response (204 No Content):**
Empty response body

**Error Responses:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Collection belongs to another user
- `404 Not Found` - Recipe not in collection

**Success Handling:**
- Refresh current page data
- Toast with undo: "Usunięto z kolekcji" (undo button, 5s)
- If current page becomes empty, navigate to previous page (or page 1)

**Error Handling:**
- 404 → Refresh collection (already removed)
- 500 → Show error toast, don't refresh

### 7.5 POST /api/collections/{collectionId}/recipes (Undo)

**Purpose:** Re-add recipe to collection (undo remove)

**When Called:**
- User clicks "Cofnij" in undo toast

**Request:**
```typescript
POST /api/collections/{collectionId}/recipes
Headers: {
  "Content-Type": "application/json",
  Cookie: "..."
}
Body: {
  "recipeId": "uuid"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "collectionRecipe": {
    "collectionId": "uuid",
    "recipeId": "uuid",
    "createdAt": "2025-10-11T12:00:00Z"
  }
}
```

**Success Handling:**
- Refresh current page
- Toast: "Przywrócono do kolekcji"

**Error Handling:**
- Show error toast: "Nie udało się przywrócić"

### 7.6 POST /api/favorites (Existing)

**Purpose:** Add recipe to favorites

**Implementation:** Already handled by `useFavoriteToggle` hook

### 7.7 DELETE /api/favorites (Existing)

**Purpose:** Remove recipe from favorites

**Implementation:** Already handled by `useFavoriteToggle` hook

## 8. User Interactions

### 8.1 View Collection

**Trigger:** User navigates to `/collections/{id}`

**Flow:**
1. Server fetches collection data via API
2. Server renders page with initial data
3. React component hydrates with data
4. Display collection header and recipe grid
5. Show pagination if needed

**Loading State:**
- Server-side: Page loads with data
- Client-side: Skeleton shown during hydration

**Error State:**
- 404 → Redirect to `/collections` with toast
- Network error → Show error message

### 8.2 Navigate Between Pages

**Trigger:** User clicks pagination controls (next, previous, page number)

**Flow:**
1. User clicks pagination button
2. Update currentPage state
3. Show loading skeleton over grid
4. Fetch new page via API
5. Update recipes in grid
6. Scroll to top of grid

**Loading State:**
- Show skeleton cards in grid
- Disable pagination controls

**Edge Cases:**
- Last page selected → Disable "Next" button
- First page selected → Disable "Previous" button
- Invalid page number → Reset to page 1

### 8.3 Click Recipe Card

**Trigger:** User clicks anywhere on recipe card (except action buttons)

**Flow:**
1. User clicks card
2. Navigate to `/recipes/{recipeId}`
3. Browser performs page navigation

**Implementation:**
```typescript
const handleCardClick = () => {
  window.location.href = `/recipes/${recipe.id}`;
};
```

**Accessibility:**
- Card has `role="button"` and `tabIndex={0}`
- Keyboard support: Enter and Space keys
- Screen reader label: "Przejdź do przepisu: {title}"

### 8.4 Toggle Favorite

**Trigger:** User clicks heart icon on recipe card

**Flow:**
1. User clicks heart icon
2. Stop event propagation (prevent card click)
3. Optimistic update: Toggle heart visually
4. API call to add/remove favorite
5. On success: Keep optimistic update
6. On error: Rollback, show error toast
7. If unfavoriting: Show undo toast (5s)

**Loading State:**
- Show spinner in heart button
- Disable heart button

**Toast Messages:**
- Unfavorite success: "Usunięto z ulubionych" with undo button
- Add favorite error: "Nie udało się dodać do ulubionych"
- Remove favorite error: "Nie udało się usunąć z ulubionych"

**Undo Flow:**
1. User clicks "Cofnij" in toast (within 5s)
2. Optimistic update: Add back to favorites
3. API call to re-add
4. On success: Toast "Przywrócono do ulubionych"
5. On error: Rollback, show error toast

### 8.5 Remove Recipe from Collection

**Trigger:** User clicks "Usuń z kolekcji" button on recipe card

**Flow:**
1. User clicks remove button
2. Stop event propagation
3. Open RemoveFromCollectionDialog
4. Display recipe title and collection name
5. User clicks "Usuń z kolekcji" to confirm
6. Show loading state in button
7. API call to remove recipe
8. On success:
   - Close dialog
   - Refresh current page
   - Show undo toast (5s)
   - If page becomes empty, go to previous page
9. On error:
   - Close dialog
   - Show error toast
   - Don't refresh

**Dialog Content:**
- Title: "Usuń z kolekcji?"
- Message: "Przepis '{title}' zostanie usunięty z kolekcji '{name}'. Sam przepis nie zostanie usunięty."
- Cancel button: "Anuluj"
- Confirm button: "Usuń z kolekcji" (destructive)

**Toast Messages:**
- Success: "Usunięto z kolekcji" with undo button
- Error: "Nie udało się usunąć przepisu z kolekcji"

**Undo Flow:**
1. User clicks "Cofnij" in toast
2. API call to re-add recipe
3. Refresh current page
4. Toast: "Przywrócono do kolekcji"

**Edge Case - Empty Page:**
```typescript
if (collection.recipes.length === 1 && currentPage > 1) {
  // Last recipe on current page - go to previous page
  await goToPage(currentPage - 1);
} else if (collection.recipes.length === 1 && currentPage === 1) {
  // Last recipe in collection - show empty state
  await refreshCollection();
}
```

### 8.6 Edit Collection Name

**Trigger:** User clicks "Edytuj nazwę" button in header

**Flow:**
1. User clicks "Edytuj nazwę" button
2. Open EditCollectionNameDialog
3. Pre-fill input with current name
4. User types new name
5. Real-time validation (1-100 chars)
6. User clicks "Zapisz"
7. Validate input
8. Show loading state in button
9. API call to update name
10. On success:
    - Close dialog
    - Update displayed name
    - Toast: "Nazwa kolekcji została zaktualizowana"
11. On error:
    - Display error in dialog
    - Keep dialog open
    - Don't update name

**Dialog Content:**
- Title: "Edytuj nazwę kolekcji"
- Input label: "Nazwa kolekcji"
- Input placeholder: Current name
- Cancel button: "Anuluj"
- Submit button: "Zapisz" (disabled when invalid/submitting)

**Validation:**
- Required: "Nazwa jest wymagana"
- Min length 1: "Nazwa jest wymagana"
- Max length 100: "Nazwa musi mieć maksymalnie 100 znaków"
- Unique (API 409): "Kolekcja o tej nazwie już istnieje"

**Form State:**
```typescript
const [name, setName] = useState(currentName);
const [error, setError] = useState<string | null>(null);
const [isSubmitting, setIsSubmitting] = useState(false);

const validate = (value: string): string | null => {
  const trimmed = value.trim();
  if (trimmed.length === 0) return "Nazwa jest wymagana";
  if (trimmed.length > 100) return "Nazwa musi mieć maksymalnie 100 znaków";
  return null;
};
```

### 8.7 Delete Collection

**Trigger:** User clicks "Usuń kolekcję" button in header

**Flow:**
1. User clicks "Usuń kolekcję" button
2. Open DeleteCollectionDialog
3. Display collection name and warning
4. User clicks "Usuń kolekcję" to confirm
5. Show loading state in button
6. API call to delete collection
7. On success:
    - Close dialog
    - Redirect to `/collections`
    - Toast: "Kolekcja została usunięta"
8. On error:
    - Close dialog
    - Show error toast
    - Stay on page

**Dialog Content:**
- Title: "Usuń kolekcję?"
- Message: "Czy na pewno chcesz usunąć kolekcję '{name}'? Wszystkie przepisy zostaną zachowane, ale stracisz tę organizację. Tej operacji nie można cofnąć."
- Cancel button: "Anuluj"
- Confirm button: "Usuń kolekcję" (destructive)

**Toast Messages:**
- Success: "Kolekcja została usunięta"
- Error: "Nie udało się usunąć kolekcji"

**Redirect Implementation:**
```typescript
const handleDeleted = () => {
  toast.success("Kolekcja została usunięta");
  window.location.href = "/collections";
};
```

## 9. Conditions and Validation

### 9.1 Route Parameter Validation

**Condition:** Collection ID must be valid UUID

**Validation Location:** API endpoint

**Component Behavior:**
- Invalid UUID → API returns 400
- Handler: Redirect to `/collections` with error toast

### 9.2 Pagination Validation

**Conditions:**
- `page` must be positive integer ≥ 1
- `limit` must be integer between 1-100
- `page` cannot exceed `totalPages`

**Validation Location:** API endpoint, useCollectionDetail hook

**Component Behavior:**
- Invalid page → Reset to page 1
- page > totalPages → Reset to last page
- Disable "Previous" button when page === 1
- Disable "Next" button when page === totalPages

**UI State:**
```typescript
const isPreviousDisabled = currentPage === 1 || isLoadingPage;
const isNextDisabled = currentPage === pagination.totalPages || isLoadingPage;
```

### 9.3 Collection Name Validation

**Conditions:**
- Required (length > 0 after trim)
- Maximum 100 characters
- Unique per user (validated by API)

**Validation Location:** EditCollectionNameDialog component

**Validation Function:**
```typescript
const validateName = (value: string): string | null => {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return "Nazwa jest wymagana";
  }

  if (trimmed.length > 100) {
    return "Nazwa musi mieć maksymalnie 100 znaków";
  }

  return null; // Valid
};
```

**Error Messages:**
- Empty: "Nazwa jest wymagana"
- Too long: "Nazwa musi mieć maksymalnie 100 znaków"
- Not unique (API 409): "Kolekcja o tej nazwie już istnieje"

**Component Behavior:**
- Show error below input field
- Disable submit button when invalid
- Clear error on input change

### 9.4 Empty State Conditions

**Condition:** Collection has no recipes

**Check:** `collection.recipes.length === 0 && !isLoading`

**Component Behavior:**
- Hide recipe grid
- Hide pagination
- Show EmptyState component
- Display message and CTA

### 9.5 Loading State Conditions

**Initial Load:**
- Condition: Server-side data not yet hydrated
- UI: Show skeleton for entire page

**Page Change:**
- Condition: `isLoadingPage === true`
- UI: Show skeleton cards in grid, disable pagination

**Recipe Actions:**
- Condition: `isTogglingRecipe(id) === true` or `isRemoving(id) === true`
- UI: Show spinner in action button, disable button

**Collection Actions:**
- Condition: `isUpdating === true` or `isDeleting === true`
- UI: Disable dialog buttons, show spinner

### 9.6 Permission Validation

**Condition:** User must own the collection

**Validation Location:** API endpoints (middleware)

**Component Behavior:**
- 403 response → Redirect to `/collections`
- Toast: "Nie masz dostępu do tej kolekcji"

### 9.7 Concurrent Action Prevention

**Condition:** Prevent multiple simultaneous operations

**Implementation:**
```typescript
// Disable all actions when any operation in progress
const isAnyActionInProgress =
  isLoadingPage ||
  isUpdating ||
  isDeleting ||
  togglingRecipes.size > 0 ||
  removingRecipes.size > 0;

// Disable buttons
<Button disabled={isAnyActionInProgress}>...</Button>
```

## 10. Error Handling

### 10.1 Collection Not Found (404)

**Scenarios:**
- Collection doesn't exist
- Collection was deleted by another session
- Invalid collection ID

**Handling:**
```typescript
// In useCollectionDetail hook
if (response.status === 404) {
  toast.error("Kolekcja nie została znaleziona");
  window.location.href = "/collections";
  return;
}
```

**User Experience:**
- Immediate redirect to collections list
- Error toast explaining what happened

### 10.2 Unauthorized Access (403)

**Scenarios:**
- Collection belongs to another user
- User lost permission to collection

**Handling:**
```typescript
if (response.status === 403) {
  toast.error("Nie masz dostępu do tej kolekcji");
  window.location.href = "/collections";
  return;
}
```

**User Experience:**
- Redirect to collections list
- Error toast with permission message

### 10.3 Network Errors

**Scenarios:**
- No internet connection
- Server unreachable
- Timeout

**Handling:**
```typescript
try {
  const response = await fetch(...);
  // ...
} catch (error) {
  console.error("Network error:", error);
  toast.error("Wystąpił błąd sieciowy. Sprawdź połączenie internetowe.");
  // Keep current state, allow retry
}
```

**User Experience:**
- Show error toast
- Keep current data visible
- Allow user to retry action

### 10.4 Validation Errors (400)

**Scenarios:**
- Invalid pagination parameters
- Invalid collection name
- Invalid request body

**Handling:**
```typescript
if (response.status === 400) {
  const data = await response.json();
  setError(data.message || "Nieprawidłowe dane");
  return;
}
```

**User Experience:**
- Display validation error in form/dialog
- Highlight problematic field
- Allow correction without closing dialog

### 10.5 Name Conflict (409)

**Scenario:** Collection name already exists for user

**Handling:**
```typescript
if (response.status === 409) {
  setError("Kolekcja o tej nazwie już istnieje");
  return; // Keep dialog open
}
```

**User Experience:**
- Show error below name input
- Keep dialog open for correction
- Highlight input field
- Allow user to choose different name

### 10.6 Remove Recipe Failure

**Scenarios:**
- Recipe already removed
- Network error
- Permission changed

**Handling:**
```typescript
try {
  await removeRecipe(recipeId);
  // Success - show undo toast
  toast("Usunięto z kolekcji", {
    action: { label: "Cofnij", onClick: handleUndo }
  });
  await refreshCollection();
} catch (error) {
  console.error("Remove failed:", error);
  toast.error("Nie udało się usunąć przepisu z kolekcji");
  // Don't refresh - keep current view
}
```

**User Experience:**
- Error toast if removal fails
- Don't refresh on error (avoid confusion)
- Allow user to retry

### 10.7 Favorite Toggle Failure

**Scenario:** API call fails during favorite toggle

**Handling:** Implemented in useFavoriteToggle hook (existing)

```typescript
// Optimistic update
setFavorites(prev => /* update */);

try {
  await api.toggleFavorite(recipeId);
} catch (error) {
  // Rollback optimistic update
  setFavorites(prev => /* revert */);
  toast.error("Nie udało się zaktualizować ulubionych");
}
```

**User Experience:**
- Immediate visual feedback (optimistic)
- Automatic rollback on error
- Error toast explaining failure

### 10.8 Delete Collection Failure

**Scenarios:**
- Collection already deleted
- Network error
- Permission changed

**Handling:**
```typescript
try {
  await deleteCollection(collectionId);
  toast.success("Kolekcja została usunięta");
  window.location.href = "/collections";
} catch (error) {
  console.error("Delete failed:", error);
  toast.error("Nie udało się usunąć kolekcji");
  // Stay on current page
}
```

**User Experience:**
- Close dialog
- Show error toast
- Stay on collection page (allow retry)

### 10.9 Server Error (500)

**Scenarios:**
- Database error
- Internal server error
- Unexpected exception

**Handling:**
```typescript
if (response.status >= 500) {
  console.error("Server error:", await response.text());
  toast.error("Wystąpił błąd serwera. Spróbuj ponownie później.");
  return;
}
```

**User Experience:**
- Generic error message
- Keep current state
- Don't lose user's work
- Log error for debugging

### 10.10 Empty Page After Removal

**Scenario:** Removing last recipe on current page (when page > 1)

**Handling:**
```typescript
const handleRecipeRemoved = async () => {
  if (collection.recipes.length === 1 && currentPage > 1) {
    // Go to previous page
    await goToPage(currentPage - 1);
  } else {
    // Refresh current page (may show empty state)
    await refreshCollection();
  }
};
```

**User Experience:**
- Automatic navigation to previous page
- Smooth transition
- No manual intervention needed

### 10.11 Undo Timeout

**Scenario:** User doesn't click undo within 5 seconds

**Handling:**
```typescript
toast("Usunięto z kolekcji", {
  action: { label: "Cofnij", onClick: handleUndo },
  duration: 5000, // 5 seconds
});
// After timeout, toast disappears, undo no longer available
```

**User Experience:**
- Clear 5-second window for undo
- Visual countdown (toast progress bar)
- After timeout, change is permanent

### 10.12 Stale Data

**Scenario:** Collection modified in another tab/session

**Handling:**
- Refresh on focus (optional enhancement)
- Show refresh button if data seems stale
- Auto-refresh after actions (remove, edit)

**User Experience:**
- Data stays reasonably fresh
- User can manually refresh if needed
- Automatic refresh after mutations

## 11. Implementation Steps

### Step 1: Create Base Page Structure
**Files to create:**
- `src/pages/collections/[id].astro`

**Tasks:**
1. Create Astro page file with dynamic route parameter `[id]`
2. Import AppLayout for authentication and layout
3. Fetch collection data server-side from API endpoint
4. Handle fetch errors (404, 403, network errors)
5. Extract initial favorites from collection data
6. Pass data to React component as props
7. Add proper TypeScript types for page params

**Acceptance Criteria:**
- Page accessible at `/collections/{uuid}`
- Server-side data fetching works
- Proper error handling for missing collections
- Data passed to client component correctly

### Step 2: Create Custom Hooks
**Files to create:**
- `src/components/hooks/useCollectionDetail.ts`
- `src/components/hooks/useRemoveFromCollection.ts`
- `src/components/hooks/useEditCollectionName.ts`
- `src/components/hooks/useDeleteCollection.ts`

**Tasks:**
1. Implement useCollectionDetail hook:
   - State for collection, loading, error, currentPage
   - goToPage function with API call
   - refreshCollection function
   - Error handling with redirects
2. Implement useRemoveFromCollection hook:
   - removeRecipe function with API call
   - isRemoving state tracking
   - Undo functionality with toast
   - Success/error toast notifications
3. Implement useEditCollectionName hook:
   - updateName function with validation
   - API call to update
   - Error state management
   - Success/error handling
4. Implement useDeleteCollection hook:
   - deleteCollection function
   - API call to delete
   - Navigation callback
   - Success/error handling

**Acceptance Criteria:**
- All hooks properly typed with TypeScript
- API calls correctly implemented
- Error handling comprehensive
- Toast notifications working
- Undo functionality for remove works

### Step 3: Create Main Layout Component
**Files to create:**
- `src/components/collections/detail/CollectionDetailLayout.tsx`

**Tasks:**
1. Create React component structure
2. Initialize all custom hooks
3. Implement state management
4. Coordinate between child components
5. Handle loading states
6. Implement pagination logic
7. Handle empty state condition
8. Pass props to child components

**Acceptance Criteria:**
- Component receives initial data
- All hooks initialized correctly
- State updates flow properly
- Loading states display correctly
- Empty state shows when appropriate

### Step 4: Create Header Component
**Files to create:**
- `src/components/collections/detail/CollectionHeader.tsx`

**Tasks:**
1. Create component structure
2. Display collection name as H1
3. Display recipe count with proper pluralization
4. Add "Edytuj nazwę" button with Pencil icon
5. Add "Usuń kolekcję" button with Trash2 icon (destructive)
6. Manage dialog open/close state
7. Implement responsive layout
8. Add proper ARIA labels

**Acceptance Criteria:**
- Header displays correctly on all screen sizes
- Buttons trigger appropriate dialogs
- Recipe count uses proper Polish pluralization
- Accessible via keyboard

### Step 5: Create Dialog Components
**Files to create:**
- `src/components/collections/detail/EditCollectionNameDialog.tsx`
- `src/components/collections/detail/DeleteCollectionDialog.tsx`
- `src/components/collections/detail/RemoveFromCollectionDialog.tsx`

**Tasks:**

**EditCollectionNameDialog:**
1. Use shadcn/ui Dialog components
2. Create form with controlled input
3. Implement real-time validation
4. Add submit and cancel handlers
5. Display validation errors
6. Show loading state during submission
7. Handle API errors (especially 409 conflict)

**DeleteCollectionDialog:**
1. Use shadcn/ui AlertDialog components
2. Display collection name in warning message
3. Add destructive confirm button
4. Implement delete handler
5. Show loading state
6. Handle success (call callback)

**RemoveFromCollectionDialog:**
1. Use shadcn/ui AlertDialog components
2. Display recipe and collection names
3. Explain that only association is removed
4. Add destructive confirm button
5. Implement remove handler
6. Handle success with undo toast

**Acceptance Criteria:**
- All dialogs use proper shadcn/ui components
- Validation works correctly
- Loading states display
- Error messages clear and helpful
- Keyboard accessible
- Mobile responsive

### Step 6: Create Recipe Grid Component
**Files to create:**
- `src/components/collections/detail/CollectionRecipeGrid.tsx`

**Tasks:**
1. Create responsive grid layout
2. Map recipes to RecipeCard components
3. Pass proper props to each card
4. Implement pagination controls at bottom
5. Add loading skeleton for page changes
6. Handle empty recipes array
7. Ensure proper spacing and alignment

**Acceptance Criteria:**
- Grid responsive (1-4 columns based on screen size)
- Pagination controls work correctly
- Loading skeleton displays during fetch
- Cards display correctly
- Proper gap between cards

### Step 7: Extend RecipeCard Component
**Files to modify:**
- `src/components/RecipeCard.tsx`

**Tasks:**
1. Add new optional props:
   - `isCollectionView?: boolean`
   - `collectionId?: string`
   - `collectionName?: string`
   - `onRemoveFromCollection?: () => void`
2. Add "Usuń z kolekcji" button/action when in collection view
3. Position remove button appropriately
4. Open RemoveFromCollectionDialog on click
5. Maintain existing functionality (favorite, click)

**Acceptance Criteria:**
- Original functionality unchanged
- Collection-specific action displays correctly
- Remove dialog opens on click
- Button doesn't trigger card click
- Keyboard accessible

### Step 8: Create Empty State Component
**Files to create:**
- `src/components/collections/detail/EmptyState.tsx`

**Tasks:**
1. Create centered layout
2. Add appropriate icon (folder or empty box)
3. Display heading and description
4. Add CTA button linking to browse recipes
5. Make responsive for mobile
6. Add proper styling

**Acceptance Criteria:**
- Displays centered in container
- Text is clear and helpful
- CTA button links to correct page
- Responsive design
- Visually appealing

### Step 9: Implement Pagination
**Files to create/modify:**
- Use existing shadcn/ui pagination or create custom component

**Tasks:**
1. Display current page info: "X-Y z Z przepisów"
2. Add Previous button (disabled on page 1)
3. Add Next button (disabled on last page)
4. Optionally add page number buttons (if shadcn provides)
5. Handle page change events
6. Show loading state during fetch
7. Implement proper Polish pluralization

**Acceptance Criteria:**
- Navigation works correctly
- Buttons disabled appropriately
- Current page displayed clearly
- Responsive on mobile
- Keyboard accessible

### Step 10: Add Loading Skeletons
**Files to create:**
- `src/components/collections/detail/LoadingSkeleton.tsx` (or inline)

**Tasks:**
1. Create skeleton for collection header
2. Create skeleton for recipe cards
3. Use shadcn/ui Skeleton component
4. Match actual component dimensions
5. Display during initial load and page changes
6. Implement smooth transitions

**Acceptance Criteria:**
- Skeletons match actual components
- Smooth loading transitions
- No layout shift when content loads
- Proper shimmer animation

### Step 11: Integrate Toast Notifications
**Files to modify:**
- All components that show toasts

**Tasks:**
1. Ensure toast provider configured (should be in AppLayout)
2. Use consistent toast messages:
   - Success: Green with checkmark
   - Error: Red with X icon
   - Info: Blue with info icon
3. Implement undo toasts with action buttons
4. Set appropriate durations (5s for undo, 3s for others)
5. Test all toast scenarios

**Acceptance Criteria:**
- All toasts display correctly
- Undo functionality works
- Messages clear in Polish
- Toasts dismissible
- Mobile responsive

### Step 12: Implement Accessibility
**Files to modify:**
- All component files

**Tasks:**
1. Add proper ARIA labels to all interactive elements
2. Ensure keyboard navigation works:
   - Tab through all controls
   - Enter/Space to activate
   - Escape to close dialogs
3. Add focus indicators
4. Ensure proper heading hierarchy (H1, H2, etc.)
5. Add screen reader text where needed
6. Test with keyboard only
7. Verify with screen reader (optional but recommended)

**Acceptance Criteria:**
- All interactive elements keyboard accessible
- Focus indicators visible
- ARIA labels appropriate
- Heading hierarchy correct
- Tab order logical

### Step 13: Add Responsive Design
**Files to modify:**
- All component files

**Tasks:**
1. Test on mobile (320px - 768px)
2. Test on tablet (768px - 1024px)
3. Test on desktop (> 1024px)
4. Adjust grid columns per breakpoint
5. Stack header buttons on mobile
6. Make dialogs mobile-friendly
7. Ensure touch targets adequate (min 44x44px)
8. Test landscape orientation

**Acceptance Criteria:**
- Layout works on all screen sizes
- No horizontal scrolling
- Touch targets appropriate
- Text readable on mobile
- Dialogs fit on screen

### Step 14: Error Handling Testing
**Files to modify:**
- All components with API calls

**Tasks:**
1. Test 404 response (collection not found)
2. Test 403 response (unauthorized)
3. Test 409 response (name conflict)
4. Test 500 response (server error)
5. Test network errors (offline)
6. Test empty page after removal
7. Test concurrent operations
8. Verify error messages display correctly
9. Test recovery from errors

**Acceptance Criteria:**
- All error scenarios handled gracefully
- User never sees unhandled errors
- Error messages clear and actionable
- Recovery possible when appropriate
- No data loss on errors

### Step 15: Integration Testing
**Tasks:**
1. Test complete user flows:
   - View collection
   - Navigate pages
   - Edit collection name
   - Remove recipe with undo
   - Delete collection
   - Toggle favorites
2. Test edge cases:
   - Empty collection
   - Single recipe
   - Last page with one recipe
   - Concurrent operations
3. Test performance:
   - Large collections (100+ recipes)
   - Slow network
   - Multiple rapid actions
4. Cross-browser testing:
   - Chrome
   - Firefox
   - Safari
   - Mobile browsers

**Acceptance Criteria:**
- All user flows work end-to-end
- Edge cases handled correctly
- Performance acceptable
- Works in all major browsers
- No console errors

### Step 16: Polish and Refinement
**Tasks:**
1. Review all Polish text for grammar and consistency
2. Ensure consistent styling with rest of app
3. Add subtle animations (optional):
   - Card hover effects
   - Dialog slide-in
   - Toast slide-in
4. Optimize images/icons if any
5. Review and optimize bundle size
6. Add comments to complex logic
7. Update type documentation
8. Final code review

**Acceptance Criteria:**
- Polish text perfect and consistent
- Visual consistency with app
- Animations smooth (if added)
- Code well-documented
- No unnecessary dependencies
- Ready for production

### Step 17: Documentation
**Tasks:**
1. Document component props and interfaces
2. Add usage examples to complex components
3. Document custom hooks with examples
4. Create troubleshooting guide for common issues
5. Document API endpoints used
6. Add architectural decisions document

**Acceptance Criteria:**
- All components documented
- Examples provided
- Troubleshooting guide helpful
- API usage clear
- Architecture documented

---

## Summary

This implementation plan provides a comprehensive guide for building the Collection Detail Page. The page allows users to:

- **View** their collection with paginated recipes
- **Edit** the collection name
- **Delete** the entire collection
- **Remove** recipes from the collection with undo functionality
- **Toggle** favorites on recipes
- **Navigate** to recipe details

Key technical decisions:
- Astro for server-side rendering with React for interactivity
- Custom hooks for state management and API calls
- Shadcn/ui components for dialogs and UI elements
- Optimistic updates for immediate feedback
- Comprehensive error handling with user-friendly messages
- Mobile-first responsive design
- Full keyboard accessibility
- Polish language interface

The implementation follows existing patterns in the codebase, reuses components where possible (RecipeCard, useFavoriteToggle), and maintains consistency with the application's architecture and styling.
