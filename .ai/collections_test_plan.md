# Collections Page - Test Plan

**Generated:** 2025-12-03
**Root Component:** `src/pages/collections.astro`
**Main Layout:** `src/components/collections/CollectionsLayout.tsx`

---

## Executive Summary

This test plan covers the Collections feature, which allows users to organize recipes into custom collections. The feature includes collection creation, editing, deletion, and display in a responsive grid layout.

**Total Estimated Tests:** ~310-340 tests
**Priority Distribution:**
- **P0 (Critical):** ~180 tests - Core CRUD operations and data flow
- **P1 (High):** ~80 tests - User interactions and validation
- **P2 (Medium):** ~50 tests - Edge cases and error handling

**Components to Test:** 8 components + 3 utility functions

---

## Testing Principles

### What Makes Collections Worth Testing

1. **Complex State Management** - Multiple dialog states, optimistic updates, form validation
2. **Critical User Data** - Collections organize user recipes; data integrity is essential
3. **Form Validation** - Client-side and server-side validation with conflict detection
4. **Responsive Design** - Different interaction patterns for mobile/desktop
5. **API Integration** - All CRUD operations with error handling
6. **Toast Notifications** - User feedback system integration
7. **Accessibility** - Form labels, keyboard navigation, ARIA attributes

### Testing Strategy

- **Unit Tests** for all components and utility functions
- **Integration Tests** for dialog workflows and state management
- **Accessibility Tests** for ARIA attributes and keyboard navigation
- **Error Handling Tests** for API failures and edge cases
- Focus on user behavior over implementation details

---

## Priority Levels

| Level | Description | Examples |
|-------|-------------|----------|
| **P0** | Critical functionality that must work | CRUD operations, data flow, navigation |
| **P1** | Important user features | Form validation, error messages, loading states |
| **P2** | Edge cases and polish | Special characters, boundary values, accessibility |

---

## Test Coverage by Component

### 1. CollectionsLayout (Main Orchestrator)

**File:** `src/components/collections/CollectionsLayout.tsx`
**Test File:** `src/components/collections/__tests__/CollectionsLayout.test.tsx`
**Estimated Tests:** 55-60

#### Why Test This Component?

- **Orchestrates entire collections feature** - Manages all dialog states and data flow
- **Complex state management** - Collections array + 3 dialog states
- **Optimistic updates** - Immediate UI feedback for create/edit/delete
- **Navigation integration** - Redirects to collection detail pages
- **Conditional rendering** - Empty state vs. grid + header button visibility

#### Test Coverage

##### P0 - Critical Functionality (25 tests)

**Initial Rendering**
- ✅ Renders page header with "Moje Kolekcje" title
- ✅ Displays empty state when no collections
- ✅ Displays collection grid when collections exist
- ✅ Shows collection count with proper Polish pluralization (1 kolekcja, 2-4 kolekcje, 5+ kolekcji)
- ✅ Hides "Nowa kolekcja" button when empty
- ✅ Shows "Nowa kolekcja" button when collections exist

**Dialog State Management**
- ✅ Opens CreateCollectionDialog when button clicked
- ✅ Opens EditCollectionDialog when card edit action triggered
- ✅ Opens DeleteCollectionDialog when card delete action triggered
- ✅ Closes dialogs when onOpenChange called with false
- ✅ Only one dialog open at a time

**Create Collection Flow**
- ✅ Adds new collection to state on create success
- ✅ New collection appears at the beginning of the list
- ✅ Closes create dialog after success
- ✅ Shows empty state → grid transition when first collection created

**Edit Collection Flow**
- ✅ Updates collection name in state on edit success
- ✅ Preserves other collection properties
- ✅ Updates correct collection when multiple exist
- ✅ Closes edit dialog after success

**Delete Collection Flow**
- ✅ Removes collection from state on delete success
- ✅ Shows grid → empty state transition when last collection deleted
- ✅ Removes correct collection when multiple exist
- ✅ Closes delete dialog after success

**Navigation**
- ✅ Calls window.location.href with correct path on card click
- ✅ Navigates to /collections/:id format

##### P1 - Important Features (20 tests)

**Dialog Props Propagation**
- ✅ Passes correct collection data to EditCollectionDialog
- ✅ Passes correct collection data to DeleteCollectionDialog
- ✅ Passes open state correctly to all dialogs
- ✅ Passes onOpenChange callbacks that update state
- ✅ Passes onSuccess callbacks to all dialogs

**Collection Grid Props**
- ✅ Passes collections array to CollectionGrid
- ✅ Passes onCardClick handler to CollectionGrid
- ✅ Passes onEdit handler to CollectionGrid
- ✅ Passes onDelete handler to CollectionGrid

**Empty State Props**
- ✅ Passes onCreateClick handler to EmptyState
- ✅ EmptyState button opens create dialog

**State Transitions**
- ✅ Handle rapid create operations (multiple collections)
- ✅ Handle edit operation immediately after create
- ✅ Handle delete operation immediately after create
- ✅ Dialog state resets correctly (collection: null) on close

**Collection Count Display**
- ✅ Shows "1 kolekcja" for single collection
- ✅ Shows "2 kolekcje" for 2 collections
- ✅ Shows "4 kolekcje" for 4 collections
- ✅ Shows "5 kolekcji" for 5 collections
- ✅ Shows "100 kolekcji" for many collections

##### P2 - Edge Cases (10-15 tests)

**Edge Cases**
- ✅ Handle very long collection names (truncation in header)
- ✅ Handle special characters in collection names
- ✅ Handle large number of collections (100+)
- ✅ Handle rapid dialog open/close operations
- ✅ Prevent navigation during dialog operations
- ✅ Handle undefined callbacks gracefully

**Integration**
- ✅ Multiple operations in sequence (create → edit → delete)
- ✅ Opening different dialogs in succession
- ✅ Dialog state isolation (edit doesn't affect delete state)

**Accessibility**
- ✅ Page header uses correct heading hierarchy (h1)
- ✅ Button has accessible text
- ✅ Proper focus management when dialogs open/close

---

### 2. CollectionCard

**File:** `src/components/collections/CollectionCard.tsx`
**Test File:** `src/components/collections/__tests__/CollectionCard.test.tsx`
**Estimated Tests:** 50-55

#### Why Test This Component?

- **Main display component** - User's first interaction point
- **Complex interaction handling** - Click to navigate, but not when clicking action buttons
- **Responsive actions** - Hover overlay (desktop) vs. dropdown menu (mobile)
- **Utility functions** - Three utility functions for formatting
- **Visual placeholders** - Thumbnail grid with consistent colors

#### Test Coverage

##### P0 - Critical Functionality (25 tests)

**Rendering**
- ✅ Displays collection name
- ✅ Displays recipe count badge with proper formatting
- ✅ Displays created date with relative time
- ✅ Renders 2x2 grid of colored placeholders
- ✅ Uses correct thumbnail colors (4 green shades)

**Navigation**
- ✅ Calls onClick with collection ID when card clicked
- ✅ Does NOT call onClick when edit button clicked (desktop)
- ✅ Does NOT call onClick when delete button clicked (desktop)
- ✅ Does NOT call onClick when dropdown trigger clicked (mobile)
- ✅ Does NOT call onClick when dropdown menu item clicked (mobile)

**Desktop Actions (Hover Overlay)**
- ✅ Shows Edit button with Pencil icon
- ✅ Shows Delete button with Trash2 icon
- ✅ Calls onEdit with collection when edit button clicked
- ✅ Calls onDelete with collection when delete button clicked
- ✅ Prevents card navigation when action buttons clicked

**Mobile Actions (Dropdown Menu)**
- ✅ Shows MoreVertical icon trigger
- ✅ Opens dropdown menu when trigger clicked
- ✅ Shows "Edytuj" menu item with Pencil icon
- ✅ Shows "Usuń" menu item with Trash2 icon
- ✅ Calls onEdit with collection when "Edytuj" clicked
- ✅ Calls onDelete with collection when "Usuń" clicked
- ✅ Prevents card navigation when menu items clicked

**Event Propagation**
- ✅ stopPropagation works correctly for edit action
- ✅ stopPropagation works correctly for delete action
- ✅ Dropdown trigger click doesn't navigate

##### P1 - Important Features (15 tests)

**Recipe Count Formatting**
- ✅ Shows "1 przepis" for count = 1
- ✅ Shows "2 przepisy" for count = 2
- ✅ Shows "4 przepisy" for count = 4
- ✅ Shows "5 przepisów" for count = 5
- ✅ Shows "0 przepisów" for count = 0
- ✅ Shows "100 przepisów" for large count

**Relative Time Formatting**
- ✅ Shows "Dziś" for today
- ✅ Shows "Wczoraj" for yesterday
- ✅ Shows "3 dni temu" for 3 days ago
- ✅ Shows "Tydzień temu" for 7 days ago
- ✅ Shows "2 tygodni temu" for 14 days ago
- ✅ Shows "Miesiąc temu" for 30 days ago
- ✅ Shows "3 miesięcy temu" for 90 days ago
- ✅ Shows "Rok temu" for 365 days ago
- ✅ Shows "2 lat temu" for 730 days ago

##### P2 - Edge Cases (10-15 tests)

**Edge Cases**
- ✅ Very long collection names (truncation)
- ✅ Special characters in collection name
- ✅ Polish characters in collection name
- ✅ Empty collection name (should not happen, but handle gracefully)
- ✅ Very large recipe counts (999+)
- ✅ Negative recipe count (should not happen)
- ✅ Invalid date strings (graceful fallback)

**Visual States**
- ✅ Hover state applies correctly
- ✅ Border color changes on hover
- ✅ Shadow appears on hover
- ✅ Thumbnail colors are consistent

**Accessibility**
- ✅ Card is keyboard accessible
- ✅ Action buttons have proper ARIA labels
- ✅ Dropdown menu is keyboard navigable
- ✅ Proper focus indicators

---

### 3. Utility Functions (within CollectionCard)

**File:** `src/components/collections/CollectionCard.tsx`
**Test File:** `src/components/collections/__tests__/collectionUtils.test.ts`
**Estimated Tests:** 40-45

#### Why Test These Functions?

- **Data formatting** - Critical for displaying correct information to users
- **Polish pluralization** - Complex grammar rules that are easy to get wrong
- **Date calculations** - Time zone handling, edge cases
- **Pure functions** - Easy to test in isolation

#### Test Coverage

##### P0 - formatRecipeCount (12 tests)

- ✅ Returns "1 przepis" for count = 1
- ✅ Returns "2 przepisy" for count = 2
- ✅ Returns "3 przepisy" for count = 3
- ✅ Returns "4 przepisy" for count = 4
- ✅ Returns "5 przepisów" for count = 5
- ✅ Returns "10 przepisów" for count = 10
- ✅ Returns "21 przepisów" for count = 21 (not "przepisy")
- ✅ Returns "22 przepisy" for count = 22
- ✅ Returns "100 przepisów" for count = 100
- ✅ Returns "0 przepisów" for count = 0
- ✅ Handles negative numbers (should not happen)
- ✅ Handles decimal numbers (rounds appropriately)

##### P0 - formatRelativeTime (20 tests)

**Recent Times**
- ✅ Returns "Dziś" for current time
- ✅ Returns "Dziś" for 1 hour ago
- ✅ Returns "Dziś" for 23 hours ago
- ✅ Returns "Wczoraj" for 24 hours ago
- ✅ Returns "Wczoraj" for 47 hours ago

**Days**
- ✅ Returns "2 dni temu" for 2 days ago
- ✅ Returns "3 dni temu" for 3 days ago
- ✅ Returns "6 dni temu" for 6 days ago

**Weeks**
- ✅ Returns "Tydzień temu" for 7 days ago
- ✅ Returns "Tydzień temu" for 13 days ago
- ✅ Returns "2 tygodni temu" for 14 days ago
- ✅ Returns "2 tygodni temu" for 20 days ago
- ✅ Returns "3 tygodni temu" for 21 days ago
- ✅ Returns "4 tygodni temu" for 28 days ago

**Months**
- ✅ Returns "Miesiąc temu" for 30 days ago
- ✅ Returns "Miesiąc temu" for 59 days ago
- ✅ Returns "2 miesięcy temu" for 60 days ago
- ✅ Returns "6 miesięcy temu" for 180 days ago
- ✅ Returns "11 miesięcy temu" for 330 days ago

**Years**
- ✅ Returns "Rok temu" for 365 days ago
- ✅ Returns "2 lat temu" for 730 days ago
- ✅ Returns "10 lat temu" for 3650 days ago

**Edge Cases**
- ✅ Handles invalid date strings gracefully
- ✅ Handles future dates (should not happen)
- ✅ Handles dates at exact boundaries (7, 14, 30, 365 days)

##### P1 - getThumbnailColors (8 tests)

- ✅ Returns array of 4 colors
- ✅ All colors are valid Tailwind classes
- ✅ Colors include green shades (bg-green-100, bg-green-200, etc.)
- ✅ Returns same colors on multiple calls (consistency)
- ✅ Array length is always 4
- ✅ No duplicate colors in array (currently allows, but document behavior)
- ✅ Colors work with Tailwind (snapshot test)
- ✅ Colors are in expected order

---

### 4. CollectionGrid

**File:** `src/components/collections/CollectionGrid.tsx`
**Test File:** `src/components/collections/__tests__/CollectionGrid.test.tsx`
**Estimated Tests:** 20-25

#### Why Test This Component?

- **Layout component** - Ensures responsive grid behavior
- **Props propagation** - Passes handlers to multiple CollectionCard components
- **Responsive design** - Different column counts at different breakpoints

#### Test Coverage

##### P0 - Critical Functionality (12 tests)

**Rendering**
- ✅ Renders all collections as CollectionCard components
- ✅ Renders correct number of cards
- ✅ Passes collection data to each card
- ✅ Passes onCardClick handler to all cards
- ✅ Passes onEdit handler to all cards
- ✅ Passes onDelete handler to all cards

**Grid Layout**
- ✅ Applies CSS Grid classes
- ✅ Has correct gap between cards
- ✅ Has responsive grid classes (1→2→3→4 columns)

**Interaction**
- ✅ Card click triggers onCardClick with correct ID
- ✅ Edit action triggers onEdit with correct collection
- ✅ Delete action triggers onDelete with correct collection

##### P1 - Important Features (5 tests)

**Multiple Collections**
- ✅ Renders 1 collection correctly
- ✅ Renders 10 collections correctly
- ✅ Renders 100 collections correctly
- ✅ Maintains correct order of collections
- ✅ Each card receives unique collection data

##### P2 - Edge Cases (3-8 tests)

**Edge Cases**
- ✅ Handles empty array (should not happen, but handle gracefully)
- ✅ Handles collections with missing data
- ✅ Handles duplicate collection IDs

**Accessibility**
- ✅ Grid structure is accessible
- ✅ Cards are keyboard navigable
- ✅ Proper focus order

**Responsive Layout** (Visual/Manual Testing)
- Grid shows 1 column on mobile
- Grid shows 2 columns on sm breakpoint
- Grid shows 3 columns on lg breakpoint
- Grid shows 4 columns on xl breakpoint

---

### 5. EmptyState (Collections)

**File:** `src/components/collections/EmptyState.tsx`
**Test File:** `src/components/collections/__tests__/EmptyState.test.tsx`
**Estimated Tests:** 15-18

#### Why Test This Component?

- **User guidance** - First impression for new users
- **Call-to-action** - Critical conversion point
- **Accessibility** - Must be screen-reader friendly

#### Test Coverage

##### P0 - Critical Functionality (8 tests)

**Rendering**
- ✅ Displays FolderPlus icon
- ✅ Displays heading "Nie masz jeszcze kolekcji"
- ✅ Displays description text
- ✅ Displays "Utwórz pierwszą kolekcję" button
- ✅ Button has correct styling (green background)

**Interaction**
- ✅ Button click calls onCreateClick callback
- ✅ Callback is called only once per click
- ✅ Button is keyboard accessible (Enter/Space)

##### P1 - Important Features (4 tests)

**Visual Structure**
- ✅ Icon has correct size and color
- ✅ Content is centered
- ✅ Has minimum height for proper spacing
- ✅ Text is center-aligned

##### P2 - Accessibility & Polish (3-6 tests)

**Accessibility**
- ✅ Heading uses correct hierarchy (h2)
- ✅ Button has descriptive text
- ✅ Icon is decorative (not in tab order)

**Edge Cases**
- ✅ Handles missing onCreateClick gracefully
- ✅ Button disabled state (if needed)
- ✅ Long description text wraps correctly

---

### 6. CreateCollectionDialog

**File:** `src/components/collections/dialogs/CreateCollectionDialog.tsx`
**Test File:** `src/components/collections/dialogs/__tests__/CreateCollectionDialog.test.tsx`
**Estimated Tests:** 45-50

#### Why Test This Component?

- **Data entry point** - Creates new collections
- **Complex validation** - Client-side + server-side (409 conflict)
- **API integration** - POST /api/collections
- **Form state management** - Input, errors, loading states
- **User feedback** - Toast notifications

#### Test Coverage

##### P0 - Critical Functionality (20 tests)

**Rendering**
- ✅ Renders when open=true
- ✅ Does not render when open=false
- ✅ Displays dialog title "Nowa kolekcja"
- ✅ Displays dialog description
- ✅ Displays labeled input field
- ✅ Displays character counter "0/100"
- ✅ Displays "Anuluj" and "Utwórz" buttons
- ✅ Input has placeholder text

**Form Interaction**
- ✅ Input value updates when user types
- ✅ Character counter updates as user types
- ✅ Form submission calls API with POST /api/collections
- ✅ API receives trimmed collection name

**Success Flow**
- ✅ Shows success toast on successful creation
- ✅ Calls onSuccess callback with new collection data
- ✅ Closes dialog after successful creation
- ✅ Resets form state when dialog closes

**Form Submission**
- ✅ Submit button triggers form submission
- ✅ Enter key triggers form submission
- ✅ Form does not submit when validation fails

**Dialog Closing**
- ✅ "Anuluj" button closes dialog

##### P1 - Validation & Error Handling (15 tests)

**Client-Side Validation**
- ✅ Shows error for empty name (required)
- ✅ Shows error for whitespace-only name
- ✅ Shows error for name > 100 characters
- ✅ Clears error when user starts typing
- ✅ Input border turns red when error present
- ✅ Error message displays below input

**Server-Side Validation**
- ✅ Handles 409 conflict (duplicate name)
- ✅ Shows "Kolekcja o tej nazwie już istnieje" for 409
- ✅ Handles 500 server error
- ✅ Shows generic error message for unknown errors
- ✅ Handles network errors gracefully
- ✅ Handles malformed API responses

**Loading States**
- ✅ Shows loading spinner during API call
- ✅ Submit button shows "Tworzenie..." text during load
- ✅ Input is disabled during loading
- ✅ Dialog cannot be closed during loading (both buttons disabled)

##### P2 - Polish & Edge Cases (10-15 tests)

**Character Counter**
- ✅ Shows gray color for < 90 characters
- ✅ Shows amber color for 90-100 characters
- ✅ Shows red color for > 100 characters
- ✅ Max length enforced by input (maxLength={100})

**Edge Cases**
- ✅ Very long name (100 characters exactly)
- ✅ Name with only spaces (validation catches)
- ✅ Name with leading/trailing whitespace (trimmed)
- ✅ Special characters in name
- ✅ Polish characters (ąćęłńóśźż)
- ✅ Emoji in name
- ✅ Multiple rapid submissions (prevented by loading state)

**Accessibility**
- ✅ Input has associated label (htmlFor)
- ✅ Dialog has proper ARIA attributes
- ✅ Focus management (focus input on open)
- ✅ Keyboard navigation (Tab, Enter, Escape)

---

### 7. EditCollectionDialog

**File:** `src/components/collections/dialogs/EditCollectionDialog.tsx`
**Test File:** `src/components/collections/dialogs/__tests__/EditCollectionDialog.test.tsx`
**Estimated Tests:** 50-55

#### Why Test This Component?

- **Similar to CreateCollectionDialog** - But with pre-population and update logic
- **Skip API call optimization** - If name unchanged, don't call API
- **404 handling** - Collection might have been deleted by another session

#### Test Coverage

##### P0 - Critical Functionality (22 tests)

**Rendering**
- ✅ Renders when open=true
- ✅ Does not render when open=false
- ✅ Displays dialog title "Edytuj kolekcję"
- ✅ Displays dialog description
- ✅ Pre-populates input with current collection name
- ✅ Character counter shows current name length
- ✅ Displays "Anuluj" and "Zapisz" buttons

**Pre-Population**
- ✅ Input value set to collection.name on open
- ✅ Character counter matches pre-populated name length
- ✅ No validation errors shown initially
- ✅ Form resets to new collection data when different collection edited

**Form Interaction**
- ✅ Input value updates when user types
- ✅ Character counter updates as user types
- ✅ Form submission calls API with PUT /api/collections/:id
- ✅ API receives trimmed collection name

**Success Flow**
- ✅ Shows success toast on successful update
- ✅ Calls onSuccess callback with updated data
- ✅ Closes dialog after successful update
- ✅ Resets form state when dialog closes

**Skip API Call Optimization**
- ✅ Does NOT call API if name unchanged
- ✅ Closes dialog immediately if name unchanged
- ✅ Shows success toast even when skipping API call
- ✅ Calls onSuccess even when skipping API call

##### P1 - Validation & Error Handling (18 tests)

**Client-Side Validation**
- ✅ Shows error for empty name (after clearing)
- ✅ Shows error for whitespace-only name
- ✅ Shows error for name > 100 characters
- ✅ Clears error when user starts typing
- ✅ Input border turns red when error present
- ✅ Error message displays below input

**Server-Side Validation**
- ✅ Handles 404 not found (collection deleted)
- ✅ Shows "Kolekcja nie istnieje" for 404
- ✅ Handles 409 conflict (duplicate name)
- ✅ Shows "Kolekcja o tej nazwie już istnieje" for 409
- ✅ Handles 500 server error
- ✅ Shows generic error message for unknown errors
- ✅ Handles network errors gracefully
- ✅ Handles malformed API responses

**Loading States**
- ✅ Shows loading spinner during API call
- ✅ Submit button shows "Zapisywanie..." text during load
- ✅ Input is disabled during loading
- ✅ Dialog cannot be closed during loading

##### P2 - Polish & Edge Cases (10-15 tests)

**Character Counter**
- ✅ Shows gray color for < 90 characters
- ✅ Shows amber color for 90-100 characters
- ✅ Shows red color for > 100 characters

**Edge Cases**
- ✅ Pre-populated name at exactly 100 characters
- ✅ Change to whitespace-only (validation error)
- ✅ Change with leading/trailing whitespace (trimmed)
- ✅ Special characters in name
- ✅ Polish characters
- ✅ Emoji in name
- ✅ Edit back to original name (API skipped)
- ✅ Edit to trimmed version of same name (API skipped)

**Null/Undefined Handling**
- ✅ Handles null collection gracefully
- ✅ Handles undefined collection gracefully
- ✅ Handles collection with missing name

**Accessibility**
- ✅ Input has associated label
- ✅ Dialog has proper ARIA attributes
- ✅ Focus management

---

### 8. DeleteCollectionDialog

**File:** `src/components/collections/dialogs/DeleteCollectionDialog.tsx`
**Test File:** `src/components/collections/dialogs/__tests__/DeleteCollectionDialog.test.tsx`
**Estimated Tests:** 35-40

#### Why Test This Component?

- **Destructive action** - Requires confirmation
- **User reassurance** - Shows recipe count, clarifies recipes remain
- **API integration** - DELETE /api/collections/:id
- **Different UI pattern** - AlertDialog instead of Dialog

#### Test Coverage

##### P0 - Critical Functionality (18 tests)

**Rendering**
- ✅ Renders when open=true
- ✅ Does not render when open=false
- ✅ Displays AlertDialog title "Usuń kolekcję"
- ✅ Displays warning description
- ✅ Shows collection name in description
- ✅ Shows recipe count with proper formatting
- ✅ Clarifies "Przepisy pozostaną dostępne"
- ✅ Displays "Anuluj" and "Usuń" buttons
- ✅ Delete button has destructive styling (red)

**Deletion Flow**
- ✅ Delete button calls API with DELETE /api/collections/:id
- ✅ Shows success toast after deletion
- ✅ Calls onSuccess callback with deleted collection ID
- ✅ Closes dialog after successful deletion

**Dialog Closing**
- ✅ "Anuluj" button closes dialog
- ✅ Dialog can be closed before deletion
- ✅ Dialog cannot be closed during deletion
- ✅ Closing resets loading state

**Recipe Count Display**
- ✅ Shows "1 przepis" for count = 1
- ✅ Shows "5 przepisów" for count = 5

##### P1 - Error Handling (10 tests)

**API Errors**
- ✅ Handles 404 not found (already deleted)
- ✅ Shows appropriate error message for 404
- ✅ Handles 500 server error
- ✅ Shows generic error message for unknown errors
- ✅ Handles network errors gracefully
- ✅ Handles malformed API responses
- ✅ Dialog remains open on error (user can retry)

**Loading States**
- ✅ Shows loading spinner during API call
- ✅ Delete button shows "Usuwanie..." text during load
- ✅ Both buttons disabled during loading

##### P2 - Edge Cases (7-12 tests)

**Edge Cases**
- ✅ Very long collection name (truncation)
- ✅ Special characters in collection name
- ✅ Collection with 0 recipes
- ✅ Collection with 100+ recipes
- ✅ Null collection (should not happen)
- ✅ Collection with missing recipeCount

**Recipe Count Formatting**
- ✅ Shows "0 przepisów" for empty collection
- ✅ Shows "2 przepisy" for 2 recipes
- ✅ Shows "4 przepisy" for 4 recipes
- ✅ Shows "22 przepisy" for 22 recipes

**Accessibility**
- ✅ AlertDialog has proper ARIA attributes
- ✅ Focus management
- ✅ Keyboard navigation
- ✅ Destructive action clearly indicated

---

## Test Implementation Order

### Phase 1: Utilities & Basic Components (Week 1)
**Estimated:** 80-90 tests

1. **Utility Functions** (~40 tests) - Foundation for other components
   - formatRecipeCount
   - formatRelativeTime
   - getThumbnailColors

2. **EmptyState** (~15 tests) - Simple, no dependencies

3. **CollectionCard** (~25 tests) - Uses utilities, core display component

### Phase 2: Dialogs (Week 2)
**Estimated:** 130-145 tests

4. **CreateCollectionDialog** (~45 tests) - Simpler than Edit

5. **EditCollectionDialog** (~50 tests) - Includes skip-API logic

6. **DeleteCollectionDialog** (~35 tests) - Destructive action

### Phase 3: Layout & Integration (Week 3)
**Estimated:** 80-95 tests

7. **CollectionGrid** (~20 tests) - Layout component

8. **CollectionsLayout** (~55 tests) - Main orchestrator, integration tests

---

## Testing Tools & Patterns

### Required Libraries

```typescript
// Component testing
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';

// Toast mocking
import { toast } from 'sonner';

// Type imports
import type { CollectionDTO } from '@/types';
```

### Mock Patterns

#### Mock fetch for API calls
```typescript
global.fetch = vi.fn();

// Success response
(fetch as MockedFunction).mockResolvedValueOnce({
  ok: true,
  json: async () => ({ collection: mockCollection }),
});

// Error response
(fetch as MockedFunction).mockResolvedValueOnce({
  ok: false,
  status: 409,
  json: async () => ({ message: 'Duplicate name' }),
});
```

#### Mock window.location
```typescript
delete window.location;
window.location = { href: '' } as Location;
```

#### Mock toast
```typescript
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));
```

### Test Data Factories

```typescript
const createMockCollection = (overrides?: Partial<CollectionDTO>): CollectionDTO => ({
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'Test Collection',
  recipeCount: 5,
  createdAt: new Date().toISOString(),
  ...overrides,
});

const createMockCollections = (count: number): CollectionDTO[] =>
  Array.from({ length: count }, (_, i) =>
    createMockCollection({
      id: `collection-${i}`,
      name: `Collection ${i + 1}`
    })
  );
```

---

## Accessibility Requirements

### ARIA Attributes to Test

- Dialog title and description: `aria-labelledby`, `aria-describedby`
- Form inputs: `htmlFor` labels, `aria-invalid`, `aria-errormessage`
- Buttons: `aria-label` for icon-only buttons
- Loading states: `aria-busy`, `aria-live` regions
- Destructive actions: Clear indication in button text

### Keyboard Navigation

- **Tab**: Navigate through interactive elements
- **Enter/Space**: Activate buttons
- **Escape**: Close dialogs
- **Arrow keys**: Navigate dropdown menus

### Focus Management

- Focus input field when dialog opens
- Return focus to trigger when dialog closes
- Trap focus within modal dialogs

---

## Coverage Goals

### Minimum Coverage Targets

- **Statements:** 85%
- **Branches:** 80%
- **Functions:** 85%
- **Lines:** 85%

### What to Exclude from Coverage

- Type definitions
- Console.log statements
- Development-only code

---

## Success Criteria

### Tests Must:

1. ✅ Follow existing test patterns in codebase
2. ✅ Use React Testing Library best practices
3. ✅ Test user behavior, not implementation details
4. ✅ Include accessibility testing
5. ✅ Mock external dependencies (fetch, toast)
6. ✅ Use descriptive test names
7. ✅ Group related tests with describe blocks
8. ✅ Clean up after each test (beforeEach/afterEach)
9. ✅ Test both happy paths and error cases
10. ✅ Include edge case coverage

### Red Flags:

- ❌ Testing internal state directly
- ❌ Testing implementation details (class names, internal methods)
- ❌ Shallow tests that don't catch real bugs
- ❌ Tests that duplicate coverage
- ❌ Tests without cleanup
- ❌ Tests that depend on execution order

---

## References

### Existing Test Examples

- **Component Tests:** `src/components/__tests__/DashboardContent.test.tsx`
- **Hook Tests:** `src/components/hooks/__tests__/useFavoriteToggle.test.ts`
- **Utility Tests:** `src/lib/utils/__tests__/dashboard.test.ts`
- **Dialog Tests:** `src/components/favorites/__tests__/FavoritesLayout.test.tsx` (contains dialog interaction patterns)

### Documentation

- Testing Library: https://testing-library.com/docs/react-testing-library/intro/
- Vitest: https://vitest.dev/guide/
- Accessibility: https://www.w3.org/WAI/ARIA/apg/

---

## Notes

### Why We Skip E2E Tests for Now

- Unit tests provide faster feedback
- Integration tests cover most user flows
- E2E tests are slower and more brittle
- Can add E2E tests later for critical flows

### Testing Philosophy

> "Write tests. Not too many. Mostly integration."
> — Guillermo Rauch

We focus on:
- **Unit tests** for utilities and pure functions
- **Integration tests** for component interactions
- **Accessibility tests** for inclusive design
- **User behavior tests** over implementation tests

---

**Last Updated:** 2025-12-03
**Status:** Ready for Implementation
**Estimated Timeline:** 3 weeks (8 components, ~310-340 tests)
