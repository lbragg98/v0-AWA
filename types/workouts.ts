// Additional types for workout builder and library

export interface ExerciseFilter {
  equipment?: string
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  primaryMuscle?: string
  category?: 'strength' | 'cardio' | 'flexibility' | 'warmup' | 'cooldown'
}

export interface CreateWorkoutPlanForm {
  name: string
  goal: 'fat_loss' | 'muscle_gain' | 'strength' | 'endurance' | 'general_fitness'
  trainingFrequency: number // 1-7 days per week
  experienceLevel: 'beginner' | 'intermediate' | 'advanced'
}

export interface WorkoutDayForm {
  dayNumber: number
  name: string
  focusLabel: string
  targetMuscles: string[]
  estimatedDuration: number
}

export interface WorkoutExerciseForm {
  exerciseId: string
  sets: number
  repsMin: number
  repsMax: number
  restSeconds: number
  notes?: string
  exerciseType: 'warmup' | 'main' | 'accessory' | 'finisher' | 'cooldown'
}
