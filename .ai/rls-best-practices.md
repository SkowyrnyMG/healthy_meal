# Row-Level Security (RLS) Best Practices for Supabase

## Executive Summary

Row-Level Security (RLS) is a PostgreSQL security feature that restricts which rows users can access in database tables. When combined with Supabase Auth, RLS provides a robust, database-level authorization system that prevents unauthorized data access even if application-level checks fail.

**Key Principle**: RLS should be your **primary** security layer, not a backup. Application code can have bugs, but database policies are enforced at the lowest level.

---

## 1. Core Concepts

### 1.1 What is Row-Level Security?

RLS policies are SQL rules that PostgreSQL evaluates **before every query** to determine which rows a user can see or modify. Think of it as a WHERE clause automatically added to every query.

```sql
-- Without RLS (DANGEROUS)
SELECT * FROM recipes;
-- Returns ALL recipes in database

-- With RLS (SECURE)
SELECT * FROM recipes;
-- PostgreSQL automatically adds: WHERE user_id = auth.uid() OR is_public = true
-- Returns only recipes the user is authorized to see
```

### 1.2 Supabase Auth Integration

Supabase provides a built-in `auth.uid()` function that returns the currently authenticated user's ID from the JWT token. This is the foundation of all RLS policies.

```sql
-- Get current user's ID
auth.uid() -- Returns UUID or NULL if not authenticated

-- Check if user is authenticated
auth.role() -- Returns 'authenticated' or 'anon'

-- Access JWT claims
auth.jwt() -- Returns full JWT token (for custom claims)
```

### 1.3 Policy Types

PostgreSQL supports policies for four operations:

1. **SELECT** - Which rows can users read?
2. **INSERT** - Which rows can users create?
3. **UPDATE** - Which rows can users modify?
4. **DELETE** - Which rows can users remove?

You can also use **FOR ALL** to apply the same policy to all operations.

---

## 2. Secure-by-Default Policy Patterns

### 2.1 Pattern: User Isolation (Private Data)

**Use Case**: User can only access their own data (profiles, favorites, collections, meal plans)

**Security Level**: ⭐⭐⭐⭐⭐ Highest

```sql
-- Enable RLS on table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own profile
CREATE POLICY profiles_select_own ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can only insert their own profile
CREATE POLICY profiles_insert_own ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own profile
CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only delete their own profile
CREATE POLICY profiles_delete_own ON profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
```

**Simplified Version** (using FOR ALL):

```sql
CREATE POLICY profiles_all_own ON profiles
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

**Key Points**:
- `TO authenticated` ensures only logged-in users can access
- `USING` checks if user can see existing rows
- `WITH CHECK` validates new/updated rows meet criteria
- Both clauses needed for UPDATE to prevent users from transferring ownership

### 2.2 Pattern: Public Read, Authenticated Write (Reference Data)

**Use Case**: Reference tables like tags, allergens, ingredient substitutions

**Security Level**: ⭐⭐⭐⭐ High

```sql
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- Anonymous users can read tags
CREATE POLICY tags_select_anon ON tags
  FOR SELECT
  TO anon
  USING (true);

-- Authenticated users can read tags
CREATE POLICY tags_select_auth ON tags
  FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can modify (handled at application level or with admin policies)
-- No INSERT/UPDATE/DELETE policies = only superusers can modify
```

**Key Points**:
- Separate policies for `anon` and `authenticated` roles
- `USING (true)` allows all rows to be read
- No write policies = only database admins can modify (perfect for reference data)

### 2.3 Pattern: Public or Owned (Shared Content)

**Use Case**: Recipes that can be public or private

**Security Level**: ⭐⭐⭐⭐ High

```sql
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- Anonymous users can view public recipes
CREATE POLICY recipes_select_anon ON recipes
  FOR SELECT
  TO anon
  USING (is_public = true);

-- Authenticated users can view public recipes OR their own recipes
CREATE POLICY recipes_select_auth ON recipes
  FOR SELECT
  TO authenticated
  USING (is_public = true OR auth.uid() = user_id);

-- Users can only insert their own recipes
CREATE POLICY recipes_insert_own ON recipes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own recipes
CREATE POLICY recipes_update_own ON recipes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own recipes
CREATE POLICY recipes_delete_own ON recipes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
```

**Key Points**:
- Read permissions are flexible (public OR owned)
- Write permissions are strict (only owner)
- Anonymous users have limited access (public only)

### 2.4 Pattern: Joined Ownership (Child Tables)

**Use Case**: Recipe tags, collection recipes - tables that inherit ownership from parent

**Security Level**: ⭐⭐⭐⭐⭐ Highest

```sql
ALTER TABLE recipe_tags ENABLE ROW LEVEL SECURITY;

-- Users can view tags for public recipes OR their own recipes
CREATE POLICY recipe_tags_select ON recipe_tags
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_tags.recipe_id
      AND (recipes.is_public = true OR recipes.user_id = auth.uid())
    )
  );

-- Users can only modify tags for their own recipes
CREATE POLICY recipe_tags_modify ON recipe_tags
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_tags.recipe_id
      AND recipes.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_tags.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );
```

**Key Points**:
- Use `EXISTS` subquery to check parent table
- Visibility follows parent table's rules
- Modifications require parent ownership
- **Performance**: Ensure parent table has proper indexes

### 2.5 Pattern: Public Read, Private Write (Social Data)

**Use Case**: Recipe ratings - everyone can see, only owner can modify their own

**Security Level**: ⭐⭐⭐⭐ High

```sql
ALTER TABLE recipe_ratings ENABLE ROW LEVEL SECURITY;

-- Everyone can view all ratings (transparency)
CREATE POLICY recipe_ratings_select_all ON recipe_ratings
  FOR SELECT
  USING (true);

-- Users can only insert their own ratings
CREATE POLICY recipe_ratings_insert_own ON recipe_ratings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own ratings
CREATE POLICY recipe_ratings_update_own ON recipe_ratings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own ratings
CREATE POLICY recipe_ratings_delete_own ON recipe_ratings
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
```

**Key Points**:
- `USING (true)` for SELECT allows everyone to read
- Separate `anon` policy if you want anonymous access
- Write operations still require ownership

---

## 3. Advanced Patterns

### 3.1 Admin-Only Access

```sql
-- Create admin check function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'role')::TEXT = 'admin',
    false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin-only SELECT policy
CREATE POLICY admin_view_all ON sensitive_data
  FOR SELECT
  TO authenticated
  USING (is_admin());
```

### 3.2 Time-Based Access

```sql
-- Users can only modify recent records (within 24 hours)
CREATE POLICY recent_edit_only ON user_actions
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND created_at > NOW() - INTERVAL '24 hours'
  );
```

### 3.3 Soft Deletes

```sql
-- Hide deleted records from queries
CREATE POLICY hide_deleted ON recipes
  FOR SELECT
  USING (deleted_at IS NULL);

-- Users can only soft-delete their own recipes
CREATE POLICY soft_delete_own ON recipes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND deleted_at IS NULL)
  WITH CHECK (auth.uid() = user_id);
```

---

## 4. Common Pitfalls and How to Avoid Them

### 4.1 Pitfall: Forgetting to Enable RLS

**Problem**: RLS policies are ignored if RLS is not enabled on the table.

```sql
-- ❌ WRONG: Policies defined but RLS not enabled
CREATE POLICY my_policy ON users FOR SELECT USING (...);
-- Users can still see ALL rows!

-- ✅ CORRECT: Always enable RLS first
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY my_policy ON users FOR SELECT USING (...);
```

**Best Practice**: Enable RLS immediately when creating tables, even before defining policies.

### 4.2 Pitfall: Missing WITH CHECK in UPDATE Policies

**Problem**: Users could transfer ownership of rows to other users.

```sql
-- ❌ WRONG: Only USING clause
CREATE POLICY update_profile ON profiles
  FOR UPDATE
  USING (auth.uid() = user_id);
-- User could UPDATE user_id to someone else's ID!

-- ✅ CORRECT: Both USING and WITH CHECK
CREATE POLICY update_profile ON profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
-- User cannot change user_id to another user
```

**Best Practice**: Always use both `USING` and `WITH CHECK` for UPDATE policies.

### 4.3 Pitfall: Overly Permissive Policies

**Problem**: Using `USING (true)` for operations beyond SELECT.

```sql
-- ❌ WRONG: Anyone can delete anything!
CREATE POLICY delete_all ON recipes
  FOR DELETE
  USING (true);

-- ✅ CORRECT: Restrict deletions to owners
CREATE POLICY delete_own ON recipes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
```

**Best Practice**: Only use `USING (true)` for SELECT on public reference data.

### 4.4 Pitfall: Policy Performance Issues

**Problem**: Complex EXISTS queries on every row can be slow.

```sql
-- ⚠️ POTENTIALLY SLOW
CREATE POLICY collection_recipes_select ON collection_recipes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM collections
      WHERE collections.id = collection_recipes.collection_id
      AND collections.user_id = auth.uid()
    )
  );

-- ✅ OPTIMIZED: Ensure proper index exists
CREATE INDEX idx_collections_user_id ON collections(user_id);
-- Now the EXISTS query can use the index
```

**Best Practice**: Always create indexes on foreign keys used in RLS policies.

### 4.5 Pitfall: Not Testing Anonymous Access

**Problem**: Assuming all users are authenticated.

```sql
-- ❌ INCOMPLETE: No policy for anonymous users
CREATE POLICY recipes_select_auth ON recipes
  FOR SELECT
  TO authenticated
  USING (is_public = true);
-- Anonymous users get zero rows, even for public recipes!

-- ✅ COMPLETE: Separate policies for anon and authenticated
CREATE POLICY recipes_select_anon ON recipes
  FOR SELECT
  TO anon
  USING (is_public = true);

CREATE POLICY recipes_select_auth ON recipes
  FOR SELECT
  TO authenticated
  USING (is_public = true OR auth.uid() = user_id);
```

**Best Practice**: Always consider both `anon` and `authenticated` roles.

---

## 5. Policy Testing Strategies

### 5.1 Manual Testing with SQL

```sql
-- Test as specific user
SET request.jwt.claims.sub = 'user-uuid-here';

-- Verify user sees only their own data
SELECT * FROM profiles; -- Should return 1 row

-- Verify user cannot see other users' data
SELECT * FROM profiles WHERE user_id != 'user-uuid-here'; -- Should return 0 rows

-- Reset to superuser
RESET request.jwt.claims.sub;
```

### 5.2 Testing from Application Code

```typescript
// Test 1: Authenticated user can read own profile
const { data: ownProfile, error: error1 } = await supabase
  .from('profiles')
  .select('*')
  .eq('user_id', user.id)
  .single();

assert(ownProfile !== null, 'User should see own profile');

// Test 2: Authenticated user cannot read other profiles
const { data: otherProfiles, error: error2 } = await supabase
  .from('profiles')
  .select('*')
  .neq('user_id', user.id);

assert(otherProfiles.length === 0, 'User should not see other profiles');

// Test 3: Anonymous user cannot read any profiles
await supabase.auth.signOut();
const { data: anonProfiles, error: error3 } = await supabase
  .from('profiles')
  .select('*');

assert(anonProfiles.length === 0, 'Anonymous users should see no profiles');
```

### 5.3 Automated Testing

Create test users and verify isolation:

```typescript
describe('RLS Policies', () => {
  let user1: User;
  let user2: User;

  beforeAll(async () => {
    user1 = await createTestUser('user1@test.com');
    user2 = await createTestUser('user2@test.com');
  });

  it('user1 cannot see user2 favorites', async () => {
    // User2 creates a favorite
    await supabase.auth.signInWithPassword({
      email: 'user2@test.com',
      password: 'password',
    });
    await supabase.from('favorites').insert({ recipe_id: 'recipe-123' });

    // User1 tries to read it
    await supabase.auth.signInWithPassword({
      email: 'user1@test.com',
      password: 'password',
    });
    const { data } = await supabase
      .from('favorites')
      .select('*')
      .eq('recipe_id', 'recipe-123');

    expect(data).toHaveLength(0);
  });
});
```

---

## 6. Migration Strategy: Development to Production

### 6.1 Current State (Development)

In development, RLS has been disabled for easier testing:

```sql
-- Development: RLS disabled
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
```

### 6.2 Production Migration Plan

**Step 1: Create Re-enable Migration**

```sql
-- Migration: enable_rls_for_production.sql

-- Enable RLS on all user-facing tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_allergens ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_disliked_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_modifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE allergens ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredient_substitutions ENABLE ROW LEVEL SECURITY;
```

**Step 2: Verify Policies Exist**

```sql
-- Check that all tables have RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

**Step 3: Test Before Deployment**

1. Enable RLS on staging environment
2. Run full test suite
3. Manually test all user flows
4. Verify no unauthorized access

**Step 4: Deploy to Production**

1. Apply migration during maintenance window
2. Monitor error logs for RLS violations
3. Have rollback plan ready (disable RLS if issues)

### 6.3 Rollback Plan

```sql
-- Emergency rollback: disable RLS (use only if necessary)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
-- ... repeat for other tables
```

---

## 7. Policy Maintenance Best Practices

### 7.1 Document All Policies

```sql
-- Add comments to policies
COMMENT ON POLICY profiles_select_own ON profiles IS
  'Users can only read their own profile data. Prevents unauthorized access to personal information.';
```

### 7.2 Regular Security Audits

```sql
-- List all tables WITHOUT RLS enabled (potential security holes)
SELECT
  schemaname,
  tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT LIKE 'pg_%'
  AND NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = tablename
      AND n.nspname = schemaname
      AND c.relrowsecurity = true
  );
```

### 7.3 Monitor Policy Violations

Enable logging for policy violations:

```sql
-- PostgreSQL logging configuration
SET log_statement = 'all';
SET log_min_messages = 'warning';
```

Monitor logs for patterns like:
- Frequent RLS policy rejections (might indicate application bugs)
- Slow queries with complex policies (optimize with indexes)

---

## 8. Summary Checklist

Before deploying to production, verify:

- [ ] RLS is **enabled** on all tables containing user data
- [ ] RLS is **enabled** on all reference tables (even if public)
- [ ] Each table has policies for all four operations (SELECT, INSERT, UPDATE, DELETE)
- [ ] UPDATE policies have both `USING` and `WITH CHECK` clauses
- [ ] Policies consider both `authenticated` and `anon` roles
- [ ] Indexes exist on foreign keys used in `EXISTS` clauses
- [ ] Policies have been tested with real users
- [ ] Policies have been tested with anonymous access
- [ ] Admin functions use `SECURITY DEFINER` carefully
- [ ] All policies are documented with comments
- [ ] Rollback plan is prepared
- [ ] Monitoring is in place for policy violations

---

## 9. Additional Resources

### Official Documentation
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers)

### Security Best Practices
- [OWASP Database Security](https://owasp.org/www-project-database-security/)
- [PostgreSQL Security Checklist](https://www.postgresql.org/docs/current/security.html)

### Performance Optimization
- [PostgreSQL Index Usage](https://www.postgresql.org/docs/current/indexes.html)
- [Query Performance Tuning](https://www.postgresql.org/docs/current/performance-tips.html)

---

## 10. Real-World Examples from HealthyMeal App

### Example 1: Profiles Table

**Requirement**: Users should only see and modify their own profile.

**Implementation**:
```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_all_own ON profiles
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

**Test**:
```typescript
// User A creates profile
const { data } = await supabase.from('profiles').insert({
  user_id: userA.id,
  weight: 75,
  age: 28,
});

// User B tries to read User A's profile
await supabase.auth.signInWithPassword({ email: 'userB@example.com' });
const { data: forbidden } = await supabase
  .from('profiles')
  .select('*')
  .eq('user_id', userA.id);

// Result: forbidden is empty array (User B cannot see User A's profile)
```

### Example 2: Recipes Table

**Requirement**: Users can see public recipes OR their own private recipes. Only owners can modify.

**Implementation**:
```sql
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- Anonymous users: only public recipes
CREATE POLICY recipes_select_anon ON recipes
  FOR SELECT
  TO anon
  USING (is_public = true);

-- Authenticated users: public OR owned
CREATE POLICY recipes_select_auth ON recipes
  FOR SELECT
  TO authenticated
  USING (is_public = true OR auth.uid() = user_id);

-- Only owners can modify
CREATE POLICY recipes_modify_own ON recipes
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

**Test**:
```typescript
// User A creates private recipe
await supabase.from('recipes').insert({
  user_id: userA.id,
  title: 'Secret Recipe',
  is_public: false,
});

// Anonymous user cannot see it
await supabase.auth.signOut();
const { data: anonData } = await supabase
  .from('recipes')
  .select('*')
  .eq('title', 'Secret Recipe');
// Result: anonData is empty

// User B (authenticated) cannot see it
await supabase.auth.signInWithPassword({ email: 'userB@example.com' });
const { data: userBData } = await supabase
  .from('recipes')
  .select('*')
  .eq('title', 'Secret Recipe');
// Result: userBData is empty

// User A (owner) can see it
await supabase.auth.signInWithPassword({ email: 'userA@example.com' });
const { data: ownerData } = await supabase
  .from('recipes')
  .select('*')
  .eq('title', 'Secret Recipe');
// Result: ownerData contains the recipe
```

### Example 3: Recipe Tags (Joined Ownership)

**Requirement**: Tag visibility follows recipe visibility. Only recipe owners can modify tags.

**Implementation**:
```sql
ALTER TABLE recipe_tags ENABLE ROW LEVEL SECURITY;

-- Read: follow recipe visibility
CREATE POLICY recipe_tags_select ON recipe_tags
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_tags.recipe_id
      AND (recipes.is_public = true OR recipes.user_id = auth.uid())
    )
  );

-- Write: only recipe owner
CREATE POLICY recipe_tags_modify ON recipe_tags
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_tags.recipe_id
      AND recipes.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_tags.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );
```

**Performance Optimization**:
```sql
-- Create index for fast EXISTS lookups
CREATE INDEX idx_recipes_id_user_id ON recipes(id, user_id);
CREATE INDEX idx_recipes_id_is_public ON recipes(id, is_public);
```

---

**This document is maintained as part of the HealthyMeal project. Last updated: 2025-11-25**
