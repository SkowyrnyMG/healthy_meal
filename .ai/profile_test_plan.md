# Profile Page - Test Plan

**Page:** `src/pages/profile.astro`
**Component Structure Reference:** `.ai/profile_component_structure.txt`
**Created:** 2025-12-05
**Status:** Planning Phase

---

## Executive Summary

This test plan covers comprehensive testing for the Profile Settings page, focusing on custom hooks, form validation, API integration, and user interaction flows. The plan excludes components already tested in other contexts (UserMenu, MobileNav, type utilities).

**Total Estimated Tests:** ~385 tests
**Estimated Timeline:** 4 weeks (4 phases)

---

## Table of Contents

- [Priority Levels](#priority-levels)
- [Phase 1: Core Hook & Layout (P0)](#phase-1-core-hook--layout-p0)
- [Phase 2: Form Sections (P1)](#phase-2-form-sections-p1)
- [Phase 3: Sub-components (P2)](#phase-3-sub-components-p2)
- [Phase 4: Navigation Components (P2-P3)](#phase-4-navigation-components-p2-p3)
- [Testing Principles](#testing-principles)
- [Implementation Notes](#implementation-notes)

---

## Priority Levels

| Priority | Description | Timeline |
|----------|-------------|----------|
| **P0** | Critical - Core functionality, data management, main orchestrator | Week 1 |
| **P1** | High - Form validation, API integration, user interactions | Week 2 |
| **P2** | Medium - Sub-components, navigation, UI elements | Week 3 |
| **P3** | Low - Placeholder components, minimal functionality | Week 4 |

---

## Phase 1: Core Hook & Layout (P0)

**Timeline:** Week 1
**Total Tests:** ~110 tests

### 1. useProfileSettings Hook (P0)

**File:** `src/components/hooks/useProfileSettings.ts`
**Test File:** `src/components/hooks/__tests__/useProfileSettings.test.ts`
**Estimated Tests:** 70 tests

**What to Test:**

#### Initial State & Data Fetching (12 tests)
- ✅ Initialize with null profile and empty allergen/disliked arrays
- ✅ Initialize with all loading states set to true
- ✅ Initialize with no error
- ✅ Fetch all data in parallel on mount (GET /api/profile, /api/allergens, /api/profile/allergens, /api/profile/disliked-ingredients)
- ✅ Handle successful responses for all endpoints
- ✅ Parse profile data correctly (ProfileDTO)
- ✅ Parse allergens data correctly (AllergenDTO[])
- ✅ Parse user allergens correctly (UserAllergenDTO[])
- ✅ Parse disliked ingredients correctly (DislikedIngredientDTO[])
- ✅ Set all loading states to false after successful fetch
- ✅ Handle partial API failures (some succeed, some fail)
- ✅ Set error state when initial fetch fails

#### Profile Updates - saveBasicInfo (10 tests)
- ✅ Call PUT /api/profile with correct payload
- ✅ Set isSavingBasicInfo to true during save
- ✅ Update profile state optimistically
- ✅ Toast success message on successful save
- ✅ Set isSavingBasicInfo to false after save
- ✅ Handle API errors (400, 500)
- ✅ Rollback optimistic update on error
- ✅ Show error toast on failure
- ✅ Handle network errors
- ✅ Handle malformed responses

#### Profile Updates - saveDietaryPreferences (10 tests)
- ✅ Call PUT /api/profile with correct payload
- ✅ Set isSavingDietaryPreferences to true during save
- ✅ Update profile state optimistically
- ✅ Toast success message on successful save
- ✅ Set isSavingDietaryPreferences to false after save
- ✅ Handle API errors (400, 500)
- ✅ Rollback optimistic update on error
- ✅ Show error toast on failure
- ✅ Handle network errors
- ✅ Handle malformed responses

#### Allergens Management - saveAllergens (14 tests)
- ✅ Calculate diff (added and removed allergen IDs)
- ✅ Call POST /api/profile/allergens for new allergens
- ✅ Call DELETE /api/profile/allergens/:id for removed allergens
- ✅ Make all API calls in parallel
- ✅ Set isSavingAllergens to true during save
- ✅ Update userAllergens state after successful save
- ✅ Toast success message
- ✅ Set isSavingAllergens to false after save
- ✅ Skip API calls when no changes (optimization)
- ✅ Handle POST errors
- ✅ Handle DELETE errors
- ✅ Handle partial failures (some POST/DELETE succeed, some fail)
- ✅ Show appropriate error messages
- ✅ Refetch user allergens on error

#### Disliked Ingredients - addDislikedIngredient (12 tests)
- ✅ Call POST /api/profile/disliked-ingredients with ingredient name
- ✅ Set isAddingDislikedIngredient to true
- ✅ Add ingredient to list optimistically
- ✅ Toast success message
- ✅ Set isAddingDislikedIngredient to false after save
- ✅ Handle API errors (400 validation, 409 conflict, 500)
- ✅ Remove optimistic ingredient on error
- ✅ Show error toast with server message
- ✅ Handle network errors
- ✅ Handle malformed responses
- ✅ Prevent duplicate submissions
- ✅ Trim ingredient name before sending

#### Disliked Ingredients - removeDislikedIngredient (12 tests)
- ✅ Call DELETE /api/profile/disliked-ingredients/:id
- ✅ Track removing state per ingredient (removingDislikedIngredientId)
- ✅ Remove ingredient from list optimistically
- ✅ Toast success message
- ✅ Clear removing state after delete
- ✅ Handle API errors (404, 500)
- ✅ Re-add ingredient on error (rollback)
- ✅ Show error toast
- ✅ Handle network errors
- ✅ Prevent double-clicking on remove
- ✅ Handle 404 gracefully (ingredient already deleted)
- ✅ Clear removing state on error

#### Refetch Functionality (5 tests)
- ✅ refetchAll() clears previous errors
- ✅ refetchAll() fetches all data again
- ✅ refetchAll() updates all state correctly
- ✅ refetchAll() handles errors
- ✅ refetchAll() sets loading states correctly

#### Edge Cases (7 tests)
- ✅ Handle empty profile response
- ✅ Handle empty allergens list
- ✅ Handle empty user allergens list
- ✅ Handle empty disliked ingredients list
- ✅ Handle very long ingredient names (100 chars)
- ✅ Handle special characters in ingredient names
- ✅ Component unmount cleanup (prevent state updates)

**Coverage:**
- Complete state management lifecycle
- All CRUD operations for profile, allergens, and disliked ingredients
- Optimistic UI updates with rollback
- Diff-based syncing for allergens
- Error handling for all API calls
- Loading states for each section
- Toast notifications
- Concurrent operations handling

---

### 2. ProfileSettingsLayout (P0)

**File:** `src/components/profile/ProfileSettingsLayout.tsx`
**Test File:** `src/components/profile/__tests__/ProfileSettingsLayout.test.tsx`
**Estimated Tests:** 40 tests

**What to Test:**

#### Rendering & Layout (8 tests)
- ✅ Render desktop sidebar (SettingsSidebar)
- ✅ Render mobile tabs (SettingsTabs)
- ✅ Render all 5 section components (BasicInfo, DietaryPreferences, Allergens, DislikedIngredients, Account)
- ✅ Show loading skeletons when isLoading is true
- ✅ Show error alert when error exists
- ✅ Show retry button on error
- ✅ Correct section ordering
- ✅ Responsive layout structure

#### Section Navigation (10 tests)
- ✅ Default to 'basic-info' section
- ✅ Switch to 'dietary-preferences' section
- ✅ Switch to 'allergens' section
- ✅ Switch to 'disliked-ingredients' section
- ✅ Switch to 'account' section
- ✅ Show only active section content
- ✅ Sync navigation between sidebar and tabs
- ✅ Keyboard navigation (Arrow keys, Tab)
- ✅ Update aria-current on active section
- ✅ Maintain section state during navigation

#### Data Propagation (12 tests)
- ✅ Pass profile data to BasicInfoSection
- ✅ Pass profile data to DietaryPreferencesSection
- ✅ Pass allergens data to AllergensSection
- ✅ Pass userAllergens to AllergensSection
- ✅ Pass dislikedIngredients to DislikedIngredientsSection
- ✅ Pass saveBasicInfo callback to BasicInfoSection
- ✅ Pass saveDietaryPreferences callback to DietaryPreferencesSection
- ✅ Pass saveAllergens callback to AllergensSection
- ✅ Pass addDislikedIngredient callback to DislikedIngredientsSection
- ✅ Pass removeDislikedIngredient callback to DislikedIngredientsSection
- ✅ Pass loading states to all sections
- ✅ Pass saving states to all sections

#### Error Handling & Retry (5 tests)
- ✅ Display error message from hook
- ✅ Retry button calls refetchAll()
- ✅ Clear error state after successful retry
- ✅ Show loading state during retry
- ✅ Handle retry errors

#### Accessibility (5 tests)
- ✅ Page has proper heading hierarchy
- ✅ Sections have ARIA labels
- ✅ Navigation has correct ARIA attributes
- ✅ Skip to content link (if implemented)
- ✅ Focus management on section change

**Coverage:**
- Main orchestrator component
- Section navigation and state management
- Data and callback propagation
- Error recovery
- Responsive layout switching
- Accessibility compliance

---

## Phase 2: Form Sections (P1)

**Timeline:** Week 2
**Total Tests:** ~145 tests

### 3. BasicInfoSection (P1)

**File:** `src/components/profile/sections/BasicInfoSection.tsx`
**Test File:** `src/components/profile/sections/__tests__/BasicInfoSection.test.tsx`
**Estimated Tests:** 40 tests

**What to Test:**

#### Rendering & Initial State (8 tests)
- ✅ Render all form fields (weight, age, gender, activityLevel)
- ✅ Render labels for all fields
- ✅ Pre-populate form with profile data
- ✅ Display correct gender selected
- ✅ Display correct activity level selected
- ✅ Render submit button
- ✅ Show loading spinner when isSaving is true
- ✅ Disable submit button when isSaving is true

#### Form Interaction (8 tests)
- ✅ Update weight field on user input
- ✅ Update age field on user input
- ✅ Change gender selection
- ✅ Change activity level selection
- ✅ Clear error when field is corrected
- ✅ Enable submit button when form is dirty
- ✅ Submit form on button click
- ✅ Submit form on Enter key (if applicable)

#### Client-Side Validation (14 tests)
- ✅ Show error for empty weight
- ✅ Show error for weight < 40 kg
- ✅ Show error for weight > 200 kg
- ✅ Show error for non-numeric weight
- ✅ Show error for empty age
- ✅ Show error for age < 13
- ✅ Show error for age > 100
- ✅ Show error for non-integer age
- ✅ Show error for empty gender
- ✅ Show error for empty activity level
- ✅ Prevent form submission when validation fails
- ✅ Display Polish error messages
- ✅ Show all errors simultaneously
- ✅ Clear error on field change

#### Form Submission (10 tests)
- ✅ Call onSave with correct data structure
- ✅ Include all form fields in payload
- ✅ Convert weight to number
- ✅ Convert age to number
- ✅ Don't submit if form invalid
- ✅ Show loading state during submission
- ✅ Disable all inputs during submission
- ✅ Reset form dirty state after successful save
- ✅ Keep form editable after error
- ✅ Handle rapid submit clicks

**Coverage:**
- Form rendering and pre-population
- User interactions
- Client-side validation with Polish messages
- Form submission flow
- Loading and disabled states

---

### 4. DietaryPreferencesSection (P1)

**File:** `src/components/profile/sections/DietaryPreferencesSection.tsx`
**Test File:** `src/components/profile/sections/__tests__/DietaryPreferencesSection.test.tsx`
**Estimated Tests:** 35 tests

**What to Test:**

#### Rendering & Initial State (8 tests)
- ✅ Render all form fields (dietType, targetGoal, targetValue)
- ✅ Render labels for all fields
- ✅ Pre-populate form with profile data
- ✅ Display correct diet type selected
- ✅ Display correct target goal selected
- ✅ Display target value if present
- ✅ Render submit button
- ✅ Show loading state when isSaving is true

#### Form Interaction (6 tests)
- ✅ Change diet type selection
- ✅ Change target goal selection
- ✅ Update target value field
- ✅ Clear error when field is corrected
- ✅ Submit form on button click
- ✅ Disable inputs during submission

#### Client-Side Validation (12 tests)
- ✅ Show error for empty diet type
- ✅ Show error for empty target goal
- ✅ Show error for targetValue < 0.1 kg (if provided)
- ✅ Show error for targetValue > 100 kg (if provided)
- ✅ Show error for non-numeric targetValue
- ✅ Allow empty targetValue (optional field)
- ✅ Prevent form submission when validation fails
- ✅ Display Polish error messages
- ✅ Clear error on field change
- ✅ Validate all 6 diet type options
- ✅ Validate all 3 target goal options
- ✅ Handle decimal values correctly

#### Form Submission (9 tests)
- ✅ Call onSave with correct data structure
- ✅ Include dietType and targetGoal in payload
- ✅ Include targetValue as number if provided
- ✅ Send null for targetValue if empty
- ✅ Don't submit if form invalid
- ✅ Show loading state during submission
- ✅ Disable all inputs during submission
- ✅ Reset form state after successful save
- ✅ Handle rapid submit clicks

**Coverage:**
- Form rendering and pre-population
- All select options
- Optional field handling (targetValue)
- Client-side validation
- Form submission flow

---

### 5. AllergensSection (P1)

**File:** `src/components/profile/sections/AllergensSection.tsx`
**Test File:** `src/components/profile/sections/__tests__/AllergensSection.test.tsx`
**Estimated Tests:** 35 tests

**What to Test:**

#### Rendering & Initial State (8 tests)
- ✅ Render all allergen checkboxes
- ✅ Render allergen labels
- ✅ Check selected allergens based on userAllergens
- ✅ Uncheck non-selected allergens
- ✅ Show loading skeleton when isLoadingAllergens is true
- ✅ Show empty state when allergens array is empty
- ✅ Display selected count
- ✅ Render save button

#### Grid Layout (4 tests)
- ✅ Responsive grid: 3 cols on lg, 2 cols on sm, 1 col on mobile
- ✅ Proper gap between checkboxes
- ✅ Render 9 skeleton items during loading
- ✅ Maintain layout with 1, 5, 10, 20 allergens

#### User Interaction (8 tests)
- ✅ Check an allergen (add to selection)
- ✅ Uncheck an allergen (remove from selection)
- ✅ Select multiple allergens
- ✅ Deselect all allergens
- ✅ Update selected count on change
- ✅ Enable save button when selection changes
- ✅ Disable save button when no changes
- ✅ Keyboard navigation (Space to toggle)

#### Form Submission (10 tests)
- ✅ Call onSave with array of selected allergen IDs
- ✅ Send only changed allergens (diff-based)
- ✅ Don't submit if no changes
- ✅ Show loading state during save (isSaving)
- ✅ Disable all checkboxes during save
- ✅ Disable save button during save
- ✅ Reset dirty state after successful save
- ✅ Maintain selection after successful save
- ✅ Rollback selection on error
- ✅ Handle rapid clicks on save button

#### Accessibility (5 tests)
- ✅ Each checkbox has associated label
- ✅ Checkboxes have correct ARIA attributes
- ✅ Alert icon for allergen context (if present)
- ✅ Screen reader announces selected count
- ✅ Focus management on checkbox interaction

**Coverage:**
- Checkbox rendering and state
- Responsive grid layout
- Multi-select behavior
- Diff-based save optimization
- Loading skeleton
- Accessibility features

---

### 6. DislikedIngredientsSection (P1)

**File:** `src/components/profile/sections/DislikedIngredientsSection.tsx`
**Test File:** `src/components/profile/sections/__tests__/DislikedIngredientsSection.test.tsx`
**Estimated Tests:** 35 tests

**What to Test:**

#### Rendering & Initial State (7 tests)
- ✅ Render AddIngredientForm at top
- ✅ Render all disliked ingredients as IngredientItem components
- ✅ Show empty state when no ingredients
- ✅ Display ingredient count
- ✅ Show XCircle icon in empty state
- ✅ Correct empty state message
- ✅ Render ingredients in order

#### User Interaction - Adding (8 tests)
- ✅ Pass onAdd callback to AddIngredientForm
- ✅ Call onAdd when form submitted
- ✅ Show new ingredient optimistically
- ✅ Update ingredient count
- ✅ Clear form after successful add
- ✅ Show loading state during add (isAdding)
- ✅ Disable form during add
- ✅ Handle add errors (rollback)

#### User Interaction - Removing (10 tests)
- ✅ Pass onRemove callback to IngredientItem
- ✅ Call onRemove with ingredient ID
- ✅ Remove ingredient optimistically
- ✅ Update ingredient count
- ✅ Show loading spinner on ingredient being removed
- ✅ Disable remove button during remove
- ✅ Track removing state per ingredient (removingId)
- ✅ Allow removing different ingredients concurrently
- ✅ Prevent double-clicking on remove
- ✅ Handle remove errors (rollback)

#### Empty State (5 tests)
- ✅ Show empty state when array is empty
- ✅ Hide empty state when ingredients exist
- ✅ Show empty state after removing last ingredient
- ✅ Update count display (0 ingredients)
- ✅ Empty state has proper styling

#### Accessibility (5 tests)
- ✅ Section has proper heading
- ✅ List has correct semantic structure
- ✅ Ingredient count announced to screen readers
- ✅ Add form has accessible labels
- ✅ Remove buttons have aria-labels

**Coverage:**
- Add ingredient flow
- Remove ingredient flow
- Optimistic UI updates
- Concurrent operations
- Empty state handling
- Accessibility features

---

## Phase 3: Sub-components (P2)

**Timeline:** Week 3
**Total Tests:** ~80 tests

### 7. IngredientItem (P2)

**File:** `src/components/profile/IngredientItem.tsx`
**Test File:** `src/components/profile/__tests__/IngredientItem.test.tsx`
**Estimated Tests:** 25 tests

**What to Test:**

#### Rendering (8 tests)
- ✅ Render ingredient name
- ✅ Render remove button with X icon
- ✅ Show loading spinner when isRemoving is true
- ✅ Hide X icon when isRemoving is true
- ✅ Disable remove button when isRemoving is true
- ✅ Correct button styling
- ✅ Handle very long ingredient names (truncate or wrap)
- ✅ Handle special characters in name

#### User Interaction (7 tests)
- ✅ Call onRemove with ingredient ID on button click
- ✅ Don't call onRemove when disabled
- ✅ Prevent double-clicking
- ✅ Keyboard interaction (Enter, Space on button)
- ✅ Show loading state immediately on click
- ✅ Maintain disabled state during removal
- ✅ Visual feedback on hover (if not removing)

#### Loading State (5 tests)
- ✅ Show Loader2 spinner when isRemoving
- ✅ Spinner has correct size
- ✅ Spinner has animation class
- ✅ Hide remove icon during loading
- ✅ Button remains clickable area (but disabled)

#### Accessibility (5 tests)
- ✅ Remove button has aria-label with ingredient name
- ✅ Button has correct type attribute
- ✅ Loading state announced (aria-busy or aria-live)
- ✅ Button disabled state has aria-disabled
- ✅ Focus management

**Coverage:**
- Ingredient display
- Remove button interaction
- Loading state visualization
- Accessibility features

---

### 8. AddIngredientForm (P2)

**File:** `src/components/profile/AddIngredientForm.tsx`
**Test File:** `src/components/profile/__tests__/AddIngredientForm.test.tsx`
**Estimated Tests:** 35 tests

**What to Test:**

#### Rendering & Initial State (6 tests)
- ✅ Render input field with placeholder
- ✅ Render add button with Plus icon
- ✅ Input is empty initially
- ✅ No error shown initially
- ✅ Add button is enabled
- ✅ Inline form layout (input + button)

#### User Interaction (8 tests)
- ✅ Update input value on typing
- ✅ Call onAdd on button click
- ✅ Call onAdd on Enter key press
- ✅ Clear input after successful add
- ✅ Clear error on input change
- ✅ Don't clear input on add error
- ✅ Focus remains on input after successful add
- ✅ Disable button during submission (isAdding)

#### Client-Side Validation (12 tests)
- ✅ Show error for empty input
- ✅ Show error for whitespace-only input
- ✅ Show error for input > 100 characters
- ✅ Trim whitespace before validation
- ✅ Don't submit if validation fails
- ✅ Display error message in Polish
- ✅ Error message styling (red text)
- ✅ Clear error when user starts typing
- ✅ Prevent form submission when invalid
- ✅ Allow valid 100-character input
- ✅ Allow 1-character input
- ✅ Handle special characters and Polish characters

#### Loading State (5 tests)
- ✅ Show loading spinner when isAdding
- ✅ Disable input when isAdding
- ✅ Disable button when isAdding
- ✅ Spinner replaces Plus icon
- ✅ Form cannot be submitted during loading

#### Accessibility (4 tests)
- ✅ Input has associated label (visible or aria-label)
- ✅ Error has aria-live region
- ✅ Input has aria-invalid when error exists
- ✅ Button has aria-label

**Coverage:**
- Form rendering
- User input and submission
- Client-side validation
- Loading states
- Accessibility compliance

---

### 9. SettingsSidebar (P2)

**File:** `src/components/profile/SettingsSidebar.tsx`
**Test File:** `src/components/profile/__tests__/SettingsSidebar.test.tsx`
**Estimated Tests:** 20 tests

**What to Test:**

#### Rendering (8 tests)
- ✅ Render all 5 section buttons
- ✅ Render correct icons for each section (User, Utensils, AlertTriangle, XCircle, Settings)
- ✅ Render correct labels for each section
- ✅ Highlight active section
- ✅ Desktop only (hidden on mobile)
- ✅ Vertical navigation list
- ✅ Sticky positioning (if implemented)
- ✅ Correct button order

#### User Interaction (6 tests)
- ✅ Call onSectionChange with section ID on click
- ✅ Change active section visually
- ✅ Support keyboard navigation (Arrow Up/Down)
- ✅ Tab key navigation between buttons
- ✅ Enter/Space to activate button
- ✅ Don't call onSectionChange for already active section

#### Active State Styling (3 tests)
- ✅ Active button has correct background color
- ✅ Active button has correct text color
- ✅ Inactive buttons have hover effect

#### Accessibility (3 tests)
- ✅ Navigation has role="navigation" or semantic nav element
- ✅ Active button has aria-current="page"
- ✅ All buttons have accessible names (icon + label)

**Coverage:**
- Navigation list rendering
- Section switching
- Keyboard navigation
- Active state management
- Accessibility features

---

## Phase 4: Navigation Components (P2-P3)

**Timeline:** Week 4
**Total Tests:** ~50 tests

### 10. SettingsTabs (P2)

**File:** `src/components/profile/SettingsTabs.tsx`
**Test File:** `src/components/profile/__tests__/SettingsTabs.test.tsx`
**Estimated Tests:** 25 tests

**What to Test:**

#### Rendering (8 tests)
- ✅ Render Tabs component from shadcn/ui
- ✅ Render all 5 tab triggers
- ✅ Render correct icons for each tab
- ✅ Render labels (hidden on small screens, visible on larger)
- ✅ Mobile only (visible on small screens)
- ✅ Horizontal scrollable layout
- ✅ Active tab styling
- ✅ Correct tab order

#### User Interaction (6 tests)
- ✅ Call onValueChange with section ID on tab click
- ✅ Change active tab visually
- ✅ Support keyboard navigation (Arrow Left/Right)
- ✅ Tab key navigation between tabs
- ✅ Enter/Space to activate tab
- ✅ Swipe gesture on mobile (if supported by Tabs component)

#### Responsive Behavior (5 tests)
- ✅ Hidden on desktop (lg breakpoint)
- ✅ Visible on mobile and tablet
- ✅ Labels hidden on xs screens (icon only)
- ✅ Labels visible on sm+ screens (icon + label)
- ✅ Horizontal scroll on overflow

#### ScrollArea Integration (3 tests)
- ✅ Tabs are scrollable horizontally
- ✅ ScrollBar is visible when needed
- ✅ Smooth scroll behavior

#### Accessibility (3 tests)
- ✅ Tabs have correct ARIA attributes (role, aria-selected)
- ✅ Active tab has aria-selected="true"
- ✅ All tabs have accessible names

**Coverage:**
- Tab navigation rendering
- Section switching
- Keyboard and touch navigation
- Responsive design
- Accessibility features

---

### 11. AccountSection (P3)

**File:** `src/components/profile/sections/AccountSection.tsx`
**Test File:** `src/components/profile/sections/__tests__/AccountSection.test.tsx`
**Estimated Tests:** 25 tests

**What to Test:**

#### Rendering (10 tests)
- ✅ Render info alert about future Supabase integration
- ✅ Render email field (disabled)
- ✅ Render change password button (disabled)
- ✅ Render logout button (disabled)
- ✅ Render delete account button (disabled)
- ✅ Display correct icons (Info, Lock, LogOut, Trash2)
- ✅ Show "Coming soon" message
- ✅ Alert has info styling
- ✅ Delete button has destructive styling
- ✅ All interactive elements are disabled

#### Props (5 tests)
- ✅ Accept userEmail prop
- ✅ Display user email in disabled input
- ✅ Handle null userEmail gracefully
- ✅ Handle empty string userEmail
- ✅ Handle very long email addresses

#### Styling & Layout (5 tests)
- ✅ Proper vertical spacing between elements
- ✅ Alert is prominent at top
- ✅ Buttons have correct size and padding
- ✅ Delete button is visually distinct (red)
- ✅ Responsive layout

#### Accessibility (5 tests)
- ✅ Alert has correct ARIA attributes
- ✅ Disabled inputs have aria-disabled
- ✅ Disabled buttons have aria-disabled
- ✅ Email input has associated label
- ✅ Descriptive button labels

**Note:** This is a placeholder component with no functionality. Tests focus on ensuring the UI correctly indicates that features are coming soon and all actions are disabled.

**Coverage:**
- Placeholder UI rendering
- Disabled state enforcement
- Accessibility compliance
- Future-proof structure

---

## Testing Principles

### 1. User-Centric Testing
- Test user behavior, not implementation details
- Focus on what users see and do
- Test accessibility features (keyboard navigation, screen readers)

### 2. Comprehensive Validation
- Test all validation rules (client-side and server-side)
- Test boundary conditions (min, max, edge values)
- Test error messages in Polish

### 3. API Integration
- Mock all API calls with fetch
- Test success and error responses
- Test network errors and malformed responses
- Test loading states during API calls

### 4. Optimistic UI Updates
- Test optimistic updates (add/remove immediately)
- Test rollback on API failure
- Test concurrent operations

### 5. Error Handling
- Test all error scenarios
- Test error message display (toast notifications)
- Test recovery mechanisms (retry)

### 6. Accessibility
- Test ARIA attributes
- Test keyboard navigation
- Test screen reader announcements
- Test focus management

### 7. Responsive Design
- Test mobile, tablet, and desktop layouts
- Test component visibility at breakpoints
- Test touch and click interactions

### 8. Edge Cases
- Test empty states
- Test very long strings
- Test special characters and Polish characters
- Test rapid user interactions (double-clicks, rapid typing)

---

## Implementation Notes

### Tools & Libraries
- **Test Framework:** Vitest
- **Component Testing:** React Testing Library
- **Mocking:** vitest.fn(), vitest.mock()
- **User Interaction:** @testing-library/user-event
- **Assertions:** expect from Vitest

### Mocking Strategies

#### API Calls
```typescript
global.fetch = vi.fn();
// Mock successful response
(fetch as any).mockResolvedValueOnce({
  ok: true,
  json: async () => ({ data: {...} })
});
```

#### Toast Notifications
```typescript
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  }
}));
```

#### useProfileSettings Hook (for component tests)
```typescript
vi.mock('@/components/hooks/useProfileSettings', () => ({
  useProfileSettings: vi.fn()
}));
```

### File Structure
```
src/components/
├── hooks/
│   └── __tests__/
│       └── useProfileSettings.test.ts
├── profile/
│   ├── __tests__/
│   │   ├── ProfileSettingsLayout.test.tsx
│   │   ├── IngredientItem.test.tsx
│   │   ├── AddIngredientForm.test.tsx
│   │   ├── SettingsSidebar.test.tsx
│   │   └── SettingsTabs.test.tsx
│   └── sections/
│       └── __tests__/
│           ├── BasicInfoSection.test.tsx
│           ├── DietaryPreferencesSection.test.tsx
│           ├── AllergensSection.test.tsx
│           ├── DislikedIngredientsSection.test.tsx
│           └── AccountSection.test.tsx
```

### Test Patterns

#### Testing Forms
```typescript
it('should show error for empty weight', async () => {
  const user = userEvent.setup();
  render(<BasicInfoSection {...props} />);

  const weightInput = screen.getByLabelText(/waga/i);
  await user.clear(weightInput);
  await user.click(screen.getByRole('button', { name: /zapisz/i }));

  expect(screen.getByText(/waga jest wymagana/i)).toBeInTheDocument();
});
```

#### Testing API Calls
```typescript
it('should call saveBasicInfo with correct data', async () => {
  const onSave = vi.fn().mockResolvedValueOnce(undefined);
  const user = userEvent.setup();
  render(<BasicInfoSection onSave={onSave} {...props} />);

  await user.type(screen.getByLabelText(/waga/i), '70');
  await user.click(screen.getByRole('button', { name: /zapisz/i }));

  expect(onSave).toHaveBeenCalledWith({
    weight: 70,
    age: expect.any(Number),
    gender: expect.any(String),
    activityLevel: expect.any(String)
  });
});
```

#### Testing Optimistic Updates
```typescript
it('should add ingredient optimistically', async () => {
  render(<DislikedIngredientsSection {...props} />);

  await user.type(screen.getByRole('textbox'), 'Cebula');
  await user.click(screen.getByRole('button', { name: /dodaj/i }));

  // Should appear immediately (optimistically)
  expect(screen.getByText('Cebula')).toBeInTheDocument();
});
```

---

## Test Execution Order

### Phase 1 (Week 1): Foundation - P0
1. useProfileSettings hook (70 tests)
2. ProfileSettingsLayout (40 tests)

**Milestone:** Core data management and main orchestrator tested

---

### Phase 2 (Week 2): Forms - P1
3. BasicInfoSection (40 tests)
4. DietaryPreferencesSection (35 tests)
5. AllergensSection (35 tests)
6. DislikedIngredientsSection (35 tests)

**Milestone:** All form validation and submission flows tested

---

### Phase 3 (Week 3): Sub-components - P2
7. IngredientItem (25 tests)
8. AddIngredientForm (35 tests)
9. SettingsSidebar (20 tests)

**Milestone:** All interactive sub-components tested

---

### Phase 4 (Week 4): Navigation & Placeholders - P2-P3
10. SettingsTabs (25 tests)
11. AccountSection (25 tests)

**Milestone:** Complete test coverage for Profile page

---

## Success Criteria

### Coverage Goals
- ✅ 100% of custom hooks tested
- ✅ 100% of form validation logic tested
- ✅ 100% of API integration tested
- ✅ 100% of user interactions tested
- ✅ All accessibility features verified
- ✅ All edge cases covered

### Quality Metrics
- All tests pass consistently
- No flaky tests
- Tests run in < 5 seconds total
- Tests are maintainable and readable
- Tests follow existing patterns in codebase

---

## Excluded Components

The following components are **NOT included** in this test plan because they are already tested in other contexts:

1. **UserMenu** - Already tested in `src/components/app/__tests__/UserMenu.test.tsx`
2. **MobileNav** - Already tested in `src/components/app/__tests__/MobileNav.test.tsx`
3. **Type Utilities** - Already tested in `src/components/app/types.test.ts`
4. **AppLayout** - Layout wrapper, no business logic to test
5. **AppHeader** - Already tested as part of app components
6. **Shadcn/ui components** - Third-party library components (Button, Input, Select, Checkbox, etc.)

---

## Summary

**Total Components to Test:** 11
**Total Estimated Tests:** ~385 tests
**Timeline:** 4 weeks (4 phases)
**Priority Distribution:**
- P0 (Critical): 110 tests (2 components)
- P1 (High): 145 tests (4 components)
- P2 (Medium): 105 tests (4 components)
- P3 (Low): 25 tests (1 component)

**Key Focus Areas:**
1. Custom hook state management (useProfileSettings)
2. Form validation and submission
3. API integration and error handling
4. Optimistic UI updates with rollback
5. Accessibility compliance
6. Responsive design

---

**Next Steps:**
1. Review and approve this test plan
2. Begin Phase 1: useProfileSettings hook
3. Iterate through phases sequentially
4. Update TESTED_COMPONENTS.md after each phase
5. Run full test suite after completion

---

**Document Version:** 1.0
**Last Updated:** 2025-12-05
**Status:** Ready for Implementation
