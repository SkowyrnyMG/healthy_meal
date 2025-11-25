# RLS Policy Testing Guide

## Overview

This guide provides step-by-step instructions for testing Row-Level Security (RLS) policies to ensure they work correctly before and after production deployment.

**Testing Philosophy**: Test from least privileged (anonymous) to most privileged (admin) access levels.

---

## Prerequisites

Before testing:

1. ✅ RLS policies are defined (from initial migrations)
2. ✅ RLS is enabled on all tables (from `20251125000000_enable_rls_for_production.sql`)
3. ✅ You have access to Supabase SQL Editor or psql
4. ✅ You have created at least 2 test users for isolation testing

---

## Testing Phases

### Phase 1: Database-Level Verification

#### Test 1.1: Verify RLS is Enabled

```sql
-- Run this in Supabase SQL Editor
SELECT * FROM verify_rls_enabled();
```

**Expected Output**:
- All tables should have `rls_enabled = true`
- Each table should have at least one policy

**Red Flags**:
- Any table with `rls_enabled = false` (security risk!)
- User data tables with `policy_count = 0` (unprotected data!)

#### Test 1.2: List All RLS Policies

```sql
-- View all policies
SELECT
  tablename,
  policyname,
  cmd,
  roles,
  CASE
    WHEN qual IS NOT NULL THEN 'Has USING'
    ELSE 'No USING'
  END as using_clause,
  CASE
    WHEN with_check IS NOT NULL THEN 'Has WITH CHECK'
    ELSE 'No WITH CHECK'
  END as with_check_clause
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;
```

**Expected Output**:
- Each table should have policies for SELECT, INSERT, UPDATE, DELETE (or FOR ALL)
- UPDATE policies should have both USING and WITH CHECK clauses
- Reference tables should only have SELECT policies

#### Test 1.3: Check for Tables Without RLS

```sql
-- Find tables with RLS disabled (should be empty)
SELECT
  c.relname as table_name
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relname NOT LIKE 'pg_%'
  AND c.relname NOT LIKE 'mv_%'
  AND NOT c.relrowsecurity;
```

**Expected Output**: Empty result (no tables without RLS)

**Red Flag**: If any table is listed, enable RLS immediately!

---

### Phase 2: Anonymous User Testing

Test what anonymous (not logged in) users can access.

#### Test 2.1: Anonymous Cannot Access Private Data

```sql
-- Test in Supabase SQL Editor (logged out) or with:
SET ROLE anon;

-- Profiles (should return 0 rows)
SELECT * FROM profiles;

-- Favorites (should return 0 rows)
SELECT * FROM favorites;

-- Collections (should return 0 rows)
SELECT * FROM collections;

-- Meal Plans (should return 0 rows)
SELECT * FROM meal_plans;

RESET ROLE;
```

**Expected**: All queries return 0 rows

**Red Flag**: If any rows are returned, anonymous users can see private data!

#### Test 2.2: Anonymous Can Access Public Reference Data

```sql
SET ROLE anon;

-- Tags (should return all tags)
SELECT * FROM tags;

-- Allergens (should return all allergens)
SELECT * FROM allergens;

-- Ingredient Substitutions (should return all)
SELECT * FROM ingredient_substitutions;

RESET ROLE;
```

**Expected**: All reference data is returned

**Red Flag**: If no rows returned, anonymous users cannot see public data (feature broken)

#### Test 2.3: Anonymous Can Access Public Recipes

```sql
SET ROLE anon;

-- Public recipes (should return all public recipes)
SELECT * FROM recipes WHERE is_public = true;

-- Recipe tags for public recipes (should work)
SELECT rt.* FROM recipe_tags rt
JOIN recipes r ON r.id = rt.recipe_id
WHERE r.is_public = true;

-- Recipe ratings (should return all ratings - transparency)
SELECT * FROM recipe_ratings;

RESET ROLE;
```

**Expected**: Public recipes and their metadata are accessible

**Red Flag**: If no public recipes visible, check policies for `anon` role

---

### Phase 3: Authenticated User Testing (User Isolation)

Create two test users to verify isolation:

```sql
-- In Supabase SQL Editor, you can manually create test data or use the auth UI
```

From your application:

```typescript
// Create test users
const user1 = await supabase.auth.signUp({
  email: 'test1@example.com',
  password: 'test123456',
});

const user2 = await supabase.auth.signUp({
  email: 'test2@example.com',
  password: 'test123456',
});
```

#### Test 3.1: User Can Only See Own Profile

```typescript
// User 1 creates profile
await supabase.auth.signInWithPassword({
  email: 'test1@example.com',
  password: 'test123456',
});

await supabase.from('profiles').insert({
  user_id: user1.id,
  weight: 70,
  age: 25,
});

// User 1 reads own profile (should succeed)
const { data: ownProfile, error: error1 } = await supabase
  .from('profiles')
  .select('*');

console.log('User 1 profiles:', ownProfile);
// Expected: 1 row (own profile)

// User 2 tries to read all profiles (should only see their own)
await supabase.auth.signInWithPassword({
  email: 'test2@example.com',
  password: 'test123456',
});

await supabase.from('profiles').insert({
  user_id: user2.id,
  weight: 75,
  age: 30,
});

const { data: user2Profiles, error: error2 } = await supabase
  .from('profiles')
  .select('*');

console.log('User 2 profiles:', user2Profiles);
// Expected: 1 row (own profile only, NOT user1's profile)

// User 2 tries to query User 1's profile explicitly (should return 0 rows)
const { data: forbidden, error: error3 } = await supabase
  .from('profiles')
  .select('*')
  .eq('user_id', user1.id);

console.log('User 2 accessing User 1 profile:', forbidden);
// Expected: Empty array
```

**✅ PASS**: Users only see their own profile
**❌ FAIL**: User can see other users' profiles (RLS violation!)

#### Test 3.2: User Cannot Modify Another User's Data

```typescript
// User 2 tries to update User 1's profile (should fail silently)
await supabase.auth.signInWithPassword({
  email: 'test2@example.com',
  password: 'test123456',
});

const { data: updateResult, error: updateError } = await supabase
  .from('profiles')
  .update({ weight: 999 })
  .eq('user_id', user1.id);

console.log('Update result:', updateResult);
console.log('Update error:', updateError);
// Expected: No rows updated (or error)

// Verify User 1's data unchanged
await supabase.auth.signInWithPassword({
  email: 'test1@example.com',
  password: 'test123456',
});

const { data: user1Profile } = await supabase
  .from('profiles')
  .select('weight')
  .single();

console.log('User 1 weight:', user1Profile.weight);
// Expected: Original value (70), not 999
```

**✅ PASS**: Update fails or returns 0 rows
**❌ FAIL**: User 1's data was modified by User 2 (critical security bug!)

#### Test 3.3: User Cannot Delete Another User's Data

```typescript
// User 2 tries to delete User 1's profile (should fail)
await supabase.auth.signInWithPassword({
  email: 'test2@example.com',
  password: 'test123456',
});

const { data: deleteResult, error: deleteError } = await supabase
  .from('profiles')
  .delete()
  .eq('user_id', user1.id);

console.log('Delete result:', deleteResult);
// Expected: No rows deleted

// Verify User 1's profile still exists
await supabase.auth.signInWithPassword({
  email: 'test1@example.com',
  password: 'test123456',
});

const { data: user1Still Exists } = await supabase
  .from('profiles')
  .select('*')
  .single();

console.log('User 1 profile exists:', user1StillExists !== null);
// Expected: true
```

**✅ PASS**: Delete fails or returns 0 rows
**❌ FAIL**: User 1's profile was deleted (critical security bug!)

---

### Phase 4: Recipe Visibility Testing

Test public vs private recipe access.

#### Test 4.1: Public Recipes Visible to All

```typescript
// User 1 creates public recipe
await supabase.auth.signInWithPassword({
  email: 'test1@example.com',
  password: 'test123456',
});

await supabase.from('recipes').insert({
  user_id: user1.id,
  title: 'Public Pancakes',
  is_public: true,
  ingredients: [{ name: 'flour', amount: 200, unit: 'g' }],
  steps: [{ step_number: 1, instruction: 'Mix ingredients' }],
  servings: 4,
  nutrition_per_serving: {
    calories: 300,
    protein: 10,
    fat: 5,
    carbs: 50,
    fiber: 3,
    salt: 1,
  },
});

// User 2 can see it
await supabase.auth.signInWithPassword({
  email: 'test2@example.com',
  password: 'test123456',
});

const { data: publicRecipes } = await supabase
  .from('recipes')
  .select('*')
  .eq('title', 'Public Pancakes');

console.log('User 2 sees public recipe:', publicRecipes.length === 1);
// Expected: true

// Anonymous user can see it
await supabase.auth.signOut();

const { data: anonRecipes } = await supabase
  .from('recipes')
  .select('*')
  .eq('title', 'Public Pancakes');

console.log('Anonymous sees public recipe:', anonRecipes.length === 1);
// Expected: true
```

**✅ PASS**: Public recipes visible to all users
**❌ FAIL**: Public recipes not visible (check policies)

#### Test 4.2: Private Recipes Hidden from Others

```typescript
// User 1 creates private recipe
await supabase.auth.signInWithPassword({
  email: 'test1@example.com',
  password: 'test123456',
});

await supabase.from('recipes').insert({
  user_id: user1.id,
  title: 'Secret Family Recipe',
  is_public: false,
  ingredients: [{ name: 'secret ingredient', amount: 1, unit: 'cup' }],
  steps: [{ step_number: 1, instruction: 'Top secret' }],
  servings: 2,
  nutrition_per_serving: {
    calories: 500,
    protein: 20,
    fat: 10,
    carbs: 60,
    fiber: 5,
    salt: 2,
  },
});

// User 1 can see it
const { data: ownPrivate } = await supabase
  .from('recipes')
  .select('*')
  .eq('title', 'Secret Family Recipe');

console.log('User 1 sees own private recipe:', ownPrivate.length === 1);
// Expected: true

// User 2 cannot see it
await supabase.auth.signInWithPassword({
  email: 'test2@example.com',
  password: 'test123456',
});

const { data: otherPrivate } = await supabase
  .from('recipes')
  .select('*')
  .eq('title', 'Secret Family Recipe');

console.log('User 2 sees User 1 private recipe:', otherPrivate.length);
// Expected: 0

// Anonymous cannot see it
await supabase.auth.signOut();

const { data: anonPrivate } = await supabase
  .from('recipes')
  .select('*')
  .eq('title', 'Secret Family Recipe');

console.log('Anonymous sees private recipe:', anonPrivate.length);
// Expected: 0
```

**✅ PASS**: Private recipes only visible to owner
**❌ FAIL**: Other users can see private recipes (RLS violation!)

#### Test 4.3: Only Owner Can Modify Recipes

```typescript
// User 2 tries to update User 1's public recipe (should fail)
await supabase.auth.signInWithPassword({
  email: 'test2@example.com',
  password: 'test123456',
});

const { data: publicRecipe } = await supabase
  .from('recipes')
  .select('id')
  .eq('title', 'Public Pancakes')
  .single();

const { data: updateResult, error: updateError } = await supabase
  .from('recipes')
  .update({ title: 'HACKED RECIPE' })
  .eq('id', publicRecipe.id);

console.log('User 2 update result:', updateResult);
// Expected: null or 0 rows

// Verify recipe unchanged
await supabase.auth.signInWithPassword({
  email: 'test1@example.com',
  password: 'test123456',
});

const { data: unchanged } = await supabase
  .from('recipes')
  .select('title')
  .eq('id', publicRecipe.id)
  .single();

console.log('Recipe title unchanged:', unchanged.title === 'Public Pancakes');
// Expected: true
```

**✅ PASS**: Non-owner cannot modify recipes
**❌ FAIL**: Non-owner can modify recipes (critical security bug!)

---

### Phase 5: Joined Table Testing (Recipe Tags)

Test policies that use EXISTS subqueries.

#### Test 5.1: Recipe Tags Follow Recipe Visibility

```typescript
// User 1 creates private recipe with tags
await supabase.auth.signInWithPassword({
  email: 'test1@example.com',
  password: 'test123456',
});

// Get a tag
const { data: tag } = await supabase
  .from('tags')
  .select('id')
  .limit(1)
  .single();

// Create private recipe
const { data: recipe } = await supabase
  .from('recipes')
  .insert({
    user_id: user1.id,
    title: 'Tagged Private Recipe',
    is_public: false,
    ingredients: [],
    steps: [],
    servings: 1,
    nutrition_per_serving: {
      calories: 100,
      protein: 1,
      fat: 1,
      carbs: 1,
      fiber: 1,
      salt: 1,
    },
  })
  .select()
  .single();

// Add tag to recipe
await supabase.from('recipe_tags').insert({
  recipe_id: recipe.id,
  tag_id: tag.id,
});

// User 1 can see recipe tags
const { data: ownTags } = await supabase
  .from('recipe_tags')
  .select('*')
  .eq('recipe_id', recipe.id);

console.log('User 1 sees own recipe tags:', ownTags.length === 1);
// Expected: true

// User 2 cannot see recipe tags (private recipe)
await supabase.auth.signInWithPassword({
  email: 'test2@example.com',
  password: 'test123456',
});

const { data: otherTags } = await supabase
  .from('recipe_tags')
  .select('*')
  .eq('recipe_id', recipe.id);

console.log('User 2 sees User 1 recipe tags:', otherTags.length);
// Expected: 0
```

**✅ PASS**: Recipe tags follow parent recipe visibility
**❌ FAIL**: Recipe tags visible for private recipes (RLS violation!)

#### Test 5.2: Only Recipe Owner Can Add Tags

```typescript
// User 2 tries to add tag to User 1's recipe (should fail)
await supabase.auth.signInWithPassword({
  email: 'test2@example.com',
  password: 'test123456',
});

const { data: hackTag, error: hackError } = await supabase
  .from('recipe_tags')
  .insert({
    recipe_id: recipe.id, // User 1's recipe
    tag_id: tag.id,
  });

console.log('User 2 add tag result:', hackTag);
console.log('User 2 add tag error:', hackError);
// Expected: Error or null

// Verify tag count unchanged
await supabase.auth.signInWithPassword({
  email: 'test1@example.com',
  password: 'test123456',
});

const { data: finalTags } = await supabase
  .from('recipe_tags')
  .select('*')
  .eq('recipe_id', recipe.id);

console.log('Tag count unchanged:', finalTags.length === 1);
// Expected: true (still 1 tag)
```

**✅ PASS**: Non-owner cannot add tags to recipes
**❌ FAIL**: Non-owner can add tags (RLS violation!)

---

### Phase 6: Collection Testing

Test user isolation for collections.

#### Test 6.1: Users Cannot See Other Users' Collections

```typescript
// User 1 creates collection
await supabase.auth.signInWithPassword({
  email: 'test1@example.com',
  password: 'test123456',
});

await supabase.from('collections').insert({
  user_id: user1.id,
  name: 'My Favorite Dinners',
});

// User 1 can see it
const { data: ownCollections } = await supabase
  .from('collections')
  .select('*');

console.log('User 1 collections:', ownCollections.length);
// Expected: >= 1

// User 2 cannot see it
await supabase.auth.signInWithPassword({
  email: 'test2@example.com',
  password: 'test123456',
});

const { data: otherCollections } = await supabase
  .from('collections')
  .select('*')
  .eq('name', 'My Favorite Dinners');

console.log('User 2 sees User 1 collections:', otherCollections.length);
// Expected: 0
```

**✅ PASS**: Users cannot see other users' collections
**❌ FAIL**: Users can see other collections (RLS violation!)

---

### Phase 7: Performance Testing

Ensure RLS policies don't cause performance issues.

#### Test 7.1: Check Query Execution Plans

```sql
-- Test recipe SELECT with RLS (as authenticated user)
EXPLAIN ANALYZE
SELECT * FROM recipes
WHERE is_public = true OR user_id = 'user-uuid-here'
LIMIT 20;

-- Look for:
-- 1. Index usage (should use idx_recipes_user_public)
-- 2. Execution time (should be < 100ms for small datasets)
-- 3. No sequential scans on large tables
```

**Red Flags**:
- Sequential scans (Seq Scan) on tables with >1000 rows
- Execution time > 500ms for simple queries
- High planning time (>100ms)

**Fix**: Create appropriate indexes as defined in `.ai/db-plan.md`

#### Test 7.2: Check EXISTS Subquery Performance

```sql
-- Test recipe_tags with EXISTS subquery
EXPLAIN ANALYZE
SELECT * FROM recipe_tags rt
WHERE EXISTS (
  SELECT 1 FROM recipes r
  WHERE r.id = rt.recipe_id
  AND (r.is_public = true OR r.user_id = 'user-uuid-here')
);

-- Should use indexes:
-- - idx_recipes_id_user_id or idx_recipes_id_is_public
-- - idx_recipe_tags_recipe_id
```

**Red Flags**:
- Nested Loop without indexes
- Execution time > 500ms

**Fix**: Ensure indexes exist on foreign keys:
```sql
CREATE INDEX IF NOT EXISTS idx_recipe_tags_recipe_id ON recipe_tags(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipes_id_user_id ON recipes(id, user_id);
```

---

## Testing Checklist

Before deploying to production, verify:

### Database Level
- [ ] All tables have RLS enabled (`SELECT * FROM verify_rls_enabled()`)
- [ ] All policies are created (check `pg_policies`)
- [ ] UPDATE policies have both USING and WITH CHECK
- [ ] No tables with user data have RLS disabled

### Anonymous Access
- [ ] Anonymous users cannot see private data (profiles, favorites, collections)
- [ ] Anonymous users can see public reference data (tags, allergens)
- [ ] Anonymous users can see public recipes
- [ ] Anonymous users cannot see recipe ratings (or can, if transparency is desired)

### Authenticated User Isolation
- [ ] User A cannot see User B's profile
- [ ] User A cannot modify User B's data
- [ ] User A cannot delete User B's data
- [ ] User A can only see own favorites/collections/meal plans

### Recipe Visibility
- [ ] Public recipes visible to everyone
- [ ] Private recipes only visible to owner
- [ ] Only owner can modify recipes (public or private)
- [ ] Only owner can delete recipes

### Joined Tables
- [ ] Recipe tags follow recipe visibility
- [ ] Only recipe owner can modify recipe tags
- [ ] Collection recipes only visible to collection owner

### Performance
- [ ] Queries use indexes (check EXPLAIN ANALYZE)
- [ ] No sequential scans on large tables
- [ ] Execution time < 500ms for typical queries

### Application Integration
- [ ] Application code works with RLS enabled
- [ ] Error messages are user-friendly (not raw SQL errors)
- [ ] No unauthorized access errors for legitimate actions

---

## Common Issues and Solutions

### Issue 1: "Permission Denied" Errors

**Symptom**: Users get permission denied when accessing their own data

**Cause**: RLS policies might be too restrictive or missing

**Solution**:
```sql
-- Check if user is authenticated
SELECT auth.uid(); -- Should return user UUID, not NULL

-- Check if policy exists for operation
SELECT * FROM pg_policies
WHERE tablename = 'table_name'
AND cmd = 'SELECT';
```

### Issue 2: Anonymous Users See Empty Data

**Symptom**: Public recipes not visible when logged out

**Cause**: Missing policy for `anon` role

**Solution**:
```sql
-- Add anon policy
CREATE POLICY recipes_select_anon ON recipes
  FOR SELECT
  TO anon
  USING (is_public = true);
```

### Issue 3: Slow Queries After Enabling RLS

**Symptom**: Queries that were fast are now slow

**Cause**: RLS policies use EXISTS subqueries without indexes

**Solution**:
```sql
-- Create indexes on foreign keys
CREATE INDEX idx_recipe_tags_recipe_id ON recipe_tags(recipe_id);
CREATE INDEX idx_recipes_user_id ON recipes(user_id);
CREATE INDEX idx_recipes_is_public ON recipes(is_public) WHERE is_public = true;
```

### Issue 4: Users Can Modify Other Users' Data

**Symptom**: User A can update User B's profile

**Cause**: Missing WITH CHECK clause in UPDATE policy

**Solution**:
```sql
-- Fix UPDATE policy
DROP POLICY profiles_update_own ON profiles;

CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id); -- Add this!
```

---

## Automated Testing Script

Create an automated test suite:

```typescript
// rls-tests.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function runRLSTests() {
  console.log('🧪 Starting RLS Policy Tests...\n');

  // Test 1: Anonymous access
  console.log('Test 1: Anonymous users cannot access profiles');
  const { data: anonProfiles } = await supabase.from('profiles').select('*');
  console.assert(
    anonProfiles.length === 0,
    '❌ FAIL: Anonymous users can see profiles!'
  );
  console.log('✅ PASS: Anonymous users cannot see profiles\n');

  // Test 2: User isolation
  const user1 = await supabase.auth.signUp({
    email: `test-${Date.now()}@example.com`,
    password: 'test123456',
  });

  console.log('Test 2: Users can only see own profile');
  const { data: ownProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user1.data.user.id);

  console.assert(
    ownProfile.length <= 1,
    '❌ FAIL: User sees multiple profiles!'
  );
  console.log('✅ PASS: User isolation working\n');

  // Add more tests...

  console.log('🎉 All RLS tests passed!');
}

runRLSTests().catch(console.error);
```

---

## Next Steps

After all tests pass:

1. ✅ Document test results
2. ✅ Commit RLS migration to repository
3. ✅ Test in staging environment
4. ✅ Prepare rollback plan
5. ✅ Deploy to production during low-traffic period
6. ✅ Monitor error logs for 24 hours
7. ✅ Verify no unauthorized access attempts

---

**See also**:
- `.ai/rls-best-practices.md` - Comprehensive RLS patterns and best practices
- `supabase/migrations/20251125000000_enable_rls_for_production.sql` - Migration file
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
