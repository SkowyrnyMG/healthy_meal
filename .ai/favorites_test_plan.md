# Favorites Page - Unit Testing Plan

**Generated:** 2025-12-02
**Target:** `src/pages/favorites.astro` and its component tree
**Based on:** `.ai/favorites_component_structure.txt`

---

## Executive Summary

This document outlines a comprehensive testing strategy for the Favorites page, prioritizing components and utilities based on their complexity, business criticality, and potential for bugs. The plan focuses on unit tests that provide maximum value while avoiding over-testing simple presentational components.

---

## Testing Priorities

### Priority Levels Definition

- **🔴 HIGH**: Critical business logic, complex state management, error-prone code
- **🟡 MEDIUM**: User interactions, data transformations, conditional rendering
- **🟢 LOW**: Simple presentational components, static content

---

## 🔴 HIGH PRIORITY TESTS

### 1. Custom Hook: `useFavorites`
**File:** `src/components/hooks/useFavorites.ts`

**Why Test:**
- **Complex State Management**: Manages multiple pieces of state (favorites, pagination, loading, error)
- **Side Effects**: Performs API calls with useEffect
- **URL Synchronization**: Updates browser history
- **Error Handling**: Catches and manages API errors
- **Business Critical**: Core functionality of the entire page

**Test Cases:**

```typescript
describe('useFavorites', () => {
  // Initial state
  ✓ should initialize with empty favorites and loading state
  ✓ should initialize with page from URL query parameter
  ✓ should default to page 1 if no query parameter exists

  // Data fetching
  ✓ should fetch favorites on mount
  ✓ should fetch favorites when page changes
  ✓ should update URL when page changes
  ✓ should handle successful API response
  ✓ should parse pagination data correctly

  // Error handling
  ✓ should set error state when API fails
  ✓ should handle network errors gracefully
  ✓ should handle malformed API responses
  ✓ should not crash on missing pagination data

  // Refetch functionality
  ✓ should refetch data when refetch() is called
  ✓ should reset to page 1 on refetch
  ✓ should clear previous error state on refetch

  // Loading states
  ✓ should set loading to false after successful fetch
  ✓ should set loading to false after error
  ✓ should not trigger multiple fetches simultaneously

  // Cleanup
  ✓ should abort fetch on unmount
  ✓ should handle race conditions (multiple rapid page changes)
})
```

**Estimated Tests:** 20
**Mocking Required:** `fetch` API, `window.location`, `window.history`

---

### 2. Data Transformation: `transformFavoriteToCardData`
**File:** `src/lib/utils/dashboard.ts`

**Why Test:**
- **Data Shape Transformation**: Converts API DTOs to UI-specific format
- **Type Safety**: Ensures correct property mapping
- **Potential for Null/Undefined Issues**: Must handle missing fields gracefully

**Test Cases:**

```typescript
describe('transformFavoriteToCardData', () => {
  // Happy path
  ✓ should transform complete FavoriteDTO to RecipeCardData
  ✓ should map all required fields correctly
  ✓ should preserve recipe ID
  ✓ should preserve image URL
  ✓ should map nutritional information

  // Edge cases
  ✓ should handle missing optional fields (description, image)
  ✓ should handle zero calories
  ✓ should handle undefined prep/cook time
  ✓ should handle empty tags array
  ✓ should handle very long recipe names

  // Data validation
  ✓ should return valid RecipeCardData type
  ✓ should not mutate input object
})
```

**Estimated Tests:** 12
**Mocking Required:** None (pure function)

---

### 3. Utility Functions: Dashboard Helpers
**File:** `src/lib/utils/dashboard.ts`

**Why Test:**
- **Business Logic**: Determines UI behavior (colors, badges)
- **Consistent Behavior**: Must return predictable results for UI consistency
- **Edge Case Handling**: Must handle boundary values

**Test Cases:**

```typescript
describe('getCalorieBadgeColor', () => {
  // Boundary testing
  ✓ should return "green" for low calories (< 300)
  ✓ should return "yellow" for medium calories (300-500)
  ✓ should return "red" for high calories (> 500)
  ✓ should handle exactly 300 calories
  ✓ should handle exactly 500 calories
  ✓ should handle zero calories
  ✓ should handle negative calories (edge case)
  ✓ should handle very high calories (> 2000)
})

describe('getRecipeInitial', () => {
  ✓ should return first letter of recipe name
  ✓ should return uppercase letter
  ✓ should handle empty string
  ✓ should handle single character name
  ✓ should handle special characters
  ✓ should handle numbers at start
  ✓ should handle emoji at start
  ✓ should handle whitespace-only name
})

describe('getRecipePlaceholderColor', () => {
  ✓ should return consistent color for same recipe ID
  ✓ should return different colors for different IDs
  ✓ should return valid Tailwind color class
  ✓ should handle empty ID
  ✓ should handle very long ID
})

describe('getRecipePlaceholderIconColor', () => {
  ✓ should return consistent icon color for same recipe ID
  ✓ should match color intensity with placeholder color
  ✓ should return valid Tailwind color class
})
```

**Estimated Tests:** 28
**Mocking Required:** None (pure functions)

---

### 4. Type Utilities: User Information
**File:** `src/components/app/types.ts`

**Why Test:**
- **Critical for Display**: User sees this information in header
- **Privacy/Security**: Must handle user data correctly
- **Fallback Logic**: Must provide defaults for missing data

**Test Cases:**

```typescript
describe('getUserDisplayName', () => {
  ✓ should return full name when available
  ✓ should return email when name is missing
  ✓ should return email username when both missing
  ✓ should return "User" when all fields missing
  ✓ should trim whitespace from name
  ✓ should handle empty string name
  ✓ should handle name with only spaces
  ✓ should handle very long names (truncation?)
})

describe('getUserInitials', () => {
  ✓ should return two initials for full name
  ✓ should return one initial for single name
  ✓ should return email initial when name missing
  ✓ should return "U" when all missing
  ✓ should handle hyphenated names
  ✓ should handle names with middle initial
  ✓ should handle lowercase names
  ✓ should handle special characters in name
  ✓ should limit to 2 characters maximum
})
```

**Estimated Tests:** 17
**Mocking Required:** None (pure functions)

---

## 🟡 MEDIUM PRIORITY TESTS

### 5. Component: `FavoritesLayout`
**File:** `src/components/favorites/FavoritesLayout.tsx`

**Why Test:**
- **State Orchestration**: Manages toggling state and undo functionality
- **User Interactions**: Handles unfavorite/undo with toast notifications
- **Conditional Rendering**: Shows loading/error/empty/success states
- **Data Transformation**: Uses useMemo for recipe cards

**Test Cases:**

```typescript
describe('FavoritesLayout', () => {
  // Rendering states
  ✓ should render loading skeletons when loading
  ✓ should render empty state when no favorites
  ✓ should render recipe grid when favorites exist
  ✓ should render error state with retry button
  ✓ should display correct favorite count in header

  // Unfavorite interaction
  ✓ should call API when unfavoriting recipe
  ✓ should add recipe to toggling set during API call
  ✓ should remove recipe from toggling set after API call
  ✓ should show toast notification after unfavorite
  ✓ should call refetch after successful unfavorite
  ✓ should handle unfavorite API error

  // Undo functionality
  ✓ should re-add recipe when undo is clicked
  ✓ should call favorites API on undo
  ✓ should show success toast on undo
  ✓ should call refetch after undo
  ✓ should handle undo API error
  ✓ should dismiss toast after undo

  // Pagination
  ✓ should call goToPage when pagination changes
  ✓ should pass current page to pagination component
  ✓ should pass total pages to pagination component

  // Data transformation
  ✓ should transform favorites to recipe cards using useMemo
  ✓ should recalculate cards when favorites change
  ✓ should not recalculate when unrelated state changes

  // Error recovery
  ✓ should call refetch when retry button clicked
  ✓ should clear error state on retry
})
```

**Estimated Tests:** 25
**Mocking Required:** `useFavorites` hook, `fetch` API, `toast` from sonner

---

### 6. Component: `RecipeCard`
**File:** `src/components/RecipeCard.tsx`

**Why Test:**
- **User Interaction**: Handles favorite toggle and card click
- **Conditional Rendering**: Shows different states (loading, favorited)
- **Event Handling**: Prevents propagation on favorite button click

**Test Cases:**

```typescript
describe('RecipeCard', () => {
  // Rendering
  ✓ should render recipe information correctly
  ✓ should render image when available
  ✓ should render placeholder when image missing
  ✓ should display correct calorie badge color
  ✓ should render prep and cook time
  ✓ should render tags as badges

  // Favorite state
  ✓ should show filled heart when favorited
  ✓ should show outline heart when not favorited
  ✓ should disable heart button when toggling

  // Interactions
  ✓ should call onFavoriteToggle when heart clicked
  ✓ should not navigate when heart clicked
  ✓ should navigate to recipe detail when card clicked
  ✓ should not navigate when clicking disabled elements

  // Accessibility
  ✓ should have proper aria-label for favorite button
  ✓ should be keyboard navigable
  ✓ should have proper heading hierarchy
})
```

**Estimated Tests:** 16
**Mocking Required:** Navigation, event handlers

---

### 7. Component: `Pagination`
**File:** `src/components/recipes/Pagination.tsx`

**Why Test:**
- **Navigation Logic**: Calculates visible page numbers
- **User Interaction**: Handles page changes
- **Disabled States**: Correctly disables prev/next buttons

**Test Cases:**

```typescript
describe('Pagination', () => {
  // Rendering
  ✓ should render current page
  ✓ should render total pages
  ✓ should render prev/next buttons
  ✓ should show ellipsis for many pages

  // Button states
  ✓ should disable prev on first page
  ✓ should disable next on last page
  ✓ should enable both buttons on middle page

  // Interactions
  ✓ should call onPageChange with correct page on click
  ✓ should call onPageChange when prev clicked
  ✓ should call onPageChange when next clicked

  // Keyboard navigation
  ✓ should handle arrow key navigation
  ✓ should focus current page indicator

  // Edge cases
  ✓ should handle single page (hide pagination)
  ✓ should handle zero pages
  ✓ should handle very large page numbers
})
```

**Estimated Tests:** 15
**Mocking Required:** Event handlers

---

### 8. Component: `UserMenu`
**File:** `src/components/app/UserMenu.tsx`

**Why Test:**
- **User Data Display**: Shows user information correctly
- **Dropdown Interaction**: Opens/closes menu
- **Logout Flow**: Handles logout action

**Test Cases:**

```typescript
describe('UserMenu', () => {
  // Rendering
  ✓ should display user name
  ✓ should display user email
  ✓ should display user avatar
  ✓ should show user initials in avatar

  // Dropdown behavior
  ✓ should open menu on trigger click
  ✓ should close menu on item click
  ✓ should close menu on outside click

  // Logout
  ✓ should navigate to logout endpoint
  ✓ should use POST method for logout

  // Accessibility
  ✓ should have proper aria-labels
  ✓ should be keyboard navigable
})
```

**Estimated Tests:** 11
**Mocking Required:** Navigation, form submission

---

### 9. Component: `MobileNav`
**File:** `src/components/app/MobileNav.tsx`

**Why Test:**
- **State Management**: Opens/closes sheet
- **Navigation Links**: Renders active state correctly
- **User Display**: Shows user information

**Test Cases:**

```typescript
describe('MobileNav', () => {
  // Sheet behavior
  ✓ should open sheet on trigger click
  ✓ should close sheet on link click
  ✓ should close sheet on backdrop click

  // Navigation
  ✓ should render all nav links
  ✓ should highlight active link
  ✓ should navigate on link click

  // User info
  ✓ should display user name
  ✓ should display user avatar

  // Logout
  ✓ should show logout button
  ✓ should handle logout action
})
```

**Estimated Tests:** 10
**Mocking Required:** Navigation, event handlers

---

## 🟢 LOW PRIORITY TESTS

### 10. Component: `PageHeader`
**File:** `src/components/favorites/PageHeader.tsx`

**Why Skip/Low Priority:**
- **Simple Presentational**: Just displays title and count
- **No Logic**: No conditional rendering or interactions
- **Visual Regression Better**: Better tested with visual/e2e tests

**Potential Tests (if needed):**
```typescript
describe('PageHeader', () => {
  ✓ should render title
  ✓ should render count badge
  ✓ should format count correctly
})
```

**Estimated Tests:** 3

---

### 11. Component: `EmptyFavoritesState`
**File:** `src/components/favorites/EmptyFavoritesState.tsx`

**Why Skip/Low Priority:**
- **Static Content**: No dynamic behavior
- **Simple Navigation**: Single button with href

**Potential Tests (if needed):**
```typescript
describe('EmptyFavoritesState', () => {
  ✓ should render message
  ✓ should render browse button
  ✓ should link to public recipes
})
```

**Estimated Tests:** 3

---

### 12. Component: `LoadingSkeletons`
**File:** `src/components/recipes/LoadingSkeletons.tsx`

**Why Skip/Low Priority:**
- **Pure Presentation**: No logic, just skeleton UI
- **Visual Component**: Better tested visually

**Potential Tests (if needed):**
```typescript
describe('LoadingSkeletons', () => {
  ✓ should render correct number of skeletons
  ✓ should match card layout
})
```

**Estimated Tests:** 2

---

## Testing Strategy & Implementation

### Testing Stack Recommendation

```json
{
  "framework": "Vitest",
  "react-testing": "@testing-library/react",
  "hooks-testing": "@testing-library/react-hooks",
  "assertions": "Vitest matchers + @testing-library/jest-dom",
  "mocking": "Vitest mocks + MSW for API"
}
```

### Test File Structure

```
src/
├── components/
│   ├── hooks/
│   │   ├── useFavorites.ts
│   │   └── useFavorites.test.ts           🔴 HIGH
│   ├── favorites/
│   │   ├── FavoritesLayout.tsx
│   │   ├── FavoritesLayout.test.tsx       🟡 MEDIUM
│   │   ├── PageHeader.test.tsx            🟢 LOW
│   │   └── EmptyFavoritesState.test.tsx   🟢 LOW
│   ├── recipes/
│   │   ├── Pagination.tsx
│   │   ├── Pagination.test.tsx            🟡 MEDIUM
│   │   └── LoadingSkeletons.test.tsx      🟢 LOW
│   ├── app/
│   │   ├── types.ts
│   │   ├── types.test.ts                  🔴 HIGH
│   │   ├── UserMenu.tsx
│   │   ├── UserMenu.test.tsx              🟡 MEDIUM
│   │   ├── MobileNav.tsx
│   │   └── MobileNav.test.tsx             🟡 MEDIUM
│   └── RecipeCard.tsx
│       └── RecipeCard.test.tsx            🟡 MEDIUM
└── lib/
    └── utils/
        ├── dashboard.ts
        └── dashboard.test.ts              🔴 HIGH
```

### Implementation Order

**Phase 1: Foundation (High Priority)**
1. Utility functions (`dashboard.test.ts`, `types.test.ts`) - Pure functions, easiest to test
2. Custom hook (`useFavorites.test.ts`) - Critical business logic

**Phase 2: Core Components (Medium Priority)**
3. `RecipeCard.test.tsx` - Reusable component
4. `Pagination.test.tsx` - Reusable component
5. `FavoritesLayout.test.tsx` - Main orchestrator

**Phase 3: Navigation (Medium Priority)**
6. `UserMenu.test.tsx` - User interactions
7. `MobileNav.test.tsx` - Mobile-specific behavior

**Phase 4: Presentational (Low Priority - Optional)**
8. `PageHeader.test.tsx`
9. `EmptyFavoritesState.test.tsx`
10. `LoadingSkeletons.test.tsx`

---

## Coverage Goals

### Recommended Targets

- **Overall Coverage:** 80%+
- **High Priority Files:** 90%+ (utilities, hooks)
- **Medium Priority Files:** 75%+ (components)
- **Low Priority Files:** 50%+ (presentational)

### What NOT to Test

❌ **Shadcn/ui Components** - Already tested by library
❌ **Third-party Hooks** - Tested by library (React, Radix)
❌ **CSS/Styling** - Use visual regression tests
❌ **Astro Layouts** - Better suited for e2e tests
❌ **API Routes** - Require integration tests (separate plan)

---

## Mocking Strategy

### API Calls
```typescript
// Use MSW (Mock Service Worker) for consistent API mocking
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.get('/api/favorites', (req, res, ctx) => {
    return res(ctx.json({ favorites: [], pagination: {} }));
  })
);
```

### Navigation
```typescript
// Mock Astro navigation for tests
const mockNavigate = vi.fn();
vi.mock('astro:navigation', () => ({
  navigate: mockNavigate
}));
```

### External Libraries
```typescript
// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));
```

---

## Success Metrics

### Quantitative
- [ ] 80%+ code coverage
- [ ] All high priority tests implemented (97 tests)
- [ ] All medium priority tests implemented (77 tests)
- [ ] 0 flaky tests (100% pass rate)

### Qualitative
- [ ] Tests catch regressions before production
- [ ] New developers understand code through tests
- [ ] Tests run in < 30 seconds
- [ ] Test failures provide clear error messages

---

## Estimated Effort

| Priority | Files | Tests | Effort (hours) |
|----------|-------|-------|----------------|
| 🔴 HIGH  | 4     | 97    | 12-16          |
| 🟡 MEDIUM| 6     | 77    | 16-20          |
| 🟢 LOW   | 3     | 8     | 2-3            |
| **TOTAL**| **13**| **182**| **30-39**     |

---

## Maintenance Plan

### Test Review Cadence
- Review test coverage monthly
- Update tests when components change
- Remove obsolete tests immediately

### Preventing Test Rot
- Run tests on every commit (CI/CD)
- Enforce coverage thresholds
- Code review must include test review

---

## Appendix: Testing Utilities

### Useful Test Helpers

```typescript
// test-utils.tsx - Custom render with providers
export function renderWithProviders(ui: ReactElement) {
  return render(ui, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  });
}

// Mock user data
export const mockUser: UserInfo = {
  id: 'user-123',
  email: 'test@example.com',
  fullName: 'Test User'
};

// Mock favorite
export const mockFavorite: FavoriteDTO = {
  id: 'fav-123',
  recipeId: 'recipe-123',
  recipe: {
    id: 'recipe-123',
    name: 'Test Recipe',
    calories: 350,
    prepTime: 15,
    cookTime: 30,
    tags: ['healthy', 'quick']
  }
};
```

---

## References

- [Testing Library Best Practices](https://testing-library.com/docs/guiding-principles)
- [Vitest Documentation](https://vitest.dev/)
- [MSW for API Mocking](https://mswjs.io/)
- [Component Testing Guidelines](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

**Document Status:** Draft
**Last Updated:** 2025-12-02
**Next Review:** After Phase 1 implementation
