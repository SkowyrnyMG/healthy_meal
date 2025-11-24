# Authentication Mock Rollout Plan

## Document Overview

This document provides a comprehensive plan to replace all hardcoded/mocked user IDs with proper Supabase authentication integration throughout the codebase.

**Current State:** API routes and pages use hardcoded userId: `a85d6d6c-b7d4-4605-9cc4-3743401b67a0`
**Target State:** All routes extract real user ID from `Astro.locals.user` (set by middleware)
**Risk Level:** Medium - impacts all user-specific operations
**Estimated Effort:** 2-3 hours

---

## 1. Problem Statement

### Current Issues

1. **Session Isolation Failure**: All users see the same data because requests use a hardcoded UUID
2. **Security Risk**: No actual user verification - anyone can access any user's data
3. **Development Confusion**: Mix of real auth (login/logout) and mock data (everything else)
4. **Production Blocker**: Cannot deploy with hardcoded user IDs

### Scope

**Total Files to Modify:** 32 files
**API Endpoints:** 24 files
**Astro Pages:** 3 files
**Documentation:** 5 files (optional cleanup)

---

## 2. Pattern Analysis

### Two Patterns Found

#### Pattern A: `userId` Variable (24 occurrences)
```typescript
// Current (WRONG)
const userId = "a85d6d6c-b7d4-4605-9cc4-3743401b67a0";

// Target (CORRECT)
const userId = locals.user?.id;
if (!userId) {
  return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
}
```

#### Pattern B: `user` Object (8 occurrences)
```typescript
// Current (WRONG)
const user = { id: "a85d6d6c-b7d4-4605-9cc4-3743401b67a0" };

// Target (CORRECT)
const user = locals.user;
if (!user) {
  return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
}
```

---

## 3. Implementation Strategy

### Phase 1: API Routes (Priority: HIGH)

All API routes are **already protected by middleware**, which means:
- Middleware redirects unauthenticated requests to `/auth/login`
- `locals.user` is guaranteed to be set for protected routes
- **No additional auth check needed** - just extract the user ID

#### Replacement Pattern for API Routes

**Option A: Extract userId directly**
```typescript
export const GET: APIRoute = async ({ locals }) => {
  // Middleware guarantees locals.user exists for protected routes
  const userId = locals.user!.id;

  // Use userId for database operations
  const recipes = await recipeService.getRecipesByUserId(userId, supabase);
  // ...
};
```

**Option B: Defensive check (recommended for robustness)**
```typescript
export const GET: APIRoute = async ({ locals }) => {
  const userId = locals.user?.id;

  if (!userId) {
    // This should never happen if middleware is working correctly
    // But provides fallback for edge cases
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401 }
    );
  }

  // Use userId for database operations
  const recipes = await recipeService.getRecipesByUserId(userId, supabase);
  // ...
};
```

**Recommendation:** Use Option B for all API routes for defense-in-depth approach.

### Phase 2: Astro Pages (Priority: HIGH)

Astro pages use AppLayout, which already validates authentication. Extract user from `Astro.locals`:

```astro
---
// Current (WRONG)
const userId = "a85d6d6c-b7d4-4605-9cc4-3743401b67a0";

// Target (CORRECT)
const userId = Astro.locals.user?.id;
if (!userId) {
  // This should never happen - AppLayout redirects if not authenticated
  return Astro.redirect("/auth/login");
}
---
```

### Phase 3: Documentation (Priority: LOW)

Update `.ai/` documentation files to remove references to mocked authentication:
- Remove mock examples from implementation plans
- Update `auth_dev_mock.md` to indicate mocking is deprecated
- Add note that real authentication is now implemented

---

## 4. File-by-File Implementation Plan

### 4.1 API Routes - Recipe Management

#### `src/pages/api/recipes.ts` (2 occurrences)
**Lines:** 158, 257
**Pattern:** userId variable
**Methods:** GET, POST

**Changes:**
```typescript
// Line 158 - GET handler
export const GET: APIRoute = async ({ locals, url }) => {
  try {
    const userId = locals.user?.id;
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    // ... rest of GET handler
  }
};

// Line 257 - POST handler
export const POST: APIRoute = async ({ locals, request }) => {
  try {
    const userId = locals.user?.id;
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    // ... rest of POST handler
  }
};
```

#### `src/pages/api/recipes/[recipeId].ts` (3 occurrences)
**Lines:** 160, 266, 452
**Pattern:** user object
**Methods:** GET, PUT, DELETE

**Changes:**
```typescript
// Line 160 - GET handler
export const GET: APIRoute = async ({ locals, params }) => {
  try {
    const user = locals.user;
    if (!user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    // ... rest of GET handler uses user.id
  }
};

// Line 266 - PUT handler
export const PUT: APIRoute = async ({ locals, params, request }) => {
  const user = locals.user;
  if (!user) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }
  // ... rest of PUT handler uses user.id
};

// Line 452 - DELETE handler
export const DELETE: APIRoute = async ({ locals, params }) => {
  const user = locals.user;
  if (!user) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }
  // ... rest of DELETE handler uses user.id
};
```

#### `src/pages/api/recipes/[recipeId]/modifications.ts` (2 occurrences)
**Lines:** 241, 360
**Pattern:** user object
**Methods:** GET, POST

**Changes:**
```typescript
// Apply same pattern as recipes/[recipeId].ts
// Replace const user = { id: "..." } with const user = locals.user
// Add null check with 401 response
```

#### `src/pages/api/recipes/[recipeId]/collections.ts` (1 occurrence)
**Line:** 63
**Pattern:** userId variable
**Method:** GET

**Changes:**
```typescript
export const GET: APIRoute = async ({ locals, params }) => {
  const userId = locals.user?.id;
  if (!userId) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }
  // ... rest of handler
};
```

### 4.2 API Routes - Favorites

#### `src/pages/api/favorites.ts` (3 occurrences)
**Lines:** 78, 186, 350
**Pattern:** userId variable
**Methods:** GET, POST, DELETE

**Changes:**
```typescript
// Each handler follows the same pattern:
export const METHOD: APIRoute = async ({ locals, ... }) => {
  const userId = locals.user?.id;
  if (!userId) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }
  // ... rest of handler
};
```

#### `src/pages/api/favorites/[recipeId].ts` (1 occurrence)
**Line:** 61
**Pattern:** userId variable
**Method:** DELETE

**Changes:**
```typescript
// Same pattern as above
```

### 4.3 API Routes - Collections

#### `src/pages/api/collections/index.ts` (2 occurrences)
**Lines:** 61, 137
**Pattern:** userId variable
**Methods:** GET, POST

#### `src/pages/api/collections/[collectionId].ts` (3 occurrences)
**Lines:** 91, 255, 462
**Pattern:** userId variable
**Methods:** GET, PUT, DELETE

#### `src/pages/api/collections/[collectionId]/recipes.ts` (1 occurrence)
**Line:** 73
**Pattern:** userId variable
**Method:** POST

#### `src/pages/api/collections/[collectionId]/recipes/[recipeId].ts` (1 occurrence)
**Line:** 67
**Pattern:** userId variable
**Method:** DELETE

**Changes for all collection routes:**
```typescript
// All follow the same pattern - extract userId from locals.user
const userId = locals.user?.id;
if (!userId) {
  return new Response(
    JSON.stringify({ error: "Unauthorized" }),
    { status: 401, headers: { "Content-Type": "application/json" } }
  );
}
```

### 4.4 API Routes - Profile

#### `src/pages/api/profile.ts` (2 occurrences)
**Lines:** 90, 181
**Pattern:** userId variable with comment
**Methods:** GET, PUT

**Changes:**
```typescript
// Line 90 - GET handler
export const GET: APIRoute = async ({ locals }) => {
  try {
    const userId = locals.user?.id; // Remove comment: "// Mock user ID for development"
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    // ... rest of GET handler
  }
};

// Line 181 - PUT handler (same pattern)
```

#### `src/pages/api/profile/allergens.ts` (2 occurrences)
**Lines:** 53, 122
**Pattern:** userId variable with comment
**Methods:** GET, POST

#### `src/pages/api/profile/allergens/[id].ts` (1 occurrence)
**Line:** 49
**Pattern:** userId variable
**Method:** DELETE

#### `src/pages/api/profile/disliked-ingredients.ts` (2 occurrences)
**Lines:** 56, 125
**Pattern:** userId variable with comment
**Methods:** GET, POST

#### `src/pages/api/profile/disliked-ingredients/[id].ts` (1 occurrence)
**Line:** 52
**Pattern:** userId variable
**Method:** DELETE

**Changes for all profile routes:**
```typescript
// Same pattern - extract userId, add null check
const userId = locals.user?.id;
if (!userId) {
  return new Response(
    JSON.stringify({ error: "Unauthorized" }),
    { status: 401, headers: { "Content-Type": "application/json" } }
  );
}
```

### 4.5 API Routes - Modifications

#### `src/pages/api/modifications/[modificationId].ts` (2 occurrences)
**Lines:** 85, 171
**Pattern:** user object
**Methods:** GET, DELETE

**Changes:**
```typescript
// Same pattern as recipes/[recipeId].ts
const user = locals.user;
if (!user) {
  return new Response(
    JSON.stringify({ error: "Unauthorized" }),
    { status: 401, headers: { "Content-Type": "application/json" } }
  );
}
```

### 4.6 API Routes - Other

#### `src/pages/api/tags.ts` (1 occurrence)
**Line:** 117
**Pattern:** user object
**Method:** POST (note: line 117 shows unused variable warning)

**Changes:**
```typescript
// Line 117 - Note: Variable is currently unused according to linter
// Check if user validation is actually needed here
// If yes, replace with:
const user = locals.user;
if (!user) {
  return new Response(
    JSON.stringify({ error: "Unauthorized" }),
    { status: 401, headers: { "Content-Type": "application/json" } }
  );
}

// If tags are global and don't require user context, remove the variable entirely
```

#### `src/pages/api/ingredient-substitutions.ts` (1 occurrence - COMMENTED OUT)
**Line:** 67
**Pattern:** Commented out userId variable
**Status:** Already commented - no action needed

**Action:** Leave as-is (already commented out)

### 4.7 Astro Pages

#### `src/pages/dashboard.astro` (1 occurrence)
**Line:** 16
**Current:**
```typescript
const userId = "a85d6d6c-b7d4-4605-9cc4-3743401b67a0";
```

**Changes:**
```astro
---
// ... imports

// Extract user ID from authenticated session
const userId = Astro.locals.user?.id;

if (!userId) {
  // Fallback redirect (should not happen - AppLayout handles this)
  return Astro.redirect("/auth/login");
}

// ... rest of page logic
---
```

**Note:** Line 64 also has unused `profile` variable - consider removing or using it.

#### `src/pages/recipes.astro` (1 occurrence)
**Line:** 14
**Current:**
```typescript
const userId = "a85d6d6c-b7d4-4605-9cc4-3743401b67a0";
```

**Changes:**
```astro
---
// Extract user ID from authenticated session
const userId = Astro.locals.user?.id;

if (!userId) {
  return Astro.redirect("/auth/login");
}
// ... rest of page
---
```

**Note:** Line 14 shows userId is assigned but never used - investigate if it's needed at all.

#### `src/pages/recipes/[id]/edit.astro` (1 occurrence)
**Line:** 22
**Current:**
```typescript
const userId = "a85d6d6c-b7d4-4605-9cc4-3743401b67a0";
```

**Changes:**
```astro
---
// Extract user ID from authenticated session
const userId = Astro.locals.user?.id;

if (!userId) {
  return Astro.redirect("/auth/login");
}
// ... rest of page
---
```

---

## 5. Implementation Order (Recommended)

### Step 1: Core Recipe Operations (30 min)
1. `src/pages/api/recipes.ts`
2. `src/pages/api/recipes/[recipeId].ts`
3. `src/pages/api/recipes/[recipeId]/modifications.ts`
4. `src/pages/api/recipes/[recipeId]/collections.ts`

**Test:** Create, view, update, delete recipes. Verify each user sees only their own recipes.

### Step 2: Favorites (15 min)
1. `src/pages/api/favorites.ts`
2. `src/pages/api/favorites/[recipeId].ts`

**Test:** Add/remove favorites. Verify user A cannot see user B's favorites.

### Step 3: Collections (20 min)
1. `src/pages/api/collections/index.ts`
2. `src/pages/api/collections/[collectionId].ts`
3. `src/pages/api/collections/[collectionId]/recipes.ts`
4. `src/pages/api/collections/[collectionId]/recipes/[recipeId].ts`

**Test:** Create collections, add recipes to collections. Verify isolation.

### Step 4: Profile (20 min)
1. `src/pages/api/profile.ts`
2. `src/pages/api/profile/allergens.ts`
3. `src/pages/api/profile/allergens/[id].ts`
4. `src/pages/api/profile/disliked-ingredients.ts`
5. `src/pages/api/profile/disliked-ingredients/[id].ts`

**Test:** Update profile settings. Verify each user has separate profile.

### Step 5: Modifications (10 min)
1. `src/pages/api/modifications/[modificationId].ts`

**Test:** View and delete modifications.

### Step 6: Astro Pages (15 min)
1. `src/pages/dashboard.astro`
2. `src/pages/recipes.astro`
3. `src/pages/recipes/[id]/edit.astro`

**Test:** Navigate through pages. Verify data is user-specific.

### Step 7: Edge Cases (10 min)
1. `src/pages/api/tags.ts` - Investigate if user check is needed
2. Review linter warnings for unused variables

**Total Estimated Time:** 2 hours

---

## 6. Testing Strategy

### 6.1 Create Test Users

Create at least 2 test users in Supabase:
```
User A: testa@test.com / TestPass123!
User B: testb@test.com / TestPass123!
```

### 6.2 Testing Checklist

For each modified endpoint, verify:

**Isolation Tests:**
- [ ] User A logs in, creates recipe
- [ ] User B logs in, cannot see User A's recipe
- [ ] User A's dashboard shows only their data
- [ ] User B's dashboard shows only their data

**CRUD Operations:**
- [ ] Create: New items belong to logged-in user
- [ ] Read: Only user's own items are returned
- [ ] Update: Can only update own items
- [ ] Delete: Can only delete own items

**Edge Cases:**
- [ ] Logout and try to access API → 401 Unauthorized (middleware redirect)
- [ ] Access another user's recipe by ID → 404 Not Found (not 403, for security)
- [ ] Session expiry → Redirects to login

### 6.3 Automated Test (Optional)

Create a simple test script:
```typescript
// test-auth.ts
async function testUserIsolation() {
  // Login as User A
  const sessionA = await login('testa@test.com', 'TestPass123!');

  // Create recipe as User A
  const recipeA = await createRecipe(sessionA, { title: 'Recipe A' });

  // Login as User B
  const sessionB = await login('testb@test.com', 'TestPass123!');

  // Try to access User A's recipe as User B
  const response = await fetch(`/api/recipes/${recipeA.id}`, {
    headers: { Cookie: sessionB.cookies }
  });

  // Should return 404 (not found) or 403 (forbidden)
  console.assert(response.status === 404 || response.status === 403);

  // User B should not see Recipe A in their list
  const recipesB = await getRecipes(sessionB);
  console.assert(!recipesB.some(r => r.id === recipeA.id));
}
```

---

## 7. Rollback Plan

If issues occur during rollout:

### Immediate Rollback (Emergency)
```bash
# Revert all changes
git reset --hard HEAD~1  # If committed
git checkout .           # If not committed yet

# Restart dev server
npm run dev
```

### Partial Rollback (Specific Endpoint)
```bash
# Revert specific file
git checkout HEAD -- src/pages/api/recipes.ts

# Restart dev server
npm run dev
```

### Database Considerations
- No schema changes are made
- No data migration needed
- Safe to rollback without data loss

---

## 8. Potential Issues & Solutions

### Issue 1: Middleware Not Running
**Symptom:** `locals.user` is undefined even when logged in
**Solution:**
- Verify middleware is registered in `src/middleware/index.ts`
- Check public paths don't accidentally include API routes
- Restart dev server

### Issue 2: TypeScript Errors
**Symptom:** `Property 'user' does not exist on type 'Locals'`
**Solution:**
- Verify `src/env.d.ts` has user property in Locals interface
- Run `npm run build` to regenerate types

### Issue 3: Existing Data Belongs to Mock User
**Symptom:** After rollout, existing recipes don't show up
**Solution:**
- Old data still belongs to mock UUID `a85d6d6c-b7d4-4605-9cc4-3743401b67a0`
- Option A: Manually reassign data in Supabase to real user UUIDs
- Option B: Create a migration script to transfer ownership
- Option C: Start fresh with new test data

### Issue 4: Null Pointer Exceptions
**Symptom:** App crashes with "Cannot read property 'id' of null"
**Solution:**
- Ensure all code uses optional chaining: `locals.user?.id`
- Add null checks before accessing user properties
- Use TypeScript strict mode to catch these at compile time

---

## 9. Post-Rollout Verification

### Critical Checks
- [ ] All API endpoints return user-specific data
- [ ] No cross-user data leakage
- [ ] Logout properly clears session
- [ ] Login redirects to dashboard
- [ ] All pages load without errors
- [ ] No console errors in browser
- [ ] No server errors in terminal

### Performance Checks
- [ ] Dashboard loads in < 2 seconds
- [ ] Recipe list loads in < 1 second
- [ ] No N+1 query issues (check Supabase logs)

### Security Checks
- [ ] Cannot access other user's data via API
- [ ] Cannot access other user's data via URL manipulation
- [ ] Session cookies are httpOnly and secure
- [ ] Auth tokens expire correctly

---

## 10. Documentation Updates (Optional)

After successful rollout, update:

1. **`.ai/claude_rules/auth_dev_mock.md`**
   - Add deprecation notice at top
   - Keep for historical reference

2. **`.ai/auth-spec.md`**
   - Update "Current State" section
   - Mark mock authentication as deprecated

3. **`CLAUDE.md`**
   - Add note that real authentication is implemented
   - Document how to access current user in API routes

4. **`README.md`** (if exists)
   - Update setup instructions
   - Document test user creation process

---

## 11. Summary

### Files to Modify: 27 source files
- API Routes: 24 files
- Astro Pages: 3 files

### Pattern to Apply
```typescript
// Before
const userId = "a85d6d6c-b7d4-4605-9cc4-3743401b67a0";

// After
const userId = locals.user?.id;
if (!userId) {
  return new Response(
    JSON.stringify({ error: "Unauthorized" }),
    { status: 401, headers: { "Content-Type": "application/json" } }
  );
}
```

### Success Criteria
✅ Each user sees only their own data
✅ No hardcoded UUIDs in source code
✅ All tests pass
✅ No console errors
✅ Linter passes (no unused variables)

### Timeline
- **Preparation:** 15 min (create test users, review plan)
- **Implementation:** 2 hours (following step-by-step plan)
- **Testing:** 30 min (manual testing with 2 users)
- **Documentation:** 15 min (optional)
- **Total:** ~3 hours

---

## Next Steps

1. **Review this plan** with the team
2. **Create test users** in Supabase Dashboard
3. **Create a feature branch**: `git checkout -b feat/real-auth-integration`
4. **Follow implementation order** (Section 5)
5. **Test thoroughly** after each step
6. **Commit frequently** to allow granular rollback
7. **Deploy to production** only after all tests pass

---

**Document Version:** 1.0
**Last Updated:** 2025-11-20
**Author:** Claude Code Assistant
**Status:** Ready for Implementation
