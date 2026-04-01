import type { ExerciseLibrary, FitnessProfile, MuscleProgress } from '@/types/database'
import { getRecoveryReadiness } from './muscle-intelligence'

export interface RecommendationPreferences {
  targetMuscles: string[]
  timeAvailable: number
  energyLevel: 1 | 2 | 3 | 4 | 5
  desiredSplit: 'full_body' | 'upper_lower' | 'push_pull_legs' | 'upper' | 'lower'
  availableEquipment: string[]
}

export interface GeneratedWorkout {
  name: string
  smartGoal: string
  estimatedDuration: number
  exercises: GeneratedExercise[]
  warmup: GeneratedExercise[]
  finisher: GeneratedExercise | null
  cooldown: GeneratedExercise | null
  reasoning: WorkoutReasoning
}

export interface WorkoutReasoning {
  selectedMuscles: string
  recoveryStatus: string
  equipmentFit: string
  timefit: string
}

export interface GeneratedExercise {
  name: string
  primaryMuscle: string
  secondaryMuscles: string[]
  sets: number
  reps: string
  restSeconds: number
  difficulty: string
  type: 'warmup' | 'main' | 'accessory' | 'finisher' | 'cooldown'
  tips: string[]
}

export function generateWorkoutRecommendation(
  preferences: RecommendationPreferences,
  exercises: ExerciseLibrary[],
  fitnessProfile: FitnessProfile | null,
  muscleProgress: MuscleProgress[]
): GeneratedWorkout {
  const recentlyTrained = muscleProgress
    .filter((mp) => {
      const lastTrained = mp.last_trained_at ? new Date(mp.last_trained_at) : null
      if (!lastTrained) return false
      const daysSince = (Date.now() - lastTrained.getTime()) / (1000 * 60 * 60 * 24)
      return daysSince < 3
    })
    .map((mp) => ({
      name: mp.muscle_group?.name?.toLowerCase() || '',
      recoveryReadiness: getRecoveryReadiness(mp),
    }))
    .filter((r) => r.name)

  const warmupExercises = buildWarmup(exercises, preferences)
  const mainExercises = buildMainLifts(exercises, preferences, fitnessProfile, recentlyTrained)
  const accessories = buildAccessories(exercises, preferences, mainExercises, recentlyTrained)
  const finisher = buildFinisher(exercises, preferences, preferences.energyLevel >= 4)
  const cooldown = buildCooldown(exercises)

  const estimatedDuration = computeDuration([...warmupExercises, ...mainExercises, ...accessories, ...(finisher ? [finisher] : []), ...cooldown])
  const smartGoal = buildSmartGoalText(mainExercises, preferences, fitnessProfile)
  
  const reasoning: WorkoutReasoning = {
    selectedMuscles: `Focused on ${preferences.targetMuscles.join(', ')}`,
    recoveryStatus: recentlyTrained.length > 0 
      ? `Avoiding heavy work on recently trained muscles` 
      : `All muscles recovered and ready`,
    equipmentFit: `Using ${preferences.availableEquipment.join(', ')}`,
    timefit: `${estimatedDuration} min session fits your ${preferences.timeAvailable} min availability`,
  }

  return {
    name: buildWorkoutName(preferences),
    smartGoal,
    estimatedDuration,
    exercises: [...mainExercises, ...accessories],
    warmup: warmupExercises,
    finisher: finisher || null,
    cooldown,
    reasoning,
  }
}

function buildWarmup(exercises: ExerciseLibrary[], preferences: RecommendationPreferences): GeneratedExercise[] {
  const warmups = exercises.filter((e) => e.category === 'warmup')
  if (warmups.length === 0) {
    return [
      {
        name: 'Arm Circles & Shoulder Rotations',
        primaryMuscle: 'shoulders',
        secondaryMuscles: [],
        sets: 1,
        reps: '10 each direction',
        restSeconds: 0,
        difficulty: 'beginner',
        type: 'warmup',
        tips: ['Controlled movement', 'Focus on mobility'],
      },
    ]
  }
  return warmups.slice(0, 1).map((e) => ({
    name: e.name,
    primaryMuscle: e.primary_muscle,
    secondaryMuscles: e.secondary_muscles || [],
    sets: 1,
    reps: '10-15',
    restSeconds: 30,
    difficulty: e.difficulty,
    type: 'warmup' as const,
    tips: e.tips || [],
  }))
}

function buildMainLifts(
  exercises: ExerciseLibrary[],
  preferences: RecommendationPreferences,
  fitnessProfile: FitnessProfile | null,
  recentlyTrained: Array<{ name: string; recoveryReadiness: number }>
): GeneratedExercise[] {
  const candidates = exercises.filter((e) => {
    const muscleMatch = preferences.targetMuscles.some((tm) =>
      e.primary_muscle.toLowerCase().includes(tm.toLowerCase())
    )
    const equipmentMatch = !e.equipment || preferences.availableEquipment.some((ae) => e.equipment?.toLowerCase().includes(ae.toLowerCase()))
    const notRecentlyTrained = !recentlyTrained.some((rt) => rt.name.includes(e.primary_muscle.toLowerCase()))
    const isCompound = e.is_compound
    return muscleMatch && equipmentMatch && notRecentlyTrained && isCompound
  })

  const mainLiftCount = preferences.timeAvailable > 60 ? 3 : preferences.timeAvailable > 45 ? 2 : 1
  const selected = candidates.slice(0, mainLiftCount)

  return selected.map((e) => ({
    name: e.name,
    primaryMuscle: e.primary_muscle,
    secondaryMuscles: e.secondary_muscles || [],
    sets: preferences.energyLevel >= 4 ? 4 : 3,
    reps: e.difficulty === 'beginner' ? '8-10' : e.difficulty === 'intermediate' ? '6-8' : '3-5',
    restSeconds: e.difficulty === 'beginner' ? 60 : e.difficulty === 'intermediate' ? 90 : 180,
    difficulty: e.difficulty,
    type: 'main' as const,
    tips: e.tips || ['Control the weight', 'Full range of motion'],
  }))
}

function buildAccessories(
  exercises: ExerciseLibrary[],
  preferences: RecommendationPreferences,
  mainLifts: GeneratedExercise[],
  recentlyTrained: Array<{ name: string; recoveryReadiness: number }>
): GeneratedExercise[] {
  const trainedMuscles = new Set([
    ...mainLifts.map((e) => e.primaryMuscle.toLowerCase()),
    ...mainLifts.flatMap((e) => e.secondaryMuscles.map((m) => m.toLowerCase())),
  ])

  const candidates = exercises.filter((e) => {
    const isIsolation = !e.is_compound
    const targetsTrained = trainedMuscles.has(e.primary_muscle.toLowerCase())
    const equipmentMatch = !e.equipment || preferences.availableEquipment.some((ae) => e.equipment?.toLowerCase().includes(ae.toLowerCase()))
    return isIsolation && targetsTrained && equipmentMatch
  })

  const accessoryCount = preferences.timeAvailable > 60 ? 2 : preferences.timeAvailable > 45 ? 1 : 0
  const selected = candidates.slice(0, accessoryCount)

  return selected.map((e) => ({
    name: e.name,
    primaryMuscle: e.primary_muscle,
    secondaryMuscles: e.secondary_muscles || [],
    sets: 3,
    reps: '10-15',
    restSeconds: 60,
    difficulty: e.difficulty,
    type: 'accessory' as const,
    tips: e.tips || ['Controlled tempo'],
  }))
}

function buildFinisher(exercises: ExerciseLibrary[], preferences: RecommendationPreferences, highEnergy: boolean): GeneratedExercise | null {
  if (!highEnergy || preferences.timeAvailable < 50) return null
  const finishers = exercises.filter((e) => e.category === 'cardio')
  if (finishers.length === 0) return null
  const selected = finishers[0]
  return {
    name: selected.name,
    primaryMuscle: selected.primary_muscle,
    secondaryMuscles: selected.secondary_muscles || [],
    sets: 1,
    reps: '2-3 min',
    restSeconds: 0,
    difficulty: selected.difficulty,
    type: 'finisher',
    tips: ['Go all out'],
  }
}

function buildCooldown(exercises: ExerciseLibrary[]): GeneratedExercise[] {
  const cooldowns = exercises.filter((e) => e.category === 'cooldown')
  if (cooldowns.length === 0) {
    return [
      {
        name: 'Static Stretching',
        primaryMuscle: 'general',
        secondaryMuscles: [],
        sets: 1,
        reps: '5-10 min',
        restSeconds: 0,
        difficulty: 'beginner',
        type: 'cooldown',
        tips: ['Hold each stretch 30 seconds'],
      },
    ]
  }
  return cooldowns.slice(0, 1).map((e) => ({
    name: e.name,
    primaryMuscle: e.primary_muscle,
    secondaryMuscles: e.secondary_muscles || [],
    sets: 1,
    reps: '5-10 min',
    restSeconds: 0,
    difficulty: e.difficulty,
    type: 'cooldown' as const,
    tips: e.tips || ['Relax and recover'],
  }))
}

function computeDuration(exercises: GeneratedExercise[]): number {
  let total = 0
  exercises.forEach((e) => {
    const timePerSet = e.type === 'warmup' ? 3 : e.type === 'cooldown' ? 5 : e.type === 'finisher' ? 3 : 4
    const numSets = e.sets || 1
    total += (timePerSet * numSets) + e.restSeconds / 60
  })
  return Math.round(total)
}

function buildSmartGoalText(mainLifts: GeneratedExercise[], preferences: RecommendationPreferences, fitnessProfile: FitnessProfile | null): string {
  if (mainLifts.length === 0) {
    return 'Complete a balanced workout session'
  }
  const reps = mainLifts[0].reps.split('-')[0]
  return `Complete ${mainLifts.length} exercises for ${preferences.targetMuscles.join(' and ')} with ${mainLifts[0].sets} sets of ${reps}+ reps`
}

function buildWorkoutName(preferences: RecommendationPreferences): string {
  const muscleNames = preferences.targetMuscles.slice(0, 2).map((m) => m.charAt(0).toUpperCase() + m.slice(1)).join(' & ')
  return muscleNames
}
