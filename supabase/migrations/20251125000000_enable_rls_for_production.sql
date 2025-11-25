-- =============================================
-- Migration: Enable Row-Level Security for Production
-- Description: Re-enables RLS and recreates all policies that were dropped during development
-- Purpose: Activate production-ready security policies before deployment
-- Documentation: See .ai/rls-best-practices.md for detailed RLS patterns
-- =============================================

-- =============================================
-- IMPORTANT: This migration re-enables RLS AND recreates all policies.
-- Previous migrations dropped all policies except profiles for development.
-- This migration restores full security by recreating all policies.
-- =============================================

-- =============================================
-- Step 1: Enable RLS and Recreate Policies for User Profile Tables
-- =============================================

-- Profiles: Users can only access their own profile data
-- (Policies already exist, just ensure RLS is enabled)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE profiles IS 'RLS ENABLED: Users can only view/modify their own profile. Policies: profiles_select_own, profiles_insert_own, profiles_update_own, profiles_delete_own';

-- User Allergens: Users can only manage their own allergen preferences
ALTER TABLE user_allergens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_allergens_select ON user_allergens;
DROP POLICY IF EXISTS user_allergens_insert ON user_allergens;
DROP POLICY IF EXISTS user_allergens_update ON user_allergens;
DROP POLICY IF EXISTS user_allergens_delete ON user_allergens;

CREATE POLICY user_allergens_select ON user_allergens
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY user_allergens_insert ON user_allergens
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_allergens_update ON user_allergens
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_allergens_delete ON user_allergens
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

COMMENT ON TABLE user_allergens IS 'RLS ENABLED: Users can only view/modify their own allergen preferences. Policies: user_allergens_select, user_allergens_insert, user_allergens_update, user_allergens_delete';

-- User Disliked Ingredients: Users can only manage their own disliked ingredients
ALTER TABLE user_disliked_ingredients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_disliked_ingredients_select ON user_disliked_ingredients;
DROP POLICY IF EXISTS user_disliked_ingredients_insert ON user_disliked_ingredients;
DROP POLICY IF EXISTS user_disliked_ingredients_update ON user_disliked_ingredients;
DROP POLICY IF EXISTS user_disliked_ingredients_delete ON user_disliked_ingredients;

CREATE POLICY user_disliked_ingredients_select ON user_disliked_ingredients
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY user_disliked_ingredients_insert ON user_disliked_ingredients
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_disliked_ingredients_update ON user_disliked_ingredients
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_disliked_ingredients_delete ON user_disliked_ingredients
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

COMMENT ON TABLE user_disliked_ingredients IS 'RLS ENABLED: Users can only view/modify their own disliked ingredients. Policies: user_disliked_ingredients_select, user_disliked_ingredients_insert, user_disliked_ingredients_update, user_disliked_ingredients_delete';

-- =============================================
-- Step 2: Enable RLS and Recreate Policies for Reference Data Tables
-- =============================================

-- Allergens: Publicly readable, admin-only write
ALTER TABLE allergens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS allergens_select_anon ON allergens;
DROP POLICY IF EXISTS allergens_select_auth ON allergens;

CREATE POLICY allergens_select_anon ON allergens
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY allergens_select_auth ON allergens
  FOR SELECT
  TO authenticated
  USING (true);

COMMENT ON TABLE allergens IS 'RLS ENABLED: Publicly readable reference data. Policies: allergens_select_anon, allergens_select_auth';

-- Tags: Publicly readable, admin-only write
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tags_select_anon ON tags;
DROP POLICY IF EXISTS tags_select_auth ON tags;

CREATE POLICY tags_select_anon ON tags
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY tags_select_auth ON tags
  FOR SELECT
  TO authenticated
  USING (true);

COMMENT ON TABLE tags IS 'RLS ENABLED: Publicly readable reference data. Policies: tags_select_anon, tags_select_auth';

-- Ingredient Substitutions: Publicly readable, admin-only write
ALTER TABLE ingredient_substitutions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ingredient_substitutions_select_anon ON ingredient_substitutions;
DROP POLICY IF EXISTS ingredient_substitutions_select_auth ON ingredient_substitutions;

CREATE POLICY ingredient_substitutions_select_anon ON ingredient_substitutions
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY ingredient_substitutions_select_auth ON ingredient_substitutions
  FOR SELECT
  TO authenticated
  USING (true);

COMMENT ON TABLE ingredient_substitutions IS 'RLS ENABLED: Publicly readable reference data. Policies: ingredient_substitutions_select_anon, ingredient_substitutions_select_auth';

-- =============================================
-- Step 3: Enable RLS and Recreate Policies for Recipe Tables
-- =============================================

-- Recipes: Public recipes OR user's own recipes
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS recipes_select_anon ON recipes;
DROP POLICY IF EXISTS recipes_select_auth ON recipes;
DROP POLICY IF EXISTS recipes_insert ON recipes;
DROP POLICY IF EXISTS recipes_update ON recipes;
DROP POLICY IF EXISTS recipes_delete ON recipes;

CREATE POLICY recipes_select_anon ON recipes
  FOR SELECT
  TO anon
  USING (is_public = true);

CREATE POLICY recipes_select_auth ON recipes
  FOR SELECT
  TO authenticated
  USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY recipes_insert ON recipes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY recipes_update ON recipes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY recipes_delete ON recipes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

COMMENT ON TABLE recipes IS 'RLS ENABLED: Users can view public recipes OR their own recipes. Only owners can modify. Policies: recipes_select_anon, recipes_select_auth, recipes_insert, recipes_update, recipes_delete';

-- Recipe Tags: Follows recipe visibility rules
ALTER TABLE recipe_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS recipe_tags_select_anon ON recipe_tags;
DROP POLICY IF EXISTS recipe_tags_select_auth ON recipe_tags;
DROP POLICY IF EXISTS recipe_tags_insert ON recipe_tags;
DROP POLICY IF EXISTS recipe_tags_update ON recipe_tags;
DROP POLICY IF EXISTS recipe_tags_delete ON recipe_tags;

CREATE POLICY recipe_tags_select_anon ON recipe_tags
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_tags.recipe_id
      AND recipes.is_public = true
    )
  );

CREATE POLICY recipe_tags_select_auth ON recipe_tags
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_tags.recipe_id
      AND (recipes.is_public = true OR recipes.user_id = auth.uid())
    )
  );

CREATE POLICY recipe_tags_insert ON recipe_tags
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_tags.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY recipe_tags_update ON recipe_tags
  FOR UPDATE
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

CREATE POLICY recipe_tags_delete ON recipe_tags
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_tags.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

COMMENT ON TABLE recipe_tags IS 'RLS ENABLED: Visibility follows parent recipe. Only recipe owners can modify tags. Policies: recipe_tags_select_anon, recipe_tags_select_auth, recipe_tags_insert, recipe_tags_update, recipe_tags_delete';

-- Recipe Modifications: Users can only view/modify their own modifications
ALTER TABLE recipe_modifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS recipe_modifications_select ON recipe_modifications;
DROP POLICY IF EXISTS recipe_modifications_insert ON recipe_modifications;
DROP POLICY IF EXISTS recipe_modifications_update ON recipe_modifications;
DROP POLICY IF EXISTS recipe_modifications_delete ON recipe_modifications;

CREATE POLICY recipe_modifications_select ON recipe_modifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY recipe_modifications_insert ON recipe_modifications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY recipe_modifications_update ON recipe_modifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY recipe_modifications_delete ON recipe_modifications
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

COMMENT ON TABLE recipe_modifications IS 'RLS ENABLED: Users can only view/modify their own recipe modifications. Policies: recipe_modifications_select, recipe_modifications_insert, recipe_modifications_update, recipe_modifications_delete';

-- =============================================
-- Step 4: Enable RLS and Recreate Policies for User Interaction Tables
-- =============================================

-- Favorites: Users can only manage their own favorites
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS favorites_select ON favorites;
DROP POLICY IF EXISTS favorites_insert ON favorites;
DROP POLICY IF EXISTS favorites_update ON favorites;
DROP POLICY IF EXISTS favorites_delete ON favorites;

CREATE POLICY favorites_select ON favorites
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY favorites_insert ON favorites
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY favorites_update ON favorites
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY favorites_delete ON favorites
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

COMMENT ON TABLE favorites IS 'RLS ENABLED: Users can only view/modify their own favorites. Policies: favorites_select, favorites_insert, favorites_update, favorites_delete';

-- Collections: Users can only manage their own collections
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS collections_select ON collections;
DROP POLICY IF EXISTS collections_insert ON collections;
DROP POLICY IF EXISTS collections_update ON collections;
DROP POLICY IF EXISTS collections_delete ON collections;

CREATE POLICY collections_select ON collections
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY collections_insert ON collections
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY collections_update ON collections
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY collections_delete ON collections
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

COMMENT ON TABLE collections IS 'RLS ENABLED: Users can only view/modify their own collections. Policies: collections_select, collections_insert, collections_update, collections_delete';

-- Collection Recipes: Follows collection ownership rules
ALTER TABLE collection_recipes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS collection_recipes_select ON collection_recipes;
DROP POLICY IF EXISTS collection_recipes_insert ON collection_recipes;
DROP POLICY IF EXISTS collection_recipes_update ON collection_recipes;
DROP POLICY IF EXISTS collection_recipes_delete ON collection_recipes;

CREATE POLICY collection_recipes_select ON collection_recipes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM collections
      WHERE collections.id = collection_recipes.collection_id
      AND collections.user_id = auth.uid()
    )
  );

CREATE POLICY collection_recipes_insert ON collection_recipes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM collections
      WHERE collections.id = collection_recipes.collection_id
      AND collections.user_id = auth.uid()
    )
  );

CREATE POLICY collection_recipes_update ON collection_recipes
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM collections
      WHERE collections.id = collection_recipes.collection_id
      AND collections.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM collections
      WHERE collections.id = collection_recipes.collection_id
      AND collections.user_id = auth.uid()
    )
  );

CREATE POLICY collection_recipes_delete ON collection_recipes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM collections
      WHERE collections.id = collection_recipes.collection_id
      AND collections.user_id = auth.uid()
    )
  );

COMMENT ON TABLE collection_recipes IS 'RLS ENABLED: Users can only manage recipes in their own collections. Policies: collection_recipes_select, collection_recipes_insert, collection_recipes_update, collection_recipes_delete';

-- Recipe Ratings: Public read, private write
ALTER TABLE recipe_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS recipe_ratings_select_anon ON recipe_ratings;
DROP POLICY IF EXISTS recipe_ratings_select_auth ON recipe_ratings;
DROP POLICY IF EXISTS recipe_ratings_insert ON recipe_ratings;
DROP POLICY IF EXISTS recipe_ratings_update ON recipe_ratings;
DROP POLICY IF EXISTS recipe_ratings_delete ON recipe_ratings;

CREATE POLICY recipe_ratings_select_anon ON recipe_ratings
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY recipe_ratings_select_auth ON recipe_ratings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY recipe_ratings_insert ON recipe_ratings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY recipe_ratings_update ON recipe_ratings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY recipe_ratings_delete ON recipe_ratings
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

COMMENT ON TABLE recipe_ratings IS 'RLS ENABLED: All users can view ratings (transparency). Users can only modify their own ratings. Policies: recipe_ratings_select_anon, recipe_ratings_select_auth, recipe_ratings_insert, recipe_ratings_update, recipe_ratings_delete';

-- Meal Plans: Users can only manage their own meal plans
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS meal_plans_select ON meal_plans;
DROP POLICY IF EXISTS meal_plans_insert ON meal_plans;
DROP POLICY IF EXISTS meal_plans_update ON meal_plans;
DROP POLICY IF EXISTS meal_plans_delete ON meal_plans;

CREATE POLICY meal_plans_select ON meal_plans
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY meal_plans_insert ON meal_plans
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY meal_plans_update ON meal_plans
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY meal_plans_delete ON meal_plans
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

COMMENT ON TABLE meal_plans IS 'RLS ENABLED: Users can only view/modify their own meal plans. Policies: meal_plans_select, meal_plans_insert, meal_plans_update, meal_plans_delete';

-- =============================================
-- Step 5: Verification - Check RLS is Enabled
-- =============================================

DO $$
DECLARE
  rls_disabled_tables TEXT[];
  table_name TEXT;
BEGIN
  -- Find all tables with RLS disabled
  SELECT ARRAY_AGG(c.relname)
  INTO rls_disabled_tables
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    AND c.relname NOT LIKE 'pg_%'
    AND c.relname NOT LIKE 'sql_%'
    AND c.relname NOT LIKE 'mv_%'  -- Exclude materialized views
    AND NOT c.relrowsecurity;

  IF rls_disabled_tables IS NOT NULL THEN
    RAISE WARNING 'The following tables still have RLS DISABLED:';
    FOREACH table_name IN ARRAY rls_disabled_tables
    LOOP
      RAISE WARNING '  - %', table_name;
    END LOOP;
    RAISE NOTICE 'Review these tables and enable RLS if they contain user data.';
  ELSE
    RAISE NOTICE '✅ SUCCESS: All tables have RLS enabled!';
  END IF;
END $$;

-- =============================================
-- Step 6: Verification - Check Policy Coverage
-- =============================================

DO $$
DECLARE
  policy_count INTEGER;
  table_record RECORD;
BEGIN
  RAISE NOTICE '=== RLS Policy Coverage Report ===';
  RAISE NOTICE '';

  FOR table_record IN
    SELECT
      schemaname,
      tablename,
      COUNT(*) as policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    GROUP BY schemaname, tablename
    ORDER BY tablename
  LOOP
    RAISE NOTICE 'Table: % - % policies', table_record.tablename, table_record.policy_count;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '=== Detailed Policy List ===';
  RAISE NOTICE '';

  FOR table_record IN
    SELECT
      tablename,
      policyname,
      cmd,
      roles::TEXT[] as roles,
      CASE
        WHEN qual IS NOT NULL THEN 'Has USING clause'
        ELSE 'No USING clause'
      END as using_clause,
      CASE
        WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
        ELSE 'No WITH CHECK clause'
      END as with_check_clause
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, cmd, policyname
  LOOP
    RAISE NOTICE 'Table: % | Policy: % | Command: % | Roles: % | % | %',
      table_record.tablename,
      table_record.policyname,
      table_record.cmd,
      table_record.roles,
      table_record.using_clause,
      table_record.with_check_clause;
  END LOOP;
END $$;

-- =============================================
-- Step 7: Security Audit Recommendations
-- =============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== Security Audit Recommendations ===';
  RAISE NOTICE '';
  RAISE NOTICE '1. Test RLS policies with real users in staging environment';
  RAISE NOTICE '2. Verify anonymous users can only access public data';
  RAISE NOTICE '3. Verify authenticated users cannot access other users'' data';
  RAISE NOTICE '4. Monitor database logs for RLS policy violations';
  RAISE NOTICE '5. Review policy performance with EXPLAIN ANALYZE';
  RAISE NOTICE '';
  RAISE NOTICE 'See .ai/rls-best-practices.md for detailed testing procedures';
  RAISE NOTICE '';
  RAISE NOTICE '=== RLS Migration Complete ===';
END $$;

-- =============================================
-- Step 8: Create Helper Function for Policy Testing
-- =============================================

-- Function to verify RLS is working correctly
CREATE OR REPLACE FUNCTION verify_rls_enabled()
RETURNS TABLE (
  table_name TEXT,
  rls_enabled BOOLEAN,
  policy_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.relname::TEXT as table_name,
    c.relrowsecurity as rls_enabled,
    COUNT(p.policyname) as policy_count
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  LEFT JOIN pg_policies p ON p.tablename = c.relname AND p.schemaname = n.nspname
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    AND c.relname NOT LIKE 'pg_%'
    AND c.relname NOT LIKE 'sql_%'
    AND c.relname NOT LIKE 'mv_%'
  GROUP BY c.relname, c.relrowsecurity
  ORDER BY c.relname;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION verify_rls_enabled() IS 'Helper function to verify RLS status and policy count for all tables. Usage: SELECT * FROM verify_rls_enabled();';

-- =============================================
-- Step 9: Create Test Queries (Documentation)
-- =============================================

-- To test RLS policies manually, use these queries:
-- Note: Execute these from your application or Supabase SQL editor

COMMENT ON TABLE profiles IS 'RLS ENABLED: Users can only view/modify their own profile.

TEST QUERIES:
-- As authenticated user (should see own profile only):
SELECT * FROM profiles WHERE user_id = auth.uid();

-- As authenticated user (should return 0 rows - cannot see others):
SELECT * FROM profiles WHERE user_id != auth.uid();

-- As anonymous user (should return 0 rows):
SELECT * FROM profiles;
';

COMMENT ON TABLE recipes IS 'RLS ENABLED: Users can view public recipes OR their own recipes. Only owners can modify.

TEST QUERIES:
-- As authenticated user (should see public + own recipes):
SELECT * FROM recipes WHERE is_public = true OR user_id = auth.uid();

-- As anonymous user (should see only public recipes):
SELECT * FROM recipes WHERE is_public = true;

-- As authenticated user (should fail - cannot insert as another user):
INSERT INTO recipes (user_id, title, ingredients, steps, servings, nutrition_per_serving)
VALUES (''other-user-id'', ''Hacked Recipe'', ''[]''::jsonb, ''[]''::jsonb, 1, ''{\"calories\": 100}''::jsonb);
';

COMMENT ON TABLE favorites IS 'RLS ENABLED: Users can only view/modify their own favorites.

TEST QUERIES:
-- As authenticated user (should see only own favorites):
SELECT * FROM favorites WHERE user_id = auth.uid();

-- As authenticated user (should return 0 rows):
SELECT * FROM favorites WHERE user_id != auth.uid();

-- As authenticated user (should fail - cannot insert favorite for another user):
INSERT INTO favorites (user_id, recipe_id)
VALUES (''other-user-id'', ''some-recipe-id'');
';

-- =============================================
-- Step 10: Rollback Instructions (EMERGENCY ONLY)
-- =============================================

-- EMERGENCY ROLLBACK: Only use if RLS causes critical production issues
-- This disables RLS on all tables - USE WITH EXTREME CAUTION

/*
-- Uncomment the following lines ONLY in emergency:

ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_allergens DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_disliked_ingredients DISABLE ROW LEVEL SECURITY;
ALTER TABLE allergens DISABLE ROW LEVEL SECURITY;
ALTER TABLE tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE ingredient_substitutions DISABLE ROW LEVEL SECURITY;
ALTER TABLE recipes DISABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_modifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE favorites DISABLE ROW LEVEL SECURITY;
ALTER TABLE collections DISABLE ROW LEVEL SECURITY;
ALTER TABLE collection_recipes DISABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ratings DISABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans DISABLE ROW LEVEL SECURITY;

-- After rollback, investigate the issue and fix before re-enabling RLS
*/

-- =============================================
-- Migration Complete
-- =============================================

-- Next Steps:
-- 1. Review the verification output above
-- 2. Test policies in staging environment
-- 3. Run application tests with RLS enabled
-- 4. Monitor for any unexpected authorization errors
-- 5. Review .ai/rls-best-practices.md for testing procedures
