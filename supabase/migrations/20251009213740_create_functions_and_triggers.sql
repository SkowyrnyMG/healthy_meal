-- =============================================
-- Migration: Create Functions, Triggers, and Materialized Views
-- Description: Creates database functions, triggers for automation, and materialized views for admin dashboard
-- Affected Objects: Triggers on profiles/recipes/recipe_ratings, materialized views for statistics
-- Purpose: Automated timestamp updates, admin analytics, and helper functions
-- =============================================

-- =============================================
-- Function: Auto-update updated_at timestamp
-- Purpose: Automatically updates updated_at column when row is modified
-- Usage: Applied to tables with updated_at column via triggers
-- =============================================

create or replace function auto_update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

comment on function auto_update_updated_at is 'Trigger function to automatically update updated_at timestamp on row modification';

-- =============================================
-- Triggers: Apply auto_update_updated_at to relevant tables
-- =============================================

-- trigger on profiles table
-- fires before update to set updated_at to current timestamp
create trigger profiles_updated_at
  before update on profiles
  for each row
  execute function auto_update_updated_at();

comment on trigger profiles_updated_at on profiles is 'Automatically updates updated_at timestamp when profile is modified';

-- trigger on recipes table
-- fires before update to set updated_at to current timestamp
create trigger recipes_updated_at
  before update on recipes
  for each row
  execute function auto_update_updated_at();

comment on trigger recipes_updated_at on recipes is 'Automatically updates updated_at timestamp when recipe is modified';

-- trigger on recipe_ratings table
-- fires before update to set updated_at to current timestamp
create trigger recipe_ratings_updated_at
  before update on recipe_ratings
  for each row
  execute function auto_update_updated_at();

comment on trigger recipe_ratings_updated_at on recipe_ratings is 'Automatically updates updated_at timestamp when rating is modified';

-- =============================================
-- Function: Check if user is admin
-- Purpose: Helper function to check if current user has admin role
-- Usage: Used in RLS policies for admin-only access
-- Note: Checks user_metadata -> role in Supabase auth JWT
-- =============================================

create or replace function is_admin()
returns boolean as $$
begin
  -- check if user has admin role in auth.users metadata
  return (
    select coalesce(
      (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin',
      false
    )
  );
end;
$$ language plpgsql security definer;

comment on function is_admin is 'Returns true if current user has admin role in user_metadata. Used for admin-only RLS policies.';

-- =============================================
-- Materialized View: User Statistics
-- Purpose: Aggregated user statistics for admin dashboard
-- Refresh: Should be refreshed daily or on-demand
-- =============================================

create materialized view mv_user_statistics as
select
  count(distinct user_id) as total_users,
  count(distinct case when diet_type is not null then user_id end) as users_with_preferences,
  round(
    100.0 * count(distinct case when diet_type is not null then user_id end) /
    nullif(count(distinct user_id), 0),
    2
  ) as preference_completion_rate,
  count(distinct case when created_at >= now() - interval '7 days' then user_id end) as new_users_last_7_days,
  count(distinct case when created_at >= now() - interval '30 days' then user_id end) as new_users_last_30_days
from profiles;

-- unique index required for concurrent refresh
-- uses dummy column (true) since there's only one row
create unique index on mv_user_statistics ((true));

comment on materialized view mv_user_statistics is 'Aggregated user statistics for admin dashboard. Refresh daily or on-demand.';

-- =============================================
-- Materialized View: Recipe Statistics
-- Purpose: Aggregated recipe and modification statistics for admin dashboard
-- Refresh: Should be refreshed daily or on-demand
-- =============================================

create materialized view mv_recipe_statistics as
select
  count(distinct r.id) as total_recipes,
  count(distinct case when r.is_public then r.id end) as public_recipes,
  count(distinct rm.id) as total_modifications,
  round(
    count(distinct rm.id)::decimal / nullif(count(distinct r.id), 0),
    2
  ) as avg_modifications_per_recipe,
  rm.modification_type,
  count(*) as modification_count
from recipes r
left join recipe_modifications rm on r.id = rm.original_recipe_id
group by rm.modification_type;

-- unique index required for concurrent refresh
-- uses modification_type as unique key (null is also unique)
create unique index on mv_recipe_statistics (modification_type);

comment on materialized view mv_recipe_statistics is 'Aggregated recipe and AI modification statistics grouped by modification type. Refresh daily or on-demand.';

-- =============================================
-- Materialized View: Rating Statistics
-- Purpose: Aggregated rating and cooking statistics for admin dashboard
-- Refresh: Should be refreshed daily or on-demand
-- =============================================

create materialized view mv_rating_statistics as
select
  count(*) as total_ratings,
  round(avg(rating)::numeric, 2) as average_rating,
  count(case when did_cook then 1 end) as recipes_cooked,
  round(
    100.0 * count(case when did_cook then 1 end) / nullif(count(*), 0),
    2
  ) as cook_percentage,
  count(case when rating >= 4 then 1 end) as positive_ratings,
  count(case when rating <= 2 then 1 end) as negative_ratings
from recipe_ratings;

-- unique index required for concurrent refresh
-- uses dummy column (true) since there's only one row
create unique index on mv_rating_statistics ((true));

comment on materialized view mv_rating_statistics is 'Aggregated rating and cooking statistics for admin dashboard. Refresh daily or on-demand.';

-- =============================================
-- Function: Refresh Admin Statistics
-- Purpose: Convenience function to refresh all admin materialized views
-- Usage: Can be called manually or scheduled via pg_cron
-- Note: Uses concurrent refresh to avoid blocking reads
-- =============================================

create or replace function refresh_admin_statistics()
returns void as $$
begin
  refresh materialized view concurrently mv_user_statistics;
  refresh materialized view concurrently mv_recipe_statistics;
  refresh materialized view concurrently mv_rating_statistics;
end;
$$ language plpgsql;

comment on function refresh_admin_statistics is 'Refreshes all admin dashboard materialized views concurrently. Schedule to run daily at midnight.';

-- =============================================
-- RLS Policies for Materialized Views
-- Purpose: Restrict access to materialized views to admin users only
-- =============================================

-- enable rls on materialized views
alter materialized view mv_user_statistics owner to postgres;
alter materialized view mv_recipe_statistics owner to postgres;
alter materialized view mv_rating_statistics owner to postgres;

-- note: materialized views don't support rls policies directly
-- access control should be handled at application level or via postgres roles
-- for supabase, recommend creating a separate schema for admin views
-- and restricting access via postgres grants

-- =============================================
-- Helper Function: Calculate Recipe Total Nutrition
-- Purpose: Calculate total nutrition for a recipe based on servings
-- Usage: select calculate_total_nutrition('recipe-uuid')
-- =============================================

create or replace function calculate_total_nutrition(recipe_uuid uuid)
returns jsonb as $$
declare
  recipe_record record;
  total_nutrition jsonb;
begin
  -- get recipe with nutrition and servings
  select
    nutrition_per_serving,
    servings
  into recipe_record
  from recipes
  where id = recipe_uuid;

  -- return null if recipe not found
  if not found then
    return null;
  end if;

  -- calculate total nutrition by multiplying per-serving values by servings
  select jsonb_object_agg(
    key,
    (value::numeric * recipe_record.servings)::numeric
  )
  into total_nutrition
  from jsonb_each(recipe_record.nutrition_per_serving);

  return total_nutrition;
end;
$$ language plpgsql stable;

comment on function calculate_total_nutrition is 'Calculates total nutritional values for entire recipe (all servings combined)';

-- =============================================
-- Helper Function: Search Recipes by Text
-- Purpose: Helper function for full-text search
-- Usage: select * from search_recipes('pierogi')
-- Note: Uses 'simple' configuration for compatibility. Change to 'polish' in production.
-- =============================================

create or replace function search_recipes(search_query text)
returns table (
  recipe_id uuid,
  title varchar(255),
  description text,
  rank real
) as $$
begin
  return query
  select
    r.id,
    r.title,
    r.description,
    ts_rank(r.search_vector, to_tsquery('simple', search_query)) as rank
  from recipes r
  where r.search_vector @@ to_tsquery('simple', search_query)
  order by rank desc;
end;
$$ language plpgsql stable;

comment on function search_recipes is 'Full-text search for recipes. Returns results ranked by relevance. Uses simple configuration for compatibility.';

-- =============================================
-- Comments for documentation
-- =============================================

comment on trigger profiles_updated_at on profiles is 'Automatically sets updated_at to current timestamp before each update';
comment on trigger recipes_updated_at on recipes is 'Automatically sets updated_at to current timestamp before each update';
comment on trigger recipe_ratings_updated_at on recipe_ratings is 'Automatically sets updated_at to current timestamp before each update';
