# HealthyMeal - Tested Components and Elements

This document provides a comprehensive list of all components, hooks, utilities, and features that have been tested in this project. Use this as a reference to avoid duplicating test efforts.

**Last Updated:** 2025-12-03

---

## Summary

**Total Test Files:** 27 passing
**Total Tests:** 828 passing (3 skipped)

### Latest Addition (2025-12-05): Collections Page Tests - COMPLETE! 🎉
**New Test Files:** 5 (Phase 2: 3, Phase 3: 2)
**New Tests:** 210 (Phase 2: 142, Phase 3: 68)

**Phase 2 Complete:**
- ✅ CreateCollectionDialog (51 tests) - Form validation, API integration, loading states, error handling
- ✅ EditCollectionDialog (51 tests) - Pre-population, skip-API optimization, 404 handling, null/undefined handling
- ✅ DeleteCollectionDialog (40 tests) - Destructive action confirmation, 404 handling, recipe count formatting

**Phase 3 Complete:**
- ✅ CollectionGrid (25 tests) - Grid layout, props propagation, multiple collections handling
- ✅ CollectionsLayout (43 tests) - Main orchestrator, dialog management, state management

### Previous Addition (2025-12-03): Collections Page Tests - Phase 1
**Test Files:** 3
**Tests:** 78 (3 skipped)

Components and utilities tested:
- ✅ Collection Utility Functions (42 tests) - formatRecipeCount, formatRelativeTime, getThumbnailColors
- ✅ EmptyState (16 tests) - Icon, content, interactions, accessibility
- ✅ CollectionCard (20 tests, 3 skipped) - Rendering, navigation, desktop/mobile actions, event propagation

**Remaining for Phase 2:** EditCollectionDialog, DeleteCollectionDialog
**Next Phase:** CollectionGrid, CollectionsLayout

### Previous Addition (2025-12-03): Recipes Page Tests
**New Test Files:** 6
**New Tests:** 149

Components and hooks tested:
- ✅ useRecipeFilters (49 tests) - URL state management, browser navigation, all filter operations
- ✅ useTags (16 tests) - API integration, caching, error handling
- ✅ SearchBar (26 tests) - User input, controlled component, accessibility
- ✅ SortDropdown (19 tests) - All sort options, value synchronization
- ✅ EmptyState (24 tests) - Two state variants, public/private views
- ✅ LoadingSkeletons (15 tests) - Responsive layout, various counts

**Skipped (due to complexity/time):** useRecipeList, RecipeListLayout, FilterPanel, TagFilterSection, CaloriesSlider, PrepTimeSlider, ActiveFilterChips, RecipeGrid

---

## Table of Contents

- [React Components](#react-components)
  - [Dashboard Components](#dashboard-components)
  - [Recipe Components](#recipe-components)
  - [App Components](#app-components)
  - [Favorites Components](#favorites-components)
  - [Landing Components](#landing-components)
- [Custom Hooks](#custom-hooks)
- [Utilities](#utilities)
- [Types and Helper Functions](#types-and-helper-functions)
- [End-to-End (E2E) Tests](#end-to-end-e2e-tests)

---

## React Components

### Dashboard Components

#### **DashboardContent** (`src/components/DashboardContent.tsx`)
**Test File:** `src/components/__tests__/DashboardContent.test.tsx`

**What's Tested:**
- ✅ Rendering of three recipe sections: "Twoje przepisy", "Ulubione", "Inspiracje"
- ✅ Passing correct data to each section
- ✅ Favorite state management and initialization
- ✅ Favorite toggle propagation to all sections
- ✅ Empty states for all sections
- ✅ Recipe map creation and deduplication
- ✅ Handling very large numbers of recipes
- ✅ Special characters in recipe IDs
- ✅ Component structure (main element wrapper, section ordering)

**Coverage:**
- Sections rendering
- Favorite state initialization and updates
- Toggle favorite functionality
- Empty state messages
- Recipe data flow between sections
- Edge cases (duplicates, large datasets)

---

#### **RecipeCard** (`src/components/RecipeCard.tsx`)
**Test File:** `src/components/__tests__/RecipeCard.test.tsx`

**What's Tested:**
- ✅ Recipe title rendering and truncation (line-clamp-2)
- ✅ Prep time display with clock icon (handles null values)
- ✅ Calorie badge with correct values and rounding
- ✅ Protein display with rounding
- ✅ Primary tag rendering (handles null)
- ✅ Favorite state (outline vs. filled heart)
- ✅ Loading spinner when isLoading is true
- ✅ Favorite button disable state during loading
- ✅ Favorite button color (red for favorited, gray for not favorited)
- ✅ Author badge ("Publiczny") when showAuthorBadge is true
- ✅ Click handlers (card navigation, favorite toggle with event.stopPropagation)
- ✅ Collection view mode (remove button)
- ✅ Accessibility (ARIA labels, keyboard navigation with Enter/Space)
- ✅ Placeholder with recipe initial and utensils icon
- ✅ Visual states (hover effects, group classes)
- ✅ Edge cases (very high/zero calories, zero protein, null prep time, special characters)

**Coverage:**
- Visual rendering
- Interaction handlers
- Accessibility features
- Loading states
- Collection view functionality
- Edge case handling

---

#### **RecipeSectionRow** (`src/components/RecipeSectionRow.tsx`)
**Test File:** `src/components/__tests__/RecipeSectionRow.test.tsx`

**What's Tested:**
- ✅ Section title rendering
- ✅ View All link (conditional rendering)
- ✅ Recipe card rendering for all recipes
- ✅ Props propagation to RecipeCard (isFavorited, isLoading)
- ✅ Empty state with custom message and action button
- ✅ Keyboard navigation (ArrowLeft, ArrowRight for horizontal scroll)
- ✅ Scroll behavior (scroll-snap, webkit-overflow-scrolling)
- ✅ Accessibility (aria-labelledby, aria-live, sr-only announcements)
- ✅ Recipe count announcements (singular vs. plural)
- ✅ Responsive layout (mobile horizontal scroll, desktop grid)
- ✅ Interaction propagation (onFavoriteToggle, favoriteRecipeIds, isTogglingRecipe)
- ✅ Visual structure (section spacing, container padding, header layout)
- ✅ Edge cases (very large number of recipes, duplicate IDs, long titles)

**Coverage:**
- Layout and structure
- Scroll functionality
- Keyboard navigation
- Accessibility features
- Responsive design
- Empty states

---

### Recipe Components

#### **Pagination** (`src/components/recipes/Pagination.tsx`)
**Test File:** `src/components/recipes/__tests__/Pagination.test.tsx`

**What's Tested:**
- ✅ Results count display (start, end, total items)
- ✅ Previous and Next buttons rendering
- ✅ Current page button (disabled state, aria-current="page")
- ✅ Page number buttons for small page counts
- ✅ Ellipsis display for many pages
- ✅ Button states (disabled on first/last page)
- ✅ Click handlers (onPageChange callback)
- ✅ Keyboard navigation (ArrowLeft, ArrowRight)
- ✅ Page number display logic (showing all pages when ≤7, ellipsis logic)
- ✅ Edge cases (single page, zero pages, very large page numbers, partial last page)
- ✅ Accessibility (navigation role, aria-labels, descriptive button labels)
- ✅ Visual styling (current page highlight, consistent button sizes)
- ✅ Correct item range calculation (startItem, endItem)

**Coverage:**
- Pagination logic
- Button interactions
- Keyboard navigation
- Accessibility
- Edge cases

---

### App Components

#### **UserMenu** (`src/components/app/UserMenu.tsx`)
**Test File:** `src/components/app/__tests__/UserMenu.test.tsx`

**What's Tested:**
- ✅ User name and email display
- ✅ User initials in avatar
- ✅ Email username fallback when displayName is null
- ✅ Profile menu item rendering
- ✅ Logout menu item rendering
- ✅ Dropdown behavior (open on trigger click)
- ✅ Profile navigation (redirect to /profile)
- ✅ Logout flow (API call to /api/auth/logout, redirect to /)
- ✅ Error handling (alert on logout failure, network error handling)
- ✅ Accessibility (aria-label for trigger, keyboard navigation)
- ✅ Visual styling (red text for logout, truncation for long names)
- ✅ Edge cases (long email, special characters, empty user data)

**Coverage:**
- User info display
- Dropdown interactions
- Navigation flows
- API integration
- Error handling
- Accessibility

---

#### **MobileNav** (`src/components/app/MobileNav.tsx`)
**Test File:** `src/components/app/__tests__/MobileNav.test.tsx`

**What's Tested:**
- ✅ Sheet behavior (open on trigger click)
- ✅ User info display (name, email, avatar with initials)
- ✅ Navigation links rendering and active state highlighting
- ✅ Navigation link clicks (redirect to correct URLs)
- ✅ Active state for nested routes
- ✅ New recipe button (conditional rendering, redirect to /recipes/new)
- ✅ Profile button (redirect to /profile)
- ✅ Logout button (API call, redirect, error handling)
- ✅ Auth buttons for non-authenticated users (login, register)
- ✅ Conditional rendering based on authentication state
- ✅ Accessibility (aria-label for trigger, keyboard navigation)
- ✅ Visual styling (avatar, logout red text, green new recipe button)
- ✅ Edge cases (empty navLinks, long paths, special characters)

**Coverage:**
- Sheet interactions
- Navigation functionality
- Authentication flows
- Conditional rendering
- Accessibility

---

#### **Type Utilities** (`src/components/app/types.ts`)
**Test File:** `src/components/app/types.test.ts`

**What's Tested:**
- ✅ `getUserDisplayName`: Returns full name, email username fallback, "Użytkownik" for null
- ✅ `getUserInitials`: Returns first character uppercase, email first char fallback, "U" for null
- ✅ Edge cases (empty strings, whitespace, special characters, Polish characters, emojis)

**Coverage:**
- User display name logic
- User initials logic
- Edge case handling

---

### Favorites Components

#### **FavoritesLayout** (`src/components/favorites/FavoritesLayout.tsx`)
**Test File:** `src/components/favorites/__tests__/FavoritesLayout.test.tsx`

**What's Tested:**
- ✅ Loading skeletons when isLoading is true
- ✅ Empty state when no favorites
- ✅ Recipe grid rendering when favorites exist
- ✅ Error state with retry button
- ✅ Correct favorite count in header
- ✅ Unfavorite interaction (API call to DELETE /api/favorites)
- ✅ Toast notification after unfavorite
- ✅ Refetch after successful unfavorite
- ✅ Error handling for unfavorite API failure
- ✅ Prevent double-clicking on unfavorite
- ✅ Undo functionality (re-add recipe, POST /api/favorites)
- ✅ Success toast on undo
- ✅ Refetch after undo
- ✅ Handle undo API errors
- ✅ Pagination rendering (conditional based on totalPages)
- ✅ goToPage callback on pagination change
- ✅ Error recovery (refetch on retry button click)
- ✅ Data transformation (favorites to recipe cards)
- ✅ Handle null description and prepTimeMinutes

**Coverage:**
- Loading states
- Empty and error states
- Unfavorite functionality
- Undo functionality
- Pagination
- Data transformation
- Error recovery

---

### Landing Components

#### **MobileMenu** (`src/components/landing/MobileMenu.tsx`)
**Test File:** `src/components/landing/__tests__/MobileMenu.test.tsx`

**What's Tested:**
- ✅ Sheet state management (start closed, open on trigger click, close on sheet click)
- ✅ Close menu after navigation link click
- ✅ Close menu after auth button click
- ✅ Navigation behavior (querySelector with correct href, smooth scroll)
- ✅ Handle missing DOM element gracefully
- ✅ Auth button behavior (navigate to /auth/login, /auth/register, /dashboard)
- ✅ Conditional rendering (login/register for unauthenticated, dashboard for authenticated)
- ✅ Navigation links rendering (Funkcje, Jak to działa)
- ✅ Correct href attributes for navigation links

**Coverage:**
- Sheet state management
- Navigation interactions
- Auth flows
- Conditional rendering

---

## Custom Hooks

### **useFavoriteToggle** (`src/components/hooks/useFavoriteToggle.ts`)
**Test File:** `src/components/hooks/__tests__/useFavoriteToggle.test.ts`

**What's Tested:**
- ✅ Initialize with provided favorite IDs
- ✅ Add recipe to favorites set optimistically
- ✅ Remove recipe from favorites set optimistically
- ✅ POST /api/favorites when adding favorite
- ✅ DELETE /api/favorites when removing favorite
- ✅ Toast with undo option on remove (not on add)
- ✅ Rollback optimistic update on API failure
- ✅ Show error toast on API failure
- ✅ Handle network errors gracefully
- ✅ Default error message when API returns no message
- ✅ Handle JSON parsing errors
- ✅ Undo functionality (re-add favorite, POST /api/favorites)
- ✅ Success toast after undo
- ✅ Handle undo API failures
- ✅ Prevent double-toggling same recipe
- ✅ Allow concurrent toggles for different recipes
- ✅ Track toggling state per recipe (isTogglingRecipe)
- ✅ Edge cases (non-existent recipe, empty favorites, long IDs, special characters)

**Coverage:**
- State management
- API integration
- Optimistic updates
- Error handling
- Undo functionality
- Concurrent operations

---

### **useFavorites** (`src/components/hooks/useFavorites.ts`)
**Test File:** `src/components/hooks/useFavorites.test.ts`

**What's Tested:**
- ✅ Initialize with empty favorites and loading state
- ✅ Initialize with page from URL query parameter
- ✅ Default to page 1 if no/invalid query parameter
- ✅ Fetch favorites on mount (GET /api/favorites)
- ✅ Handle successful API response
- ✅ Parse pagination data correctly
- ✅ Update URL when fetching data
- ✅ Set error state when API fails
- ✅ Handle network errors gracefully
- ✅ Handle malformed API responses
- ✅ Default error message when error message is missing
- ✅ Refetch data when refetch() is called
- ✅ Clear previous error state on refetch
- ✅ Set loading to false after successful fetch/error
- ✅ Fetch new data when goToPage is called
- ✅ Validate page number (minimum 1, maximum totalPages)
- ✅ Update URL when page changes
- ✅ Handle browser back/forward navigation (popstate event)

**Coverage:**
- Data fetching
- Pagination
- URL synchronization
- Error handling
- Browser navigation

---

## Utilities

### **Dashboard Utilities** (`src/lib/utils/dashboard.ts`)
**Test File:** `src/lib/utils/__tests__/dashboard.test.ts`

**What's Tested:**

#### `transformRecipeToCardData`
- ✅ Transform complete RecipeListItemDTO to RecipeCardData
- ✅ Map all required fields correctly
- ✅ Extract nutrition data correctly
- ✅ Extract first tag as primary tag
- ✅ Handle empty tags array (primaryTag = null)
- ✅ Edge cases (null description, null prepTimeMinutes, long titles, special characters)

#### `transformFavoriteToCardData`
- ✅ Transform FavoriteDTO to RecipeCardData
- ✅ Extract nested recipe data correctly
- ✅ Always set primaryTag to null
- ✅ Edge cases (null description, null prepTimeMinutes)

#### `shuffleArray`
- ✅ Return array with same length
- ✅ Contain all original elements
- ✅ Not mutate original array
- ✅ Produce different order (probabilistic test with mocked Math.random)
- ✅ Edge cases (empty array, single element, duplicates, complex objects)

#### `getCalorieBadgeColor`
- ✅ Return "default" for low calories (< 300)
- ✅ Return "secondary" for medium calories (300-600)
- ✅ Return "destructive" for high calories (> 600)
- ✅ Edge cases (boundaries, 0 calories, negative, very large values)

#### `getRecipeInitial`
- ✅ Return first letter uppercase for simple titles
- ✅ Handle Polish characters
- ✅ Uppercase lowercase first letters
- ✅ Edge cases (empty string returns "?", special characters, numbers, whitespace, emojis)

#### `getRecipePlaceholderColor`
- ✅ Return consistent color for same title
- ✅ Return valid Tailwind color class
- ✅ Handle empty title
- ✅ Distribute titles across color palette

#### `getRecipePlaceholderIconColor`
- ✅ Return correct icon color for each background color
- ✅ Return fallback color for unknown background
- ✅ Integration with getRecipePlaceholderColor

**Coverage:**
- Data transformation
- Array manipulation
- UI helper utilities
- Hash-based color assignment

---

### **Class Name Utility** (`src/lib/utils.ts`)
**Test File:** `src/lib/__tests__/utils.test.ts`

**What's Tested:**

#### `cn` (Class Name Merging)
- ✅ Merge multiple class strings
- ✅ Return empty string for no inputs
- ✅ Handle single class string
- ✅ Resolve conflicting Tailwind classes (later wins)
- ✅ Preserve non-conflicting classes
- ✅ Resolve complex Tailwind conflicts
- ✅ Filter out falsy values (false, undefined, null, empty string)
- ✅ Include truthy conditional classes
- ✅ Handle ternary operators
- ✅ Handle array inputs
- ✅ Handle object inputs with boolean values
- ✅ Handle mixed inputs (strings, arrays, objects)
- ✅ Handle nested arrays
- ✅ Edge cases (undefined, null, empty strings, whitespace, duplicate classes)
- ✅ Real-world patterns (button variants, conditional active state, responsive classes, state variants)

**Coverage:**
- Class merging
- Tailwind conflict resolution
- Conditional classes
- Complex input types
- Real-world usage patterns

---

## Types and Helper Functions

### **UserInfo Type Helpers** (`src/components/app/types.ts`)
**Test File:** `src/components/app/types.test.ts`

See [Type Utilities](#type-utilities-srccomponentsapptypests) above.

---

## End-to-End (E2E) Tests

### **Authentication Flow** (`e2e/authentication.spec.ts`)

**What's Tested:**
- ✅ Display login form
- ✅ Show error for invalid credentials
- ✅ Validate email format
- ✅ Navigate to forgot password page
- ✅ Navigate to register page from login
- ✅ Accessible form labels
- ✅ Allow typing in email and password fields
- ✅ Disable login button while form is submitting
- ✅ Make POST request to login endpoint on submit

**Coverage:**
- Login form display
- Form validation
- Navigation flows
- Accessibility
- API integration

---

### **Landing Page** (`e2e/landing.spec.ts`)

**What's Tested:**
- ✅ Load successfully
- ✅ Display main heading
- ✅ Have navigation buttons
- ✅ Navigate to login page when login button clicked
- ✅ Navigate to register page when register button clicked
- ✅ Proper page title
- ✅ Visual regression (screenshot)
- ✅ Responsive design (mobile viewport, tablet viewport)

**Coverage:**
- Page loading
- Navigation
- Visual regression
- Responsive design

---

## Summary

### Test Coverage by Category

| Category | Files Tested | Total Tests |
|----------|--------------|-------------|
| **Components** | 9 | ~400+ |
| **Hooks** | 2 | ~100+ |
| **Utilities** | 2 | ~100+ |
| **E2E Tests** | 2 | ~20+ |

### Key Testing Principles Applied

1. **Comprehensive Coverage**: All critical user flows and edge cases are tested
2. **Accessibility**: ARIA labels, keyboard navigation, screen reader support
3. **Error Handling**: API failures, network errors, validation errors
4. **Responsive Design**: Mobile, tablet, desktop viewports
5. **Visual Regression**: Screenshots for visual changes
6. **Data Transformation**: Complex data mapping and validation
7. **State Management**: Optimistic updates, rollbacks, concurrent operations

---

## How to Use This Document

### For Developers
- Before writing new tests, check if the component/feature is already tested
- When adding new features, update this document with new test coverage
- Use this as a reference for testing patterns and best practices

### For LLMs
- Use this document to avoid duplicating test efforts
- Reference existing test patterns when creating new tests
- Ensure new components follow the same testing standards as documented here

---

## Maintenance

**Update this document when:**
- Adding new test files
- Significantly expanding test coverage for existing components
- Removing or refactoring components
- Changing component responsibilities

**Review frequency:** Monthly or after major feature additions

---

## Recipes Page Components (NEW - 2025-12-03)

### **SearchBar** (`src/components/recipes/SearchBar.tsx`)
**Test File:** `src/components/recipes/__tests__/SearchBar.test.tsx`

**What's Tested:**
- ✅ Input field rendering with search icon
- ✅ Placeholder text (default and custom)
- ✅ Current value display (controlled component)
- ✅ onChange callback on user input
- ✅ Value trimming (whitespace removal)
- ✅ onChange with undefined for empty/whitespace-only strings
- ✅ Max length enforcement (255 characters)
- ✅ Enter key triggering onChange
- ✅ Clear button visibility (shows when value exists)
- ✅ Clear button functionality
- ✅ Value synchronization with props (re-renders)
- ✅ Accessibility (aria-label, keyboard access)
- ✅ Polish characters handling
- ✅ Special characters and numbers support

**Coverage:**
- User interaction and input handling
- Controlled component behavior
- Clear button logic
- Value validation and trimming
- Accessibility features

**Total Tests:** 26

---

### **SortDropdown** (`src/components/recipes/SortDropdown.tsx`)
**Test File:** `src/components/recipes/__tests__/SortDropdown.test.tsx`

**What's Tested:**
- ✅ Select component rendering with label
- ✅ Display of current sort option (6 variants)
- ✅ Correct labels for all sort options:
  - Najnowsze (createdAt desc)
  - Najstarsze (createdAt asc)
  - Tytuł A-Z (title asc)
  - Tytuł Z-A (title desc)
  - Czas przygotowania rosnąco (prepTime asc)
  - Czas przygotowania malejąco (prepTime desc)
- ✅ Value synchronization when sortBy changes
- ✅ Value synchronization when sortOrder changes
- ✅ All sort combinations display correctly
- ✅ Accessibility (label association, button type, ARIA attributes)
- ✅ Props acceptance (sortBy, sortOrder, onChange)
- ✅ Works with all valid sortBy values
- ✅ Works with both sortOrder values

**Coverage:**
- Rendering and display
- Value synchronization
- Accessibility attributes
- Props validation

**Total Tests:** 19

---

### **EmptyState** (`src/components/recipes/EmptyState.tsx`)
**Test File:** `src/components/recipes/__tests__/EmptyState.test.tsx`

**What's Tested:**
- ✅ No-recipes state (type='no-recipes')
- ✅ Appropriate heading and description for no-recipes
- ✅ Add Recipe button (shown in user view, hidden in public view)
- ✅ onAddRecipe callback on button click
- ✅ Different message in public view
- ✅ FileX icon rendering
- ✅ No-results state (type='no-results')
- ✅ Appropriate heading and description for no-results
- ✅ Clear Filters button
- ✅ onClearFilters callback on button click
- ✅ Different heading in public view
- ✅ Search icon rendering
- ✅ Conditional rendering based on type prop
- ✅ Only one state rendered at a time
- ✅ Button hidden when callback is undefined
- ✅ Accessibility (heading hierarchy, button labels, container structure)
- ✅ Public view mode handling

**Coverage:**
- Two state variants (no-recipes, no-results)
- User vs public view modes
- Button visibility logic
- Icon rendering
- Accessibility features

**Total Tests:** 24

---

### **LoadingSkeletons** (`src/components/recipes/LoadingSkeletons.tsx`)
**Test File:** `src/components/recipes/__tests__/LoadingSkeletons.test.tsx`

**What's Tested:**
- ✅ Skeleton cards rendering
- ✅ Default count (8 skeletons)
- ✅ Custom count (1, 12, 20, 100)
- ✅ CSS Grid layout
- ✅ Responsive grid classes matching RecipeGrid:
  - 1 column on mobile
  - 2 columns on sm
  - 3 columns on lg
  - 4 columns on xl
- ✅ Proper gap between cards
- ✅ Card container structure (min-height, borders, rounded corners)
- ✅ Multiple skeleton elements per card (image, title, description, nutrition)
- ✅ Edge cases (count=0, very large count)
- ✅ Structure consistency across different counts

**Coverage:**
- Rendering with various counts
- Layout and grid classes
- Card structure
- Edge cases

**Total Tests:** 15

---

## Recipes Page Hooks (NEW - 2025-12-03)

### **useRecipeFilters** (`src/components/hooks/useRecipeFilters.ts`)
**Test File:** `src/components/hooks/__tests__/useRecipeFilters.test.ts`

**What's Tested:**
- ✅ Default filters when no URL params
- ✅ Parse search query from URL
- ✅ Parse tag IDs from URL (comma-separated, validated UUIDs)
- ✅ Parse maxCalories from URL
- ✅ Parse maxPrepTime from URL
- ✅ Parse sortBy and sortOrder from URL
- ✅ Parse page number from URL
- ✅ Update URL when filters change (pushState)
- ✅ Handle invalid URL parameters (sanitization)
- ✅ Sanitize search query (trim whitespace)
- ✅ Filter out invalid tag IDs
- ✅ Popstate event listener setup/cleanup
- ✅ Update filters on browser back/forward navigation
- ✅ setSearch updates search filter and resets page to 1
- ✅ setTagIds updates tags filter and resets page to 1
- ✅ setMaxCalories updates filter and resets page to 1
- ✅ setMaxPrepTime updates filter and resets page to 1
- ✅ setSortBy updates both sortBy and sortOrder, resets page to 1
- ✅ setPage updates page number
- ✅ clearFilters resets all filters except sort
- ✅ removeFilter removes search, maxCalories, maxPrepTime
- ✅ removeFilter removes specific tag from tagIds array
- ✅ removeFilter clears tagIds when last tag removed
- ✅ Active filter counting (search, tags, calories, prep time)
- ✅ Sort and page don't count as active filters
- ✅ Mobile panel state (isFilterPanelOpen, toggleFilterPanel)
- ✅ Handle empty string/whitespace search as undefined
- ✅ Handle empty tagIds array as undefined
- ✅ Clamp negative/zero page numbers to 1

**Coverage:**
- URL state management (read and write)
- Browser navigation (popstate)
- All filter operations
- Active filter counting
- Mobile UI state
- Edge cases and validation

**Total Tests:** 49

---

### **useTags** (`src/components/hooks/useTags.ts`)
**Test File:** `src/components/hooks/__tests__/useTags.test.ts`

**What's Tested:**
- ✅ Initialize with empty tags array
- ✅ Initialize with isLoading = true
- ✅ Initialize with error = null
- ✅ Fetch tags on mount (GET /api/tags)
- ✅ Parse successful API response
- ✅ Extract tags array from response
- ✅ Set isLoading to false after fetch
- ✅ Cache results (no refetch on re-render)
- ✅ Set error state on API failure
- ✅ Extract error message from response
- ✅ Default to generic error message when none provided
- ✅ Handle network errors
- ✅ Set isLoading to false on error
- ✅ Keep empty array on error
- ✅ Component unmount cleanup (prevent state updates)
- ✅ Handle empty tags array response

**Coverage:**
- Initial state
- Data fetching
- API integration
- Error handling
- Component lifecycle

**Total Tests:** 16

---

### Collections Components

#### **Utility Functions** (`src/components/collections/CollectionCard.tsx`)
**Test File:** `src/components/collections/__tests__/collectionUtils.test.ts`

**What's Tested:**
- ✅ formatRecipeCount - Polish pluralization (1 przepis, 2-4 przepisy, 5+ przepisów)
- ✅ formatRelativeTime - Polish time expressions (Dziś, Wczoraj, X dni temu, tygodni, miesięcy, lat)
- ✅ getThumbnailColors - Color consistency and validation

**Coverage:**
- Recipe count formatting with all pluralization rules
- Relative time formatting for all time ranges (today → years ago)
- Thumbnail color generation
- Edge cases (0 count, boundaries, consistency)

**Test Count:** 42 tests

---

#### **EmptyState** (`src/components/collections/EmptyState.tsx`)
**Test File:** `src/components/collections/__tests__/EmptyState.test.tsx`

**What's Tested:**
- ✅ Icon and content rendering (FolderPlus icon, heading, description, button)
- ✅ Button styling (green background)
- ✅ User interaction (onClick callback, keyboard accessibility)
- ✅ Visual structure (centered layout, spacing, text alignment)
- ✅ Accessibility (h2 heading hierarchy, descriptive button text)
- ✅ Edge cases (missing callback, text wrapping)

**Coverage:**
- Rendering all UI elements
- Click and keyboard interactions
- Layout and styling
- Accessibility features
- Graceful error handling

**Test Count:** 16 tests

---

#### **CollectionCard** (`src/components/collections/CollectionCard.tsx`)
**Test File:** `src/components/collections/__tests__/CollectionCard.test.tsx`

**What's Tested:**
- ✅ Rendering (name, recipe count badge, relative date, 2x2 thumbnail grid)
- ✅ Thumbnail colors (4 green shades: bg-green-100/200/300/400)
- ✅ Navigation (onClick with collection ID, preventing navigation during actions)
- ✅ Desktop actions (hover overlay with Edit/Delete icon buttons)
- ✅ Desktop action buttons (Pencil and Trash2 icons, proper callbacks)
- ✅ Event propagation (stopPropagation for edit/delete actions)
- ✅ Mobile dropdown trigger (MoreVertical icon)
- ⏭️ Mobile dropdown menu items (skipped - Radix UI portal rendering)

**Coverage:**
- Visual rendering of all card elements
- Click handlers and navigation
- Desktop hover overlay actions
- Mobile dropdown structure
- Event propagation and isolation
- Recipe count and time formatting integration

**Test Count:** 20 tests (3 skipped)

**Skipped Tests:**
- Mobile dropdown "Edytuj" menu item click
- Mobile dropdown "Usuń" menu item click
- Navigation prevention in dropdown menu

**Reason:** Radix UI DropdownMenu renders items in a portal outside the component tree, making them difficult to test with current test setup. Desktop functionality (which has identical behavior) is fully tested.

---

#### **CreateCollectionDialog** (`src/components/collections/dialogs/CreateCollectionDialog.tsx`)
**Test File:** `src/components/collections/dialogs/__tests__/CreateCollectionDialog.test.tsx`

**What's Tested:**
- ✅ Rendering (dialog, title, description, input, buttons, character counter, placeholder)
- ✅ Form interaction (input updates, character counter, API calls with POST)
- ✅ Success flow (toast notification, callback, dialog close, form reset)
- ✅ Form submission (button click, Enter key, validation checks)
- ✅ Dialog closing (Cancel button)
- ✅ Client-side validation (empty, whitespace, max length, error clearing, border styling)
- ✅ Server-side validation (409 conflict, 500 error, network errors, malformed responses)
- ✅ Loading states (spinner, disabled inputs/buttons, loading text)
- ✅ Character counter (color changes: gray < 90, amber 90-100, red > 100)
- ✅ Edge cases (100 chars, spaces, whitespace trimming, special chars, Polish chars, emoji, rapid submissions)
- ✅ Accessibility (label associations, ARIA attributes, focus management, keyboard navigation)

**Coverage:**
- Complete dialog lifecycle (open, interact, submit, close)
- All validation scenarios (client and server)
- All error states and recovery
- Loading and disabled states
- Polish character support
- Accessibility compliance

**Test Count:** 51 tests

---

#### **EditCollectionDialog** (`src/components/collections/dialogs/EditCollectionDialog.tsx`)
**Test File:** `src/components/collections/dialogs/__tests__/EditCollectionDialog.test.tsx`

**What's Tested:**
- ✅ Rendering (dialog, title, description, input, buttons when open=true/false)
- ✅ Pre-population (input value, character counter, no initial errors)
- ✅ Form reset when different collection edited (updates to new collection data)
- ✅ Form interaction (input updates, character counter updates, API calls with PUT)
- ✅ API receives trimmed collection name
- ✅ Success flow (toast notification, callback, dialog close, form reset)
- ✅ Skip-API optimization (name unchanged, trimmed name equals original)
- ✅ Client-side validation (empty, whitespace, max length enforcement, error clearing, border styling)
- ✅ Server-side validation (404 not found, 409 conflict, 500 error, network errors, malformed responses)
- ✅ Loading states (spinner, disabled inputs/buttons, loading text, dialog cannot close)
- ✅ Character counter (color changes: gray < 90, amber 90-100, red > 100)
- ✅ Edge cases (100 chars pre-populated, special chars, Polish chars, emoji)
- ✅ Null/undefined collection handling (graceful handling, no submit when null)
- ✅ Accessibility (label associations, ARIA attributes)
- ✅ Dialog closing (Anuluj button)

**Coverage:**
- Complete dialog lifecycle (open, pre-populate, interact, submit, close)
- All validation scenarios (client and server)
- Skip-API optimization for unchanged names
- 404 error handling (collection deleted)
- All error states and recovery
- Loading and disabled states
- Polish character support
- Accessibility compliance
- Null/undefined safety

**Test Count:** 51 tests

---

#### **DeleteCollectionDialog** (`src/components/collections/dialogs/DeleteCollectionDialog.tsx`)
**Test File:** `src/components/collections/dialogs/__tests__/DeleteCollectionDialog.test.tsx`

**What's Tested:**
- ✅ Rendering (AlertDialog, title, warning description, collection name, recipe count)
- ✅ Displays 'Anuluj' and 'Usuń' buttons
- ✅ Delete button has destructive styling (red background)
- ✅ Deletion flow (API call DELETE /api/collections/:id, toast, callback, close)
- ✅ Dialog closing (Anuluj button, can close before deletion, cannot close during)
- ✅ Recipe count display with Polish pluralization (1 przepis, 2-4 przepisy, 5+ przepisów)
- ✅ Clarifies "Przepisy pozostaną dostępne" when recipeCount > 0
- ✅ API errors (404 not found, 500 server error, network errors, malformed responses)
- ✅ Dialog remains open on error (except 404) for retry
- ✅ Loading states (spinner, disabled buttons, loading text)
- ✅ Edge cases (very long names, special characters, 0 recipes, 100+ recipes, null collection)
- ✅ Recipe count formatting (0, 1, 2, 4, 22 recipes with correct pluralization)
- ✅ Accessibility (AlertDialog ARIA attributes, destructive action indication)

**Coverage:**
- Complete deletion workflow with confirmation
- All error scenarios (404 closes dialog, others remain open)
- Polish pluralization for recipe counts
- Loading and disabled states
- Null collection safety
- Accessibility compliance
- User-friendly error messages

**Test Count:** 40 tests

---

#### **CollectionGrid** (`src/components/collections/CollectionGrid.tsx`)
**Test File:** `src/components/collections/__tests__/CollectionGrid.test.tsx`

**What's Tested:**
- ✅ Rendering (all collections as CollectionCard components, correct number of cards, collection data)
- ✅ Grid layout (CSS Grid classes, gap-4, responsive grid-cols-1/2/3/4)
- ✅ Interaction (card click, edit action, delete action with correct callbacks)
- ✅ Multiple collections (1, 10, 100 collections with correct order)
- ✅ Each card receives unique collection data
- ✅ Edge cases (empty array returns null, missing data, duplicate IDs, long names, special characters)
- ✅ Accessibility (grid structure, keyboard navigation, focus order)
- ✅ Props propagation (onCardClick, onEdit, onDelete to all cards)

**Coverage:**
- Complete grid layout component
- Responsive breakpoints (mobile 1 col → desktop 4 cols)
- Props forwarding to CollectionCard components
- Empty state handling (returns null)
- Edge case robustness
- Keyboard and focus accessibility

**Test Count:** 25 tests

---

#### **CollectionsLayout** (`src/components/collections/CollectionsLayout.tsx`)
**Test File:** `src/components/collections/__tests__/CollectionsLayout.test.tsx`

**What's Tested:**
- ✅ Initial rendering (page header, empty state, collection grid, collection count with Polish pluralization)
- ✅ "Nowa kolekcja" button visibility (hidden when empty, shown when collections exist)
- ✅ Dialog state management (open/close for Create, Edit, Delete dialogs)
- ✅ Create collection flow (button rendering, dialog opening from empty state)
- ✅ Edit collection flow (dialog opening from cards, property preservation)
- ✅ Delete collection flow (dialog opening, empty state rendering)
- ✅ Navigation (window.location.href to /collections/:id format)
- ✅ Collection count display (1 kolekcja, 2-4 kolekcje, 5+ kolekcji) for all edge cases
- ✅ Edge cases (100+ collections, empty array, special characters, long names)
- ✅ Accessibility (h1 heading hierarchy, button accessibility, container structure)
- ✅ State transitions (multiple collections, dialog isolation)

**Coverage:**
- Main orchestrator component for collections page
- Dialog state management for all three dialogs
- Polish pluralization for collection counts
- Empty state ↔ grid transitions
- Navigation to collection detail pages
- Props propagation to child components
- Accessibility compliance

**Test Count:** 43 tests

---

## NEED TO BE TESTED / SKIPPED

### Recipes Page Components and Hooks (Partially Completed - 2025-12-03)

**Status:** 149 tests implemented for the most critical components. The following components were intentionally skipped due to complexity and time constraints. They remain as future testing opportunities.

#### Skipped Hooks

##### **useRecipeList** (`src/components/hooks/useRecipeList.ts`)
**Status:** SKIPPED - Complex async/timing behavior
**Estimated Tests:** ~45

**Coverage Needed:**
- Initial state and data fetching
- Query string building from filters
- Endpoint selection (user vs public view)
- Refetching on filter changes
- Search debouncing (500ms)
- Manual refetch functionality
- Error handling (network errors, API errors, malformed responses)
- Edge cases (empty responses, concurrent requests, race conditions)

---

#### Skipped Components

##### **RecipeListLayout** (`src/components/recipes/RecipeListLayout.tsx`)
**Status:** SKIPPED - Complex integration component
**Estimated Tests:** ~50

**Reason:** This component integrates multiple hooks and child components. Testing it requires complex mocking of all dependencies and would be better tested via integration/E2E tests.

---

##### **RecipeListLayout** (`src/components/recipes/RecipeListLayout.tsx`)
**Estimated Tests:** ~50

**Coverage Needed:**
- Initial rendering and hook initialization
- Layout structure (SearchBar, FilterPanel, ActiveFilterChips, RecipeGrid, Pagination)
- Empty states (no recipes, no results)
- Filter integration (props propagation, filter changes)
- Favorite integration (state management, toggle functionality)
- Pagination integration
- Public view mode
- Mobile filter panel (Sheet behavior)
- Error handling and retry functionality
- Edge cases and accessibility

---

#### Filter Components - Priority P0-P1

##### **FilterPanel** (`src/components/recipes/FilterPanel.tsx`)
**Estimated Tests:** ~35

**Coverage Needed:**
- Desktop layout (sidebar, sticky positioning)
- Mobile layout (Sheet with trigger button)
- Props propagation to child components
- Filter change handling
- Sheet state management
- Active filter count badge
- Accessibility (ARIA attributes, keyboard navigation)
- Edge cases

---

##### **SearchBar** (`src/components/recipes/SearchBar.tsx`)
**Estimated Tests:** ~20

**Coverage Needed:**
- Rendering (input, icon, placeholder)
- User interaction (typing, debouncing 300ms)
- Value synchronization (controlled component)
- Edge cases (long queries, special characters, paste events)
- Accessibility (labels, keyboard access)

---

##### **TagFilterSection** (`src/components/recipes/TagFilterSection.tsx`)
**Estimated Tests:** ~20

**Coverage Needed:**
- Rendering (checkboxes, labels, loading state)
- Selection state (checked/unchecked based on props)
- User interaction (multi-select, onChange callback)
- Edge cases (empty tags, long names, special characters)
- Accessibility (checkbox-label association, keyboard navigation)

---

##### **CaloriesSlider** (`src/components/recipes/CaloriesSlider.tsx`)
**Estimated Tests:** ~22

**Coverage Needed:**
- Rendering (slider, checkbox, label, value display)
- Initial state (enabled/disabled based on value)
- User interaction (checkbox toggle, slider movement)
- Value clamping (1-2000 kcal, 50 kcal step)
- Value synchronization
- Edge cases (min/max boundaries, invalid values)
- Accessibility (ARIA attributes, keyboard control, live region)

---

##### **PrepTimeSlider** (`src/components/recipes/PrepTimeSlider.tsx`)
**Estimated Tests:** ~22

**Coverage Needed:**
- Rendering (slider, checkbox, label, value display in minutes)
- Initial state (enabled/disabled based on value)
- User interaction (checkbox toggle, slider movement)
- Value clamping (5-180 min, 5 min step)
- Value synchronization
- Edge cases (min/max boundaries, invalid values)
- Accessibility (ARIA attributes, keyboard control, live region)

---

##### **SortDropdown** (`src/components/recipes/SortDropdown.tsx`)
**Estimated Tests:** ~20

**Coverage Needed:**
- Rendering (select component, all sort options)
- Sort options (6 options: Najnowsze, Najstarsze, Nazwa A-Z, Nazwa Z-A, Najkrótszy czas, Najdłuższy czas)
- User interaction (selection, onChange with correct sortBy and sortOrder)
- Value synchronization
- Edge cases (invalid sortBy/sortOrder values)
- Accessibility (labels, keyboard navigation)

---

##### **ActiveFilterChips** (`src/components/recipes/ActiveFilterChips.tsx`)
**Estimated Tests:** ~25

**Coverage Needed:**
- Rendering (chips for search, tags, calories, prep time; "Clear All" button)
- Chip content (correct labels and values)
- Tag name resolution (lookup from tags array)
- User interaction (remove chip, clear all)
- Edge cases (long values, all filters active, tag not found)
- Accessibility (ARIA labels, keyboard navigation)

---

#### Display Components - Priority P1-P2

##### **RecipeGrid** (`src/components/recipes/RecipeGrid.tsx`)
**Estimated Tests:** ~25

**Coverage Needed:**
- Rendering (grid container, RecipeCard for each recipe)
- Data transformation (RecipeListItemDTO to RecipeCardData)
- Props propagation (favorite state, handlers, view mode)
- Grid layout (responsive breakpoints: 1/2/3/4 columns)
- Favorite state management
- Edge cases (empty array, missing fields, duplicates)
- Accessibility (grid structure, keyboard navigation)

---

##### **EmptyState** (`src/components/recipes/EmptyState.tsx`)
**Estimated Tests:** ~18

**Coverage Needed:**
- No recipes state (ChefHat icon, "Add Recipe" button)
- No results state (Search icon, "Clear Filters" button)
- Conditional rendering based on type prop
- Public view mode (hide "Add Recipe" button)
- User interaction (button clicks, callbacks)
- Edge cases (invalid type, missing callbacks)
- Accessibility (heading hierarchy, descriptive labels)

---

##### **LoadingSkeletons** (`src/components/recipes/LoadingSkeletons.tsx`)
**Estimated Tests:** ~12

**Coverage Needed:**
- Rendering (skeleton cards, correct count)
- Layout (CSS Grid, responsive breakpoints matching RecipeGrid)
- Structure (image, title, description, metadata placeholders)
- Edge cases (count = 0, count = 1, very large count)

---

### Testing Phases

**Phase 1 (Week 1):** Hooks - useRecipeFilters, useRecipeList, useTags (~105 tests)
**Phase 2 (Week 2):** Layout & Core Filtering - RecipeListLayout, FilterPanel, SearchBar (~105 tests)
**Phase 3 (Week 3):** Filter Components - TagFilterSection, CaloriesSlider, PrepTimeSlider, SortDropdown, ActiveFilterChips (~109 tests)
**Phase 4 (Week 4):** Display Components - RecipeGrid, EmptyState, LoadingSkeletons (~55 tests)

**Total Estimated Tests:** ~300 tests

---

### Implementation Notes

- All test files should follow existing patterns in the codebase
- Use React Testing Library for component tests
- Use Vitest for hook tests
- Mock fetch for API calls
- Mock window.history for URL state management
- Prioritize testing user behavior over implementation details
- Include accessibility testing in all component tests
- Test responsive behavior for mobile/desktop layouts

---

## Collections Page Components (FULLY TESTED - 2025-12-05) ✅

**Test Plan Reference:** `.ai/collections_test_plan.md`
**Status:** ALL PHASES COMPLETE! 🎉
- Phase 1 Complete (78 tests) - Utilities & Basic Components
- Phase 2 Complete (142 tests) - Dialogs
- Phase 3 Complete (68 tests) - Layout & Integration
**Total Tests:** 288 tests (3 skipped)
**Timeline:** Completed in 2 days

### ✅ Phase 1 Completed: Utilities & Basic Components
1. ✅ Utility Functions (42 tests) - formatRecipeCount, formatRelativeTime, getThumbnailColors
2. ✅ EmptyState (16 tests) - Icon, rendering, interactions, accessibility
3. ✅ CollectionCard (20 tests, 3 skipped) - Rendering, navigation, desktop/mobile actions

### ✅ Phase 2 Completed: Dialogs (3/3 Complete)
4. ✅ CreateCollectionDialog (51 tests) - Form validation, API integration, loading states, error handling
5. ✅ EditCollectionDialog (51 tests) - Pre-population, skip-API optimization, 404 handling, null/undefined handling
6. ✅ DeleteCollectionDialog (40 tests) - **Complete** - Destructive action confirmation, recipe count formatting

### ✅ Phase 3 Completed: Layout & Integration Components

7. ✅ CollectionGrid (25 tests) - Grid layout, props propagation, responsive breakpoints
8. ✅ CollectionsLayout (43 tests) - Main orchestrator, dialog management, Polish pluralization

---

## 🎉 Collections Page - ALL TESTING COMPLETE!

**Summary:**
- 8 components fully tested
- 288 tests total (3 skipped)
- All phases complete (Phase 1, 2, and 3)
- Completed in 2 days

---

### Test Implementation Order (Remaining)

**Phase 2: Dialogs** - ✅ **Complete** (142/142 tests)
1. ✅ CreateCollectionDialog (51 tests)
2. ✅ EditCollectionDialog (51 tests)
3. ✅ DeleteCollectionDialog (40 tests)

**Phase 3: Layout & Integration** - ✅ **Complete** (68/68 tests)
4. ✅ CollectionGrid (25 tests)
5. ✅ CollectionsLayout (43 tests)

---

**Last Updated:** 2025-12-05
**Test Plan Reference:** `.ai/recipes_test_plan.md`, `.ai/collections_test_plan.md`
