# Unit Testing Recommendations for HealthyMeal Project

**Generated:** 2025-12-02
**Focus:** Landing page components and core application logic

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [HIGH PRIORITY - Critical for Unit Tests](#high-priority---critical-for-unit-tests)
3. [MEDIUM PRIORITY - Worth Testing](#medium-priority---worth-testing)
4. [LOW PRIORITY - Not Worth Unit Testing](#low-priority---not-worth-unit-testing)
5. [Recommended Testing Stack](#recommended-testing-stack)
6. [Test Coverage Goals](#test-coverage-goals)

---

## Executive Summary

Based on the codebase analysis, **40-50% of the code is highly suitable for unit testing**, primarily:
- Service layer functions with complex business logic
- Pure utility functions used throughout the app
- Custom React hooks with state management
- Validation and transformation logic

The remaining code is either presentational (Astro components), third-party (shadcn/ui), or better suited for integration/E2E tests.

---

## HIGH PRIORITY - Critical for Unit Tests

### 1. Service Layer - OpenRouter Service ⭐⭐⭐⭐⭐

**File:** `src/lib/services/openrouter.service.ts` (765 lines)

**Why test:**
- **Complex business logic:** Request building, error handling, response parsing
- **Multiple validation layers:** Config, parameters, schema validation
- **Custom error handling:** OpenRouterError with error codes
- **Critical to application:** All AI functionality depends on this
- **Pure functions:** Most functions are easily testable
- **Well-documented:** Clear JSDoc comments define expected behavior

**What to test:**

```typescript
// 1. Validation Functions
✓ validateParameters() - Parameter range checking
  - Temperature: 0-2
  - max_tokens: >= 1
  - top_p: 0-1
  - frequency_penalty: -2 to 2
  - presence_penalty: -2 to 2

✓ validateConfig() - Required field validation
  - Missing model throws error
  - Missing userMessage throws error
  - Invalid responseSchema throws error

✓ validateResponseSchema() - JSON schema structure
  - Must have name
  - Must have strict boolean
  - Schema must be type "object"

// 2. Helper Functions
✓ buildRequestBody() - Request construction
  - Merges default parameters
  - Includes system message when provided
  - Adds response_format for structured outputs
  - Constructs messages array correctly

✓ parseResponse() - Response extraction
  - Returns string for unstructured responses
  - Parses JSON for structured responses
  - Throws EMPTY_RESPONSE when no content
  - Throws JSON_PARSE_ERROR on invalid JSON

✓ mapStatusCodeToErrorCode() - Status mapping
  - 400 → BAD_REQUEST
  - 401 → UNAUTHORIZED
  - 402 → INSUFFICIENT_CREDITS
  - 403 → MODERATION_FLAGGED
  - 429 → RATE_LIMIT_EXCEEDED
  - Unknown → UNKNOWN_ERROR

// 3. Error Class
✓ OpenRouterError - Custom error
  - Sets correct properties (code, statusCode, metadata)
  - Maintains stack trace
```

**Benefits:**
- **Confidence in AI integration:** Ensure API calls are constructed correctly
- **Error handling verification:** Validate all error cases are handled
- **Regression prevention:** Catch breaking changes to API integration
- **Documentation:** Tests serve as usage examples

**Test approach:**
- Unit tests for pure functions (validation, parsing, mapping)
- Mock `fetch` for integration tests of `createChatCompletion`
- Test error scenarios with mocked error responses

---

### 2. Service Layer - Collection Service ⭐⭐⭐⭐⭐

**File:** `src/lib/services/collection.service.ts` (765 lines)

**Why test:**
- **Complex business logic:** Multiple validation steps, anti-enumeration patterns
- **Custom error classes:** 6 different error types with specific semantics
- **Data transformation:** Multiple mapper functions
- **Security-critical:** Ownership verification, access control
- **Pure functions:** Mappers are easily testable

**What to test:**

```typescript
// 1. CRUD Operations (with mocked Supabase)
✓ createCollection()
  - Trims collection name
  - Throws CollectionAlreadyExistsError on duplicate
  - Returns CollectionDTO with recipeCount: 0
  - Handles database errors

✓ getUserCollections()
  - Returns collections sorted by created_at DESC
  - Correctly aggregates recipe counts
  - Returns empty array when no collections

✓ updateCollection()
  - Throws CollectionNotFoundError when not found
  - Throws CollectionForbiddenError when not owner
  - Throws CollectionAlreadyExistsError on duplicate name
  - Updates name successfully

✓ deleteCollection()
  - Verifies ownership before deletion
  - Throws CollectionNotFoundError when not found
  - Returns void on success

✓ addRecipeToCollection()
  - Verifies collection ownership (anti-enumeration)
  - Verifies recipe exists
  - Throws RecipeAlreadyInCollectionError on duplicate
  - Returns created relationship

✓ removeRecipeFromCollection()
  - Verifies collection ownership
  - Throws RecipeNotInCollectionError when recipe not in collection
  - Returns void on success

// 2. Helper/Mapper Functions (Pure functions - easy to test)
✓ mapToCollectionDTO()
  - Converts snake_case to camelCase
  - Extracts recipe count from aggregation
  - Handles missing recipe count (defaults to 0)

✓ mapToCollectionDetailDTO()
  - Structures nested recipe data
  - Filters out null recipes
  - Includes pagination metadata
```

**Benefits:**
- **Data integrity:** Ensure collections are managed correctly
- **Security validation:** Verify ownership checks work
- **Error handling:** Test all error paths
- **Anti-enumeration:** Confirm security patterns are maintained

**Test approach:**
- Mock Supabase client with jest.fn()
- Test both success and error paths
- Verify exact error types are thrown
- Test mapper functions in isolation (pure functions)

---

### 3. Utility Functions - Dashboard Helpers ⭐⭐⭐⭐⭐

**File:** `src/lib/utils/dashboard.ts` (198 lines)

**Why test:**
- **Pure functions:** No side effects, deterministic output
- **Easy to test:** Simple inputs/outputs
- **Used throughout app:** Changes could break multiple components
- **Algorithm correctness:** shuffleArray uses Fisher-Yates
- **UI consistency:** Color/badge logic affects user experience

**What to test:**

```typescript
// 1. Array Utilities
✓ shuffleArray()
  - Returns new array (doesn't mutate original)
  - Returns same length array
  - Contains all original elements
  - Produces different order (statistical test over multiple runs)

// 2. Data Transformation
✓ transformRecipeToCardData()
  - Correctly maps all fields
  - Extracts first tag as primaryTag
  - Sets primaryTag to null when tags array is empty

✓ transformFavoriteToCardData()
  - Extracts recipe from nested structure
  - Sets primaryTag to null (favorites don't have tags)

// 3. UI Helpers
✓ getCalorieBadgeColor()
  - Returns "default" for calories < 300
  - Returns "secondary" for 300 ≤ calories ≤ 600
  - Returns "destructive" for calories > 600
  - Boundary testing: 299, 300, 600, 601

✓ getRecipeInitial()
  - Returns uppercased first character
  - Handles empty string (returns "?")
  - Handles Unicode characters (Polish: Ł, Ż, etc.)

✓ getRecipePlaceholderColor()
  - Returns consistent color for same title
  - Returns valid Tailwind class
  - Distributes colors across palette

✓ getRecipePlaceholderIconColor()
  - Maps background color to corresponding text color
  - Returns default color for unknown backgrounds
```

**Benefits:**
- **Fast execution:** Pure functions test in milliseconds
- **High ROI:** Small amount of code, large impact
- **Confidence in UI:** Ensure consistent styling logic
- **Algorithm verification:** Confirm Fisher-Yates implementation

**Test approach:**
- Simple input/output testing
- Boundary value testing for conditional logic
- Statistical testing for shuffleArray (run 100x, verify randomness)

---

### 4. Custom React Hooks ⭐⭐⭐⭐

**File:** `src/components/hooks/useDebounce.ts` (82 lines)

**Why test:**
- **Reusable logic:** Used across multiple components
- **Timing-dependent:** Debounce delay must work correctly
- **Memory management:** Must cleanup timeouts on unmount
- **State management:** Uses useRef and useCallback

**What to test:**

```typescript
✓ useDebounce()
  - Delays callback execution by specified delay
  - Cancels previous timeout when called again
  - Executes callback with correct arguments
  - Cleans up timeout on unmount (no memory leaks)
  - Updates callback reference without resetting timer
  - Works with different delay values
```

**Benefits:**
- **Prevent bugs:** Timing issues are hard to debug in production
- **Performance validation:** Ensure debouncing actually works
- **Memory leak prevention:** Verify cleanup happens

**Test approach:**
- Use `@testing-library/react-hooks` or React Testing Library
- Use `jest.useFakeTimers()` to control time
- Test with `act()` to handle React updates

---

### 5. Utility Functions - Class Name Merging ⭐⭐⭐

**File:** `src/lib/utils.ts` (7 lines)

**Why test:**
- **Used everywhere:** Every component uses this
- **Simple but critical:** Class name conflicts could break styling
- **Easy to test:** Pure function

**What to test:**

```typescript
✓ cn()
  - Merges multiple class names
  - Handles conditional classes (via clsx)
  - Resolves Tailwind conflicts (via twMerge)
  - Example: cn("px-4 px-2") → "px-2" (later value wins)
```

**Benefits:**
- **Prevent styling bugs:** Ensure class merging works correctly
- **Fast to write:** 5-10 test cases cover all scenarios

**Test approach:**
- Test various input combinations
- Test Tailwind conflict resolution
- Test conditional class handling

---

## MEDIUM PRIORITY - Worth Testing

### 6. React Components with Business Logic ⭐⭐⭐

**File:** `src/components/landing/MobileMenu.tsx` (97 lines)

**Why test:**
- **State management:** useState for isOpen
- **Event handlers:** handleNavClick, handleAuthClick
- **Conditional rendering:** Different buttons based on isAuthenticated
- **DOM interactions:** querySelector, scrollIntoView, window.location

**What to test:**

```typescript
✓ MobileMenu component
  - Renders menu trigger button
  - Opens sheet when trigger clicked
  - Closes sheet when nav link clicked
  - Scrolls to section when nav link clicked (mock scrollIntoView)
  - Shows "Dashboard" button when authenticated
  - Shows "Login" and "Register" buttons when not authenticated
  - Navigates to correct URL when auth button clicked
```

**Why medium priority:**
- **Presentational focus:** Mostly renders UI
- **Better suited for integration tests:** User interactions
- **DOM dependencies:** Requires more mocking

**Test approach:**
- Use React Testing Library
- Mock window.location and scrollIntoView
- Test user interactions with fireEvent or userEvent
- Verify conditional rendering based on props

---

### 7. Service Helper Functions ⭐⭐⭐

**Files:** Various service files

**What to test:**

```typescript
// Collection Service Mappers
✓ mapToCollectionDTO()
✓ mapToCollectionDetailDTO()

// OpenRouter Service Helpers
✓ getDefaultParameters()
✓ buildRequestBody()
✓ parseResponse()
```

**Why medium priority:**
- **Already covered by service tests:** Tested indirectly
- **Pure functions:** Easy to test separately
- **Lower complexity:** Simple transformations

**Benefits:**
- **Isolation:** Test mappers separately from database logic
- **Regression prevention:** Catch DTO structure changes

---

## LOW PRIORITY - Not Worth Unit Testing

### 8. Astro Components ❌

**Files:**
- `src/pages/index.astro`
- `src/layouts/Layout.astro`
- `src/components/landing/*.astro`

**Why NOT test:**
- **Server-rendered:** Run at build time, not runtime
- **Mostly presentational:** Static HTML with props
- **Better suited for integration tests:** Test full page render
- **Difficult to unit test:** Astro's compilation makes isolation hard
- **Low ROI:** High effort for limited benefit

**Alternative approach:**
- **Integration tests:** Test with Playwright/Cypress
- **Visual regression tests:** Capture screenshots
- **Manual testing:** Review in browser

---

### 9. Shadcn/ui Components ❌

**Files:**
- `src/components/ui/button.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/sheet.tsx`
- `src/components/ui/separator.tsx`

**Why NOT test:**
- **Third-party library:** Already tested by shadcn/ui
- **Wrapper components:** Thin wrappers around Radix UI
- **Only test if heavily customized:** These are stock implementations

**Exception:**
- If you add custom business logic to these components, then test the custom logic

---

### 10. Type Definitions ❌

**Files:**
- `src/types.ts`
- `src/components/landing/types.ts`
- `src/components/app/types.ts`

**Why NOT test:**
- **TypeScript handles type safety:** Compile-time checking
- **No runtime behavior:** Types are erased at runtime
- **Can't unit test types:** They don't execute

**Alternative approach:**
- Use `tsc --noEmit` to verify type correctness
- Rely on TypeScript's type checker

---

### 11. Static Data/Constants ❌

**Examples:**
```typescript
// In landing components
const navLinks: NavLink[] = [
  { href: "#features", label: "Funkcje" },
  { href: "#how-it-works", label: "Jak to działa" },
];

const features: Feature[] = [...];
const steps: Step[] = [...];
```

**Why NOT test:**
- **No logic to test:** Just data structures
- **Type-safe:** TypeScript ensures correct shape
- **No failure scenarios:** Can't "break" static data

---

## Recommended Testing Stack

### Core Testing Libraries

```json
{
  "devDependencies": {
    // Test runner and framework
    "vitest": "^1.0.0",              // Fast, Vite-native test runner

    // React testing
    "@testing-library/react": "^14.0.0",
    "@testing-library/user-event": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",

    // Mocking
    "msw": "^2.0.0",                 // Mock Service Worker for API mocking

    // Coverage
    "@vitest/coverage-v8": "^1.0.0"
  }
}
```

### Why Vitest over Jest?

1. **Vite integration:** Already using Vite for Astro
2. **Faster:** Uses native ES modules
3. **Same API as Jest:** Easy migration
4. **Built-in coverage:** No additional setup

---

## Test Coverage Goals

### Target Coverage (by category)

| Category | Target | Rationale |
|----------|--------|-----------|
| Services (`lib/services/*`) | 90%+ | Critical business logic |
| Utilities (`lib/utils/*`) | 95%+ | Pure functions, easy to test |
| Custom Hooks | 85%+ | Reusable logic |
| React Components | 60-70% | Focus on logic, not presentation |
| Astro Components | 0% | Use integration tests instead |
| Types | 0% | TypeScript handles this |

### Overall Project Target: 60-70%

**Why not 100%?**
- Diminishing returns on presentational code
- Astro components better tested via E2E
- Third-party components already tested

---

## Recommended Testing Priority Order

### Phase 1: Foundation (Week 1-2)
1. ✅ Set up Vitest + React Testing Library
2. ✅ Test `src/lib/utils.ts` (cn function)
3. ✅ Test `src/lib/utils/dashboard.ts` (all utility functions)

**Why first:** Quick wins, builds confidence, establishes patterns

### Phase 2: Critical Services (Week 3-4)
4. ✅ Test `src/lib/services/openrouter.service.ts`
   - Start with validation functions
   - Then helper functions
   - Finally integration tests with mocked fetch

**Why second:** Most critical to app functionality

### Phase 3: Data Layer (Week 5-6)
5. ✅ Test `src/lib/services/collection.service.ts`
6. ✅ Test other service files (allergen, favorite, etc.)

**Why third:** Business logic, security-critical

### Phase 4: React Layer (Week 7-8)
7. ✅ Test `src/components/hooks/useDebounce.ts`
8. ✅ Test other custom hooks
9. ✅ Test React components with business logic (MobileMenu, etc.)

**Why last:** Depends on services, more complex to set up

---

## Example Test Structure

### Example 1: Pure Function (Utils)

```typescript
// src/lib/utils/dashboard.test.ts
import { describe, it, expect } from 'vitest';
import { shuffleArray, getCalorieBadgeColor, getRecipeInitial } from './dashboard';

describe('shuffleArray', () => {
  it('should return array with same length', () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffleArray(input);
    expect(result).toHaveLength(5);
  });

  it('should not mutate original array', () => {
    const input = [1, 2, 3, 4, 5];
    const original = [...input];
    shuffleArray(input);
    expect(input).toEqual(original);
  });

  it('should contain all original elements', () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffleArray(input);
    expect(result.sort()).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('getCalorieBadgeColor', () => {
  it('should return "default" for low calories', () => {
    expect(getCalorieBadgeColor(200)).toBe('default');
  });

  it('should return "secondary" for medium calories', () => {
    expect(getCalorieBadgeColor(400)).toBe('secondary');
  });

  it('should return "destructive" for high calories', () => {
    expect(getCalorieBadgeColor(700)).toBe('destructive');
  });

  it('should handle boundary values correctly', () => {
    expect(getCalorieBadgeColor(299)).toBe('default');
    expect(getCalorieBadgeColor(300)).toBe('secondary');
    expect(getCalorieBadgeColor(600)).toBe('secondary');
    expect(getCalorieBadgeColor(601)).toBe('destructive');
  });
});

describe('getRecipeInitial', () => {
  it('should return uppercased first character', () => {
    expect(getRecipeInitial('Sałatka grecka')).toBe('S');
  });

  it('should handle empty string', () => {
    expect(getRecipeInitial('')).toBe('?');
  });

  it('should handle Polish characters', () => {
    expect(getRecipeInitial('Łosoś')).toBe('Ł');
  });
});
```

### Example 2: Service with Mocked Dependencies

```typescript
// src/lib/services/openrouter.service.test.ts
import { describe, it, expect, vi } from 'vitest';
import { validateParameters, OpenRouterError } from './openrouter.service';

describe('validateParameters', () => {
  it('should not throw for valid parameters', () => {
    expect(() => {
      validateParameters({ temperature: 1.0, max_tokens: 100 });
    }).not.toThrow();
  });

  it('should throw for temperature out of range', () => {
    expect(() => {
      validateParameters({ temperature: 3.0 });
    }).toThrow(OpenRouterError);
  });

  it('should throw for negative max_tokens', () => {
    expect(() => {
      validateParameters({ max_tokens: 0 });
    }).toThrow(OpenRouterError);
  });

  it('should throw for top_p out of range', () => {
    expect(() => {
      validateParameters({ top_p: 1.5 });
    }).toThrow(OpenRouterError);
  });
});
```

### Example 3: React Hook

```typescript
// src/components/hooks/useDebounce.test.ts
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useDebounce } from './useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should debounce callback execution', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebounce(callback, 500));

    act(() => {
      result.current('test');
    });

    expect(callback).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(callback).toHaveBeenCalledWith('test');
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should cancel previous timeout when called again', () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebounce(callback, 500));

    act(() => {
      result.current('first');
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    act(() => {
      result.current('second');
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(callback).toHaveBeenCalledWith('second');
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
```

---

## Benefits Summary

### By Testing Priority Tier

**HIGH PRIORITY (Services + Utils + Hooks):**
- ✅ **Catches bugs early:** Before they reach production
- ✅ **Fast feedback loop:** Tests run in <1 second
- ✅ **Regression prevention:** Changes don't break existing functionality
- ✅ **Documentation:** Tests show how to use functions
- ✅ **Refactoring confidence:** Safe to optimize code
- ✅ **High ROI:** Easy to write, huge value

**MEDIUM PRIORITY (React Components):**
- ✅ **User interaction validation:** Ensure UI works as expected
- ⚠️ **More setup required:** Mocking, DOM dependencies
- ⚠️ **Slower execution:** Component tests take longer
- ⚠️ **Medium ROI:** More effort, less isolated

**LOW PRIORITY (Astro, UI libs, Types):**
- ❌ **Not worth the effort:** Better alternatives exist
- ❌ **Low ROI:** High effort, limited benefit
- ✅ **Use integration tests instead:** Playwright, Cypress

---

## Conclusion

**Start with HIGH PRIORITY items** (services, utils, hooks) for maximum impact with minimum effort. These tests will:

1. Run fast (milliseconds)
2. Catch critical bugs
3. Serve as documentation
4. Enable confident refactoring
5. Provide immediate value

**Skip LOW PRIORITY items** (Astro components, UI libs) and use integration/E2E tests instead.

**Aim for 60-70% overall coverage** focusing on business logic, not lines of code.

---

## Next Steps

1. **Set up test infrastructure:**
   ```bash
   npm install -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom @vitest/coverage-v8
   ```

2. **Create vitest.config.ts:**
   ```typescript
   import { defineConfig } from 'vitest/config';
   import react from '@vitejs/plugin-react';

   export default defineConfig({
     plugins: [react()],
     test: {
       environment: 'jsdom',
       setupFiles: './src/test/setup.ts',
       coverage: {
         provider: 'v8',
         reporter: ['text', 'html', 'lcov'],
         exclude: ['**/*.astro', '**/ui/**', '**/*.d.ts'],
       },
     },
   });
   ```

3. **Start with utilities:** `src/lib/utils/dashboard.test.ts`

4. **Move to services:** `src/lib/services/openrouter.service.test.ts`

5. **Add CI integration:** Run tests on every commit

6. **Track coverage:** Aim for steady improvement to 60-70%
