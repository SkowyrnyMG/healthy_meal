# Database Planning Session Summary - HealthyMeal MVP

## Decisions

1. **User Authentication**: Use separate `profiles` table referencing Supabase's `auth.users` via `user_id` (UUID)
2. **Dietary Preferences**: Hybrid approach - simple preferences as columns, allergens and disliked ingredients in separate normalized tables
3. **Recipe Ingredients**: Store as JSONB array in `recipes` table for MVP flexibility
4. **Nutritional Values**: Store both `servings` count and `nutrition_per_serving` as JSONB
5. **Recipe Modifications**: Create separate `recipe_modifications` table to preserve original recipes
6. **Tags System**: Two tables (`tags` and `recipe_tags` junction) for predefined 15-20 categories
7. **Search Indexes**: Implement GIN index for full-text search, B-tree indexes for numeric filters
8. **Favorites & Collections**: Separate features with dedicated tables
9. **Meal Planning**: `meal_plans` table with date, meal_type enum for future-proofing
10. **Recipe Ratings**: `recipe_ratings` table with rating (1-5), did_cook boolean, unique per user-recipe
11. **Admin Statistics**: Use **materialized views** from the start (deviation from real-time suggestion)
12. **Activity Tracking**: Keep only `created_at` for MVP (minimal tracking)
13. **RLS Policies**: Standard user isolation + **recipes can be "public" (visible to all, editable by owner only)**
14. **Primary Keys**: Use UUIDs for all tables
15. **Timestamps**: Use TIMESTAMPTZ with auto-update trigger for `updated_at`
16. **Delete Strategy**: Hard deletes for MVP
17. **Partitioning**: Not needed for MVP, but design with future partitioning in mind
18. **Ingredient Substitutions**: Create `ingredient_substitutions` knowledge base table
19. **AI Usage Tracking**: Skip for MVP
20. **Foreign Key Cascades**: CASCADE on user-owned data, RESTRICT on reference data
21. **Polish Language**: Use PostgreSQL 'polish' text search configuration with unaccent extension
22. **Data Validation**: Implement Polish-specific check constraints at database level

## Matched Recommendations

### Core Schema Structure

1. **profiles** table
   - References `auth.users.id` as `user_id` (UUID, PK)
   - Columns: `weight`, `age`, `gender`, `activity_level`, `diet_type`, `created_at`
   - RLS: Users can SELECT/UPDATE only their own profile

2. **user_allergens** table
   - Many-to-many: `user_id`, `allergen_id`
   - Junction table for user allergen preferences

3. **allergens** table
   - Reference table: `id`, `name_pl`
   - Predefined allergen list

4. **user_disliked_ingredients** table
   - `user_id`, `ingredient_name`, `created_at`
   - Flexible text-based disliked ingredients

5. **recipes** table
   - `id` (UUID, PK), `user_id` (UUID, FK), `title`, `description`
   - `ingredients` (JSONB) - array of `[{"name": "mąka", "amount": 200, "unit": "g"}]`
   - `steps` (TEXT or JSONB array)
   - `servings` (INTEGER)
   - `nutrition_per_serving` (JSONB) - `{"calories": 450, "protein": 25, "fat": 15, "carbs": 50, "fiber": 8, "salt": 2}`
   - `prep_time_minutes` (INTEGER)
   - `is_public` (BOOLEAN DEFAULT false) - **allows public recipe sharing**
   - `search_vector` (TSVECTOR GENERATED) - Polish full-text search
   - `created_at`, `updated_at` (TIMESTAMPTZ)
   - Indexes: GIN on `search_vector`, B-tree on `prep_time_minutes`, `user_id`
   - RLS: Users can SELECT public recipes OR own recipes; INSERT/UPDATE/DELETE only own recipes

6. **recipe_modifications** table
   - `id` (UUID, PK), `original_recipe_id` (UUID, FK), `user_id` (UUID, FK)
   - `modification_type` (ENUM: 'reduce_calories', 'increase_protein', 'increase_fiber', 'portion_size', 'ingredient_substitution')
   - `modified_data` (JSONB) - stores changed ingredients, steps, nutrition
   - `created_at` (TIMESTAMPTZ)
   - ON DELETE CASCADE from recipes and profiles

7. **tags** table
   - `id` (UUID, PK), `name`, `slug`, `created_at`
   - Predefined 15-20 categories (e.g., 'śniadanie', 'obiad', 'wegetariańskie', 'wysokobiałkowe')

8. **recipe_tags** table
   - `recipe_id` (UUID, FK), `tag_id` (UUID, FK)
   - Composite PK or unique constraint on (recipe_id, tag_id)
   - B-tree index on `tag_id` for filtering
   - ON DELETE CASCADE from recipes, RESTRICT from tags

9. **favorites** table
   - `user_id` (UUID, FK), `recipe_id` (UUID, FK), `created_at` (TIMESTAMPTZ)
   - Unique constraint on (user_id, recipe_id)
   - ON DELETE CASCADE

10. **collections** table
    - `id` (UUID, PK), `user_id` (UUID, FK), `name`, `created_at` (TIMESTAMPTZ)
    - RLS: Users can only access their own collections

11. **collection_recipes** table
    - `collection_id` (UUID, FK), `recipe_id` (UUID, FK), `added_at` (TIMESTAMPTZ)
    - Unique constraint on (collection_id, recipe_id)

12. **meal_plans** table
    - `id` (UUID, PK), `user_id` (UUID, FK), `recipe_id` (UUID, FK)
    - `planned_date` (DATE), `meal_type` (ENUM: 'breakfast', 'lunch', 'dinner', 'snack')
    - `created_at` (TIMESTAMPTZ)
    - Unique constraint on (user_id, recipe_id, planned_date, meal_type)
    - RLS: Users can only access their own meal plans

13. **recipe_ratings** table
    - `id` (UUID, PK), `user_id` (UUID, FK), `recipe_id` (UUID, FK)
    - `rating` (INTEGER CHECK rating >= 1 AND rating <= 5)
    - `did_cook` (BOOLEAN)
    - `created_at`, `updated_at` (TIMESTAMPTZ)
    - Unique constraint on (user_id, recipe_id)
    - RLS: Users can SELECT all ratings, INSERT/UPDATE/DELETE only their own

14. **ingredient_substitutions** table
    - `id` (UUID, PK)
    - `original_ingredient`, `substitute_ingredient` (VARCHAR)
    - `nutrition_comparison` (JSONB)
    - `healthier` (BOOLEAN)
    - `created_at` (TIMESTAMPTZ)
    - Knowledge base for common substitutions

### Admin Features

15. **Materialized Views for Admin Dashboard**
    - `mv_user_statistics` - total users, users with preferences, retention metrics
    - `mv_recipe_statistics` - total recipes, modifications count, popular modification types
    - `mv_rating_statistics` - average ratings, cook percentage, trends
    - Scheduled refresh (e.g., daily or hourly)

### Database Functions & Triggers

16. **auto_update_updated_at()** trigger function
    - Automatically updates `updated_at` column on row modifications
    - Apply to: `profiles`, `recipes`, `recipe_ratings`

17. **Polish Full-Text Search Configuration**
    - Enable `unaccent` extension
    - Use `to_tsvector('polish', ...)` for search columns
    - Generated column on `recipes.search_vector`

18. **Check Constraints**
    - `profiles.weight`: CHECK (weight >= 40 AND weight <= 200)
    - `profiles.age`: CHECK (age >= 13 AND age <= 100)
    - `recipe_ratings.rating`: CHECK (rating >= 1 AND rating <= 5)
    - Nutritional values: CHECK for reasonable ranges

### Security (RLS Policies)

19. **Row-Level Security Policies**
    - Enable RLS on all user-facing tables
    - Profiles: `user_id = auth.uid()`
    - Recipes: `user_id = auth.uid() OR is_public = true` (SELECT), `user_id = auth.uid()` (INSERT/UPDATE/DELETE)
    - Recipe modifications, favorites, collections, meal plans: `user_id = auth.uid()`
    - Recipe ratings: SELECT all, modify only own
    - Admin tables: Separate `admin_users` or custom claims

## Database Planning Summary

### Overview
The HealthyMeal database schema is designed for a Polish-language MVP application that uses AI to modify recipes according to dietary needs. The schema leverages PostgreSQL via Supabase with a focus on flexibility, performance, and security.

### Key Architectural Decisions

**1. Data Modeling Philosophy**
- **Semi-structured approach**: Core entities normalized, flexible data (ingredients, nutrition) stored as JSONB for MVP speed
- **UUID-based**: All primary keys use UUIDs for security and alignment with Supabase auth
- **Future-proof**: Design supports future enhancements (meal_type enum, public recipes) without schema changes

**2. User Management**
- Separation of authentication (`auth.users`) and application data (`profiles`)
- Minimal activity tracking for MVP (`created_at` only)
- Hybrid preference storage: direct columns for simple data, normalized tables for many-to-many relationships

**3. Recipe Architecture**
- **Original recipes**: Stored in `recipes` table with JSONB for ingredients and nutrition
- **Modifications**: Separate `recipe_modifications` table preserves change history
- **Public recipes**: `is_public` flag enables recipe sharing while maintaining ownership
- **Versioning**: Users can access original + all their modifications independently

**4. Search & Discovery**
- Polish language full-text search with `unaccent` extension
- Multi-dimensional filtering: tags, calories, prep time, title search
- Efficient indexing strategy: GIN for text, B-tree for numeric/foreign keys
- Predefined tag system (15-20 categories) with automatic assignment

**5. Performance Optimization**
- **Materialized views** for admin dashboard (refreshed periodically)
- Strategic indexing on high-query columns
- JSONB indexing support for ingredient searches
- Designed for future partitioning (meal_plans by date, if needed)

**6. Security Model**
- Row-Level Security on all user tables
- Users isolated to their own data by default
- Public recipes: visible to all, editable only by owner
- Cascading deletes for user-owned data
- Restrictive deletes for reference data (tags, allergens)

**7. Data Integrity**
- Foreign key constraints with appropriate cascade rules
- Check constraints for Polish demographic data (weight, age ranges)
- Unique constraints prevent duplicates (favorites, ratings)
- Auto-updating timestamps via triggers

**8. AI Integration Support**
- `ingredient_substitutions` knowledge base reduces AI API calls
- `modification_type` enum tracks AI usage patterns
- JSONB storage facilitates AI-generated content storage
- Nutritional data structure supports AI recalculations

### Entity Relationships

**Core Entities:**
- **User** (1) → (M) **Recipes** (can own multiple recipes)
- **User** (1) → (M) **RecipeModifications** (can modify multiple recipes)
- **Recipe** (1) → (M) **RecipeModifications** (original can have multiple versions)
- **Recipe** (M) ↔ (M) **Tags** (via recipe_tags junction)
- **User** (M) ↔ (M) **Recipes** (via favorites - can favorite multiple)
- **User** (1) → (M) **Collections** → (M) **Recipes** (via collection_recipes)
- **User** (M) ↔ (M) **Recipes** (via meal_plans - scheduled for dates)
- **User** (M) ↔ (M) **Recipes** (via recipe_ratings - one rating per user-recipe pair)
- **User** (M) ↔ (M) **Allergens** (via user_allergens)

**Key Characteristics:**
- Most relationships cascade on user deletion (GDPR compliance)
- Reference data (tags, allergens) protected with RESTRICT
- Junction tables enable efficient many-to-many queries
- Timestamps track creation and modification across entities

### Scalability Considerations

**Immediate (MVP):**
- No partitioning required
- Standard indexing sufficient
- Hard deletes keep schema simple
- Materialized views handle admin analytics load

**Future Growth Path:**
- `meal_plans` can be partitioned by `planned_date` (monthly/yearly)
- Consider soft deletes for `recipes` if recovery becomes important
- Activity logging table can be added for detailed retention analysis
- Read replicas for scaling SELECT queries

### Polish Language Support
- PostgreSQL `polish` text search configuration
- `unaccent` extension handles diacritics (ą, ć, ę, ł, ń, ó, ś, ź, ż)
- Generated tsvector column for efficient search
- GIN index on search vector
- All content stored in UTF-8

### Migration Strategy
1. Create base tables (profiles, recipes, tags, allergens)
2. Create junction tables (recipe_tags, user_allergens, favorites, collections, collection_recipes)
3. Create dependent tables (recipe_modifications, meal_plans, recipe_ratings, ingredient_substitutions)
4. Add indexes (GIN, B-tree)
5. Create functions and triggers (auto_update_updated_at)
6. Enable RLS and create policies
7. Create materialized views for admin dashboard
8. Seed reference data (tags, allergens)

## Unresolved Issues

### Minor Clarifications Needed

1. **Admin User Management**
   - Decision needed: Use separate `admin_users` table or Supabase custom claims/roles?
   - Recommendation: Start with Supabase custom claims (simpler for MVP), create `admin_users` table if more complex admin hierarchies needed

2. **Materialized View Refresh Frequency**
   - How often should materialized views refresh? Options:
     - Every hour (good for active monitoring)
     - Daily at midnight (sufficient for most metrics)
     - On-demand via admin dashboard button
   - Recommendation: Daily at midnight for MVP, add manual refresh button

3. **Recipe Steps Format**
   - Should steps be stored as TEXT (single block) or JSONB array (numbered steps)?
   - Recommendation: JSONB array `[{"step_number": 1, "instruction": "..."}, ...]` for better AI modification support

4. **Ingredient Units Standardization**
   - Should units be free-text or predefined ENUM (g, kg, ml, l, sztuka, łyżka, etc.)?
   - Recommendation: Free-text for MVP, but validate common units client-side; normalize post-MVP

5. **Default "Ulubione" Collection**
   - Should system auto-create a default "Ulubione" collection for each user that syncs with favorites table?
   - Or keep favorites and collections completely separate?
   - Recommendation: Keep separate for MVP simplicity; favorites = quick access, collections = organization

6. **Recipe Modification Ratings**
   - Should ratings reference `recipe_modifications.id` or always `original_recipe_id`?
   - Current design: Ratings reference recipes (originals) only
   - Consideration: If users can rate modifications separately, update foreign key to allow both

7. **Public Recipe Discovery**
   - How should users discover public recipes? Additional fields needed?
     - `featured` flag for curated recipes?
     - `publication_date` separate from `created_at`?
   - Recommendation: Add `featured BOOLEAN DEFAULT false` to recipes table for admin curation

8. **Nutritional Data Validation**
   - Should database validate nutritional JSONB structure or rely on application layer?
   - Recommendation: Add CHECK constraint with JSON schema validation for required fields: `calories`, `protein`, `fat`, `carbs`, `fiber`, `salt`

### Non-Critical Future Considerations

9. **Recipe Versioning**
   - Currently modifications are separate records; consider if full version control is needed
   - Not blocking for MVP

10. **Multi-language Support**
    - Schema designed for Polish; adding English/other languages would require:
      - Translation tables or JSONB columns with language keys
      - Multiple search_vector columns per language
    - Not in MVP scope, but worth documenting for Phase 2
