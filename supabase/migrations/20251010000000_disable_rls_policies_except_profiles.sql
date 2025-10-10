-- =============================================
-- Migration: Disable RLS Policies (Except Profiles)
-- Description: Drops all RLS policies from tables except the profiles table
-- Purpose: Simplify development by removing RLS policies while keeping them on user profiles
-- Note: Tables still have RLS enabled, but with no policies (effectively blocking all access)
-- =============================================

-- =============================================
-- Drop Policies: allergens table
-- =============================================

drop policy if exists allergens_select_anon on allergens;
drop policy if exists allergens_select_auth on allergens;

-- =============================================
-- Drop Policies: user_allergens table
-- =============================================

drop policy if exists user_allergens_select on user_allergens;
drop policy if exists user_allergens_insert on user_allergens;
drop policy if exists user_allergens_update on user_allergens;
drop policy if exists user_allergens_delete on user_allergens;

-- =============================================
-- Drop Policies: user_disliked_ingredients table
-- =============================================

drop policy if exists user_disliked_ingredients_select on user_disliked_ingredients;
drop policy if exists user_disliked_ingredients_insert on user_disliked_ingredients;
drop policy if exists user_disliked_ingredients_update on user_disliked_ingredients;
drop policy if exists user_disliked_ingredients_delete on user_disliked_ingredients;

-- =============================================
-- Drop Policies: tags table
-- =============================================

drop policy if exists tags_select_anon on tags;
drop policy if exists tags_select_auth on tags;

-- =============================================
-- Drop Policies: recipes table
-- =============================================

drop policy if exists recipes_select_anon on recipes;
drop policy if exists recipes_select_auth on recipes;
drop policy if exists recipes_insert on recipes;
drop policy if exists recipes_update on recipes;
drop policy if exists recipes_delete on recipes;

-- =============================================
-- Drop Policies: recipe_tags table
-- =============================================

drop policy if exists recipe_tags_select_anon on recipe_tags;
drop policy if exists recipe_tags_select_auth on recipe_tags;
drop policy if exists recipe_tags_insert on recipe_tags;
drop policy if exists recipe_tags_update on recipe_tags;
drop policy if exists recipe_tags_delete on recipe_tags;

-- =============================================
-- Drop Policies: recipe_modifications table
-- =============================================

drop policy if exists recipe_modifications_select on recipe_modifications;
drop policy if exists recipe_modifications_insert on recipe_modifications;
drop policy if exists recipe_modifications_update on recipe_modifications;
drop policy if exists recipe_modifications_delete on recipe_modifications;

-- =============================================
-- Drop Policies: ingredient_substitutions table
-- =============================================

drop policy if exists ingredient_substitutions_select_anon on ingredient_substitutions;
drop policy if exists ingredient_substitutions_select_auth on ingredient_substitutions;

-- =============================================
-- Drop Policies: favorites table
-- =============================================

drop policy if exists favorites_select on favorites;
drop policy if exists favorites_insert on favorites;
drop policy if exists favorites_update on favorites;
drop policy if exists favorites_delete on favorites;

-- =============================================
-- Drop Policies: collections table
-- =============================================

drop policy if exists collections_select on collections;
drop policy if exists collections_insert on collections;
drop policy if exists collections_update on collections;
drop policy if exists collections_delete on collections;

-- =============================================
-- Drop Policies: collection_recipes table
-- =============================================

drop policy if exists collection_recipes_select on collection_recipes;
drop policy if exists collection_recipes_insert on collection_recipes;
drop policy if exists collection_recipes_update on collection_recipes;
drop policy if exists collection_recipes_delete on collection_recipes;

-- =============================================
-- Drop Policies: recipe_ratings table
-- =============================================

drop policy if exists recipe_ratings_select_anon on recipe_ratings;
drop policy if exists recipe_ratings_select_auth on recipe_ratings;
drop policy if exists recipe_ratings_insert on recipe_ratings;
drop policy if exists recipe_ratings_update on recipe_ratings;
drop policy if exists recipe_ratings_delete on recipe_ratings;

-- =============================================
-- Drop Policies: meal_plans table
-- =============================================

drop policy if exists meal_plans_select on meal_plans;
drop policy if exists meal_plans_insert on meal_plans;
drop policy if exists meal_plans_update on meal_plans;
drop policy if exists meal_plans_delete on meal_plans;

-- =============================================
-- Note: profiles table policies are KEPT intact
-- =============================================
-- The following policies remain active on the profiles table:
-- - profiles_select_own
-- - profiles_insert_own
-- - profiles_update_own
-- - profiles_delete_own
