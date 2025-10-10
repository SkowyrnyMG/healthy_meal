# Database Migrations

This directory contains Supabase database migrations for the HealthyMeal application.

## Migration Order

The migrations are numbered sequentially and should be applied in order:

1. **20251009213700_create_base_tables.sql** - Extensions and base tables (profiles, allergens, tags)
2. **20251009213710_create_recipe_tables.sql** - Recipe tables with JSONB storage
3. **20251009213720_create_user_interaction_tables.sql** - User interactions (favorites, collections, ratings, meal plans)
4. **20251009213730_create_indexes.sql** - Performance indexes (GIN, B-tree, partial, composite)
5. **20251009213740_create_functions_and_triggers.sql** - Functions, triggers, and materialized views
6. **20251009213750_seed_reference_data.sql** - Seed data for tags and allergens

## Applying Migrations

### Using Supabase CLI

```bash
# Apply all pending migrations
supabase db push

# Or apply migrations remotely
supabase db push --linked
```

### Using Supabase Dashboard

1. Go to your project dashboard
2. Navigate to Database > Migrations
3. Upload migration files in order

## Polish Language Support

### Current Configuration

The migrations use the **'simple'** text search configuration for compatibility with all PostgreSQL installations. This provides basic full-text search but doesn't handle Polish language specifics (stemming, stop words).

### Enabling Polish Language Support (Recommended for Production)

To enable proper Polish language support:

1. **Verify Polish support is available:**
   ```sql
   SELECT cfgname FROM pg_ts_config WHERE cfgname = 'polish';
   ```

2. **If Polish is not available, install it:**
   - For managed Supabase: Contact support or check if it's available
   - For self-hosted PostgreSQL:
     ```bash
     # Ubuntu/Debian
     sudo apt-get install postgresql-contrib-XX  # XX = your PostgreSQL version

     # Then in psql:
     CREATE TEXT SEARCH CONFIGURATION polish (COPY = simple);
     ```

3. **Apply the Polish migration:**
   ```bash
   # Rename the example file
   mv 99999999999999_enable_polish_text_search.sql.example $(date -u +%Y%m%d%H%M%S)_enable_polish_text_search.sql

   # Apply it
   supabase db push
   ```

### Benefits of Polish Language Support

- **Better stemming:** Handles Polish word forms (e.g., "pierogi", "pierogów", "pierogami")
- **Stop words:** Filters common Polish words ("i", "w", "na", "do")
- **Improved relevance:** Better search ranking for Polish queries

## Key Features

### Security
- Row-Level Security (RLS) enabled on all tables
- Separate policies for `anon` and `authenticated` roles
- Admin-only access to materialized views

### Performance
- GIN indexes for full-text search and JSONB queries
- B-tree indexes for foreign keys and filtering
- Partial indexes for sparse data
- Composite indexes for multi-column queries

### Data Integrity
- CHECK constraints for validation
- Foreign key CASCADE/RESTRICT rules
- Auto-updating timestamps via triggers
- JSONB structure validation

### Polish Language
- `unaccent` extension for diacritics (ą, ć, ę, ł, ń, ó, ś, ź, ż)
- Full-text search ready for Polish configuration
- Polish-specific validation ranges

## Materialized Views

The following materialized views are created for the admin dashboard:

- `mv_user_statistics` - User metrics and retention
- `mv_recipe_statistics` - Recipe and modification stats
- `mv_rating_statistics` - Rating and cooking metrics

### Refreshing Materialized Views

```sql
-- Refresh all admin statistics
SELECT refresh_admin_statistics();

-- Or refresh individually
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_statistics;
```

**Recommended:** Schedule daily refresh at midnight using pg_cron or application scheduler.

## Helper Functions

- `auto_update_updated_at()` - Auto-updates timestamps
- `is_admin()` - Checks admin role
- `calculate_total_nutrition(uuid)` - Calculates total recipe nutrition
- `search_recipes(text)` - Full-text search for recipes
- `refresh_admin_statistics()` - Refreshes all materialized views

## Troubleshooting

### Error: "text search configuration 'polish' does not exist"

This is expected if Polish language support is not installed. The migrations use 'simple' as a fallback. See "Enabling Polish Language Support" above.

### Error: "extension 'uuid-ossp' already exists"

This is a notice, not an error. The migration uses `IF NOT EXISTS` to safely skip if already installed.

### Slow Full-Text Search

1. Verify GIN index exists: `\d recipes` in psql
2. Check if search_vector is populated: `SELECT search_vector FROM recipes LIMIT 5;`
3. Analyze table: `ANALYZE recipes;`

## Database Schema Documentation

For detailed schema documentation, see `.ai/db-plan.md`.

## Support

For issues or questions:
- Check Supabase docs: https://supabase.com/docs
- Review migration logs in Supabase dashboard
- Verify prerequisites and dependencies
