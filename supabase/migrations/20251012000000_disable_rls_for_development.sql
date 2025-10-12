-- =============================================
-- Migration: Disable RLS for Development
-- Description: Disables RLS on all tables except profiles for easier development
-- Purpose: Allow API access to tables during development
-- WARNING: This is for development only! Enable proper RLS policies in production!
-- =============================================

-- Disable RLS on reference tables (read-only data)
ALTER TABLE allergens DISABLE ROW LEVEL SECURITY;
ALTER TABLE tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE ingredient_substitutions DISABLE ROW LEVEL SECURITY;

-- Disable RLS on user data tables (should have policies in production)
ALTER TABLE user_allergens DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_disliked_ingredients DISABLE ROW LEVEL SECURITY;

-- Disable RLS on recipe tables
ALTER TABLE recipes DISABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_modifications DISABLE ROW LEVEL SECURITY;

-- Disable RLS on user interaction tables
ALTER TABLE favorites DISABLE ROW LEVEL SECURITY;
ALTER TABLE collections DISABLE ROW LEVEL SECURITY;
ALTER TABLE collection_recipes DISABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ratings DISABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans DISABLE ROW LEVEL SECURITY;

-- =============================================
-- Note: profiles table RLS remains ENABLED
-- =============================================
-- The profiles table should always have RLS enabled with proper policies

-- Verification
DO $$
BEGIN
  RAISE NOTICE 'RLS disabled for development on all tables except profiles';
  RAISE NOTICE 'WARNING: Re-enable RLS with proper policies before production deployment!';
END $$;
