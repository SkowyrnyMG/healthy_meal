-- =============================================
-- Migration: Seed Reference Data
-- Description: Populates reference tables with initial data (tags and allergens)
-- Affected Tables: tags, allergens
-- Purpose: Provides predefined categories and allergens for the application
-- Note: This is initial seed data. Additional tags/allergens can be added via admin interface
-- =============================================

-- =============================================
-- Seed Data: Tags (Recipe Categories)
-- Purpose: Predefined recipe categories for filtering and organization
-- Count: 19 tags covering meal types, dietary preferences, and cooking styles
-- =============================================

insert into tags (name, slug) values
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

-- =============================================
-- Seed Data: Allergens (Common Polish Allergens)
-- Purpose: Predefined list of common allergens based on EU regulations (Regulation 1169/2011)
-- Count: 14 allergens covering all major food allergen categories
-- Reference: https://www.fsai.ie/legislation/food_legislation/food_information_fic/allergens.html
-- =============================================

insert into allergens (name_pl) values
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

-- =============================================
-- Verification: Display seeded data counts
-- =============================================

-- note: these select statements are for verification during migration
-- they will output to the migration log
do $$
declare
  tag_count int;
  allergen_count int;
begin
  select count(*) into tag_count from tags;
  select count(*) into allergen_count from allergens;

  raise notice 'Successfully seeded % tags', tag_count;
  raise notice 'Successfully seeded % allergens', allergen_count;
end $$;

-- =============================================
-- Comments for documentation
-- =============================================

comment on column tags.name is 'Human-readable tag name in Polish (displayed in UI)';
comment on column tags.slug is 'URL-friendly slug for tag (used in routes and filters)';
comment on column allergens.name_pl is 'Allergen name based on EU food labeling regulations (renamed to name in later migration)';
