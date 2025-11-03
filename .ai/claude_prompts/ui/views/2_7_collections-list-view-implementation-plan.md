# View Implementation Plan: Collections List Page

## 1. Overview

The Collections List Page displays the user's recipe collections in a responsive grid layout. Users can view all their collections with recipe counts, create new collections, edit existing collection names, and delete collections. The view provides an intuitive interface for organizing recipes into categories with full CRUD functionality for collections.

**Key Features:**
- Responsive grid layout (1 column mobile, 2 tablet, 3-4 desktop)
- Collection cards showing name, recipe count, and created date
- Quick actions (Edit, Delete) with desktop hover overlay and mobile dropdown menu
- Create new collection dialog with validation
- Edit collection name with conflict detection
- Delete confirmation with recipe count context
- Empty state with call-to-action
- Loading skeletons for initial load
- Toast notifications for user feedback
- Polish language interface

## 2. View Routing

**Path:** `/collections`

**Access:** Authenticated users only (handled by AppLayout)

**Page Type:** Server-side rendered Astro page with client-side React components for interactivity

## 3. Component Structure

```
collections.astro (Astro Page)
└── CollectionsLayout (React, client:load)
    ├── PageHeader
    │   ├── H1: "Moje Kolekcje"
    │   └── Button: "+ Nowa kolekcja"
    ├── LoadingSkeleton (conditional: collections loading)
    ├── EmptyState (conditional: no collections)
    │   ├── Icon: FolderPlus
    │   ├── Message: "Nie masz jeszcze kolekcji"
    │   └── Button: "+ Utwórz pierwszą kolekcję"
    ├── CollectionGrid (conditional: collections exist)
    │   └── CollectionCard[] (multiple)
    │       ├── Card (Shadcn/ui)
    │       │   ├── Collection name
    │       │   ├── Recipe count
    │       │   ├── Created date
    │       │   └── Placeholder thumbnails
    │       ├── Desktop hover overlay (Edit/Delete icons)
    │       └── Mobile DropdownMenu (Edit/Delete options)
    ├── CreateCollectionDialog (Shadcn/ui Dialog)
    │   ├── Input: name
    │   └── Buttons: Utwórz / Anuluj
    ├── EditCollectionDialog (Shadcn/ui Dialog)
    │   ├── Input: name (pre-populated)
    │   └── Buttons: Zapisz / Anuluj
    └── DeleteCollectionDialog (Shadcn/ui AlertDialog)
        ├── Title: "Usuń kolekcję?"
        ├── Message with collection name and recipe count
        └── Buttons: Usuń (destructive) / Anuluj
```

## 4. Component Details

### collections.astro
- **Component description:** Main Astro page component that handles server-side rendering and initial data fetching. Serves as the entry point for the Collections List view and passes data to the React layer.
- **Main elements:**
  - `<AppLayout>` wrapper with title prop
  - `<CollectionsLayout>` React component with `client:load` directive
  - HTML comment block documenting the page
- **Handled interactions:** None (server-rendered)
- **Handled validation:** None (authentication handled by AppLayout)
- **Types:** None directly
- **Props:** None (receives data via Astro.locals.supabase)

### CollectionsLayout
- **Component description:** Main React container managing all state and orchestrating the collections view. Handles dialog states, API mutations, loading states, and user interactions.
- **Main elements:**
  - Container div with max-width and responsive padding
  - PageHeader section with title and create button
  - Conditional rendering: LoadingSkeleton OR EmptyState OR CollectionGrid
  - Three dialog components (Create, Edit, Delete)
  - Toast notifications via Sonner
- **Handled interactions:**
  - Open/close create dialog
  - Open/close edit dialog (with collection selection)
  - Open/close delete dialog (with collection selection)
  - Collection card click navigation
  - API mutations with optimistic updates
- **Handled validation:** Delegates to dialog components
- **Types:**
  - `CollectionDTO[]` (collections list)
  - `DialogState` (dialog management)
  - `CollectionFormData` (form state)
  - `CollectionFormErrors` (validation errors)
- **Props:**
  ```typescript
  interface CollectionsLayoutProps {
    initialCollections: CollectionDTO[];
  }
  ```

### CollectionGrid
- **Component description:** Responsive grid container that displays collection cards in a grid layout adapting from 1 column (mobile) to 4 columns (desktop).
- **Main elements:**
  - Grid container div with responsive classes: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4`
  - CollectionCard components for each collection
- **Handled interactions:**
  - Propagates onEdit, onDelete, onClick events from cards to parent
- **Handled validation:** None
- **Types:** `CollectionDTO[]`
- **Props:**
  ```typescript
  interface CollectionGridProps {
    collections: CollectionDTO[];
    onCardClick: (collectionId: string) => void;
    onEdit: (collection: CollectionDTO) => void;
    onDelete: (collection: CollectionDTO) => void;
  }
  ```

### CollectionCard
- **Component description:** Individual card displaying collection information with hover actions (desktop) or dropdown menu (mobile). Clicking the card navigates to collection detail view.
- **Main elements:**
  - Shadcn/ui Card component
  - CardHeader with collection name (H3)
  - CardContent with:
    - Recipe count badge: "X przepisów"
    - Thumbnail grid (4 colored placeholders in 2x2 grid)
    - Created date in relative format
  - Desktop: Hover overlay with Edit (Pencil icon) and Delete (Trash2 icon) buttons
  - Mobile: DropdownMenu with "..." trigger showing Edit/Delete options
- **Handled interactions:**
  - Card click → navigate to `/collections/{id}`
  - Edit button/menu click → trigger onEdit callback
  - Delete button/menu click → trigger onDelete callback
  - Hover states (desktop only)
- **Handled validation:** None
- **Types:** `CollectionDTO`
- **Props:**
  ```typescript
  interface CollectionCardProps {
    collection: CollectionDTO;
    onClick: (collectionId: string) => void;
    onEdit: (collection: CollectionDTO) => void;
    onDelete: (collection: CollectionDTO) => void;
  }
  ```

### CreateCollectionDialog
- **Component description:** Modal dialog for creating a new collection with name input and validation. Handles form submission and API communication.
- **Main elements:**
  - Shadcn/ui Dialog component
  - DialogHeader with title "Nowa kolekcja"
  - DialogDescription explaining name requirement
  - Form with:
    - Input field for collection name (label: "Nazwa kolekcji")
    - Error message display below input
  - DialogFooter with:
    - Cancel button (variant: outline)
    - Submit button "Utwórz" (with loading spinner when submitting)
- **Handled interactions:**
  - Form input onChange → update name state, clear errors
  - Cancel button → close dialog, reset form
  - Submit button → validate, call API, handle success/error
  - Dialog close (X or outside click) → reset form
- **Handled validation:**
  - **Name field:**
    - Required: "Nazwa kolekcji jest wymagana"
    - Min length (1 char after trim): "Nazwa kolekcji nie może być pusta"
    - Max length (100 chars): "Nazwa kolekcji może mieć maksymalnie 100 znaków"
    - Uniqueness (API-enforced): Display API error message
  - Client-side validation on submit before API call
  - Server-side validation response handling (409 for duplicates)
- **Types:**
  - `CreateCollectionCommand` (API request)
  - `CollectionFormData` (local form state)
  - `CollectionFormErrors` (validation errors)
- **Props:**
  ```typescript
  interface CreateCollectionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: (collection: CollectionDTO) => void;
  }
  ```

### EditCollectionDialog
- **Component description:** Modal dialog for editing an existing collection's name. Similar to CreateCollectionDialog but pre-populated with current data.
- **Main elements:**
  - Shadcn/ui Dialog component
  - DialogHeader with title "Edytuj kolekcję"
  - DialogDescription explaining name change
  - Form with:
    - Input field for collection name (pre-filled with current name)
    - Error message display below input
  - DialogFooter with:
    - Cancel button (variant: outline)
    - Submit button "Zapisz" (with loading spinner when submitting)
- **Handled interactions:**
  - Form input onChange → update name state, clear errors
  - Cancel button → close dialog, reset form to original value
  - Submit button → validate, call API, handle success/error
  - Dialog open → populate form with collection.name
- **Handled validation:**
  - Same validation rules as CreateCollectionDialog
  - Additional: Check if name unchanged → skip API call, close dialog
  - Uniqueness check excludes current collection
- **Types:**
  - `UpdateCollectionCommand` (API request)
  - `CollectionDTO` (current collection data)
  - `CollectionFormData` (local form state)
  - `CollectionFormErrors` (validation errors)
- **Props:**
  ```typescript
  interface EditCollectionDialogProps {
    open: boolean;
    collection: CollectionDTO | null;
    onOpenChange: (open: boolean) => void;
    onSuccess: (updatedCollection: { id: string; name: string }) => void;
  }
  ```

### DeleteCollectionDialog
- **Component description:** Confirmation dialog using AlertDialog for destructive delete action. Provides context about the collection being deleted.
- **Main elements:**
  - Shadcn/ui AlertDialog component
  - AlertDialogHeader with:
    - AlertDialogTitle: "Usuń kolekcję?"
    - AlertDialogDescription: Multi-line description with:
      - "Ta akcja jest nieodwracalna."
      - "Kolekcja '{collection.name}' zostanie trwale usunięta."
      - "Kolekcja zawiera {count} przepisów (przepisy pozostaną dostępne)"
  - AlertDialogFooter with:
    - Cancel button "Anuluj"
    - Destructive button "Usuń" (red, with loading spinner when deleting)
- **Handled interactions:**
  - Cancel button → close dialog
  - Usuń button → call DELETE API, handle success/error
  - Dialog close → reset state
- **Handled validation:** None (confirmation only)
- **Types:**
  - `CollectionDTO` (collection to delete)
- **Props:**
  ```typescript
  interface DeleteCollectionDialogProps {
    open: boolean;
    collection: CollectionDTO | null;
    onOpenChange: (open: boolean) => void;
    onSuccess: (deletedCollectionId: string) => void;
  }
  ```

### EmptyState
- **Component description:** Friendly empty state displayed when user has no collections, encouraging them to create their first collection.
- **Main elements:**
  - Container div with centered flex layout
  - FolderPlus icon (large, muted color)
  - Heading: "Nie masz jeszcze kolekcji"
  - Subtitle: "Organizuj przepisy w kolekcje, aby łatwiej je znaleźć"
  - Button: "+ Utwórz pierwszą kolekcję" (primary variant)
- **Handled interactions:**
  - Button click → trigger onCreateClick callback (opens create dialog)
- **Handled validation:** None
- **Types:** None
- **Props:**
  ```typescript
  interface EmptyStateProps {
    onCreateClick: () => void;
  }
  ```

### LoadingSkeleton
- **Component description:** Skeleton loading state matching the grid layout, displayed while collections are loading.
- **Main elements:**
  - Grid container (same classes as CollectionGrid)
  - 4-6 skeleton cards with:
    - Skeleton header (title placeholder)
    - Skeleton content (count, thumbnails, date placeholders)
  - Uses Shadcn/ui Skeleton component for shimmer effect
- **Handled interactions:** None
- **Handled validation:** None
- **Types:** None
- **Props:** None

## 5. Types

### Existing DTOs (from types.ts)

```typescript
// Already defined, imported from @/types
interface CollectionDTO {
  id: string;
  userId: string;
  name: string;
  recipeCount: number;
  createdAt: string;
}

interface CreateCollectionCommand {
  name: string;
}

interface UpdateCollectionCommand {
  name: string;
}
```

### New ViewModels (to be added in components/collections/types.ts)

```typescript
/**
 * Dialog state management for all collection dialogs
 */
export interface DialogState {
  create: boolean;
  edit: {
    open: boolean;
    collection: CollectionDTO | null;
  };
  delete: {
    open: boolean;
    collection: CollectionDTO | null;
  };
}

/**
 * Form data structure for create/edit collection dialogs
 */
export interface CollectionFormData {
  name: string;
}

/**
 * Validation errors for collection forms
 */
export interface CollectionFormErrors {
  name?: string;
}

/**
 * Props for CollectionsLayout component
 */
export interface CollectionsLayoutProps {
  initialCollections: CollectionDTO[];
}

/**
 * Props for CollectionGrid component
 */
export interface CollectionGridProps {
  collections: CollectionDTO[];
  onCardClick: (collectionId: string) => void;
  onEdit: (collection: CollectionDTO) => void;
  onDelete: (collection: CollectionDTO) => void;
}

/**
 * Props for CollectionCard component
 */
export interface CollectionCardProps {
  collection: CollectionDTO;
  onClick: (collectionId: string) => void;
  onEdit: (collection: CollectionDTO) => void;
  onDelete: (collection: CollectionDTO) => void;
}

/**
 * Props for CreateCollectionDialog component
 */
export interface CreateCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (collection: CollectionDTO) => void;
}

/**
 * Props for EditCollectionDialog component
 */
export interface EditCollectionDialogProps {
  open: boolean;
  collection: CollectionDTO | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: (updatedCollection: { id: string; name: string }) => void;
}

/**
 * Props for DeleteCollectionDialog component
 */
export interface DeleteCollectionDialogProps {
  open: boolean;
  collection: CollectionDTO | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: (deletedCollectionId: string) => void;
}

/**
 * Props for EmptyState component
 */
export interface EmptyStateProps {
  onCreateClick: () => void;
}
```

### API Response Types

```typescript
// Response from POST /api/collections
interface CreateCollectionResponse {
  success: true;
  collection: CollectionDTO;
}

// Response from PUT /api/collections/{id}
interface UpdateCollectionResponse {
  success: true;
  collection: {
    id: string;
    name: string;
  };
}

// Response from GET /api/collections
interface GetCollectionsResponse {
  collections: CollectionDTO[];
}
```

## 6. State Management

### CollectionsLayout State

The main state management occurs in the `CollectionsLayout` component using React hooks:

```typescript
// Collections data (initialized from server, updated on mutations)
const [collections, setCollections] = useState<CollectionDTO[]>(initialCollections);

// Loading state for mutations
const [isLoading, setIsLoading] = useState<boolean>(false);

// Dialog state management
const [dialogState, setDialogState] = useState<DialogState>({
  create: false,
  edit: { open: false, collection: null },
  delete: { open: false, collection: null }
});
```

### State Update Patterns

**Optimistic Updates:**
- Add: Immediately add new collection to state, revert on error
- Update: Immediately update collection in state, revert on error
- Delete: Immediately remove collection from state, revert on error

**Dialog State Helpers:**
```typescript
const openCreateDialog = () => {
  setDialogState(prev => ({ ...prev, create: true }));
};

const openEditDialog = (collection: CollectionDTO) => {
  setDialogState(prev => ({
    ...prev,
    edit: { open: true, collection }
  }));
};

const openDeleteDialog = (collection: CollectionDTO) => {
  setDialogState(prev => ({
    ...prev,
    delete: { open: true, collection }
  }));
};

const closeAllDialogs = () => {
  setDialogState({
    create: false,
    edit: { open: false, collection: null },
    delete: { open: false, collection: null }
  });
};
```

### No Custom Hook Required

State management is straightforward enough to be handled directly in the `CollectionsLayout` component without requiring a custom hook. All state updates are simple and localized to this view.

## 7. API Integration

### GET /api/collections (Server-side)

**Where:** `collections.astro` page component

**When:** On initial page load (server-side rendering)

**Implementation:**
```typescript
const { data, error } = await Astro.locals.supabase
  .from('collections')
  .select('*');

const response = await fetch(`${Astro.url.origin}/api/collections`, {
  headers: {
    'Cookie': Astro.request.headers.get('Cookie') || ''
  }
});
const { collections } = await response.json();
```

**Request:** None (uses authentication from cookies)

**Response Type:** `GetCollectionsResponse`
```typescript
{
  collections: CollectionDTO[]
}
```

**Error Handling:**
- 500: Display error page or redirect to error route
- Pass empty array to CollectionsLayout on error (will show empty state)

---

### POST /api/collections (Client-side)

**Where:** `CreateCollectionDialog` component

**When:** User submits create collection form

**Request Type:** `CreateCollectionCommand`
```typescript
{
  name: string // 1-100 chars, trimmed, unique per user
}
```

**Response Type:** `CreateCollectionResponse` (201 Created)
```typescript
{
  success: true,
  collection: CollectionDTO
}
```

**Error Responses:**
- 400 Bad Request: Validation error
  - Display error message in form
- 409 Conflict: Duplicate collection name
  - Display "Kolekcja o tej nazwie już istnieje" below input
- 500 Internal Server Error: Generic error
  - Display toast: "Wystąpił błąd. Spróbuj ponownie."

**Implementation Pattern:**
```typescript
const handleSubmit = async () => {
  setIsLoading(true);
  try {
    const response = await fetch('/api/collections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: formData.name.trim() })
    });

    if (!response.ok) {
      const error = await response.json();
      if (response.status === 409) {
        setFormErrors({ name: 'Kolekcja o tej nazwie już istnieje' });
      } else {
        toast.error('Wystąpił błąd. Spróbuj ponownie.');
      }
      return;
    }

    const { collection } = await response.json();
    onSuccess(collection);
    toast.success('Kolekcja została utworzona');
  } catch (error) {
    toast.error('Wystąpił błąd. Spróbuj ponownie.');
  } finally {
    setIsLoading(false);
  }
};
```

---

### PUT /api/collections/{collectionId} (Client-side)

**Where:** `EditCollectionDialog` component

**When:** User submits edit collection form

**Request Type:** `UpdateCollectionCommand`
```typescript
{
  name: string // 1-100 chars, trimmed, unique per user
}
```

**Response Type:** `UpdateCollectionResponse` (200 OK)
```typescript
{
  success: true,
  collection: {
    id: string,
    name: string
  }
}
```

**Error Responses:**
- 400 Bad Request: Validation error
- 404 Not Found: Collection doesn't exist
  - Toast error, refresh collections list
- 409 Conflict: Duplicate collection name
  - Display error below input
- 500 Internal Server Error: Generic error
  - Toast error message

**Implementation Pattern:**
```typescript
const handleUpdate = async () => {
  if (!collection) return;

  setIsLoading(true);
  try {
    const response = await fetch(`/api/collections/${collection.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: formData.name.trim() })
    });

    if (!response.ok) {
      const error = await response.json();
      if (response.status === 409) {
        setFormErrors({ name: 'Kolekcja o tej nazwie już istnieje' });
      } else if (response.status === 404) {
        toast.error('Kolekcja nie została znaleziona');
        // Optionally refresh collections list
      } else {
        toast.error('Wystąpił błąd. Spróbuj ponownie.');
      }
      return;
    }

    const { collection: updated } = await response.json();
    onSuccess(updated);
    toast.success('Kolekcja została zaktualizowana');
  } catch (error) {
    toast.error('Wystąpił błąd. Spróbuj ponownie.');
  } finally {
    setIsLoading(false);
  }
};
```

---

### DELETE /api/collections/{collectionId} (Client-side)

**Where:** `DeleteCollectionDialog` component

**When:** User confirms collection deletion

**Request:** None (collectionId in URL)

**Response:** 204 No Content (empty response body)

**Error Responses:**
- 404 Not Found: Collection doesn't exist
  - Toast error, refresh collections list
- 500 Internal Server Error: Generic error
  - Toast error message

**Implementation Pattern:**
```typescript
const handleDelete = async () => {
  if (!collection) return;

  setIsLoading(true);
  try {
    const response = await fetch(`/api/collections/${collection.id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      if (response.status === 404) {
        toast.error('Kolekcja nie została znaleziona');
      } else {
        toast.error('Nie udało się usunąć kolekcji');
      }
      return;
    }

    onSuccess(collection.id);
    toast.success('Kolekcja została usunięta');
  } catch (error) {
    toast.error('Wystąpił błąd. Spróbuj ponownie.');
  } finally {
    setIsLoading(false);
  }
};
```

## 8. User Interactions

### 1. Click "+ Nowa kolekcja" Button (Header)
- **Trigger:** User clicks button in page header
- **Action:** Open CreateCollectionDialog
- **State Change:** `dialogState.create = true`
- **Visual Feedback:** Dialog slides in from center

### 2. Submit Create Collection Form
- **Trigger:** User fills name input and clicks "Utwórz"
- **Action:**
  1. Client-side validation
  2. If valid: POST /api/collections
  3. On success: Add collection to state, close dialog, show success toast
  4. On error: Display error message (inline for 409, toast for others)
- **State Changes:**
  - `isLoading = true` (during API call)
  - `collections = [...collections, newCollection]` (on success)
  - `dialogState.create = false` (on success)
  - `formErrors.name = error message` (on validation/API error)
- **Visual Feedback:**
  - Submit button shows spinner during loading
  - Success toast: "Kolekcja została utworzona"
  - Error display below input field or as toast

### 3. Cancel Create/Edit Dialog
- **Trigger:** User clicks "Anuluj" or X or clicks outside dialog
- **Action:** Close dialog, reset form data and errors
- **State Changes:**
  - `dialogState.create = false` or `dialogState.edit.open = false`
  - Form data reset to initial state
  - Form errors cleared
- **Visual Feedback:** Dialog slides out

### 4. Click Collection Card
- **Trigger:** User clicks anywhere on collection card (except action buttons/menu)
- **Action:** Navigate to collection detail page
- **Navigation:** `window.location.href = /collections/${collectionId}`
- **State Changes:** None (page navigation)
- **Visual Feedback:** Card hover effect (desktop), card press effect (mobile)

### 5. Click Edit Icon/Menu Item
- **Trigger:**
  - Desktop: User hovers card and clicks Pencil icon
  - Mobile: User clicks "..." menu and selects "Edytuj"
- **Action:** Open EditCollectionDialog with pre-populated data
- **State Changes:**
  - `dialogState.edit = { open: true, collection }`
  - Form pre-filled with `collection.name`
- **Visual Feedback:**
  - Desktop: Icon highlights on hover
  - Mobile: Menu item highlights on tap
  - Dialog opens with current name

### 6. Submit Edit Collection Form
- **Trigger:** User modifies name and clicks "Zapisz"
- **Action:**
  1. Check if name changed (if not, just close dialog)
  2. Client-side validation
  3. If valid: PUT /api/collections/{id}
  4. On success: Update collection in state, close dialog, show success toast
  5. On error: Display error message
- **State Changes:**
  - `isLoading = true` (during API call)
  - Update collection in `collections` array (on success)
  - `dialogState.edit.open = false` (on success)
  - `formErrors.name = error message` (on error)
- **Visual Feedback:**
  - Submit button shows spinner
  - Success toast: "Kolekcja została zaktualizowana"
  - Error display below input or as toast

### 7. Click Delete Icon/Menu Item
- **Trigger:**
  - Desktop: User hovers card and clicks Trash2 icon
  - Mobile: User clicks "..." menu and selects "Usuń"
- **Action:** Open DeleteCollectionDialog with collection context
- **State Changes:**
  - `dialogState.delete = { open: true, collection }`
- **Visual Feedback:**
  - Desktop: Icon highlights red on hover
  - Mobile: Menu item shows in red
  - AlertDialog opens showing collection name and recipe count

### 8. Confirm Delete Collection
- **Trigger:** User clicks "Usuń" in delete confirmation dialog
- **Action:**
  1. DELETE /api/collections/{id}
  2. On success: Remove collection from state, close dialog, show success toast
  3. On error: Display error toast
- **State Changes:**
  - `isLoading = true` (during API call)
  - Remove collection from `collections` array (on success)
  - `dialogState.delete.open = false` (on success)
- **Visual Feedback:**
  - Delete button shows spinner
  - Success toast: "Kolekcja została usunięta"
  - Error toast on failure

### 9. Cancel Delete Dialog
- **Trigger:** User clicks "Anuluj" or X or clicks outside dialog
- **Action:** Close dialog without deleting
- **State Changes:** `dialogState.delete.open = false`
- **Visual Feedback:** Dialog closes

### 10. Empty State CTA Click
- **Trigger:** User clicks "+ Utwórz pierwszą kolekcję" in empty state
- **Action:** Open CreateCollectionDialog (same as header button)
- **State Changes:** `dialogState.create = true`
- **Visual Feedback:** Dialog opens

## 9. Conditions and Validation

### Client-Side Validation (Create/Edit Dialogs)

**Collection Name Field:**

1. **Required Validation**
   - Condition: Field is empty or whitespace only
   - Error Message: "Nazwa kolekcji jest wymagana"
   - Trigger: On form submit
   - Implementation: `if (!name.trim()) { setError(...) }`

2. **Minimum Length Validation**
   - Condition: Trimmed length < 1 character
   - Error Message: "Nazwa kolekcji nie może być pusta"
   - Trigger: On form submit
   - Implementation: `if (name.trim().length < 1) { setError(...) }`

3. **Maximum Length Validation**
   - Condition: Length > 100 characters
   - Error Message: "Nazwa kolekcji może mieć maksymalnie 100 znaków"
   - Trigger: On input change (prevent typing) or on submit
   - Implementation:
     - Input maxLength attribute: `maxLength={100}`
     - Validation: `if (name.length > 100) { setError(...) }`

4. **Character Count Display**
   - Condition: Always visible when typing
   - Display: "{current}/100" below input
   - Color: Gray when < 90, amber when 90-100, red if > 100

### Server-Side Validation (API)

**Uniqueness Validation:**
- Condition: Collection with same name exists for user
- Response: 409 Conflict
- Error Message: "Kolekcja o tej nazwie już istnieje"
- Handling: Display error below input field (red text)
- Special Case (Edit): Uniqueness check excludes current collection

### Conditional Rendering

**Loading Skeleton:**
- Condition: Initial page load with no data yet (handled by Astro)
- Display: Grid of skeleton cards
- Duration: Until collections data loaded

**Empty State:**
- Condition: `collections.length === 0 && !isLoading`
- Display: EmptyState component with CTA
- Hide: Once user creates first collection

**Collection Grid:**
- Condition: `collections.length > 0`
- Display: Grid of collection cards
- Hide: When no collections exist

**Desktop Hover Overlay:**
- Condition: Screen width >= 1024px (lg breakpoint)
- Display: Overlay with Edit/Delete icons on card hover
- Implementation: CSS `hidden lg:flex` + hover states

**Mobile Dropdown Menu:**
- Condition: Screen width < 1024px
- Display: "..." button triggering DropdownMenu
- Implementation: CSS `flex lg:hidden`

**Dialog Open States:**
- CreateCollectionDialog: `dialogState.create === true`
- EditCollectionDialog: `dialogState.edit.open === true`
- DeleteCollectionDialog: `dialogState.delete.open === true`

**Button Loading States:**
- Condition: `isLoading === true`
- Effect:
  - Button disabled
  - Text replaced with spinner + loading text
  - Cursor changed to not-allowed

**Form Error Display:**
- Condition: `formErrors.name` is not undefined
- Display: Error message in red below input field
- Clear: On input change or successful submission

### Validation Flow

**Create Collection:**
1. User types name → Character count updates
2. User clicks "Utwórz" → Client-side validation runs
3. If invalid → Display error, keep dialog open
4. If valid → API call with trimmed name
5. API validates uniqueness → 409 if duplicate
6. If 409 → Display "already exists" error
7. If 201 → Success, add to state, close dialog, toast

**Edit Collection:**
1. Dialog opens → Form pre-filled with current name
2. User modifies name → Character count updates
3. User clicks "Zapisz" → Check if name changed
4. If unchanged → Close dialog immediately (no API call)
5. If changed → Client-side validation
6. If invalid → Display error, keep dialog open
7. If valid → API call
8. API validates uniqueness (excluding current) → 409 if duplicate
9. If 409 → Display "already exists" error
10. If 200 → Success, update state, close dialog, toast

## 10. Error Handling

### API Error Scenarios

#### 1. Network Errors (fetch fails)
- **Scenario:** Network timeout, no internet connection, CORS issues
- **Detection:** `try/catch` around fetch call, `catch` block triggered
- **Handling:**
  - Display toast: "Błąd połączenia. Sprawdź połączenie internetowe."
  - Keep dialog open (for create/edit)
  - Log error to console for debugging
- **User Action:** Retry after fixing network issue

#### 2. 400 Bad Request (Validation Error)
- **Scenario:** Invalid JSON format or validation failure on API
- **Detection:** `response.status === 400`
- **Handling:**
  - Parse error response: `const { message } = await response.json()`
  - Display generic validation error in form
  - Log specific error for debugging
- **User Action:** Correct input and retry
- **Note:** Should rarely occur due to client-side validation

#### 3. 404 Not Found (Collection Deleted)
- **Scenario:** Collection was deleted by another session or admin
- **Detection:** `response.status === 404` (edit/delete operations)
- **Handling:**
  - Display toast: "Kolekcja nie została znaleziona"
  - Close dialog
  - Optionally refresh collections list from server
  - Remove collection from local state if present
- **User Action:** None needed (state synced)

#### 4. 409 Conflict (Duplicate Name)
- **Scenario:** Collection with same name already exists for user
- **Detection:** `response.status === 409`
- **Handling:**
  - Display inline error: "Kolekcja o tej nazwie już istnieje"
  - Keep dialog open
  - Focus on name input
  - Red border on input field
- **User Action:** Choose different name and retry

#### 5. 500 Internal Server Error
- **Scenario:** Database error, server crash, unexpected exception
- **Detection:** `response.status === 500`
- **Handling:**
  - Display toast: "Wystąpił błąd. Spróbuj ponownie."
  - Keep dialog open (for create/edit)
  - Log full error for debugging
- **User Action:** Retry operation, contact support if persists

#### 6. Initial Load Failure (Astro page)
- **Scenario:** GET /api/collections fails on server-side
- **Detection:** Error during server-side fetch in collections.astro
- **Handling:**
  - Pass empty array to CollectionsLayout
  - Display error message in place of content
  - Provide "Odśwież" button to reload page
- **User Action:** Refresh page

### Error Recovery Patterns

**Optimistic Update Rollback:**
```typescript
// Example for delete operation
const handleDelete = async (collectionId: string) => {
  // Save original state
  const originalCollections = [...collections];

  // Optimistic update
  setCollections(collections.filter(c => c.id !== collectionId));

  try {
    const response = await fetch(`/api/collections/${collectionId}`, {
      method: 'DELETE'
    });

    if (!response.ok) throw new Error('Delete failed');

    toast.success('Kolekcja została usunięta');
  } catch (error) {
    // Rollback on error
    setCollections(originalCollections);
    toast.error('Nie udało się usunąć kolekcji');
  }
};
```

**Form Error State Management:**
```typescript
// Clear errors on input change
const handleNameChange = (value: string) => {
  setFormData({ name: value });
  if (formErrors.name) {
    setFormErrors({});
  }
};

// Reset on dialog close
const handleClose = () => {
  setFormData({ name: '' });
  setFormErrors({});
  onOpenChange(false);
};
```

### Error Messages (Polish)

| Error Type | Polish Message |
|------------|---------------|
| Required field | "Nazwa kolekcji jest wymagana" |
| Empty after trim | "Nazwa kolekcji nie może być pusta" |
| Too long | "Nazwa kolekcji może mieć maksymalnie 100 znaków" |
| Duplicate name | "Kolekcja o tej nazwie już istnieje" |
| Not found | "Kolekcja nie została znaleziona" |
| Network error | "Błąd połączenia. Sprawdź połączenie internetowe." |
| Generic error | "Wystąpił błąd. Spróbuj ponownie." |
| Delete success | "Kolekcja została usunięta" |
| Create success | "Kolekcja została utworzona" |
| Update success | "Kolekcja została zaktualizowana" |

## 11. Implementation Steps

### Step 1: Create Type Definitions
**File:** `src/components/collections/types.ts`

1. Define all interfaces listed in Section 5 (Types)
2. Export all types for use in other components
3. Import `CollectionDTO` from `@/types`

**Verification:** TypeScript compiles without errors

---

### Step 2: Create Astro Page
**File:** `src/pages/collections.astro`

1. Set up page metadata (title: "Moje Kolekcje - HealthyMeal")
2. Fetch collections from GET /api/collections
3. Handle fetch errors (pass empty array on error)
4. Wrap in `<AppLayout>` component
5. Render `<CollectionsLayout>` with `client:load` and `initialCollections` prop
6. Add HTML comment documenting the page

**Verification:** Page renders without errors, data fetching works

---

### Step 3: Create Empty State Component
**File:** `src/components/collections/EmptyState.tsx`

1. Import FolderPlus icon from lucide-react
2. Create centered flex container
3. Add icon, heading, subtitle, and CTA button
4. Implement onCreateClick prop callback
5. Apply Polish text: "Nie masz jeszcze kolekcji"
6. Style with Tailwind classes

**Verification:** Component renders correctly in isolation

---

### Step 4: Create Loading Skeleton Component
**File:** `src/components/collections/LoadingSkeleton.tsx`

1. Import Skeleton component from Shadcn/ui
2. Create grid layout matching CollectionGrid
3. Add 4-6 skeleton cards
4. Each card has skeleton elements for title, count, thumbnails, date
5. Apply shimmer animation

**Verification:** Skeleton displays correctly, matches grid layout

---

### Step 5: Create Collection Card Component
**File:** `src/components/collections/CollectionCard.tsx`

1. Import Card components from Shadcn/ui
2. Import icons: Pencil, Trash2, MoreVertical from lucide-react
3. Implement card structure (name, count, thumbnails, date)
4. Add desktop hover overlay with Edit/Delete icons
5. Add mobile DropdownMenu with Edit/Delete options
6. Implement onClick handler for card navigation
7. Implement onEdit and onDelete prop callbacks
8. Add responsive classes (desktop overlay: `hidden lg:flex`, mobile menu: `flex lg:hidden`)
9. Format recipe count with proper Polish pluralization
10. Format date with relative time (e.g., "2 dni temu")

**Verification:** Card renders correctly, hover states work, menu works on mobile

---

### Step 6: Create Collection Grid Component
**File:** `src/components/collections/CollectionGrid.tsx`

1. Create grid container with responsive classes
2. Map over collections array
3. Render CollectionCard for each collection
4. Pass through event handlers (onClick, onEdit, onDelete)
5. Handle empty array case (shouldn't render, but add safety check)

**Verification:** Grid displays correctly on all screen sizes

---

### Step 7: Create Create Collection Dialog
**File:** `src/components/collections/dialogs/CreateCollectionDialog.tsx`

1. Import Dialog components from Shadcn/ui
2. Import Input, Button components
3. Set up form state (name, errors, loading)
4. Implement client-side validation function
5. Implement API call (POST /api/collections)
6. Add error handling (400, 409, 500, network errors)
7. Implement success callback (onSuccess prop)
8. Add toast notifications (success/error)
9. Add character counter below input
10. Add loading spinner in submit button
11. Implement form reset on close
12. Apply Polish labels and error messages

**Verification:** Dialog opens/closes, validation works, API calls succeed, errors display correctly

---

### Step 8: Create Edit Collection Dialog
**File:** `src/components/collections/dialogs/EditCollectionDialog.tsx`

1. Copy structure from CreateCollectionDialog
2. Add collection prop (CollectionDTO | null)
3. Pre-populate form when dialog opens (useEffect on collection change)
4. Check if name unchanged → skip API call, close immediately
5. Implement API call (PUT /api/collections/{id})
6. Handle edit-specific errors (404)
7. Update success callback signature
8. Apply "Zapisz" button text
9. Add loading states
10. Implement form reset on close

**Verification:** Dialog pre-fills correctly, API calls work, updates reflected in UI

---

### Step 9: Create Delete Collection Dialog
**File:** `src/components/collections/dialogs/DeleteCollectionDialog.tsx`

1. Import AlertDialog components from Shadcn/ui
2. Add collection prop (CollectionDTO | null)
3. Display collection name in description
4. Display recipe count with proper pluralization
5. Implement API call (DELETE /api/collections/{id})
6. Handle delete-specific errors (404)
7. Implement success callback (onSuccess with collectionId)
8. Add loading spinner in delete button
9. Style delete button as destructive (red)
10. Apply Polish warning text

**Verification:** Dialog displays correct collection info, deletion works, errors handled

---

### Step 10: Create Collections Layout Component
**File:** `src/components/collections/CollectionsLayout.tsx`

1. Set up component with initialCollections prop
2. Initialize collections state from initialCollections
3. Set up dialog state management (create, edit, delete)
4. Implement dialog helper functions (open/close each dialog)
5. Implement success handlers for each dialog:
   - createSuccess: Add collection to state
   - editSuccess: Update collection in state
   - deleteSuccess: Remove collection from state
6. Implement card click handler (navigate to /collections/{id})
7. Set up conditional rendering:
   - Show LoadingSkeleton if initial load (optional, handled by Astro)
   - Show EmptyState if no collections
   - Show CollectionGrid if collections exist
8. Render all three dialogs (Create, Edit, Delete)
9. Add page header with title and "+ Nowa kolekcja" button
10. Apply max-width container and responsive padding
11. Import and configure Sonner for toasts

**Verification:** All components integrate correctly, state updates work, navigation works

---

### Step 11: Style and Polish

1. Review all components for consistent Tailwind styling
2. Test responsive breakpoints (mobile, tablet, desktop)
3. Verify hover states and transitions
4. Check focus states for accessibility
5. Test keyboard navigation (Tab, Enter, Escape)
6. Verify color contrast for WCAG compliance
7. Test with screen reader (basic check)
8. Polish loading states and animations
9. Verify Polish text is grammatically correct
10. Test with various collection counts (0, 1, many)

**Verification:** UI looks polished, responsive design works, accessibility basics covered

---

### Step 12: Testing and Bug Fixes

1. **Manual Testing:**
   - Create new collection → verify appears in grid
   - Edit collection name → verify updates in grid
   - Delete collection → verify removed from grid
   - Try duplicate name → verify error displays
   - Test with slow network (throttle)
   - Test error scenarios (disconnect network)
   - Test on mobile device (real or emulator)
   - Test on different browsers (Chrome, Firefox, Safari)

2. **Edge Cases:**
   - Create collection with max length name (100 chars)
   - Create collection with special characters
   - Edit collection without changing name
   - Delete collection with many recipes
   - Rapid clicking (ensure loading states prevent double-submit)
   - Dialog close during API call

3. **Integration Testing:**
   - Navigate from dashboard to collections
   - Navigate from collections to collection detail
   - Create collection, then add recipes to it
   - Verify collections persist after page refresh

4. **Bug Fixes:**
   - Fix any issues discovered during testing
   - Improve error messages if unclear
   - Adjust styling if elements misaligned
   - Optimize performance if slow

**Verification:** All functionality works as expected, no critical bugs

---

### Step 13: Final Review and Documentation

1. Review code for:
   - Consistent naming conventions
   - Proper TypeScript types
   - Error handling completeness
   - Code comments where needed
   - Removed console.logs (except intentional logging)

2. Update documentation:
   - Add inline JSDoc comments for complex functions
   - Update types.ts with comprehensive type documentation
   - Ensure component props are well-documented

3. Performance check:
   - Verify no unnecessary re-renders
   - Check bundle size impact
   - Optimize images/icons if needed

4. Security review:
   - Verify no sensitive data in client logs
   - Check CSRF protection (handled by Supabase)
   - Verify authentication is enforced (AppLayout)

**Verification:** Code is production-ready, documented, and secure

---

### Step 14: Deployment Preparation

1. Test build process: `npm run build`
2. Test production build locally: `npm run preview`
3. Verify no build errors or warnings
4. Check that all assets are correctly bundled
5. Test in production-like environment
6. Prepare rollback plan if needed

**Verification:** Production build works correctly

---

### Implementation Order Summary

1. ✅ Type definitions
2. ✅ Astro page (basic structure)
3. ✅ Empty state component
4. ✅ Loading skeleton component
5. ✅ Collection card component
6. ✅ Collection grid component
7. ✅ Create dialog
8. ✅ Edit dialog
9. ✅ Delete dialog
10. ✅ Collections layout (integration)
11. ✅ Styling and polish
12. ✅ Testing and bug fixes
13. ✅ Final review
14. ✅ Deployment

**Total Estimated Time:** 8-12 hours for a single developer

**Recommended Approach:**
- Implement bottom-up (smallest components first)
- Test each component in isolation before integration
- Use Storybook or similar tool for component development (optional)
- Implement dialogs one at a time and test thoroughly
- Save integration (CollectionsLayout) for last when all pieces work

---

## Notes for Implementation

### Key Considerations

1. **Mobile-First:** Always start with mobile layout, then enhance for desktop
2. **Accessibility:** Ensure keyboard navigation works, use semantic HTML
3. **Performance:** Minimize re-renders, use React.memo if needed
4. **Error Handling:** Every API call must have comprehensive error handling
5. **User Feedback:** Always provide visual feedback for user actions (toasts, loading states)
6. **Polish Language:** Double-check all text for proper Polish grammar and declension
7. **Consistency:** Follow existing patterns from AddToCollectionDialog and FavoritesLayout

### Common Pitfalls to Avoid

1. **Don't forget client:load** directive on CollectionsLayout in Astro page
2. **Don't render dialogs conditionally** (always render, control via open prop)
3. **Don't forget to trim** collection name before API calls
4. **Don't allow empty name** after trimming
5. **Don't forget optimistic updates** for better UX
6. **Don't forget to handle 409 conflicts** separately from other errors
7. **Don't forget mobile menu** for Edit/Delete actions
8. **Don't forget to close dialogs** on success
9. **Don't forget to reset form state** when dialogs close
10. **Don't forget Polish pluralization** for recipe counts

### Future Enhancements (Post-MVP)

- Collection sorting (alphabetical, date, recipe count)
- Collection search/filter
- Collection cover images
- Recipe thumbnails from actual recipe images
- Bulk operations (delete multiple collections)
- Collection sharing (public collections)
- Collection categories/tags
- Drag-and-drop reordering
- Keyboard shortcuts (N for new, E for edit, etc.)
- Collection statistics (most popular recipes, etc.)
