<project_analysis>

### 1. Key Components of the Project
Based on the code analysis, the project "Healthy Meal" is a web application structured around the following core components:

*   **Authentication & User Management:**
    *   Handled via Supabase Auth.
    *   Components: `LoginForm`, `RegisterForm`, `ForgotPasswordForm`, `ResetPasswordForm`.
    *   Key Logic: `UserMenu`, `MobileNav`, and server-side session validation (`src/env.d.ts`).
*   **Recipe Management:**
    *   Core entity. Includes CRUD operations.
    *   **Wizard:** Complex state management for creating recipes (`useRecipeFormWizard`) with draft persistence in `localStorage`.
    *   **Display:** `RecipeCard`, `RecipeDetailLayout`, `RecipeSectionRow` (Dashboard).
    *   **Filtering:** robust filtering hooks (`useRecipeFilters`) syncing state with URL parameters.
*   **AI Modification Engine:**
    *   The USP (Unique Selling Proposition). Allows modifying recipes (calories, protein, substitutions) via OpenRouter.
    *   Logic handles switching views between original and modified versions (`useRecipeDetail`).
*   **Collections & Favorites:**
    *   Organizational tools.
    *   **Collections:** CRUD logic (`useDeleteCollection`, `useEditCollectionName`), drag-and-drop implied functionality (grid layouts), and specific dialogs.
    *   **Favorites:** Optimistic UI updates (`useFavoriteToggle`) for immediate feedback.
*   **User Profile:**
    *   Dietary preferences, allergens, and disliked ingredients.
    *   State managed by `useProfileSettings` with parallel data fetching.
*   **Backend/API Layer:**
    *   Next.js/Astro API routes (implied by fetch calls to `/api/recipes`, `/api/collections`).
    *   Database schema includes profiles, recipes, user_allergens, etc.

### 2. Technology Stack & Testing Implications
*   **Astro & React:**
    *   *Implication:* Testing must distinguish between static content (Astro islands) and hydrated interactive components (React). E2E tests are crucial to verify hydration works correctly.
*   **Supabase (PostgreSQL + Auth):**
    *   *Implication:* Tests must cover RLS (Row Level Security) to ensure users cannot edit others' recipes/collections. Auth state persistence needs verification across sessions.
*   **OpenRouter API (AI):**
    *   *Implication:* Non-deterministic testing. "Mocking" is essential for CI/CD to avoid costs and flakiness. "Live" testing on staging is needed to verify prompt handling and timeout management.
*   **Optimistic UI (React Hooks):**
    *   *Implication:* `useFavoriteToggle` and `useRemoveFromCollection` implement rollback logic on error. Tests must simulate network failures to ensure the UI reverts correctly if the API call fails.

### 3. Testing Priorities
1.  **Critical:** Authentication flows (Entry point).
2.  **Critical:** Recipe Creation Wizard (Complex logic, draft saving, validation).
3.  **High:** AI Modification (Core business value, high risk of API failure/latency).
4.  **High:** Profile Settings (Allergens - health safety implication).
5.  **Medium:** Collections/Favorites (User retention features).
6.  **Low:** Dashboard layout (mostly read-only display).

### 4. Risk Areas
*   **AI Reliability & Cost:** If the OpenRouter API hangs or returns malformed JSON, the frontend might crash. Need robust error boundary testing.
*   **Draft Persistence:** The `localStorage` draft logic (`DRAFT_KEYS`) involves expiration (`DRAFT_EXPIRATION_MS`). Risk of data loss or stale drafts appearing.
*   **Optimistic UI Desync:** If the backend rejects a "favorite" toggle but the UI shows it as active, the user is misled.
*   **Localization/Pluralization:** The code contains manual Polish pluralization logic (e.g., "1 przepis", "2 przepisy", "5 przepisów"). This needs specific boundary testing.

</project_analysis>

<test_plan>

# Comprehensive Test Plan: Healthy Meal Project

## 1. Introduction
This document outlines the testing strategy for the **Healthy Meal** application. The project is a diet-oriented recipe management platform featuring AI-powered recipe customization. The primary goal is to ensure data integrity, reliable AI integration, and a seamless user experience across the hybrid Astro/React architecture.

## 2. Scope of Testing

### 2.1 In-Scope
*   **Frontend Functionality:** All React components, forms, wizards, and Astro pages.
*   **Business Logic:** Recipe creation, collection management, profile settings, and favorite toggling.
*   **AI Integration:** Request handling, response parsing, and error management for OpenRouter integration.
*   **API Integration:** Data exchange between frontend and Supabase/Next.js API routes.
*   **Authentication:** User registration, login, password recovery, and session management.
*   **Localization:** Polish language support including dynamic pluralization.

### 2.2 Out-of-Scope
*   **Supabase Internal Infrastructure:** Performance/uptime of the Supabase platform itself.
*   **OpenRouter Model Accuracy:** We test that we *receive* a response, but we do not validate the culinary taste/quality of the AI-generated recipe (subjective).
*   **Load Testing:** Not required for the initial MVP phase unless user base projections exceed 10k concurrent users.

## 3. Types of Tests

### 3.1 Unit Testing (Frontend Logic)
*   **Focus:** Complex React Hooks and Utility functions.
*   **Tools:** Vitest + React Testing Library.
*   **Key Targets:**
    *   `useRecipeFormWizard`: Step validation, state transitions, draft saving logic.
    *   `useFavoriteToggle`: Optimistic update and rollback logic.
    *   `useRecipeFilters`: URL search param parsing and sync.
    *   `pluralization helpers`: Verify correct Polish grammar for counts (0, 1, 2-4, 5+).

### 3.2 Integration Testing
*   **Focus:** Interaction between components and API mocks.
*   **Tools:** Vitest (with MSW - Mock Service Worker).
*   **Key Targets:**
    *   Recipe Detail page loading + switching tabs (Original vs. Modified).
    *   Collection Detail page + Pagination.
    *   Profile Settings form submissions (Parallel fetching logic).

### 3.3 End-to-End (E2E) Testing
*   **Focus:** Critical user journeys on a deployed-like environment.
*   **Tools:** Playwright.
*   **Key Targets:**
    *   Full Register -> Onboarding -> Create Recipe flow.
    *   AI Modification flow (using a controlled mock or strict staging environment).
    *   Draft restoration persistence across page reloads.

## 4. Test Scenarios

### 4.1 Authentication & Profile
| ID | Scenario | Pre-conditions | Expected Result |
|----|----------|----------------|-----------------|
| AUTH-01 | User Registration | Valid email/password (strong) | User created in Supabase, confirmation email sent, redirect to Dashboard. |
| AUTH-02 | Password Strength | Weak password | Validation error displayed dynamically (Red bar). |
| PRO-01 | Allergen Management | Profile loaded | Adding/Removing allergens updates the list via optimistic UI; verify "Save" syncs correctly via API. |
| PRO-02 | Disliked Ingredients | Profile loaded | User can add custom strings; duplicates prevent addition (409 handling). |

### 4.2 Recipe Management (The Wizard)
| ID | Scenario | Pre-conditions | Expected Result |
|----|----------|----------------|-----------------|
| REC-01 | Draft Auto-Save | User on Step 2, types data, closes tab | Upon returning, prompt to "Restore Draft" appears; data is restored from LocalStorage. |
| REC-02 | Draft Expiration | Draft older than 24h in LocalStorage | Draft is ignored/cleared; form starts empty. |
| REC-03 | Step Validation | Skip required fields on Step 2 | "Next" button disabled or error toast appears; user cannot proceed to Step 3. |
| REC-04 | Image Upload | (If applicable) Upload non-image file | Validation rejects file type/size. |

### 4.3 AI & Modifications
| ID | Scenario | Pre-conditions | Expected Result |
|----|----------|----------------|-----------------|
| AI-01 | Modify Calories | Recipe Detail Open | Clicking "Reduce Calories" sends request; UI shows loading; updates "Modified" tab upon success. |
| AI-02 | API Failure | OpenRouter API down | UI handles 500/timeout gracefully; Error Toast displayed; User stays on "Original" tab. |
| AI-03 | Tab Switching | Modification exists | Switching tabs updates Ingredient/Nutrition values instantly (calculated via `useRecipeDetail`). |

### 4.4 Collections & Favorites
| ID | Scenario | Pre-conditions | Expected Result |
|----|----------|----------------|-----------------|
| COL-01 | Create Collection | Dashboard | Modal opens; unique name validated; Collection appears in grid immediately. |
| FAV-01 | Optimistic Toggle | Recipe Card visible | Heart turns red immediately on click. If API fails (simulated), heart reverts to empty and error toast appears. |
| FAV-02 | Pagination | >20 favorites | URL updates (`?page=2`); correct subset of recipes displayed. |

### 4.5 Localization
| ID | Scenario | Pre-conditions | Expected Result |
|----|----------|----------------|-----------------|
| LOC-01 | Pluralization | Collection with 0, 1, 2, 5 recipes | UI displays: "0 przepisów", "1 przepis", "2 przepisy", "5 przepisów". |

## 5. Test Environment

*   **Local (Dev):**
    *   Database: Local Supabase instance.
    *   AI: Mocked responses (Pre-defined JSONs for recipes).
*   **Staging:**
    *   Database: Supabase Staging Project.
    *   AI: Live OpenRouter integration (with strict cost limits).
    *   Replica of Production DigitalOcean environment.
*   **Production:**
    *   Live environment. Testing limited to "Smoke Tests" (Health checks).

## 6. Testing Tools

| Category | Tool | usage |
|----------|------|-------|
| **Unit/Integration** | **Vitest** | Chosen for compatibility with Astro/Vite. |
| **Component Testing** | **React Testing Library** | Testing hooks (`useRecipeDetail`) and components (`RecipeCard`). |
| **E2E Testing** | **Playwright** | Browser testing (Webkit/Chromium/Firefox) and mobile emulation. |
| **API Testing** | **Postman / Thunder Client** | Manual verification of API endpoints and Auth tokens. |
| **Mocks** | **MSW (Mock Service Worker)** | Intercepting network requests during integration tests. |

## 7. Testing Schedule (Aligned with CI/CD)

*   **PR Checks:** Run Unit Tests + TypeScript Check + Linting (GitHub Actions).
*   **Nightly:** Run full E2E Suite against Staging.
*   **Release Candidate:** Manual Exploratory testing of AI features (subjective quality check) + Regression testing.

## 8. Test Acceptance Criteria

*   **Unit Test Coverage:** Minimum 80% coverage on core hooks (`src/components/hooks`).
*   **E2E Pass Rate:** 100% on "Critical" paths (Auth, Recipe Creation).
*   **Performance:**
    *   Dashboard LCP (Largest Contentful Paint) < 2.5s.
    *   Optimistic UI interaction latency < 100ms.
*   **Bugs:** No Critical or High severity bugs open.

## 9. Roles and Responsibilities

*   **QA Engineer:**
    *   Design test cases.
    *   Maintain Playwright E2E suite.
    *   Manual exploratory testing of AI recipes.
*   **Frontend Developer:**
    *   Write Unit tests for Hooks and Components.
    *   Fix bugs reported by QA.
*   **DevOps:**
    *   Maintain CI/CD pipelines (GitHub Actions) for running tests.
    *   Manage Staging environment secrets (OpenRouter Keys).

## 10. Bug Reporting Procedure

Bugs should be reported in the issue tracking system (e.g., Jira/Linear) with the following template:

1.  **Title:** [Component] Concise description of the issue.
2.  **Severity:** Critical / High / Medium / Low.
3.  **Environment:** Dev / Staging / Prod (Browser Version).
4.  **Steps to Reproduce:**
    1.  Go to '...'
    2.  Click on '...'
5.  **Expected Result:** What should happen (reference acceptance criteria).
6.  **Actual Result:** What actually happened.
7.  **Evidence:** Screenshots, Video, or Console Logs.
8.  **Draft State (if applicable):** Content of `localStorage` key `draft_recipe_new`.

</test_plan>