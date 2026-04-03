// Additional types for workout builder and library

export const AVAILABLE_BODY_PARTS = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'forearms',
  'abs',
  'obliques',
  'glutes',
  'quads',
  'hamstrings',
  'calves',
  'traps',
  'lats',
] as const

export type BodyPart = typeof AVAILABLE_BODY_PARTS[number]

export interface DayTemplate {
  dayNumber: number
  label: string
  bodyParts: readonly BodyPart[]
  estimatedMinutes: number
  trainingFocus: string
}

export interface SplitTemplate {
  id: string
  name: string
  description: string
  daysPerWeek: number
  days: DayTemplate[]
}

export const SPLIT_TEMPLATES: Record<string, SplitTemplate> = {
  full_body: {
    id: 'full_body',
    name: 'Full Body',
    description: 'Train all major muscle groups each session',
    daysPerWeek: 3,
    days: [
      {
        dayNumber: 1,
        label: 'Full Body A',
        bodyParts: ['chest', 'back', 'shoulders', 'quads', 'hamstrings'],
        estimatedMinutes: 60,
        trainingFocus: 'Strength',
      },
      {
        dayNumber: 2,
        label: 'Full Body B',
        bodyParts: ['back', 'chest', 'shoulders', 'glutes', 'hamstrings'],
        estimatedMinutes: 60,
        trainingFocus: 'Hypertrophy',
      },
      {
        dayNumber: 3,
        label: 'Full Body C',
        bodyParts: ['shoulders', 'chest', 'back', 'quads', 'glutes'],
        estimatedMinutes: 60,
        trainingFocus: 'Strength',
      },
    ],
  },
  upper_lower: {
    id: 'upper_lower',
    name: 'Upper / Lower',
    description: 'Alternate between upper body and lower body days',
    daysPerWeek: 4,
    days: [
      {
        dayNumber: 1,
        label: 'Upper Power',
        bodyParts: ['chest', 'back', 'shoulders'],
        estimatedMinutes: 60,
        trainingFocus: 'Strength',
      },
      {
        dayNumber: 2,
        label: 'Lower Power',
        bodyParts: ['quads', 'hamstrings', 'glutes'],
        estimatedMinutes: 60,
        trainingFocus: 'Strength',
      },
      {
        dayNumber: 3,
        label: 'Upper Hypertrophy',
        bodyParts: ['back', 'chest', 'shoulders', 'biceps', 'triceps'],
        estimatedMinutes: 60,
        trainingFocus: 'Hypertrophy',
      },
      {
        dayNumber: 4,
        label: 'Lower Hypertrophy',
        bodyParts: ['hamstrings', 'quads', 'glutes', 'calves'],
        estimatedMinutes: 60,
        trainingFocus: 'Hypertrophy',
      },
    ],
  },
  push_pull_legs: {
    id: 'push_pull_legs',
    name: 'Push / Pull / Legs',
    description: 'Divide workouts by movement pattern',
    daysPerWeek: 3,
    days: [
      {
        dayNumber: 1,
        label: 'Push Day',
        bodyParts: ['chest', 'shoulders', 'triceps'],
        estimatedMinutes: 60,
        trainingFocus: 'Hypertrophy',
      },
      {
        dayNumber: 2,
        label: 'Pull Day',
        bodyParts: ['back', 'biceps', 'lats'],
        estimatedMinutes: 60,
        trainingFocus: 'Hypertrophy',
      },
      {
        dayNumber: 3,
        label: 'Leg Day',
        bodyParts: ['quads', 'hamstrings', 'glutes', 'calves'],
        estimatedMinutes: 75,
        trainingFocus: 'Hypertrophy',
      },
    ],
  },
  bro_split: {
    id: 'bro_split',
    name: 'Bro Split',
    description: 'One muscle group per day for maximum volume',
    daysPerWeek: 5,
    days: [
      {
        dayNumber: 1,
        label: 'Chest Day',
        bodyParts: ['chest'],
        estimatedMinutes: 60,
        trainingFocus: 'Hypertrophy',
      },
      {
        dayNumber: 2,
        label: 'Back Day',
        bodyParts: ['back', 'lats'],
        estimatedMinutes: 60,
        trainingFocus: 'Hypertrophy',
      },
      {
        dayNumber: 3,
        label: 'Shoulder Day',
        bodyParts: ['shoulders', 'traps'],
        estimatedMinutes: 60,
        trainingFocus: 'Hypertrophy',
      },
      {
        dayNumber: 4,
        label: 'Arm Day',
        bodyParts: ['biceps', 'triceps', 'forearms'],
        estimatedMinutes: 60,
        trainingFocus: 'Hypertrophy',
      },
      {
        dayNumber: 5,
        label: 'Leg Day',
        bodyParts: ['quads', 'hamstrings', 'glutes', 'calves'],
        estimatedMinutes: 75,
        trainingFocus: 'Hypertrophy',
      },
    ],
  },
  strength_focus: {
    id: 'strength_focus',
    name: 'Strength Focus',
    description: 'Emphasize heavy compound lifts and progressive overload',
    daysPerWeek: 4,
    days: [
      {
        dayNumber: 1,
        label: 'Lower Power',
        bodyParts: ['quads', 'hamstrings', 'glutes'],
        estimatedMinutes: 60,
        trainingFocus: 'Strength',
      },
      {
        dayNumber: 2,
        label: 'Upper Power',
        bodyParts: ['chest', 'back', 'shoulders'],
        estimatedMinutes: 60,
        trainingFocus: 'Strength',
      },
      {
        dayNumber: 3,
        label: 'Lower Accessory',
        bodyParts: ['hamstrings', 'quads', 'glutes', 'calves'],
        estimatedMinutes: 45,
        trainingFocus: 'Hypertrophy',
      },
      {
        dayNumber: 4,
        label: 'Upper Accessory',
        bodyParts: ['back', 'shoulders', 'biceps', 'triceps'],
        estimatedMinutes: 45,
        trainingFocus: 'Hypertrophy',
      },
    ],
  },
}

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

export interface CompletedSet {
  id?: string
  exerciseId: string
  weight: number
  weightUnit?: 'kg' | 'lbs'
  reps: number
}
