export interface OnboardingData {
  full_name: string
  age: number | null
  height_in: number | null
  weight_lbs: number | null
  experience_level: 'beginner' | 'intermediate' | 'advanced'
  primary_goal: 'fat_loss' | 'muscle_gain' | 'strength' | 'endurance' | 'general_fitness'
  available_equipment: string[]
  preferred_training_days: number[]
  preferred_session_minutes: number
}

export const EXPERIENCE_LEVELS = [
  { value: 'beginner', label: 'Beginner', description: 'New to strength training (0-1 years)' },
  { value: 'intermediate', label: 'Intermediate', description: 'Consistent training (1-3 years)' },
  { value: 'advanced', label: 'Advanced', description: 'Experienced lifter (3+ years)' },
] as const

export const PRIMARY_GOALS = [
  { value: 'fat_loss', label: 'Fat Loss', description: 'Lose weight and get lean' },
  { value: 'muscle_gain', label: 'Muscle Gain', description: 'Build muscle mass' },
  { value: 'strength', label: 'Strength', description: 'Get stronger on key lifts' },
  { value: 'endurance', label: 'Endurance', description: 'Improve stamina and conditioning' },
  { value: 'general_fitness', label: 'General Fitness', description: 'Overall health and wellness' },
] as const

export const EQUIPMENT_OPTIONS = [
  { value: 'bodyweight', label: 'Bodyweight' },
  { value: 'dumbbells', label: 'Dumbbells' },
  { value: 'barbell', label: 'Barbell' },
  { value: 'kettlebell', label: 'Kettlebells' },
  { value: 'cable', label: 'Cable Machine' },
  { value: 'machine', label: 'Machines' },
  { value: 'resistance_bands', label: 'Resistance Bands' },
  { value: 'pull_up_bar', label: 'Pull-up Bar' },
] as const

export const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
] as const

export const SESSION_DURATIONS = [
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '60 min' },
  { value: 75, label: '75 min' },
  { value: 90, label: '90 min' },
] as const
