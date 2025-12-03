# Recipes Page - Test Plan

**Page:** `src/pages/recipes.astro`
**Generated:** 2025-12-03
**Status:** Ready for Implementation

---

## Executive Summary

This test plan covers the recipes page and its associated components based on the component structure analysis. The plan excludes already-tested components (RecipeCard, Pagination, UserMenu, MobileNav, useFavoriteToggle) and focuses on untested critical functionality.

### Components Requiring Tests: 11
### Hooks Requiring Tests: 3
### Estimated Total Tests: ~300+

---

## Priority Levels

- **P0 (Critical)**: Core functionality, user-blocking bugs, data integrity
- **P1 (High)**: Important features, common user flows, error handling
- **P2 (Medium)**: Edge cases, accessibility, UI states
- **P3 (Low)**: Nice-to-have, performance optimizations, rare edge cases

---

## Test Categories

### 1. Custom Hooks (P0 - Critical)

These hooks form the backbone of the recipes page functionality and should be tested first as other components depend on them.

#### 1.1 **useRecipeFilters** (`src/components/hooks/useRecipeFilters.ts`)
**Priority:** P0
**Rationale:** Manages all filter state and URL synchronization - critical for the entire page

**Test Cases:**

##### URL State Management (P0)
- ✅ Initialize filters from URL query parameters on mount
- ✅ Parse search query from URL (?search=keyword)
- ✅ Parse tag IDs from URL (?tags=id1,id2,id3)
- ✅ Parse maxCalories from URL (?maxCalories=500)
- ✅ Parse maxPrepTime from URL (?maxPrepTime=30)
- ✅ Parse sortBy and sortOrder from URL (?sortBy=title&sortOrder=asc)
- ✅ Parse page number from URL (?page=2)
- ✅ Update URL when filters change (pushState)
- ✅ Handle invalid URL parameters (sanitization)
- ✅ Default to valid values for malformed params
- ✅ Remove param from URL when cleared

##### Browser Navigation (P0)
- ✅ Listen to popstate events (back/forward buttons)
- ✅ Update filters when popstate fires
- ✅ Sync state with URL on browser navigation
- ✅ Clean up popstate listener on unmount

##### Filter Operations (P0)
- ✅ setSearch updates search filter and URL
- ✅ setTagIds updates tags filter and URL
- ✅ setMaxCalories updates calories filter and URL
- ✅ setMaxPrepTime updates prep time filter and URL
- ✅ setSortBy updates sort field and order, updates URL
- ✅ setPage updates page number and URL
- ✅ clearFilters resets all filters to defaults
- ✅ clearFilters resets URL to base path
- ✅ removeFilter removes specific filter by key
- ✅ removeFilter with value removes specific tag from tagIds
- ✅ Changing any filter resets page to 1

##### Active Filter Counting (P1)
- ✅ Count active filters correctly
- ✅ Search query counts as 1 filter
- ✅ Each tag counts as 1 filter
- ✅ maxCalories counts as 1 filter when set
- ✅ maxPrepTime counts as 1 filter when set
- ✅ Sort does not count as active filter (default state)
- ✅ Return 0 when no filters active

##### Mobile Panel State (P1)
- ✅ Initialize isFilterPanelOpen as false
- ✅ toggleFilterPanel toggles state
- ✅ Multiple toggles work correctly

##### Edge Cases (P2)
- ✅ Handle empty URL (no query params)
- ✅ Handle malformed JSON in URL
- ✅ Handle negative page numbers (clamp to 1)
- ✅ Handle zero/negative maxCalories
- ✅ Handle zero/negative maxPrepTime
- ✅ Handle invalid sortBy values (default to createdAt)
- ✅ Handle invalid sortOrder values (default to desc)
- ✅ Handle very long search queries (truncate or handle)
- ✅ Handle special characters in search
- ✅ Handle duplicate tag IDs in URL
- ✅ Handle non-existent tag IDs
- ✅ Multiple rapid filter changes (debouncing not needed here, but state consistency)

**Estimated Tests:** ~40

---

#### 1.2 **useRecipeList** (`src/components/hooks/useRecipeList.ts`)
**Priority:** P0
**Rationale:** Fetches recipes based on filters - core data fetching logic

**Test Cases:**

##### Initial State (P0)
- ✅ Initialize with empty recipes array
- ✅ Initialize with isLoading = true
- ✅ Initialize with error = null
- ✅ Initialize with pagination = null

##### Data Fetching (P0)
- ✅ Fetch recipes on mount with initial filters
- ✅ Build correct query string from filters
- ✅ Call correct endpoint (/api/recipes for user view)
- ✅ Call correct endpoint (/api/recipes/public for public view)
- ✅ Include search param in query string when set
- ✅ Include tags param (comma-separated) when set
- ✅ Include maxCalories param when set
- ✅ Include maxPrepTime param when set
- ✅ Include sortBy and sortOrder params
- ✅ Include page and limit params
- ✅ Parse successful API response correctly
- ✅ Extract recipes array from response
- ✅ Extract pagination object from response
- ✅ Set isLoading to false after fetch

##### Refetching on Filter Changes (P0)
- ✅ Refetch when filters.search changes
- ✅ Refetch when filters.tagIds changes
- ✅ Refetch when filters.maxCalories changes
- ✅ Refetch when filters.maxPrepTime changes
- ✅ Refetch when filters.sortBy changes
- ✅ Refetch when filters.sortOrder changes
- ✅ Refetch when filters.page changes
- ✅ Debounce search queries (500ms delay)
- ✅ Cancel previous fetch when new fetch starts
- ✅ Don't refetch if filters haven't changed

##### Manual Refetch (P1)
- ✅ Call refetch() to manually refresh data
- ✅ Clear previous error on refetch
- ✅ Set isLoading to true on refetch
- ✅ Fetch with current filters on refetch

##### Error Handling (P0)
- ✅ Set error state on API failure
- ✅ Extract error message from API response
- ✅ Default to generic error message if none provided
- ✅ Handle network errors gracefully
- ✅ Handle malformed JSON responses
- ✅ Handle 401 (unauthorized) responses
- ✅ Handle 404 (not found) responses
- ✅ Handle 500 (server error) responses
- ✅ Set isLoading to false on error
- ✅ Clear recipes on error (or keep previous?)

##### Edge Cases (P2)
- ✅ Handle empty response (no recipes)
- ✅ Handle pagination with 0 total
- ✅ Handle very large number of recipes
- ✅ Handle recipes with null/missing fields
- ✅ Handle concurrent filter changes (race conditions)
- ✅ Handle API timeout
- ✅ Handle component unmount during fetch (cleanup)

**Estimated Tests:** ~45

---

#### 1.3 **useTags** (`src/components/hooks/useTags.ts`)
**Priority:** P1
**Rationale:** Simpler hook but critical for filtering functionality

**Test Cases:**

##### Initial State (P0)
- ✅ Initialize with empty tags array
- ✅ Initialize with isLoading = true
- ✅ Initialize with error = null

##### Data Fetching (P0)
- ✅ Fetch tags on mount
- ✅ Call GET /api/tags
- ✅ Parse successful response
- ✅ Extract tags array from response
- ✅ Set isLoading to false after fetch
- ✅ Cache results (don't refetch on re-render)

##### Error Handling (P1)
- ✅ Set error state on API failure
- ✅ Extract error message from response
- ✅ Default to generic error message
- ✅ Handle network errors
- ✅ Handle malformed JSON
- ✅ Handle 401/404/500 responses
- ✅ Set isLoading to false on error

##### Edge Cases (P2)
- ✅ Handle empty tags array
- ✅ Handle tags with missing fields
- ✅ Handle very long tag names
- ✅ Handle special characters in tag names
- ✅ Handle component unmount during fetch

**Estimated Tests:** ~20

---

### 2. Core Layout Component (P0)

#### 2.1 **RecipeListLayout** (`src/components/recipes/RecipeListLayout.tsx`)
**Priority:** P0
**Rationale:** Main orchestration component - integrates all hooks and child components

**Test Cases:**

##### Initial Rendering (P0)
- ✅ Render without crashing
- ✅ Initialize with provided initialFavoriteIds
- ✅ Initialize all hooks correctly
- ✅ Pass correct endpoint to useRecipeList based on isPublicView prop
- ✅ Show loading skeletons while isLoading is true
- ✅ Hide loading skeletons when isLoading is false

##### Layout Structure (P0)
- ✅ Render SearchBar component
- ✅ Render FilterPanel component (desktop sidebar)
- ✅ Render ActiveFilterChips component
- ✅ Render RecipeGrid when recipes exist
- ✅ Render Pagination when totalPages > 1
- ✅ Render mobile filter button on small screens
- ✅ Hide FilterPanel sidebar on mobile (lg breakpoint)

##### Empty States (P0)
- ✅ Show EmptyState with type="no-recipes" when no recipes and no filters
- ✅ Show EmptyState with type="no-results" when no recipes but filters active
- ✅ Hide EmptyState when recipes exist
- ✅ Pass correct props to EmptyState (onAddRecipe, onClearFilters)

##### Filter Integration (P0)
- ✅ Pass filters to FilterPanel
- ✅ Pass filters to ActiveFilterChips
- ✅ Pass filter change handlers to FilterPanel
- ✅ Pass removeFilter handler to ActiveFilterChips
- ✅ Pass clearFilters handler to ActiveFilterChips
- ✅ Pass activeFilterCount to FilterPanel
- ✅ Update filters when SearchBar onChange fires
- ✅ Update filters when FilterPanel onChange fires
- ✅ Update filters when ActiveFilterChips onRemove fires

##### Favorite Integration (P0)
- ✅ Pass favoriteRecipeIds to RecipeGrid
- ✅ Pass toggleFavorite handler to RecipeGrid
- ✅ Pass isTogglingRecipe handler to RecipeGrid
- ✅ Favorite state persists across filter changes
- ✅ Favorite toggle works correctly

##### Pagination Integration (P0)
- ✅ Pass pagination object to Pagination component
- ✅ Pass setPage handler to Pagination
- ✅ Page change triggers recipe refetch
- ✅ Hide Pagination when totalPages <= 1
- ✅ Show Pagination when totalPages > 1

##### Public View Mode (P1)
- ✅ Pass isPublicView=true to child components when prop is true
- ✅ RecipeGrid shows author badges in public view
- ✅ EmptyState hides "Add Recipe" button in public view
- ✅ Different API endpoint used in public view

##### Mobile Filter Panel (P1)
- ✅ Sheet opens when mobile filter button clicked
- ✅ Sheet closes when "Apply" button clicked
- ✅ Sheet state synced with isFilterPanelOpen
- ✅ toggleFilterPanel called on sheet open/close

##### Error Handling (P1)
- ✅ Show error message when useRecipeList returns error
- ✅ Show error message when useTags returns error
- ✅ Provide retry functionality on error
- ✅ Clear error on retry

##### Edge Cases (P2)
- ✅ Handle empty initialFavoriteIds
- ✅ Handle null/undefined initialFavoriteIds
- ✅ Handle very large initialFavoriteIds array
- ✅ Handle recipes with missing fields
- ✅ Handle tags with missing fields
- ✅ Render correctly when both tags and recipes fail
- ✅ Accessibility (landmarks, ARIA labels)

**Estimated Tests:** ~50

---

### 3. Filter Components (P0-P1)

#### 3.1 **FilterPanel** (`src/components/recipes/FilterPanel.tsx`)
**Priority:** P0
**Rationale:** Critical for filtering functionality

**Test Cases:**

##### Desktop Layout (P0)
- ✅ Render sidebar on desktop (visible at lg breakpoint)
- ✅ Hide sidebar on mobile
- ✅ Sidebar is sticky positioned
- ✅ Render all filter sections in correct order
- ✅ Render SortDropdown
- ✅ Render TagFilterSection
- ✅ Render CaloriesSlider
- ✅ Render PrepTimeSlider
- ✅ Render Separator between sections
- ✅ Render "Clear Filters" button

##### Mobile Layout (P0)
- ✅ Render Sheet trigger button on mobile
- ✅ Hide Sheet trigger button on desktop
- ✅ Show activeFilterCount badge on trigger button
- ✅ Hide badge when activeFilterCount is 0
- ✅ Sheet opens when trigger clicked
- ✅ Sheet closes when close button clicked
- ✅ Sheet contains same filter controls as desktop
- ✅ "Apply" button closes sheet on mobile
- ✅ Call onApply when "Apply" button clicked

##### Props Propagation (P0)
- ✅ Pass filters to all child components
- ✅ Pass tags to TagFilterSection
- ✅ Pass isLoadingTags to TagFilterSection
- ✅ Call onFiltersChange when any filter changes
- ✅ Call onClear when "Clear Filters" clicked
- ✅ Call onOpenChange when sheet state changes

##### Filter Change Handling (P1)
- ✅ Update filters when SortDropdown changes
- ✅ Update filters when TagFilterSection changes
- ✅ Update filters when CaloriesSlider changes
- ✅ Update filters when PrepTimeSlider changes
- ✅ All changes propagate through onFiltersChange

##### Sheet State Management (P1)
- ✅ Sheet controlled by isOpen prop
- ✅ Sheet calls onOpenChange when state changes
- ✅ Sheet state synced with parent component

##### Accessibility (P2)
- ✅ Filter sections have proper labels
- ✅ Sheet has proper ARIA attributes
- ✅ Sheet trigger has descriptive aria-label
- ✅ Keyboard navigation works in sheet

##### Edge Cases (P2)
- ✅ Handle empty tags array
- ✅ Handle null filters
- ✅ Handle very large activeFilterCount
- ✅ Render correctly when isLoadingTags is true

**Estimated Tests:** ~35

---

#### 3.2 **SearchBar** (`src/components/recipes/SearchBar.tsx`)
**Priority:** P1
**Rationale:** Common user interaction, simple component

**Test Cases:**

##### Rendering (P0)
- ✅ Render input field
- ✅ Render search icon
- ✅ Show placeholder text
- ✅ Display current value prop

##### User Interaction (P0)
- ✅ Call onChange when user types
- ✅ Debounce onChange calls (300ms delay)
- ✅ Don't call onChange immediately on input
- ✅ Call onChange after debounce delay
- ✅ Cancel previous debounce on rapid typing
- ✅ Call onChange with latest value after debounce

##### Value Synchronization (P1)
- ✅ Update input when value prop changes
- ✅ Controlled component behavior
- ✅ Handle empty value (empty string)
- ✅ Handle undefined value

##### Edge Cases (P2)
- ✅ Handle very long search queries
- ✅ Handle special characters
- ✅ Handle paste events
- ✅ Handle clear input (backspace to empty)
- ✅ Cleanup debounce timer on unmount

##### Accessibility (P2)
- ✅ Input has proper label (aria-label or associated label)
- ✅ Input is keyboard accessible
- ✅ Search icon is decorative (aria-hidden)

**Estimated Tests:** ~20

---

#### 3.3 **TagFilterSection** (`src/components/recipes/TagFilterSection.tsx`)
**Priority:** P1
**Rationale:** Important for filtering, moderate complexity

**Test Cases:**

##### Rendering (P0)
- ✅ Render section title
- ✅ Render checkbox for each tag
- ✅ Render label for each tag
- ✅ Show loading state when isLoading is true
- ✅ Hide checkboxes when isLoading is true

##### Selection State (P0)
- ✅ Check boxes for selected tag IDs
- ✅ Uncheck boxes for unselected tag IDs
- ✅ Handle empty selectedTagIds
- ✅ Handle all tags selected
- ✅ Handle no tags selected

##### User Interaction (P0)
- ✅ Call onChange when checkbox clicked
- ✅ Add tag ID to array when checked
- ✅ Remove tag ID from array when unchecked
- ✅ Pass updated array to onChange
- ✅ Support multi-select (multiple tags)

##### Edge Cases (P2)
- ✅ Handle empty tags array
- ✅ Handle tags with very long names
- ✅ Handle tags with special characters
- ✅ Handle duplicate tag IDs in selectedTagIds
- ✅ Handle tag ID in selectedTagIds but not in tags array

##### Accessibility (P2)
- ✅ Checkboxes associated with labels
- ✅ Keyboard navigation works
- ✅ Labels are clickable
- ✅ Proper ARIA attributes

**Estimated Tests:** ~20

---

#### 3.4 **CaloriesSlider** (`src/components/recipes/CaloriesSlider.tsx`)
**Priority:** P1
**Rationale:** Important filter, moderate complexity

**Test Cases:**

##### Rendering (P0)
- ✅ Render slider component
- ✅ Render label
- ✅ Render enable/disable checkbox
- ✅ Display current value
- ✅ Show range (1-2000 kcal)
- ✅ Show step (50 kcal)

##### Initial State (P0)
- ✅ Checkbox unchecked when value is undefined
- ✅ Checkbox checked when value is set
- ✅ Slider disabled when checkbox unchecked
- ✅ Slider enabled when checkbox checked
- ✅ Display value only when checkbox checked

##### User Interaction (P0)
- ✅ Enable filter when checkbox checked
- ✅ Disable filter when checkbox unchecked (pass undefined to onChange)
- ✅ Call onChange with slider value when slider moved
- ✅ Update displayed value as slider moves
- ✅ Clamp value to min (1) and max (2000)
- ✅ Snap to step (50 kcal increments)

##### Value Synchronization (P1)
- ✅ Update slider when value prop changes
- ✅ Update checkbox when value changes from undefined to number
- ✅ Update checkbox when value changes from number to undefined

##### Edge Cases (P2)
- ✅ Handle value = 1 (minimum)
- ✅ Handle value = 2000 (maximum)
- ✅ Handle value outside range (clamp)
- ✅ Handle null value (treat as undefined)
- ✅ Handle value not on step boundary (round to nearest step)

##### Accessibility (P2)
- ✅ Slider has proper ARIA attributes
- ✅ Slider is keyboard accessible (arrow keys)
- ✅ Checkbox associated with label
- ✅ Live region announces value changes

**Estimated Tests:** ~22

---

#### 3.5 **PrepTimeSlider** (`src/components/recipes/PrepTimeSlider.tsx`)
**Priority:** P1
**Rationale:** Similar to CaloriesSlider, important filter

**Test Cases:**

_Similar to CaloriesSlider but with different range (5-180 minutes) and step (5 minutes)_

##### Rendering (P0)
- ✅ Render slider component
- ✅ Render label
- ✅ Render enable/disable checkbox
- ✅ Display current value in minutes
- ✅ Show range (5-180 min)
- ✅ Show step (5 min)

##### Initial State (P0)
- ✅ Checkbox unchecked when value is undefined
- ✅ Checkbox checked when value is set
- ✅ Slider disabled when checkbox unchecked
- ✅ Slider enabled when checkbox checked
- ✅ Display value only when checkbox checked

##### User Interaction (P0)
- ✅ Enable filter when checkbox checked
- ✅ Disable filter when checkbox unchecked (pass undefined to onChange)
- ✅ Call onChange with slider value when slider moved
- ✅ Update displayed value as slider moves
- ✅ Clamp value to min (5) and max (180)
- ✅ Snap to step (5 min increments)

##### Value Synchronization (P1)
- ✅ Update slider when value prop changes
- ✅ Update checkbox when value changes

##### Edge Cases (P2)
- ✅ Handle value = 5 (minimum)
- ✅ Handle value = 180 (maximum)
- ✅ Handle value outside range (clamp)
- ✅ Handle null value (treat as undefined)
- ✅ Handle value not on step boundary

##### Accessibility (P2)
- ✅ Slider has proper ARIA attributes
- ✅ Slider is keyboard accessible
- ✅ Checkbox associated with label
- ✅ Live region announces value changes

**Estimated Tests:** ~22

---

#### 3.6 **SortDropdown** (`src/components/recipes/SortDropdown.tsx`)
**Priority:** P1
**Rationale:** Important for UX, moderate complexity

**Test Cases:**

##### Rendering (P0)
- ✅ Render select component
- ✅ Render label
- ✅ Display current sort option
- ✅ Show all sort options in dropdown
- ✅ Display correct labels for each option

##### Sort Options (P0)
- ✅ Render "Najnowsze" (createdAt desc)
- ✅ Render "Najstarsze" (createdAt asc)
- ✅ Render "Nazwa A-Z" (title asc)
- ✅ Render "Nazwa Z-A" (title desc)
- ✅ Render "Najkrótszy czas" (prepTime asc)
- ✅ Render "Najdłuższy czas" (prepTime desc)

##### User Interaction (P0)
- ✅ Call onChange with correct sortBy and sortOrder when option selected
- ✅ Update displayed value when selection changes
- ✅ Parse combined option value (e.g., "createdAt-desc") correctly

##### Value Synchronization (P1)
- ✅ Display correct selected option based on sortBy and sortOrder props
- ✅ Handle when sortBy prop changes
- ✅ Handle when sortOrder prop changes

##### Edge Cases (P2)
- ✅ Handle invalid sortBy value (default to createdAt)
- ✅ Handle invalid sortOrder value (default to desc)
- ✅ Handle missing sortBy prop
- ✅ Handle missing sortOrder prop

##### Accessibility (P2)
- ✅ Select has proper label
- ✅ Select is keyboard accessible
- ✅ Options have descriptive text

**Estimated Tests:** ~20

---

#### 3.7 **ActiveFilterChips** (`src/components/recipes/ActiveFilterChips.tsx`)
**Priority:** P1
**Rationale:** Important for UX, shows active filters

**Test Cases:**

##### Rendering (P0)
- ✅ Render nothing when no filters active
- ✅ Render chip for search query
- ✅ Render chip for each selected tag
- ✅ Render chip for maxCalories
- ✅ Render chip for maxPrepTime
- ✅ Don't render chip for sortBy/sortOrder (not considered active filter)
- ✅ Render "Clear All" button when filters active
- ✅ Hide "Clear All" button when no filters active

##### Chip Content (P0)
- ✅ Search chip shows: "Szukaj: {query}"
- ✅ Tag chip shows tag name (not ID)
- ✅ Calories chip shows: "Max {value} kcal"
- ✅ Prep time chip shows: "Max {value} min"
- ✅ Each chip has remove button (X icon)

##### User Interaction (P0)
- ✅ Call onRemoveFilter when chip remove button clicked
- ✅ Pass correct filter key to onRemoveFilter
- ✅ Pass tag ID to onRemoveFilter for tag chips
- ✅ Call onClearAll when "Clear All" button clicked

##### Tag Name Resolution (P1)
- ✅ Look up tag name from tags array by ID
- ✅ Fallback to tag ID if tag not found in array
- ✅ Handle empty tags array
- ✅ Handle tag ID not in tags array

##### Edge Cases (P2)
- ✅ Handle very long search query (truncate)
- ✅ Handle very long tag names (truncate)
- ✅ Handle very large calorie values
- ✅ Handle very large prep time values
- ✅ Handle all filters active at once
- ✅ Handle removing last chip

##### Accessibility (P2)
- ✅ Chips have proper ARIA labels
- ✅ Remove buttons have descriptive aria-label
- ✅ Keyboard navigation works
- ✅ Clear All button is keyboard accessible

**Estimated Tests:** ~25

---

### 4. Display Components (P1-P2)

#### 4.1 **RecipeGrid** (`src/components/recipes/RecipeGrid.tsx`)
**Priority:** P1
**Rationale:** Important display component, already tested RecipeCard dependency

**Test Cases:**

##### Rendering (P0)
- ✅ Render grid container
- ✅ Render RecipeCard for each recipe
- ✅ Render correct number of cards
- ✅ Handle empty recipes array

##### Data Transformation (P0)
- ✅ Transform RecipeListItemDTO to RecipeCardData
- ✅ Call transformRecipeToCardData for each recipe
- ✅ Pass transformed data to RecipeCard

##### Props Propagation (P0)
- ✅ Pass correct isFavorited state to each card
- ✅ Pass onFavoriteToggle handler to each card
- ✅ Pass isLoading state to each card (via isTogglingRecipe)
- ✅ Pass showAuthorBadge prop to cards in public view
- ✅ Pass isPublicView prop to cards

##### Grid Layout (P1)
- ✅ Use CSS Grid layout
- ✅ 1 column on mobile
- ✅ 2 columns on sm breakpoint
- ✅ 3 columns on lg breakpoint
- ✅ 4 columns on xl breakpoint
- ✅ Proper gap between cards

##### Favorite State (P1)
- ✅ Check if recipe ID is in favoriteRecipeIds Set
- ✅ Update when favoriteRecipeIds changes
- ✅ Toggle favorite when card heart clicked
- ✅ Show loading state for specific recipe being toggled

##### Edge Cases (P2)
- ✅ Handle recipes with missing fields
- ✅ Handle very large number of recipes
- ✅ Handle recipes with null description
- ✅ Handle recipes with null prepTimeMinutes
- ✅ Handle duplicate recipe IDs

##### Accessibility (P2)
- ✅ Grid has proper structure
- ✅ Each card is properly labeled
- ✅ Keyboard navigation works

**Estimated Tests:** ~25

---

#### 4.2 **LoadingSkeletons** (`src/components/recipes/LoadingSkeletons.tsx`)
**Priority:** P2
**Rationale:** Simple component, low complexity

**Test Cases:**

##### Rendering (P1)
- ✅ Render skeleton cards
- ✅ Render correct count (default 12)
- ✅ Render custom count when prop provided
- ✅ Match RecipeCard layout

##### Layout (P2)
- ✅ Use CSS Grid layout
- ✅ Match RecipeGrid breakpoints
- ✅ 1 column on mobile
- ✅ 2 columns on sm
- ✅ 3 columns on lg
- ✅ 4 columns on xl

##### Structure (P2)
- ✅ Each skeleton has image placeholder
- ✅ Each skeleton has title placeholder
- ✅ Each skeleton has description placeholder
- ✅ Each skeleton has metadata placeholder

##### Edge Cases (P2)
- ✅ Handle count = 0
- ✅ Handle count = 1
- ✅ Handle very large count (e.g., 100)

**Estimated Tests:** ~12

---

#### 4.3 **EmptyState** (`src/components/recipes/EmptyState.tsx`)
**Priority:** P1
**Rationale:** Important for UX, multiple states

**Test Cases:**

##### No Recipes State (P0)
- ✅ Render "no-recipes" state when type="no-recipes"
- ✅ Show ChefHat icon
- ✅ Show appropriate heading
- ✅ Show descriptive message
- ✅ Show "Add Recipe" button when not public view
- ✅ Hide "Add Recipe" button when public view
- ✅ Call onAddRecipe when button clicked
- ✅ Button navigates to /recipes/new

##### No Results State (P0)
- ✅ Render "no-results" state when type="no-results"
- ✅ Show Search icon
- ✅ Show appropriate heading
- ✅ Show descriptive message
- ✅ Show "Clear Filters" button
- ✅ Call onClearFilters when button clicked

##### Conditional Rendering (P1)
- ✅ Render correct state based on type prop
- ✅ Only render one state at a time
- ✅ Handle missing type prop (default to no-recipes)

##### Public View Mode (P1)
- ✅ Pass isPublicView to control button visibility
- ✅ Show different message in public view

##### Edge Cases (P2)
- ✅ Handle invalid type prop
- ✅ Handle missing onAddRecipe callback
- ✅ Handle missing onClearFilters callback

##### Accessibility (P2)
- ✅ Headings have proper hierarchy
- ✅ Buttons have descriptive labels
- ✅ Icons are decorative (aria-hidden)
- ✅ Container has proper structure

**Estimated Tests:** ~18

---

## Summary by Priority

| Priority | Components/Hooks | Estimated Tests |
|----------|------------------|-----------------|
| **P0** | 7 (3 hooks, 4 components) | ~220 |
| **P1** | 7 components | ~185 |
| **P2** | Edge cases and accessibility | ~95 |
| **Total** | **14 items** | **~300 tests** |

---

## Testing Strategy

### Phase 1: Hooks (P0) - Week 1
1. ✅ useRecipeFilters (~40 tests)
2. ✅ useRecipeList (~45 tests)
3. ✅ useTags (~20 tests)

**Rationale:** Test foundation first. All components depend on these hooks.

### Phase 2: Layout & Core Filtering (P0) - Week 2
4. ✅ RecipeListLayout (~50 tests)
5. ✅ FilterPanel (~35 tests)
6. ✅ SearchBar (~20 tests)

**Rationale:** Test main orchestration and critical user paths.

### Phase 3: Filter Components (P1) - Week 3
7. ✅ TagFilterSection (~20 tests)
8. ✅ CaloriesSlider (~22 tests)
9. ✅ PrepTimeSlider (~22 tests)
10. ✅ SortDropdown (~20 tests)
11. ✅ ActiveFilterChips (~25 tests)

**Rationale:** Complete filter functionality testing.

### Phase 4: Display Components (P1-P2) - Week 4
12. ✅ RecipeGrid (~25 tests)
13. ✅ EmptyState (~18 tests)
14. ✅ LoadingSkeletons (~12 tests)

**Rationale:** Test display and UX components.

---

## Testing Tools & Setup

### Required Dependencies
```json
{
  "@testing-library/react": "^16.0.1",
  "@testing-library/jest-dom": "^6.5.0",
  "@testing-library/user-event": "^14.5.2",
  "vitest": "^latest",
  "@vitejs/plugin-react": "^latest"
}
```

### Test File Locations
- Hooks: `src/components/hooks/__tests__/[hookName].test.ts`
- Components: `src/components/recipes/__tests__/[ComponentName].test.tsx`

### Mock Strategy
1. Mock fetch for API calls (useRecipeList, useTags)
2. Mock window.history for URL state management (useRecipeFilters)
3. Mock window.location for URL parsing
4. Mock popstate events for browser navigation
5. Use MSW (Mock Service Worker) for complex API mocking (optional)

---

## Success Criteria

### Code Coverage Goals
- **Hooks:** 95%+ coverage
- **Components:** 90%+ coverage
- **Overall:** 85%+ coverage

### Quality Metrics
- All P0 tests passing
- All P1 tests passing
- 90%+ of P2 tests passing
- No skipped tests in production
- All accessibility tests passing

---

## Risks & Mitigation

### Risk 1: URL State Management Complexity
**Impact:** High
**Mitigation:** Extensive testing of useRecipeFilters, mock window.history, test edge cases

### Risk 2: Race Conditions in useRecipeList
**Impact:** Medium
**Mitigation:** Test concurrent filter changes, mock timers for debouncing, test cleanup on unmount

### Risk 3: Component Integration Issues
**Impact:** Medium
**Mitigation:** Integration tests in RecipeListLayout, test props propagation thoroughly

### Risk 4: Mobile vs Desktop Rendering
**Impact:** Low
**Mitigation:** Use Testing Library's responsive utilities, test breakpoints

---

## Future Enhancements

### E2E Tests (Post-Unit Testing)
1. Complete filter flow (select tags, adjust sliders, search, paginate)
2. Favorite toggle flow (mark favorite, unfavorite, undo)
3. Browser back/forward navigation
4. Mobile sheet interactions
5. Public view vs user view
6. Error recovery flows

### Performance Tests
1. Large dataset rendering (1000+ recipes)
2. Rapid filter changes (stress test)
3. Memory leaks on mount/unmount cycles

### Visual Regression Tests
1. FilterPanel layout (desktop vs mobile)
2. RecipeGrid responsive breakpoints
3. Empty states
4. Loading skeletons

---

## Notes for Implementation

### Testing Best Practices
1. **Test user behavior, not implementation details**
2. **Use semantic queries (getByRole, getByLabelText) over test IDs**
3. **Test accessibility features (ARIA, keyboard navigation)**
4. **Mock external dependencies (fetch, localStorage, history)**
5. **Test edge cases and error scenarios**
6. **Keep tests isolated and independent**
7. **Use descriptive test names (it should...)**

### Common Patterns
```typescript
// Hook testing
import { renderHook, waitFor } from '@testing-library/react';
import { useRecipeFilters } from '../useRecipeFilters';

// Component testing
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterPanel } from '../FilterPanel';

// Mock fetch
global.fetch = vi.fn();

// Mock history
const mockPushState = vi.fn();
window.history.pushState = mockPushState;
```

---

## Approval & Sign-off

**Test Plan Author:** Claude Code
**Date:** 2025-12-03
**Status:** Ready for Implementation

**Reviewed By:** _Pending_
**Approved By:** _Pending_
**Implementation Start Date:** _TBD_

---

## Revision History

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-12-03 | 1.0 | Initial test plan | Claude Code |

---

**END OF TEST PLAN**
