-- Fix height_unit constraint to allow 'in' for inches
-- The original schema only allowed 'cm' or 'ft' but we store height in inches

ALTER TABLE fitness_profiles 
DROP CONSTRAINT IF EXISTS fitness_profiles_height_unit_check;

ALTER TABLE fitness_profiles 
ADD CONSTRAINT fitness_profiles_height_unit_check 
CHECK (height_unit IN ('cm', 'ft', 'in'));
