-- Forge Fitness App Database Schema
-- Run this migration to set up all required tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES (extends Supabase auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FITNESS PROFILES (user fitness settings)
-- ============================================
CREATE TABLE IF NOT EXISTS fitness_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
  primary_goal TEXT CHECK (primary_goal IN ('fat_loss', 'muscle_gain', 'strength', 'endurance', 'general_fitness')) DEFAULT 'general_fitness',
  workout_frequency INTEGER DEFAULT 3,
  preferred_workout_duration INTEGER DEFAULT 60, -- minutes
  available_equipment TEXT[] DEFAULT ARRAY['bodyweight'],
  injuries TEXT[],
  weight DECIMAL(5,2),
  weight_unit TEXT CHECK (weight_unit IN ('kg', 'lbs')) DEFAULT 'lbs',
  height DECIMAL(5,2),
  height_unit TEXT CHECK (height_unit IN ('cm', 'ft')) DEFAULT 'ft',
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================
-- MUSCLE GROUPS (reference table)
-- ============================================
CREATE TABLE IF NOT EXISTS muscle_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  body_region TEXT CHECK (body_region IN ('upper', 'lower', 'core')) NOT NULL,
  body_side TEXT CHECK (body_side IN ('front', 'back', 'both')) NOT NULL,
  svg_path_id TEXT, -- for interactive body map
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MUSCLE PROGRESS (user muscle progression)
-- ============================================
CREATE TABLE IF NOT EXISTS muscle_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  muscle_group_id UUID REFERENCES muscle_groups(id) ON DELETE CASCADE NOT NULL,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  tier TEXT CHECK (tier IN ('unawakened', 'weakling', 'novice', 'builder', 'beast', 'elite', 'god_tier')) DEFAULT 'unawakened',
  weekly_volume INTEGER DEFAULT 0, -- total weekly sets
  strength_score INTEGER DEFAULT 0, -- 0-100
  consistency_score INTEGER DEFAULT 0, -- 0-100
  recovery_score INTEGER DEFAULT 100, -- 0-100
  last_trained_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, muscle_group_id)
);

-- ============================================
-- EXERCISE LIBRARY (seeded from dataset)
-- ============================================
CREATE TABLE IF NOT EXISTS exercise_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  primary_muscle TEXT NOT NULL,
  secondary_muscles TEXT[],
  equipment TEXT,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
  instructions TEXT[],
  tips TEXT[],
  is_compound BOOLEAN DEFAULT false,
  category TEXT CHECK (category IN ('strength', 'cardio', 'flexibility', 'warmup', 'cooldown')) DEFAULT 'strength',
  mechanic TEXT CHECK (mechanic IN ('compound', 'isolation')) DEFAULT 'isolation',
  image_url TEXT,
  video_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- GOALS (SMART goals)
-- ============================================
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  metric TEXT NOT NULL, -- e.g., 'bench_press_1rm', 'weekly_workouts', 'body_weight'
  target_value DECIMAL(10,2) NOT NULL,
  current_value DECIMAL(10,2) DEFAULT 0,
  unit TEXT, -- e.g., 'lbs', 'kg', 'workouts', '%'
  deadline DATE,
  status TEXT CHECK (status IN ('active', 'completed', 'failed', 'paused')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WORKOUT PLANS (weekly routines)
-- ============================================
CREATE TABLE IF NOT EXISTS workout_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  goal TEXT CHECK (goal IN ('fat_loss', 'muscle_gain', 'strength', 'endurance', 'general_fitness')),
  split_type TEXT CHECK (split_type IN ('full_body', 'upper_lower', 'push_pull_legs', 'bro_split', 'custom')) DEFAULT 'full_body',
  days_per_week INTEGER DEFAULT 3,
  experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WORKOUT DAYS (days within a plan)
-- ============================================
CREATE TABLE IF NOT EXISTS workout_days (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_plan_id UUID REFERENCES workout_plans(id) ON DELETE CASCADE NOT NULL,
  day_number INTEGER NOT NULL, -- 1-7
  name TEXT NOT NULL, -- e.g., 'Push Day', 'Leg Day'
  target_muscles TEXT[], -- primary muscles targeted
  estimated_duration INTEGER DEFAULT 60, -- minutes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workout_plan_id, day_number)
);

-- ============================================
-- WORKOUT EXERCISES (exercises within a day)
-- ============================================
CREATE TABLE IF NOT EXISTS workout_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_day_id UUID REFERENCES workout_days(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES exercise_library(id) ON DELETE CASCADE NOT NULL,
  order_index INTEGER NOT NULL,
  sets INTEGER DEFAULT 3,
  reps_min INTEGER DEFAULT 8,
  reps_max INTEGER DEFAULT 12,
  rest_seconds INTEGER DEFAULT 90,
  notes TEXT,
  exercise_type TEXT CHECK (exercise_type IN ('warmup', 'main', 'accessory', 'finisher', 'cooldown')) DEFAULT 'main',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- COMPLETED WORKOUTS (workout sessions)
-- ============================================
CREATE TABLE IF NOT EXISTS completed_workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  workout_plan_id UUID REFERENCES workout_plans(id) ON DELETE SET NULL,
  workout_day_id UUID REFERENCES workout_days(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  total_volume INTEGER DEFAULT 0, -- total weight lifted
  total_sets INTEGER DEFAULT 0,
  total_reps INTEGER DEFAULT 0,
  energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 5),
  effort_level INTEGER CHECK (effort_level BETWEEN 1 AND 10),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- COMPLETED SETS (individual sets logged)
-- ============================================
CREATE TABLE IF NOT EXISTS completed_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  completed_workout_id UUID REFERENCES completed_workouts(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES exercise_library(id) ON DELETE CASCADE NOT NULL,
  set_number INTEGER NOT NULL,
  weight DECIMAL(7,2),
  weight_unit TEXT CHECK (weight_unit IN ('kg', 'lbs')) DEFAULT 'lbs',
  reps INTEGER NOT NULL,
  rpe INTEGER CHECK (rpe BETWEEN 1 AND 10), -- rate of perceived exertion
  is_warmup BOOLEAN DEFAULT false,
  is_pr BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PERSONAL RECORDS
-- ============================================
CREATE TABLE IF NOT EXISTS personal_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES exercise_library(id) ON DELETE CASCADE NOT NULL,
  weight DECIMAL(7,2) NOT NULL,
  weight_unit TEXT CHECK (weight_unit IN ('kg', 'lbs')) DEFAULT 'lbs',
  reps INTEGER NOT NULL,
  estimated_1rm DECIMAL(7,2), -- calculated 1 rep max
  achieved_at TIMESTAMPTZ DEFAULT NOW(),
  completed_set_id UUID REFERENCES completed_sets(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ACHIEVEMENTS (reference table)
-- ============================================
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon TEXT, -- icon name or emoji
  category TEXT CHECK (category IN ('strength', 'consistency', 'volume', 'progression', 'milestone')) DEFAULT 'milestone',
  requirement_type TEXT NOT NULL, -- e.g., 'workouts_completed', 'pr_achieved', 'streak_days'
  requirement_value INTEGER NOT NULL,
  xp_reward INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USER ACHIEVEMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE NOT NULL,
  achieved_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- ============================================
-- USER STREAKS
-- ============================================
CREATE TABLE IF NOT EXISTS user_streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_workout_date DATE,
  streak_started_at DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all user-owned tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitness_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE muscle_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE completed_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE completed_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Fitness profiles policies
CREATE POLICY "Users can view own fitness profile" ON fitness_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own fitness profile" ON fitness_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own fitness profile" ON fitness_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Muscle progress policies
CREATE POLICY "Users can view own muscle progress" ON muscle_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own muscle progress" ON muscle_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own muscle progress" ON muscle_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Goals policies
CREATE POLICY "Users can view own goals" ON goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own goals" ON goals FOR ALL USING (auth.uid() = user_id);

-- Workout plans policies
CREATE POLICY "Users can view own workout plans" ON workout_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own workout plans" ON workout_plans FOR ALL USING (auth.uid() = user_id);

-- Workout days policies (through plan ownership)
CREATE POLICY "Users can view own workout days" ON workout_days FOR SELECT 
  USING (EXISTS (SELECT 1 FROM workout_plans WHERE id = workout_days.workout_plan_id AND user_id = auth.uid()));
CREATE POLICY "Users can manage own workout days" ON workout_days FOR ALL 
  USING (EXISTS (SELECT 1 FROM workout_plans WHERE id = workout_days.workout_plan_id AND user_id = auth.uid()));

-- Workout exercises policies (through plan ownership)
CREATE POLICY "Users can view own workout exercises" ON workout_exercises FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM workout_days wd 
    JOIN workout_plans wp ON wd.workout_plan_id = wp.id 
    WHERE wd.id = workout_exercises.workout_day_id AND wp.user_id = auth.uid()
  ));
CREATE POLICY "Users can manage own workout exercises" ON workout_exercises FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM workout_days wd 
    JOIN workout_plans wp ON wd.workout_plan_id = wp.id 
    WHERE wd.id = workout_exercises.workout_day_id AND wp.user_id = auth.uid()
  ));

-- Completed workouts policies
CREATE POLICY "Users can view own completed workouts" ON completed_workouts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own completed workouts" ON completed_workouts FOR ALL USING (auth.uid() = user_id);

-- Completed sets policies (through workout ownership)
CREATE POLICY "Users can view own completed sets" ON completed_sets FOR SELECT 
  USING (EXISTS (SELECT 1 FROM completed_workouts WHERE id = completed_sets.completed_workout_id AND user_id = auth.uid()));
CREATE POLICY "Users can manage own completed sets" ON completed_sets FOR ALL 
  USING (EXISTS (SELECT 1 FROM completed_workouts WHERE id = completed_sets.completed_workout_id AND user_id = auth.uid()));

-- Personal records policies
CREATE POLICY "Users can view own personal records" ON personal_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own personal records" ON personal_records FOR ALL USING (auth.uid() = user_id);

-- User achievements policies
CREATE POLICY "Users can view own achievements" ON user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own achievements" ON user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User streaks policies
CREATE POLICY "Users can view own streaks" ON user_streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own streaks" ON user_streaks FOR ALL USING (auth.uid() = user_id);

-- Public read access for reference tables
ALTER TABLE muscle_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view muscle groups" ON muscle_groups FOR SELECT USING (true);
CREATE POLICY "Anyone can view exercise library" ON exercise_library FOR SELECT USING (true);
CREATE POLICY "Anyone can view achievements" ON achievements FOR SELECT USING (true);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_muscle_progress_user ON muscle_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_completed_workouts_user ON completed_workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_completed_workouts_date ON completed_workouts(started_at);
CREATE INDEX IF NOT EXISTS idx_completed_sets_workout ON completed_sets(completed_workout_id);
CREATE INDEX IF NOT EXISTS idx_personal_records_user ON personal_records(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_records_exercise ON personal_records(exercise_id);
CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_plans_user ON workout_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_exercise_library_muscle ON exercise_library(primary_muscle);
CREATE INDEX IF NOT EXISTS idx_exercise_library_equipment ON exercise_library(equipment);

-- ============================================
-- FUNCTION: Auto-create profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  -- Also create fitness profile
  INSERT INTO public.fitness_profiles (user_id)
  VALUES (NEW.id);
  
  -- Also create user streak
  INSERT INTO public.user_streaks (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- FUNCTION: Update timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fitness_profiles_updated_at BEFORE UPDATE ON fitness_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_muscle_progress_updated_at BEFORE UPDATE ON muscle_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workout_plans_updated_at BEFORE UPDATE ON workout_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_streaks_updated_at BEFORE UPDATE ON user_streaks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
