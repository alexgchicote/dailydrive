-- Migration: Add additional constraints to actions_categories table
-- This includes constraints that can't be handled directly in Drizzle due to Supabase auth.users table

-- Add foreign key constraint to auth.users
ALTER TABLE actions_categories 
ADD CONSTRAINT actions_categories_created_by_id_fkey 
FOREIGN KEY (created_by_id) REFERENCES auth.users(id) 
ON UPDATE CASCADE ON DELETE CASCADE;

-- The unique indexes are already handled by Drizzle:
-- - idx_predefined_categories_unique_name (unique category names for predefined)
-- - idx_custom_categories_unique_per_user (unique category names per user for custom)

-- Add trigger for category conflict prevention
-- NOTE: You need to create the function first:
/*
CREATE OR REPLACE FUNCTION prevent_predefined_category_conflict()
RETURNS TRIGGER AS $$
BEGIN
  -- Add your conflict prevention logic here
  -- For example, prevent creating custom categories with same name as predefined ones
  
  IF NEW.category_type = 'custom' THEN
    IF EXISTS (
      SELECT 1 FROM actions_categories 
      WHERE category_name = NEW.category_name 
      AND category_type = 'predefined'
    ) THEN
      RAISE EXCEPTION 'Cannot create custom category with same name as existing predefined category: %', NEW.category_name;
    END IF;
  END IF;
  
  IF NEW.category_type = 'predefined' THEN
    IF EXISTS (
      SELECT 1 FROM actions_categories 
      WHERE category_name = NEW.category_name 
      AND category_type = 'custom'
    ) THEN
      RAISE EXCEPTION 'Cannot create predefined category with same name as existing custom category: %', NEW.category_name;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
*/

-- Uncomment the following line after creating the function above:
-- CREATE TRIGGER check_category_conflict_trigger 
-- BEFORE INSERT OR UPDATE ON actions_categories 
-- FOR EACH ROW EXECUTE FUNCTION prevent_predefined_category_conflict(); 