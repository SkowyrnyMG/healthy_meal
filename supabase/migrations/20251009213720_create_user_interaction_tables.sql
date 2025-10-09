-- =============================================
-- Migration: Create User Interaction Tables
-- Description: Creates tables for user interactions with recipes (favorites, collections, ratings, meal planning)
-- Affected Tables: favorites, collections, collection_recipes, recipe_ratings, meal_plans
-- Dependencies: Requires recipes and profiles tables from previous migrations
-- =============================================

-- =============================================
-- Table: favorites
-- Purpose: Stores user's favorite recipes for quick access
-- Relationship: Many-to-many between users and recipes
-- =============================================

create table favorites (
  user_id uuid not null references profiles(user_id) on delete cascade,
  recipe_id uuid not null references recipes(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, recipe_id)
);

-- enable row level security on favorites
alter table favorites enable row level security;

-- rls policy: authenticated users can select their own favorites
create policy favorites_select on favorites
  for select
  to authenticated
  using (auth.uid() = user_id);

-- rls policy: authenticated users can insert their own favorites
create policy favorites_insert on favorites
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- rls policy: authenticated users can update their own favorites
-- note: update is rarely needed for favorites, but included for completeness
create policy favorites_update on favorites
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- rls policy: authenticated users can delete their own favorites
create policy favorites_delete on favorites
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- =============================================
-- Table: collections
-- Purpose: User-created recipe collections for organization
-- Note: Collections are user-specific and not shared in MVP
-- =============================================

create table collections (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(user_id) on delete cascade,
  name varchar(100) not null,
  created_at timestamptz not null default now(),
  -- ensure collection names are unique per user
  unique (user_id, name)
);

-- enable row level security on collections
alter table collections enable row level security;

-- rls policy: authenticated users can select their own collections
create policy collections_select on collections
  for select
  to authenticated
  using (auth.uid() = user_id);

-- rls policy: authenticated users can insert their own collections
create policy collections_insert on collections
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- rls policy: authenticated users can update their own collections
create policy collections_update on collections
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- rls policy: authenticated users can delete their own collections
create policy collections_delete on collections
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- =============================================
-- Table: collection_recipes
-- Purpose: Junction table for collections and recipes (many-to-many)
-- Note: A recipe can be in multiple collections, collections can have multiple recipes
-- =============================================

create table collection_recipes (
  collection_id uuid not null references collections(id) on delete cascade,
  recipe_id uuid not null references recipes(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (collection_id, recipe_id)
);

-- enable row level security on collection_recipes
alter table collection_recipes enable row level security;

-- rls policy: authenticated users can select recipes in their own collections
create policy collection_recipes_select on collection_recipes
  for select
  to authenticated
  using (
    exists (
      select 1 from collections
      where collections.id = collection_recipes.collection_id
      and collections.user_id = auth.uid()
    )
  );

-- rls policy: authenticated users can insert recipes into their own collections
create policy collection_recipes_insert on collection_recipes
  for insert
  to authenticated
  with check (
    exists (
      select 1 from collections
      where collections.id = collection_recipes.collection_id
      and collections.user_id = auth.uid()
    )
  );

-- rls policy: authenticated users can update recipes in their own collections
create policy collection_recipes_update on collection_recipes
  for update
  to authenticated
  using (
    exists (
      select 1 from collections
      where collections.id = collection_recipes.collection_id
      and collections.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from collections
      where collections.id = collection_recipes.collection_id
      and collections.user_id = auth.uid()
    )
  );

-- rls policy: authenticated users can delete recipes from their own collections
create policy collection_recipes_delete on collection_recipes
  for delete
  to authenticated
  using (
    exists (
      select 1 from collections
      where collections.id = collection_recipes.collection_id
      and collections.user_id = auth.uid()
    )
  );

-- =============================================
-- Table: recipe_ratings
-- Purpose: User ratings and cooking status for recipes
-- Note: One rating per user-recipe pair, visible to all users
-- =============================================

create table recipe_ratings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(user_id) on delete cascade,
  recipe_id uuid not null references recipes(id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  did_cook boolean not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- ensure one rating per user-recipe combination
  unique (user_id, recipe_id)
);

-- enable row level security on recipe_ratings
alter table recipe_ratings enable row level security;

-- rls policy: anonymous users can select all ratings (public data for trust/transparency)
create policy recipe_ratings_select_anon on recipe_ratings
  for select
  to anon
  using (true);

-- rls policy: authenticated users can select all ratings (public data for trust/transparency)
create policy recipe_ratings_select_auth on recipe_ratings
  for select
  to authenticated
  using (true);

-- rls policy: authenticated users can insert only their own ratings
create policy recipe_ratings_insert on recipe_ratings
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- rls policy: authenticated users can update only their own ratings
create policy recipe_ratings_update on recipe_ratings
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- rls policy: authenticated users can delete only their own ratings
create policy recipe_ratings_delete on recipe_ratings
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- =============================================
-- Table: meal_plans
-- Purpose: Meal planning calendar for users
-- Note: Future-proofed with meal_type enum for breakfast/lunch/dinner/snack
-- =============================================

create table meal_plans (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(user_id) on delete cascade,
  recipe_id uuid not null references recipes(id) on delete cascade,
  planned_date date not null,
  meal_type varchar(20) not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  created_at timestamptz not null default now(),
  -- ensure unique combination: one recipe per meal type per day per user
  unique (user_id, recipe_id, planned_date, meal_type)
);

-- enable row level security on meal_plans
alter table meal_plans enable row level security;

-- rls policy: authenticated users can select their own meal plans
create policy meal_plans_select on meal_plans
  for select
  to authenticated
  using (auth.uid() = user_id);

-- rls policy: authenticated users can insert their own meal plans
create policy meal_plans_insert on meal_plans
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- rls policy: authenticated users can update their own meal plans
create policy meal_plans_update on meal_plans
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- rls policy: authenticated users can delete their own meal plans
create policy meal_plans_delete on meal_plans
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- =============================================
-- Comments for documentation
-- =============================================

comment on table favorites is 'User favorite recipes for quick access. Separate from collections for simpler UX.';
comment on table collections is 'User-created recipe collections for organization. Collection names must be unique per user.';
comment on table collection_recipes is 'Junction table for many-to-many relationship between collections and recipes.';
comment on column collection_recipes.added_at is 'Timestamp when recipe was added to collection. Enables sorting by "recently added".';

comment on table recipe_ratings is 'User ratings and cooking status for recipes. Publicly visible for transparency and trust.';
comment on column recipe_ratings.rating is 'Star rating from 1-5. Validated at database level.';
comment on column recipe_ratings.did_cook is 'Indicates if user actually cooked the recipe. Used for quality metrics.';

comment on table meal_plans is 'Meal planning calendar. Supports multiple meal types per day for flexible planning.';
comment on column meal_plans.meal_type is 'Type of meal: breakfast, lunch, dinner, or snack. Enables filtering by meal type.';
comment on column meal_plans.planned_date is 'Date for which meal is planned. Use DATE type for efficient date-based queries.';
