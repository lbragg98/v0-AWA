-- Add onboarding_completed and preferred_training_days columns to fitness_profiles
-- This migration adds fields needed for the onboarding flow

ALTER TABLE fitness_profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

ALTER TABLE fitness_profiles 
ADD COLUMN IF NOT EXISTS preferred_training_days TEXT[];
