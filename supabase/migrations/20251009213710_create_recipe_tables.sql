-- =============================================
-- Migration: Create Recipe Tables
-- Description: Creates core recipe tables with JSONB storage for flexible MVP development
-- Affected Tables: recipes, recipe_tags, recipe_modifications, ingredient_substitutions
-- Dependencies: Requires profiles and tags tables from previous migration
-- =============================================

-- =============================================
-- Table: recipes
-- Purpose: Core recipe data with JSONB for ingredients, steps, and nutrition
-- Features: Polish full-text search, public recipe sharing, nutritional validation
-- =============================================

create table recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(user_id) on delete cascade,
  title varchar(255) not null,
  description text,
  -- ingredients stored as jsonb array: [{"name": "mąka", "amount": 200, "unit": "g"}]
  ingredients jsonb not null,
  -- steps stored as jsonb array: [{"step_number": 1, "instruction": "..."}]
  steps jsonb not null,
  servings integer not null check (servings > 0),
  -- nutrition per serving: {"calories": 450, "protein": 25, "fat": 15, "carbs": 50, "fiber": 8, "salt": 2}
  nutrition_per_serving jsonb not null,
  prep_time_minutes integer check (prep_time_minutes > 0),
  is_public boolean not null default false,
  featured boolean not null default false,
  -- generated tsvector column for full-text search
  -- weighted: title (A) has higher priority than description (B)
  -- uses 'simple' configuration (language-agnostic) for compatibility
  -- note: for production with polish language support, change 'simple' to 'polish'
  search_vector tsvector generated always as (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(description, '')), 'B')
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- ensure nutrition_per_serving has all required fields
  constraint valid_nutrition check (
    jsonb_typeof(nutrition_per_serving) = 'object' and
    nutrition_per_serving ? 'calories' and
    nutrition_per_serving ? 'protein' and
    nutrition_per_serving ? 'fat' and
    nutrition_per_serving ? 'carbs' and
    nutrition_per_serving ? 'fiber' and
    nutrition_per_serving ? 'salt'
  )
);

-- enable row level security on recipes
alter table recipes enable row level security;

-- rls policy: anonymous users can select public recipes
create policy recipes_select_anon on recipes
  for select
  to anon
  using (is_public = true);

-- rls policy: authenticated users can select public recipes or their own recipes
create policy recipes_select_auth on recipes
  for select
  to authenticated
  using (is_public = true or auth.uid() = user_id);

-- rls policy: authenticated users can insert their own recipes
create policy recipes_insert on recipes
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- rls policy: authenticated users can update only their own recipes
create policy recipes_update on recipes
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- rls policy: authenticated users can delete only their own recipes
create policy recipes_delete on recipes
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- =============================================
-- Table: recipe_tags
-- Purpose: Junction table for recipe-tag relationship (many-to-many)
-- Note: Uses restrict on tag deletion to prevent accidental removal of reference data
-- =============================================

create table recipe_tags (
  recipe_id uuid not null references recipes(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (recipe_id, tag_id)
);

-- enable row level security on recipe_tags
alter table recipe_tags enable row level security;

-- rls policy: anonymous users can select tags for public recipes
create policy recipe_tags_select_anon on recipe_tags
  for select
  to anon
  using (
    exists (
      select 1 from recipes
      where recipes.id = recipe_tags.recipe_id
      and recipes.is_public = true
    )
  );

-- rls policy: authenticated users can select tags for public recipes or their own recipes
create policy recipe_tags_select_auth on recipe_tags
  for select
  to authenticated
  using (
    exists (
      select 1 from recipes
      where recipes.id = recipe_tags.recipe_id
      and (recipes.is_public = true or recipes.user_id = auth.uid())
    )
  );

-- rls policy: authenticated users can insert tags only for their own recipes
create policy recipe_tags_insert on recipe_tags
  for insert
  to authenticated
  with check (
    exists (
      select 1 from recipes
      where recipes.id = recipe_tags.recipe_id
      and recipes.user_id = auth.uid()
    )
  );

-- rls policy: authenticated users can update tags only for their own recipes
create policy recipe_tags_update on recipe_tags
  for update
  to authenticated
  using (
    exists (
      select 1 from recipes
      where recipes.id = recipe_tags.recipe_id
      and recipes.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from recipes
      where recipes.id = recipe_tags.recipe_id
      and recipes.user_id = auth.uid()
    )
  );

-- rls policy: authenticated users can delete tags only for their own recipes
create policy recipe_tags_delete on recipe_tags
  for delete
  to authenticated
  using (
    exists (
      select 1 from recipes
      where recipes.id = recipe_tags.recipe_id
      and recipes.user_id = auth.uid()
    )
  );

-- =============================================
-- Table: recipe_modifications
-- Purpose: Stores AI-generated modifications of recipes
-- Note: Preserves original recipe by storing modifications separately
-- =============================================

create table recipe_modifications (
  id uuid primary key default gen_random_uuid(),
  original_recipe_id uuid not null references recipes(id) on delete cascade,
  user_id uuid not null references profiles(user_id) on delete cascade,
  modification_type varchar(50) not null check (modification_type in (
    'reduce_calories',
    'increase_calories',
    'increase_protein',
    'increase_fiber',
    'portion_size',
    'ingredient_substitution'
  )),
  -- stores complete modified recipe data: ingredients, steps, nutrition, servings, notes
  modified_data jsonb not null,
  created_at timestamptz not null default now()
);

-- enable row level security on recipe_modifications
alter table recipe_modifications enable row level security;

-- rls policy: authenticated users can select their own recipe modifications
create policy recipe_modifications_select on recipe_modifications
  for select
  to authenticated
  using (auth.uid() = user_id);

-- rls policy: authenticated users can insert their own recipe modifications
create policy recipe_modifications_insert on recipe_modifications
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- rls policy: authenticated users can update their own recipe modifications
create policy recipe_modifications_update on recipe_modifications
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- rls policy: authenticated users can delete their own recipe modifications
create policy recipe_modifications_delete on recipe_modifications
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- =============================================
-- Table: ingredient_substitutions
-- Purpose: Knowledge base for common ingredient substitutions
-- Note: Reduces AI API calls by providing pre-calculated substitution data
-- =============================================

create table ingredient_substitutions (
  id uuid primary key default gen_random_uuid(),
  original_ingredient varchar(100) not null,
  substitute_ingredient varchar(100) not null,
  -- nutrition comparison: {"original": {...}, "substitute": {...}}
  nutrition_comparison jsonb not null,
  healthier boolean not null,
  created_at timestamptz not null default now(),
  unique (original_ingredient, substitute_ingredient)
);

-- enable row level security on ingredient_substitutions
alter table ingredient_substitutions enable row level security;

-- rls policy: anonymous users can select ingredient substitutions (public reference data)
create policy ingredient_substitutions_select_anon on ingredient_substitutions
  for select
  to anon
  using (true);

-- rls policy: authenticated users can select ingredient substitutions (public reference data)
create policy ingredient_substitutions_select_auth on ingredient_substitutions
  for select
  to authenticated
  using (true);

-- =============================================
-- Comments for documentation
-- =============================================

comment on table recipes is 'Core recipe data with JSONB storage for flexible ingredients, steps, and nutrition. Supports public sharing and Polish full-text search.';
comment on column recipes.ingredients is 'JSONB array of ingredients with structure: [{"name": "mąka", "amount": 200, "unit": "g"}]';
comment on column recipes.steps is 'JSONB array of preparation steps with structure: [{"step_number": 1, "instruction": "..."}]';
comment on column recipes.nutrition_per_serving is 'JSONB object with required nutritional values per serving in standard units (kcal, grams)';
comment on column recipes.search_vector is 'Auto-generated tsvector for Polish full-text search. Weighted: title (A) > description (B)';
comment on column recipes.is_public is 'When true, recipe is visible to all users (including anonymous). Only owner can modify.';
comment on column recipes.featured is 'Admin-curated featured recipes for discovery. Requires admin privileges to set.';

comment on table recipe_tags is 'Junction table for many-to-many relationship between recipes and tags. Enables recipe categorization and filtering.';
comment on table recipe_modifications is 'Stores AI-generated recipe modifications. Preserves original recipe integrity by keeping modifications separate.';
comment on column recipe_modifications.modification_type is 'Type of AI modification applied. Used for tracking modification patterns and analytics.';
comment on column recipe_modifications.modified_data is 'Complete snapshot of modified recipe including: ingredients, steps, nutrition_per_serving, servings, modification_notes';

comment on table ingredient_substitutions is 'Knowledge base of common ingredient substitutions with nutritional comparisons. Reduces AI API usage.';
comment on column ingredient_substitutions.healthier is 'Indicates if substitute is nutritionally superior to original ingredient';
