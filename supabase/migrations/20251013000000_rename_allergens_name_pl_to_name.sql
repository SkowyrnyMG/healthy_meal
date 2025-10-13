-- =============================================
-- Migration: Rename allergens.name_pl to allergens.name
-- Description: Corrects the column name from name_pl to name for consistency
-- Affected Tables: allergens
-- =============================================

-- Rename the column from name_pl to name
alter table allergens rename column name_pl to name;

-- Update the column comment to reflect the change
comment on column allergens.name is 'Allergen name based on EU food labeling regulations';
