-- =============================================
-- Migration: Create Indexes for Performance Optimization
-- Description: Creates strategic indexes for query performance optimization
-- Affected Tables: All tables with foreign keys, recipes (full-text search), meal_plans (date filtering)
-- Performance Impact: Improves SELECT query performance, slight overhead on INSERT/UPDATE
-- =============================================

-- =============================================
-- Full-Text Search Indexes
-- =============================================

-- gin index on recipes search_vector for polish full-text search
-- this enables fast queries like: select * from recipes where search_vector @@ to_tsquery('polish', 'pierogi')
create index idx_recipes_search_vector on recipes using gin (search_vector);

-- gin index on recipes nutrition_per_serving for jsonb containment queries
-- enables queries like: select * from recipes where nutrition_per_serving @> '{"calories": 450}'
create index idx_recipes_nutrition on recipes using gin (nutrition_per_serving);

-- =============================================
-- Foreign Key Indexes (for JOIN performance)
-- =============================================

-- user relationship indexes
-- these speed up queries like: select * from recipes where user_id = '...'
create index idx_recipes_user_id on recipes(user_id);
create index idx_recipe_modifications_user_id on recipe_modifications(user_id);
create index idx_recipe_modifications_original_recipe_id on recipe_modifications(original_recipe_id);
create index idx_favorites_user_id on favorites(user_id);
create index idx_favorites_recipe_id on favorites(recipe_id);
create index idx_collections_user_id on collections(user_id);
create index idx_collection_recipes_collection_id on collection_recipes(collection_id);
create index idx_collection_recipes_recipe_id on collection_recipes(recipe_id);
create index idx_meal_plans_user_id on meal_plans(user_id);
create index idx_meal_plans_recipe_id on meal_plans(recipe_id);
create index idx_recipe_ratings_user_id on recipe_ratings(user_id);
create index idx_recipe_ratings_recipe_id on recipe_ratings(recipe_id);

-- tag relationship indexes
-- speeds up queries like: select * from recipe_tags where tag_id = '...'
create index idx_recipe_tags_tag_id on recipe_tags(tag_id);
create index idx_recipe_tags_recipe_id on recipe_tags(recipe_id);

-- allergen relationship indexes
-- speeds up queries like: select * from user_allergens where user_id = '...'
create index idx_user_allergens_user_id on user_allergens(user_id);
create index idx_user_allergens_allergen_id on user_allergens(allergen_id);

-- disliked ingredients index
-- speeds up queries like: select * from user_disliked_ingredients where user_id = '...'
create index idx_user_disliked_ingredients_user_id on user_disliked_ingredients(user_id);

-- =============================================
-- Partial Indexes (for filtered queries)
-- =============================================

-- partial index on recipes where prep_time_minutes is not null
-- optimizes queries like: select * from recipes where prep_time_minutes <= 30
create index idx_recipes_prep_time on recipes(prep_time_minutes) where prep_time_minutes is not null;

-- partial index on public recipes
-- optimizes queries like: select * from recipes where is_public = true
create index idx_recipes_is_public on recipes(is_public) where is_public = true;

-- partial index on featured recipes
-- optimizes queries like: select * from recipes where featured = true
create index idx_recipes_featured on recipes(featured) where featured = true;

-- =============================================
-- Composite Indexes (for multi-column queries)
-- =============================================

-- composite index for recipe queries by user and public status
-- optimizes queries like: select * from recipes where user_id = '...' and is_public = true
create index idx_recipes_user_public on recipes(user_id, is_public);

-- composite index for meal planning calendar queries
-- optimizes queries like: select * from meal_plans where user_id = '...' and planned_date between '...' and '...'
create index idx_meal_plans_user_date on meal_plans(user_id, planned_date);

-- composite index for meal plans by date and meal type
-- optimizes queries like: select * from meal_plans where planned_date = '...' and meal_type = 'breakfast'
create index idx_meal_plans_date_type on meal_plans(planned_date, meal_type);

-- =============================================
-- Timestamp Indexes (for sorting and filtering)
-- =============================================

-- index on recipes created_at for sorting by newest/oldest
-- optimizes queries like: select * from recipes order by created_at desc
create index idx_recipes_created_at on recipes(created_at desc);

-- index on recipe_ratings updated_at for finding recently updated ratings
-- optimizes queries like: select * from recipe_ratings order by updated_at desc
create index idx_recipe_ratings_updated_at on recipe_ratings(updated_at desc);

-- index on meal_plans planned_date for date range queries
-- optimizes queries like: select * from meal_plans where planned_date >= '2024-01-01'
create index idx_meal_plans_planned_date on meal_plans(planned_date);

-- =============================================
-- Comments for documentation
-- =============================================

comment on index idx_recipes_search_vector is 'GIN index for Polish full-text search on recipe titles and descriptions';
comment on index idx_recipes_nutrition is 'GIN index for JSONB containment queries on nutritional data';
comment on index idx_recipes_prep_time is 'Partial index for filtering recipes by preparation time';
comment on index idx_recipes_is_public is 'Partial index for filtering public recipes (reduces index size)';
comment on index idx_recipes_featured is 'Partial index for filtering featured recipes (admin-curated)';
comment on index idx_recipes_user_public is 'Composite index for user-specific and public recipe queries';
comment on index idx_meal_plans_user_date is 'Composite index for meal planning calendar queries (user + date range)';
comment on index idx_meal_plans_date_type is 'Composite index for daily meal planning queries (date + meal type)';
