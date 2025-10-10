-- =============================================
-- Migration: Create Base Tables and Extensions
-- Description: Creates PostgreSQL extensions and foundational tables for user management
-- Affected Tables: profiles, allergens, user_allergens, user_disliked_ingredients, tags
-- Dependencies: Requires Supabase Auth (auth.users table must exist)
-- =============================================

-- =============================================
-- Extensions
-- =============================================

-- enable uuid generation for primary keys
create extension if not exists "uuid-ossp";

-- enable unaccent extension for polish language support
-- this handles polish diacritics (ą, ć, ę, ł, ń, ó, ś, ź, ż) in full-text search
create extension if not exists "unaccent";

-- =============================================
-- Polish Text Search Configuration
-- =============================================

-- check if polish text search configuration exists
-- if not, we'll use simple (language-agnostic) as fallback
do $$
begin
  -- try to create a custom polish configuration if it doesn't exist
  if not exists (select 1 from pg_ts_config where cfgname = 'polish') then
    -- check if polish dictionary is available
    if exists (select 1 from pg_ts_dict where dictname = 'polish_stem') then
      raise notice 'Polish text search configuration available';
    else
      raise notice 'Polish text search not available, using simple configuration as fallback';
      raise notice 'For production, install postgresql-contrib package with Polish language support';
    end if;
  end if;
end $$;

-- =============================================
-- Table: profiles
-- Purpose: Stores user profile information and dietary preferences
-- Relationship: 1:1 with auth.users (Supabase-managed authentication table)
-- =============================================

create table profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  weight decimal(5,2) check (weight >= 40 and weight <= 200),
  age integer check (age >= 13 and age <= 100),
  gender varchar(20) check (gender in ('male', 'female', 'other', 'prefer_not_to_say')),
  activity_level varchar(20) check (activity_level in ('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active')),
  diet_type varchar(30) check (diet_type in ('high_protein', 'keto', 'vegetarian', 'weight_gain', 'weight_loss', 'balanced')),
  target_goal varchar(30) check (target_goal in ('lose_weight', 'gain_weight', 'maintain_weight')),
  target_value decimal(5,2), -- target weight change in kg
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- enable row level security on profiles
-- users should only access their own profile data
alter table profiles enable row level security;

-- rls policy: authenticated users can select their own profile
create policy profiles_select_own on profiles
  for select
  to authenticated
  using (auth.uid() = user_id);

-- rls policy: authenticated users can insert their own profile
create policy profiles_insert_own on profiles
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- rls policy: authenticated users can update their own profile
create policy profiles_update_own on profiles
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- rls policy: authenticated users can delete their own profile
create policy profiles_delete_own on profiles
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- =============================================
-- Table: allergens
-- Purpose: Reference table for predefined allergens (common polish allergens)
-- Access: Public read-only, admin-managed data
-- =============================================

create table allergens (
  id uuid primary key default uuid_generate_v4(),
  name_pl varchar(100) not null unique,
  created_at timestamptz not null default now()
);

-- enable row level security on allergens
alter table allergens enable row level security;

-- rls policy: anonymous users can select allergens (public reference data)
create policy allergens_select_anon on allergens
  for select
  to anon
  using (true);

-- rls policy: authenticated users can select allergens (public reference data)
create policy allergens_select_auth on allergens
  for select
  to authenticated
  using (true);

-- =============================================
-- Table: user_allergens
-- Purpose: Junction table for user allergen preferences (many-to-many)
-- Relationship: profiles <-> allergens
-- =============================================

create table user_allergens (
  user_id uuid not null references profiles(user_id) on delete cascade,
  allergen_id uuid not null references allergens(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (user_id, allergen_id)
);

-- enable row level security on user_allergens
alter table user_allergens enable row level security;

-- rls policy: authenticated users can select their own allergen preferences
create policy user_allergens_select on user_allergens
  for select
  to authenticated
  using (auth.uid() = user_id);

-- rls policy: authenticated users can insert their own allergen preferences
create policy user_allergens_insert on user_allergens
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- rls policy: authenticated users can update their own allergen preferences
create policy user_allergens_update on user_allergens
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- rls policy: authenticated users can delete their own allergen preferences
create policy user_allergens_delete on user_allergens
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- =============================================
-- Table: user_disliked_ingredients
-- Purpose: Stores user's disliked ingredients as free text
-- Note: Flexible text-based approach for MVP, can normalize later if needed
-- =============================================

create table user_disliked_ingredients (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(user_id) on delete cascade,
  ingredient_name varchar(100) not null,
  created_at timestamptz not null default now(),
  unique (user_id, ingredient_name)
);

-- enable row level security on user_disliked_ingredients
alter table user_disliked_ingredients enable row level security;

-- rls policy: authenticated users can select their own disliked ingredients
create policy user_disliked_ingredients_select on user_disliked_ingredients
  for select
  to authenticated
  using (auth.uid() = user_id);

-- rls policy: authenticated users can insert their own disliked ingredients
create policy user_disliked_ingredients_insert on user_disliked_ingredients
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- rls policy: authenticated users can update their own disliked ingredients
create policy user_disliked_ingredients_update on user_disliked_ingredients
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- rls policy: authenticated users can delete their own disliked ingredients
create policy user_disliked_ingredients_delete on user_disliked_ingredients
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- =============================================
-- Table: tags
-- Purpose: Predefined recipe categories (15-20 tags for filtering and organization)
-- Access: Public read-only, admin-managed data
-- =============================================

create table tags (
  id uuid primary key default uuid_generate_v4(),
  name varchar(100) not null unique,
  slug varchar(100) not null unique,
  created_at timestamptz not null default now()
);

-- enable row level security on tags
alter table tags enable row level security;

-- rls policy: anonymous users can select tags (public reference data)
create policy tags_select_anon on tags
  for select
  to anon
  using (true);

-- rls policy: authenticated users can select tags (public reference data)
create policy tags_select_auth on tags
  for select
  to authenticated
  using (true);

-- =============================================
-- Comments for documentation
-- =============================================

comment on table profiles is 'User profile information and dietary preferences. Extends auth.users with application-specific data.';
comment on column profiles.user_id is 'Foreign key to auth.users.id (Supabase-managed authentication table)';
comment on column profiles.weight is 'User weight in kilograms (validated range: 40-200kg)';
comment on column profiles.age is 'User age in years (validated range: 13-100)';
comment on column profiles.target_value is 'Target weight change in kilograms (positive for gain, negative for loss)';

comment on table allergens is 'Reference table for common polish allergens. Admin-managed, publicly readable.';
comment on table user_allergens is 'Junction table linking users to their allergen preferences (many-to-many relationship)';
comment on table user_disliked_ingredients is 'User-specified ingredients to avoid in recipes. Uses free-text for flexibility in MVP.';
comment on table tags is 'Predefined recipe categories for filtering and organization. Admin-managed, publicly readable.';
