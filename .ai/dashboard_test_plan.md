# Dashboard Component Test Plan

**Generated:** 2025-12-02
**Target:** `src/pages/dashboard.astro` and its component tree
**Reference:** `.ai/dashboard_component_structure.txt`

---

## Testing Philosophy

This test plan prioritizes:
1. **Business-critical logic** - Features that directly impact user data and experience
2. **Complex state management** - Logic with side effects, optimistic updates, error handling
3. **Pure utility functions** - High ROI, easy to test, prevent regression
4. **Component interactions** - User-facing behaviors and edge cases
5. **Integration points** - API boundaries and data transformations

---

## Priority Levels

- **🔴 HIGH** - Must test: Business-critical, complex logic, high risk of bugs
- **🟡 MEDIUM** - Should test: Important utilities, user interactions, good ROI
- **🟢 LOW** - Nice to have: Simple components, presentational logic, low risk

---

## Test Plan by Component

### 🔴 HIGH PRIORITY

#### 1. `useFavoriteToggle` Hook (`src/components/hooks/useFavoriteToggle.ts`)

**Why Test:**
- Manages critical business logic (favorites)
- Implements optimistic UI updates with rollback
- Handles API failures and error states
- Orchestrates multiple async operations
- High complexity with side effects

**Test Cases:**

```typescript
describe('useFavoriteToggle', () => {
  // State Management
  ✓ Should initialize with provided favorite IDs
  ✓ Should add recipe to favorites set optimistically
  ✓ Should remove recipe from favorites set optimistically

  // API Integration - Add Favorite
  ✓ Should call POST /api/favorites when adding favorite
  ✓ Should pass correct recipeId in request body
  ✓ Should show success toast after adding favorite
  ✓ Should keep optimistic update on successful add

  // API Integration - Remove Favorite
  ✓ Should call DELETE /api/favorites when removing favorite
  ✓ Should show toast with undo option when removing
  ✓ Should keep optimistic removal on successful delete

  // Error Handling & Rollback
  ✓ Should rollback optimistic add on API failure
  ✓ Should rollback optimistic remove on API failure
  ✓ Should show error toast on API failure
  ✓ Should handle network errors gracefully

  // Undo Functionality
  ✓ Should re-add favorite when undo is clicked
  ✓ Should call POST /api/favorites on undo
  ✓ Should update UI immediately on undo
  ✓ Should handle undo API failures

  // Concurrent Operations
  ✓ Should prevent double-toggling same recipe (isTogglingRecipe check)
  ✓ Should handle multiple concurrent toggles for different recipes

  // Edge Cases
  ✓ Should handle toggling non-existent recipe
  ✓ Should handle empty initial favorites
  ✓ Should cleanup pending operations on unmount
})
```

**Testing Tools:**
- `@testing-library/react-hooks` for hook testing
- Mock `fetch` or use MSW (Mock Service Worker)
- Mock `toast` from sonner

---

#### 2. Data Transformation Utilities (`src/lib/utils/dashboard.ts`)

**Why Test:**
- Critical data pipeline between API and UI
- Incorrect transformations cause UI bugs
- Pure functions - easy to test, high ROI
- Prevents regression when DTO schemas change

**Test Cases:**

```typescript
describe('transformRecipeToCardData', () => {
  // Happy Path
  ✓ Should transform complete RecipeListItemDTO to RecipeCardData
  ✓ Should map all required fields correctly
  ✓ Should preserve recipe ID
  ✓ Should extract total calories from nutrition

  // Nutrition Handling
  ✓ Should handle missing nutrition object (null/undefined)
  ✓ Should handle nutrition without totalCalories
  ✓ Should default to 0 calories when nutrition is missing

  // Tags Handling
  ✓ Should transform tags array correctly
  ✓ Should handle empty tags array
  ✓ Should handle missing tags (null/undefined)

  // Author Handling
  ✓ Should include author name when isPublic is true
  ✓ Should extract authorName from author object
  ✓ Should handle missing author when public

  // Edge Cases
  ✓ Should handle extremely long recipe titles
  ✓ Should handle special characters in title
  ✓ Should handle missing optional fields
  ✓ Should handle malformed input gracefully
})

describe('transformFavoriteToCardData', () => {
  // Happy Path
  ✓ Should transform FavoriteDTO to RecipeCardData
  ✓ Should extract nested recipe data correctly
  ✓ Should map recipeId from favorited recipe

  // Nested Data
  ✓ Should handle nested nutrition object
  ✓ Should handle nested tags array
  ✓ Should extract author from nested recipe

  // Edge Cases
  ✓ Should handle missing nested recipe data
  ✓ Should handle partial favorite objects
})

describe('shuffleArray', () => {
  // Functionality
  ✓ Should return array with same length
  ✓ Should contain all original elements
  ✓ Should not mutate original array
  ✓ Should produce different order (probabilistic)

  // Edge Cases
  ✓ Should handle empty array
  ✓ Should handle single-element array
  ✓ Should handle array with duplicate elements
})
```

**Testing Tools:**
- Jest or Vitest
- Mock TypeScript types for DTOs

---

### 🟡 MEDIUM PRIORITY

#### 3. `RecipeCard` Component (`src/components/RecipeCard.tsx`)

**Why Test:**
- Primary user interaction point
- Multiple states (loading, favorited, hover)
- Complex prop combinations (isPublicView, isCollectionView)
- Click handlers and favorite toggle logic

**Test Cases:**

```typescript
describe('RecipeCard', () => {
  // Rendering
  ✓ Should render recipe title and basic info
  ✓ Should display prep time with clock icon
  ✓ Should display serving count with utensils icon
  ✓ Should show calorie badge with correct color
  ✓ Should render tags as badges

  // Image Handling
  ✓ Should display recipe image when imageUrl provided
  ✓ Should show placeholder when no imageUrl
  ✓ Should use correct placeholder color based on title
  ✓ Should show recipe initial in placeholder

  // Favorite State
  ✓ Should show filled heart when isFavorited is true
  ✓ Should show outline heart when isFavorited is false
  ✓ Should disable favorite button when isLoading is true
  ✓ Should show loading state during favorite toggle

  // Author Badge
  ✓ Should show author badge when showAuthorBadge is true
  ✓ Should display author name in badge
  ✓ Should hide author badge by default

  // Click Handlers
  ✓ Should navigate to recipe detail on card click
  ✓ Should call onFavoriteToggle when heart is clicked
  ✓ Should prevent card click when favorite button clicked
  ✓ Should prevent favorite toggle when isLoading

  // Collection View
  ✓ Should show remove button in collection view
  ✓ Should call onRemoveFromCollection when remove clicked
  ✓ Should not show favorite button in collection view

  // Accessibility
  ✓ Should have proper ARIA labels on buttons
  ✓ Should be keyboard navigable
  ✓ Should have alt text for images
  ✓ Should announce loading state to screen readers
})
```

**Testing Tools:**
- `@testing-library/react`
- Mock router for navigation
- User event testing

---

#### 4. `DashboardContent` Component (`src/components/DashboardContent.tsx`)

**Why Test:**
- Orchestrates entire dashboard state
- Manages favorite sync across sections
- Filters favorites list after removal
- Complex prop drilling and callbacks

**Test Cases:**

```typescript
describe('DashboardContent', () => {
  // Rendering Sections
  ✓ Should render three RecipeSectionRow components
  ✓ Should pass correct titles to each section
  ✓ Should pass userRecipes to first section
  ✓ Should pass favoriteRecipes to second section
  ✓ Should pass publicRecipes to third section

  // Favorite State Management
  ✓ Should initialize favorites from initialFavoriteIds
  ✓ Should sync favorite state across all sections
  ✓ Should remove recipe from favorites section when unfavorited
  ✓ Should keep recipe in other sections when unfavorited

  // Favorite Toggle Propagation
  ✓ Should call useFavoriteToggle.toggleFavorite on card click
  ✓ Should pass isTogglingRecipe to all cards
  ✓ Should update favorite state in all visible cards

  // Empty States
  ✓ Should pass empty array when no user recipes
  ✓ Should pass empty array when no favorites
  ✓ Should handle all sections being empty

  // Recipe Map
  ✓ Should create map for fast favorite lookup
  ✓ Should update map when favorites change
})
```

---

#### 5. `RecipeSectionRow` Component (`src/components/RecipeSectionRow.tsx`)

**Why Test:**
- Implements keyboard navigation
- Manages scroll behavior
- Handles empty states
- Renders dynamic number of cards

**Test Cases:**

```typescript
describe('RecipeSectionRow', () => {
  // Rendering
  ✓ Should render section title
  ✓ Should render "View All" link when provided
  ✓ Should render recipe cards for each recipe
  ✓ Should pass correct props to RecipeCard components

  // Empty State
  ✓ Should show empty message when no recipes
  ✓ Should show empty action button when provided
  ✓ Should not show "View All" link when empty
  ✓ Should not render scroll container when empty

  // Keyboard Navigation
  ✓ Should scroll right on ArrowRight key
  ✓ Should scroll left on ArrowLeft key
  ✓ Should not scroll when not focused
  ✓ Should handle scroll at boundaries

  // Scroll Behavior
  ✓ Should enable horizontal scroll for 6+ recipes
  ✓ Should snap to cards on mobile
  ✓ Should maintain scroll position on re-render

  // Interactions
  ✓ Should propagate onFavoriteToggle to cards
  ✓ Should pass favoriteRecipeIds to cards
  ✓ Should pass isTogglingRecipe to cards
})
```

---

#### 6. Utility Functions - UI Helpers (`src/lib/utils/dashboard.ts`)

**Why Test:**
- Deterministic pure functions
- Easy to test, high confidence
- Prevent visual regressions

**Test Cases:**

```typescript
describe('getCalorieBadgeColor', () => {
  ✓ Should return "default" for < 300 calories
  ✓ Should return "secondary" for 300-500 calories
  ✓ Should return "destructive" for > 500 calories
  ✓ Should handle 0 calories
  ✓ Should handle null/undefined calories
  ✓ Should handle negative calories (edge case)
})

describe('getRecipeInitial', () => {
  ✓ Should return first letter uppercase for simple titles
  ✓ Should handle empty string
  ✓ Should handle titles starting with special characters
  ✓ Should handle emoji at start
  ✓ Should handle whitespace-only title
  ✓ Should trim whitespace before extracting initial
})

describe('getRecipePlaceholderColor', () => {
  ✓ Should return consistent color for same title
  ✓ Should return different colors for different titles
  ✓ Should handle empty title
  ✓ Should return valid Tailwind color class
})

describe('getRecipePlaceholderIconColor', () => {
  ✓ Should return appropriate icon color for background
  ✓ Should have sufficient contrast
  ✓ Should handle all possible background colors
})
```

---

### 🟢 LOW PRIORITY

#### 7. `WelcomeBanner` Component (`src/components/WelcomeBanner.tsx`)

**Why Low Priority:**
- Simple presentational component
- Minimal logic (greeting + button)
- Low risk of bugs

**Test Cases:**

```typescript
describe('WelcomeBanner', () => {
  // Rendering
  ✓ Should show personalized greeting when userName provided
  ✓ Should show default greeting when userName is null
  ✓ Should render "New Recipe" button

  // Interactions
  ✓ Should navigate to /recipes/new on button click
})
```

---

#### 8. `UserMenu` Component (`src/components/app/UserMenu.tsx`)

**Why Test:**
- User authentication logic
- Logout flow critical to security
- Profile navigation

**Test Cases:**

```typescript
describe('UserMenu', () => {
  // Rendering
  ✓ Should show user initials in avatar
  ✓ Should display user email in dropdown
  ✓ Should show display name when available

  // Dropdown Interaction
  ✓ Should open menu on avatar click
  ✓ Should close menu after selection
  ✓ Should close menu on outside click

  // Actions
  ✓ Should call logout API on "Logout" click
  ✓ Should redirect to login after logout
  ✓ Should navigate to /profile on "Profile" click

  // Error Handling
  ✓ Should show error toast if logout fails
  ✓ Should keep menu open if logout fails
})
```

---

#### 9. `MobileNav` Component (`src/components/app/MobileNav.tsx`)

**Why Test:**
- Mobile-specific navigation
- Sheet drawer behavior
- Responsive breakpoints

**Test Cases:**

```typescript
describe('MobileNav', () => {
  // Rendering
  ✓ Should render hamburger menu icon
  ✓ Should show sheet on menu icon click
  ✓ Should render all nav links
  ✓ Should highlight current active link

  // Sheet Behavior
  ✓ Should close sheet on nav link click
  ✓ Should close sheet on backdrop click
  ✓ Should trap focus when open

  // Actions
  ✓ Should call logout API on logout button click
  ✓ Should navigate to profile on profile button click
  ✓ Should navigate to /recipes/new on "New Recipe" click

  // Responsive
  ✓ Should only render on mobile viewport
  ✓ Should hide on desktop viewport
})
```

---

## Integration Testing Considerations

**Note:** These are **NOT unit tests** but should be considered for E2E or integration test suite.

### Server-Side Data Fetching (dashboard.astro)

**Why NOT Unit Test:**
- Server-side Astro code difficult to unit test
- Better covered by integration/E2E tests
- Relies heavily on external APIs and cookies

**E2E Test Scenarios:**
- ✓ Should fetch and display user recipes
- ✓ Should fetch and display favorites
- ✓ Should shuffle and display public recipes
- ✓ Should handle API failures gracefully (Promise.allSettled)
- ✓ Should redirect to login if not authenticated
- ✓ Should show empty states when no data

---

## Testing Infrastructure Requirements

### Dependencies

```json
{
  "devDependencies": {
    "@testing-library/react": "^16.x",
    "@testing-library/react-hooks": "^8.x",
    "@testing-library/jest-dom": "^6.x",
    "@testing-library/user-event": "^14.x",
    "vitest": "^2.x",
    "jsdom": "^26.x",
    "msw": "^2.x"
  }
}
```

### Test Configuration

- **Test Runner:** Vitest (faster, better Vite integration)
- **React Testing:** @testing-library/react
- **API Mocking:** MSW (Mock Service Worker)
- **Coverage Target:** 80% for HIGH priority, 60% for MEDIUM

### Mock Patterns

```typescript
// Mock sonner toast
vi.mock('sonner', () => ({
  toast: vi.fn()
}));

// Mock Astro navigation (for components imported from Astro)
vi.mock('astro:content', () => ({
  navigate: vi.fn()
}));

// Mock fetch with MSW
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  http.post('/api/favorites', () => {
    return HttpResponse.json({ success: true });
  }),
  http.delete('/api/favorites', () => {
    return HttpResponse.json({ success: true });
  })
);
```

---

## Test Execution Strategy

### Phase 1: Foundation (Week 1)
- Set up Vitest configuration
- Install testing libraries
- Create test utilities and mock factories
- Test utility functions (HIGH priority items #2, #6)

### Phase 2: Core Logic (Week 2)
- Test `useFavoriteToggle` hook (HIGH priority #1)
- Test `DashboardContent` component (MEDIUM priority #4)
- Set up MSW for API mocking

### Phase 3: UI Components (Week 3)
- Test `RecipeCard` component (MEDIUM priority #3)
- Test `RecipeSectionRow` component (MEDIUM priority #5)
- Add snapshot tests for visual regression

### Phase 4: Integration (Week 4)
- Test `WelcomeBanner`, `UserMenu`, `MobileNav` (LOW priority)
- Integration tests for component interactions
- E2E tests for critical user flows

---

## Success Metrics

- **HIGH Priority Coverage:** ≥ 90%
- **MEDIUM Priority Coverage:** ≥ 75%
- **LOW Priority Coverage:** ≥ 60%
- **Overall Coverage:** ≥ 80%
- **Test Execution Time:** < 30 seconds for unit tests
- **CI Integration:** All tests pass before merge

---

## Maintenance Guidelines

1. **Update tests when:**
   - DTO schemas change
   - API endpoints change
   - Component props change
   - Business logic changes

2. **Don't test:**
   - Third-party library internals
   - Tailwind class names (brittle)
   - Static Astro layouts (no logic)

3. **Review tests:**
   - Quarterly to remove obsolete tests
   - After major refactors
   - When test execution time increases significantly

---

## Notes

- Focus on **behavior** over **implementation details**
- Prefer **integration tests** for component interactions
- Keep **unit tests fast** (< 100ms each)
- Use **descriptive test names** that explain the scenario
- Mock **external dependencies** (API, timers, localStorage)
- Test **accessibility** where critical (ARIA attributes, keyboard nav)

---

**End of Test Plan**
