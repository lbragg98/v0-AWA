// Database types for Forge fitness app

export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface FitnessProfile {
  id: string
  user_id: string
  experience_level: 'beginner' | 'intermediate' | 'advanced'
  primary_goal: 'fat_loss' | 'muscle_gain' | 'strength' | 'endurance' | 'general_fitness'
  workout_frequency: number
  preferred_workout_duration: number
  available_equipment: string[]
  injuries: string[] | null
  weight: number | null
  weight_unit: 'kg' | 'lbs'
  height: number | null
  height_unit: 'cm' | 'ft'
  date_of_birth: string | null
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null
  onboarding_completed: boolean
  preferred_training_days: number[]
  created_at: string
  updated_at: string
}

export interface UserStreak {
  id: string
  user_id: string
  current_streak: number
  longest_streak: number
  last_workout_date: string | null
  streak_started_at: string | null
  created_at: string
  updated_at: string
}

export interface Goal {
  id: string
  user_id: string
  title: string
  description: string | null
  metric: string
  target_value: number
  current_value: number
  unit: string | null
  deadline: string | null
  status: 'active' | 'completed' | 'failed' | 'paused'
  created_at: string
  updated_at: string
}

export interface CompletedWorkout {
  id: string
  user_id: string
  workout_plan_id: string | null
  workout_day_id: string | null
  name: string
  started_at: string
  completed_at: string | null
  duration_minutes: number | null
  total_volume: number
  total_sets: number
  total_reps: number
  energy_level: number | null
  effort_level: number | null
  notes: string | null
  created_at: string
}

export interface CompletedSet {
  id: string
  completed_workout_id: string
  exercise_id: string
  exercise_index: number
  set_number: number
  weight: number
  weight_unit: 'kg' | 'lbs'
  reps: number
  rpe: number | null
  rest_seconds: number | null
  created_at: string
}

export interface MuscleGroup {
  id: string
  name: string
  slug: string
  display_name: string
  body_region: 'upper' | 'lower' | 'core'
  body_side: 'front' | 'back' | 'both'
  svg_path_id: string | null
  created_at: string
}

export interface MuscleProgress {
  id: string
  user_id: string
  muscle_group_id: string
  xp: number
  level: number
  tier: 'unawakened' | 'weakling' | 'novice' | 'builder' | 'beast' | 'elite' | 'god_tier'
  weekly_volume: number
  strength_score: number
  consistency_score: number
  recovery_score: number
  last_trained_at: string | null
  created_at: string
  updated_at: string
  muscle_group?: MuscleGroup
}

export interface Achievement {
  id: string
  name: string
  slug: string
  description: string
  icon: string | null
  category: 'strength' | 'consistency' | 'volume' | 'progression' | 'milestone'
  requirement_type: string
  requirement_value: number
  xp_reward: number
  created_at: string
}

export interface UserAchievement {
  id: string
  user_id: string
  achievement_id: string
  achieved_at: string
  achievement?: Achievement
}

export interface PersonalRecord {
  id: string
  user_id: string
  exercise_id: string
  exercise_name?: string
  weight: number
  weight_unit: 'kg' | 'lbs'
  reps: number
  estimated_1rm: number | null
  achieved_at: string
  completed_set_id: string | null
  created_at: string
}

export interface ExerciseLibrary {
  id: string
  name: string
  slug: string
  primary_muscle: string
  secondary_muscles: string[] | null
  equipment: string | null
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  instructions: string[] | null
  tips: string[] | null
  is_compound: boolean
  category: 'strength' | 'cardio' | 'flexibility' | 'warmup' | 'cooldown'
  mechanic: 'compound' | 'isolation'
  image_url: string | null
  video_url: string | null
  created_at: string
}

export interface WorkoutPlan {
  id: string
  user_id: string
  name: string
  description: string | null
  goal: 'fat_loss' | 'muscle_gain' | 'strength' | 'endurance' | 'general_fitness' | null
  split_type: 'full_body' | 'upper_lower' | 'push_pull_legs' | 'bro_split' | 'custom'
  days_per_week: number
  experience_level: 'beginner' | 'intermediate' | 'advanced'
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface WorkoutDay {
  id: string
  workout_plan_id: string
  day_number: number
  name: string
  target_muscles: string[] | null
  estimated_duration: number | null
  created_at: string
}

export interface WorkoutExercise {
  id: string
  workout_day_id: string
  exercise_id: string
  order_index: number
  sets: number
  reps_min: number
  reps_max: number
  rest_seconds: number
  notes: string | null
  exercise_type: 'warmup' | 'main' | 'accessory' | 'finisher' | 'cooldown'
  created_at: string
  exercise?: ExerciseLibrary
}

export interface DashboardStats {
  workoutsThisWeek: number
  totalWorkouts: number
  currentStreak: number
  longestStreak: number
  activeGoals: number
  totalVolume: number
}

export interface Database {
  public: {
    Tables: {
      exercise_library: {
        Row: ExerciseLibrary
      }
      muscle_progress: {
        Row: MuscleProgress
      }
    }
  }
}
