# HealthyMeal Database Schema

## 1. Tables with Columns, Data Types, and Constraints

### 1.0 Supabase-Managed Authentication

#### auth.users (Managed by Supabase)

**IMPORTANT**: This table is automatically created and managed by Supabase Auth. Do NOT create or modify this table directly.

The `auth.users` table is part of the `auth` schema and contains:

- `id` (UUID) - Primary key, used as foreign key in `profiles.user_id`
- `email` (VARCHAR) - User's email address
- `encrypted_password` (VARCHAR) - Hashed password
- `email_confirmed_at` (TIMESTAMPTZ) - Email verification timestamp
- `created_at` (TIMESTAMPTZ) - Account creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp
- `last_sign_in_at` (TIMESTAMPTZ) - Last login timestamp
- Additional Supabase Auth metadata fields

**Key Points**:

- Supabase handles all authentication logic (signup, login, password reset, email verification)
- Use Supabase Auth SDK for all authentication operations
- The `profiles` table extends user data with application-specific fields
- When a user is deleted from `auth.users`, CASCADE delete removes their profile and all related data

### 1.1 User Management

#### profiles

Stores user profile information and dietary preferences.

```sql
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  weight DECIMAL(5,2) CHECK (weight >= 40 AND weight <= 200),
  age INTEGER CHECK (age >= 13 AND age <= 100),
  gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  activity_level VARCHAR(20) CHECK (activity_level IN ('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active')),
  diet_type VARCHAR(30) CHECK (diet_type IN ('high_protein', 'keto', 'vegetarian', 'weight_gain', 'weight_loss', 'balanced')),
  target_goal VARCHAR(30) CHECK (target_goal IN ('lose_weight', 'gain_weight', 'maintain_weight')),
  target_value DECIMAL(5,2), -- target weight change in kg
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### allergens

Reference table for predefined allergens.

```sql
CREATE TABLE allergens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### user_allergens

Junction table for user allergen preferences (many-to-many).

```sql
CREATE TABLE user_allergens (
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  allergen_id UUID NOT NULL REFERENCES allergens(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, allergen_id)
);
```

#### user_disliked_ingredients

Stores user's disliked ingredients as free text.

```sql
CREATE TABLE user_disliked_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  ingredient_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, ingredient_name)
);
```

### 1.2 Recipe Management

#### tags

Predefined recipe categories (15-20 tags).

```sql
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### recipes

Core recipe data with JSONB for flexible storage.

```sql
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  ingredients JSONB NOT NULL, -- [{"name": "mąka", "amount": 200, "unit": "g"}]
  steps JSONB NOT NULL, -- [{"step_number": 1, "instruction": "..."}]
  servings INTEGER NOT NULL CHECK (servings > 0),
  nutrition_per_serving JSONB NOT NULL, -- {"calories": 450, "protein": 25, "fat": 15, "carbs": 50, "fiber": 8, "salt": 2}
  prep_time_minutes INTEGER CHECK (prep_time_minutes > 0),
  is_public BOOLEAN NOT NULL DEFAULT false,
  featured BOOLEAN NOT NULL DEFAULT false,
  search_vector TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('polish', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('polish', coalesce(description, '')), 'B')
  ) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_nutrition CHECK (
    jsonb_typeof(nutrition_per_serving) = 'object' AND
    nutrition_per_serving ? 'calories' AND
    nutrition_per_serving ? 'protein' AND
    nutrition_per_serving ? 'fat' AND
    nutrition_per_serving ? 'carbs' AND
    nutrition_per_serving ? 'fiber' AND
    nutrition_per_serving ? 'salt'
  )
);
```

#### recipe_tags

Junction table for recipe-tag relationship (many-to-many).

```sql
CREATE TABLE recipe_tags (
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (recipe_id, tag_id)
);
```

#### recipe_modifications

Stores AI-generated modifications of recipes.

```sql
CREATE TABLE recipe_modifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  modification_type VARCHAR(50) NOT NULL CHECK (modification_type IN (
    'reduce_calories',
    'increase_calories',
    'increase_protein',
    'increase_fiber',
    'portion_size',
    'ingredient_substitution'
  )),
  modified_data JSONB NOT NULL, -- Stores changed ingredients, steps, nutrition
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 1.3 User Interactions

#### favorites

Stores user's favorite recipes.

```sql
CREATE TABLE favorites (
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, recipe_id)
);
```

#### collections

User-created recipe collections.

```sql
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, name)
);
```

#### collection_recipes

Junction table for collections and recipes (many-to-many).

```sql
CREATE TABLE collection_recipes (
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (collection_id, recipe_id)
);
```

#### recipe_ratings

User ratings and cooking status for recipes.

```sql
CREATE TABLE recipe_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  did_cook BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, recipe_id)
);
```

#### meal_plans

Meal planning calendar.

```sql
CREATE TABLE meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  planned_date DATE NOT NULL,
  meal_type VARCHAR(20) NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, recipe_id, planned_date, meal_type)
);
```

### 1.4 AI Support

#### ingredient_substitutions

Knowledge base for common ingredient substitutions.

```sql
CREATE TABLE ingredient_substitutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_ingredient VARCHAR(100) NOT NULL,
  substitute_ingredient VARCHAR(100) NOT NULL,
  nutrition_comparison JSONB NOT NULL, -- {"original": {...}, "substitute": {...}}
  healthier BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (original_ingredient, substitute_ingredient)
);
```

## 2. Relationships Between Tables

### User → Profile (1:1)

- `profiles.user_id` → `auth.users.id` (CASCADE on delete)

### User ↔ Allergens (M:M via user_allergens)

- `user_allergens.user_id` → `profiles.user_id` (CASCADE on delete)
- `user_allergens.allergen_id` → `allergens.id` (RESTRICT on delete)

### User → Disliked Ingredients (1:M)

- `user_disliked_ingredients.user_id` → `profiles.user_id` (CASCADE on delete)

### User → Recipes (1:M)

- `recipes.user_id` → `profiles.user_id` (CASCADE on delete)

### Recipe ↔ Tags (M:M via recipe_tags)

- `recipe_tags.recipe_id` → `recipes.id` (CASCADE on delete)
- `recipe_tags.tag_id` → `tags.id` (RESTRICT on delete)

### Recipe → Modifications (1:M)

- `recipe_modifications.original_recipe_id` → `recipes.id` (CASCADE on delete)
- `recipe_modifications.user_id` → `profiles.user_id` (CASCADE on delete)

### User ↔ Recipes (M:M via favorites)

- `favorites.user_id` → `profiles.user_id` (CASCADE on delete)
- `favorites.recipe_id` → `recipes.id` (CASCADE on delete)

### User → Collections → Recipes (1:M:M)

- `collections.user_id` → `profiles.user_id` (CASCADE on delete)
- `collection_recipes.collection_id` → `collections.id` (CASCADE on delete)
- `collection_recipes.recipe_id` → `recipes.id` (CASCADE on delete)

### User ↔ Recipes (M:M via recipe_ratings)

- `recipe_ratings.user_id` → `profiles.user_id` (CASCADE on delete)
- `recipe_ratings.recipe_id` → `recipes.id` (CASCADE on delete)

### User ↔ Recipes (M:M via meal_plans)

- `meal_plans.user_id` → `profiles.user_id` (CASCADE on delete)
- `meal_plans.recipe_id` → `recipes.id` (CASCADE on delete)

## 3. Indexes

### Primary Key Indexes (automatically created)

All tables have UUID primary keys which automatically create unique indexes.

### Full-Text Search

```sql
CREATE INDEX idx_recipes_search_vector ON recipes USING GIN (search_vector);
```

### Foreign Key Indexes (for performance)

```sql
-- User relationships
CREATE INDEX idx_recipes_user_id ON recipes(user_id);
CREATE INDEX idx_recipe_modifications_user_id ON recipe_modifications(user_id);
CREATE INDEX idx_recipe_modifications_original_recipe_id ON recipe_modifications(original_recipe_id);
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_recipe_id ON favorites(recipe_id);
CREATE INDEX idx_collections_user_id ON collections(user_id);
CREATE INDEX idx_collection_recipes_collection_id ON collection_recipes(collection_id);
CREATE INDEX idx_collection_recipes_recipe_id ON collection_recipes(recipe_id);
CREATE INDEX idx_meal_plans_user_id ON meal_plans(user_id);
CREATE INDEX idx_meal_plans_recipe_id ON meal_plans(recipe_id);
CREATE INDEX idx_recipe_ratings_user_id ON recipe_ratings(user_id);
CREATE INDEX idx_recipe_ratings_recipe_id ON recipe_ratings(recipe_id);

-- Tag filtering
CREATE INDEX idx_recipe_tags_tag_id ON recipe_tags(tag_id);
CREATE INDEX idx_recipe_tags_recipe_id ON recipe_tags(recipe_id);

-- Allergen filtering
CREATE INDEX idx_user_allergens_user_id ON user_allergens(user_id);
CREATE INDEX idx_user_allergens_allergen_id ON user_allergens(allergen_id);
```

### Filter Indexes

```sql
-- Numeric filters for recipe search
CREATE INDEX idx_recipes_prep_time ON recipes(prep_time_minutes) WHERE prep_time_minutes IS NOT NULL;
CREATE INDEX idx_recipes_is_public ON recipes(is_public) WHERE is_public = true;
CREATE INDEX idx_recipes_featured ON recipes(featured) WHERE featured = true;

-- Meal planning date filter
CREATE INDEX idx_meal_plans_planned_date ON meal_plans(planned_date);

-- JSONB nutrition filtering (GIN index for containment queries)
CREATE INDEX idx_recipes_nutrition ON recipes USING GIN (nutrition_per_serving);
```

### Composite Indexes

```sql
-- Recipe search by user and public status
CREATE INDEX idx_recipes_user_public ON recipes(user_id, is_public);

-- Meal planning calendar queries
CREATE INDEX idx_meal_plans_user_date ON meal_plans(user_id, planned_date);
```

## 4. PostgreSQL Policies (Row-Level Security)

### Enable RLS on all user-facing tables

```sql
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
```

### Profiles Policies

```sql
-- Users can view only their own profile
CREATE POLICY profiles_select_own ON profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own profile
CREATE POLICY profiles_insert_own ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update only their own profile
CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own profile
CREATE POLICY profiles_delete_own ON profiles
  FOR DELETE
  USING (auth.uid() = user_id);
```

### User Allergens Policies

```sql
CREATE POLICY user_allergens_all ON user_allergens
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### User Disliked Ingredients Policies

```sql
CREATE POLICY user_disliked_ingredients_all ON user_disliked_ingredients
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### Recipes Policies

```sql
-- Users can view public recipes OR their own recipes
CREATE POLICY recipes_select ON recipes
  FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);

-- Users can insert their own recipes
CREATE POLICY recipes_insert_own ON recipes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update only their own recipes
CREATE POLICY recipes_update_own ON recipes
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete only their own recipes
CREATE POLICY recipes_delete_own ON recipes
  FOR DELETE
  USING (auth.uid() = user_id);
```

### Recipe Tags Policies

```sql
-- Users can view tags for public recipes or their own recipes
CREATE POLICY recipe_tags_select ON recipe_tags
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_tags.recipe_id
      AND (recipes.is_public = true OR recipes.user_id = auth.uid())
    )
  );

-- Users can manage tags only for their own recipes
CREATE POLICY recipe_tags_modify ON recipe_tags
  FOR ALL
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

### Recipe Modifications Policies

```sql
CREATE POLICY recipe_modifications_all ON recipe_modifications
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### Favorites Policies

```sql
CREATE POLICY favorites_all ON favorites
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### Collections Policies

```sql
CREATE POLICY collections_all ON collections
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### Collection Recipes Policies

```sql
CREATE POLICY collection_recipes_all ON collection_recipes
  FOR ALL
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
```

### Recipe Ratings Policies

```sql
-- Users can view all ratings
CREATE POLICY recipe_ratings_select_all ON recipe_ratings
  FOR SELECT
  USING (true);

-- Users can insert only their own ratings
CREATE POLICY recipe_ratings_insert_own ON recipe_ratings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update only their own ratings
CREATE POLICY recipe_ratings_update_own ON recipe_ratings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete only their own ratings
CREATE POLICY recipe_ratings_delete_own ON recipe_ratings
  FOR DELETE
  USING (auth.uid() = user_id);
```

### Meal Plans Policies

```sql
CREATE POLICY meal_plans_all ON meal_plans
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### Reference Tables (Public Read Access)

```sql
-- Allergens are publicly readable
ALTER TABLE allergens ENABLE ROW LEVEL SECURITY;
CREATE POLICY allergens_select_all ON allergens
  FOR SELECT
  USING (true);

-- Tags are publicly readable
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY tags_select_all ON tags
  FOR SELECT
  USING (true);

-- Ingredient substitutions are publicly readable
ALTER TABLE ingredient_substitutions ENABLE ROW LEVEL SECURITY;
CREATE POLICY ingredient_substitutions_select_all ON ingredient_substitutions
  FOR SELECT
  USING (true);
```

## 5. Database Functions and Triggers

### Auto-update updated_at timestamp

```sql
CREATE OR REPLACE FUNCTION auto_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at column
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_update_updated_at();

CREATE TRIGGER recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW
  EXECUTE FUNCTION auto_update_updated_at();

CREATE TRIGGER recipe_ratings_updated_at
  BEFORE UPDATE ON recipe_ratings
  FOR EACH ROW
  EXECUTE FUNCTION auto_update_updated_at();
```

## 6. Materialized Views for Admin Dashboard

### User Statistics

```sql
CREATE MATERIALIZED VIEW mv_user_statistics AS
SELECT
  COUNT(DISTINCT user_id) as total_users,
  COUNT(DISTINCT CASE WHEN diet_type IS NOT NULL THEN user_id END) as users_with_preferences,
  ROUND(
    100.0 * COUNT(DISTINCT CASE WHEN diet_type IS NOT NULL THEN user_id END) /
    NULLIF(COUNT(DISTINCT user_id), 0),
    2
  ) as preference_completion_rate,
  COUNT(DISTINCT CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN user_id END) as new_users_last_7_days,
  COUNT(DISTINCT CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN user_id END) as new_users_last_30_days
FROM profiles;

-- Index for faster refresh
CREATE UNIQUE INDEX ON mv_user_statistics ((true));
```

### Recipe Statistics

```sql
CREATE MATERIALIZED VIEW mv_recipe_statistics AS
SELECT
  COUNT(DISTINCT r.id) as total_recipes,
  COUNT(DISTINCT CASE WHEN r.is_public THEN r.id END) as public_recipes,
  COUNT(DISTINCT rm.id) as total_modifications,
  ROUND(
    COUNT(DISTINCT rm.id)::DECIMAL / NULLIF(COUNT(DISTINCT r.id), 0),
    2
  ) as avg_modifications_per_recipe,
  rm.modification_type,
  COUNT(*) as modification_count
FROM recipes r
LEFT JOIN recipe_modifications rm ON r.id = rm.original_recipe_id
GROUP BY rm.modification_type;

-- Index for faster refresh
CREATE UNIQUE INDEX ON mv_recipe_statistics (modification_type);
```

### Rating Statistics

```sql
CREATE MATERIALIZED VIEW mv_rating_statistics AS
SELECT
  COUNT(*) as total_ratings,
  ROUND(AVG(rating)::NUMERIC, 2) as average_rating,
  COUNT(CASE WHEN did_cook THEN 1 END) as recipes_cooked,
  ROUND(
    100.0 * COUNT(CASE WHEN did_cook THEN 1 END) / NULLIF(COUNT(*), 0),
    2
  ) as cook_percentage,
  COUNT(CASE WHEN rating >= 4 THEN 1 END) as positive_ratings,
  COUNT(CASE WHEN rating <= 2 THEN 1 END) as negative_ratings
FROM recipe_ratings;

-- Index for faster refresh
CREATE UNIQUE INDEX ON mv_rating_statistics ((true));
```

### Refresh Schedule

```sql
-- Function to refresh all materialized views
CREATE OR REPLACE FUNCTION refresh_admin_statistics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_statistics;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_recipe_statistics;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_rating_statistics;
END;
$$ LANGUAGE plpgsql;

-- Note: Schedule this function to run daily at midnight using pg_cron or application scheduler
```

## 7. Additional Notes and Design Decisions

### Polish Language Support

- **Extension Required**: Enable `unaccent` extension to handle Polish diacritics (ą, ć, ę, ł, ń, ó, ś, ź, ż)
  ```sql
  CREATE EXTENSION IF NOT EXISTS unaccent;
  ```
- **Text Search Configuration**: Use `polish` configuration for full-text search
- **Generated Column**: `recipes.search_vector` automatically maintains search index
- **GIN Index**: Optimizes full-text search queries

### JSONB Design Decisions

#### Ingredients Structure

```json
[
  {
    "name": "mąka pszenna",
    "amount": 200,
    "unit": "g"
  },
  {
    "name": "jajka",
    "amount": 2,
    "unit": "sztuki"
  }
]
```

- Flexible for MVP, allows varied ingredient formats
- Future: Consider normalization if advanced ingredient search needed

#### Steps Structure

```json
[
  {
    "step_number": 1,
    "instruction": "Wymieszaj mąkę z jajkami"
  },
  {
    "step_number": 2,
    "instruction": "Formuj placki i smaż na patelni"
  }
]
```

- Structured format supports AI modifications
- `step_number` enables reordering and insertion

#### Nutrition Per Serving Structure

```json
{
  "calories": 450,
  "protein": 25,
  "fat": 15,
  "carbs": 50,
  "fiber": 8,
  "salt": 2
}
```

- All values in standard units (kcal, grams)
- CHECK constraint ensures all required fields present
- Easy to extend with vitamins, minerals later

#### Modified Data Structure (recipe_modifications)

```json
{
  "ingredients": [...],
  "steps": [...],
  "nutrition_per_serving": {...},
  "servings": 4,
  "modification_notes": "Zmniejszono kalorie przez zastąpienie masła oliwą"
}
```

- Complete snapshot of modified recipe
- Preserves original recipe integrity

### Security Considerations

1. **RLS Enabled**: All user-facing tables protected
2. **User Isolation**: Users can only access their own data
3. **Public Recipes**: Special policy allows viewing public recipes while restricting modifications
4. **Cascade Deletes**: User deletion automatically cleans up all associated data (GDPR compliance)
5. **Reference Data Protection**: Tags and allergens use RESTRICT to prevent accidental deletion

### Performance Considerations

1. **Strategic Indexing**: Balance between query performance and write overhead
2. **Materialized Views**: Reduce load on admin dashboard queries
3. **JSONB Indexing**: GIN indexes enable efficient JSONB queries
4. **Partial Indexes**: Filter indexes reduce index size for sparse conditions
5. **Composite Indexes**: Optimize common multi-column queries

### Scalability Path

1. **Immediate MVP**: Current schema handles thousands of users efficiently
2. **Growth Phase** (10k+ users):
   - Add read replicas for SELECT queries
   - Implement connection pooling (PgBouncer)
   - Consider partitioning `meal_plans` by date
3. **Scale Phase** (100k+ users):
   - Partition large tables by user_id or date
   - Move search to dedicated full-text search engine (e.g., Typesense)
   - Implement caching layer (Redis) for frequently accessed data

### Data Validation

- **Database Level**: CHECK constraints enforce business rules at the lowest level
- **Application Level**: Additional validation in TypeScript/Zod for user-friendly error messages
- **JSONB Schemas**: CHECK constraints validate JSONB structure

### Migration Strategy

1. **Phase 1**: Create extensions and base tables
2. **Phase 2**: Create indexes
3. **Phase 3**: Create functions and triggers
4. **Phase 4**: Enable RLS and create policies
5. **Phase 5**: Create materialized views
6. **Phase 6**: Seed reference data (tags, allergens)

### Seed Data Examples

#### Tags (15-20 categories)

```sql
INSERT INTO tags (name, slug) VALUES
  ('Śniadanie', 'sniadanie'),
  ('Obiad', 'obiad'),
  ('Kolacja', 'kolacja'),
  ('Deser', 'deser'),
  ('Przekąska', 'przekaska'),
  ('Wegetariańskie', 'wegetarianskie'),
  ('Wegańskie', 'weganskie'),
  ('Wysokobiałkowe', 'wysokobialko'),
  ('Niskokaloryczne', 'niskokaloryczne'),
  ('Keto', 'keto'),
  ('Szybkie (<30 min)', 'szybkie'),
  ('Fit', 'fit'),
  ('Comfort Food', 'comfort-food'),
  ('Sałatki', 'salatki'),
  ('Zupy', 'zupy'),
  ('Dania główne', 'dania-glowne'),
  ('Smoothie', 'smoothie'),
  ('Bez glutenu', 'bez-glutenu'),
  ('Bez laktozy', 'bez-laktozy');
```

#### Allergens (common Polish allergens)

```sql
INSERT INTO allergens (name) VALUES
  ('Gluten'),
  ('Jaja'),
  ('Mleko'),
  ('Orzechy'),
  ('Orzeszki ziemne'),
  ('Soja'),
  ('Ryby'),
  ('Skorupiaki'),
  ('Mięczaki'),
  ('Seler'),
  ('Gorczyca'),
  ('Sezam'),
  ('Łubin'),
  ('Dwutlenek siarki');
```

### Admin Access

For admin dashboard access, use Supabase custom claims or create admin check function:

```sql
-- Create admin role check function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user has admin role in auth.users metadata
  RETURN (
    SELECT COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'role')::TEXT = 'admin',
      false
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to materialized views for admins
CREATE POLICY mv_user_statistics_admin ON mv_user_statistics
  FOR SELECT
  USING (is_admin());
```

### Monitoring Recommendations

1. **Query Performance**: Monitor slow queries, especially full-text search
2. **Index Usage**: Track unused indexes, consider removal
3. **Table Bloat**: Regular VACUUM ANALYZE on high-write tables
4. **Materialized View Freshness**: Alert if views not refreshed within 25 hours
5. **Connection Pool**: Monitor connection usage and wait times

### Future Enhancements (Post-MVP)

1. **Soft Deletes**: Add `deleted_at` column for recipe recovery
2. **Version Control**: Implement full recipe versioning system
3. **Activity Logging**: Detailed user activity tracking for retention analysis
4. **Multi-language**: Add translation tables for international expansion
5. **Image Support**: Add `recipe_images` table with CDN URLs
6. **Sharing**: Implement recipe sharing with permissions
7. **Comments**: Add `recipe_comments` table for user feedback
8. **Nutritional AI Tracking**: Log AI API usage and costs
