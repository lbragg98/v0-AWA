// Workout recommendation engine - generates personalized workouts
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

// Normalize muscle names to handle variations
function normalizeMuscle(muscle: string): string {
  const normalized = muscle.toLowerCase().trim()
  const aliases: Record<string, string> = {
    'chest': 'chest',
    'pecs': 'chest',
    'pectoral': 'chest',
    'back': 'back',
    'lats': 'back',
    'lat': 'back',
    'latissimus': 'back',
    'shoulders': 'shoulders',
    'shoulder': 'shoulders',
    'delts': 'shoulders',
    'deltoid': 'shoulders',
    'biceps': 'biceps',
    'bicep': 'biceps',
    'triceps': 'triceps',
    'tricep': 'triceps',
    'arms': 'biceps',
    'forearms': 'forearms',
    'forearm': 'forearms',
    'abs': 'abs',
    'abdominal': 'abs',
    'core': 'abs',
    'obliques': 'obliques',
    'oblique': 'obliques',
    'glutes': 'glutes',
    'glute': 'glutes',
    'butt': 'glutes',
    'quads': 'quads',
    'quadriceps': 'quads',
    'hamstrings': 'hamstrings',
    'hamstring': 'hamstrings',
    'hams': 'hamstrings',
    'calves': 'calves',
    'calf': 'calves',
    'traps': 'traps',
    'trapezius': 'traps',
  }
  return aliases[normalized] || normalized
}

// Find exercises that match a target muscle
function findExercisesForMuscle(
  targetMuscle: string,
  exercises: ExerciseLibrary[],
  equipment?: string[],
  isCompound: boolean = true
): ExerciseLibrary[] {
  const normalizedTarget = normalizeMuscle(targetMuscle)

  return exercises.filter((ex) => {
    const primaryMatch = normalizeMuscle(ex.primary_muscle) === normalizedTarget
    const secondaryMatch =
      ex.secondary_muscles &&
      ex.secondary_muscles.some((m) => normalizeMuscle(m) === normalizedTarget)
    const equipmentMatch =
      !equipment || !ex.equipment || equipment.some((e) => ex.equipment?.includes(e))
    const compoundMatch = !isCompound || ex.is_compound

    return (primaryMatch || secondaryMatch) && equipmentMatch && compoundMatch
  })
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
    .map((mp) => normalizeMuscle(mp.muscle_group?.name || ''))

  const warmupExercises = findWarmupExercises(exercises)
  const mainExercises = generateMainLifts(
    preferences.targetMuscles,
    exercises,
    preferences.availableEquipment,
    recentlyTrained
  )
  const accessories = generateAccessories(
    preferences.targetMuscles,
    exercises,
    mainExercises,
    preferences.availableEquipment
  )
  const finisher = preferences.energyLevel >= 4 ? findFinisher(exercises) : null
  const cooldown = findCooldownExercises(exercises)

  const estimatedDuration = computeWorkoutDuration(
    [...warmupExercises, ...mainExercises, ...accessories, ...(finisher ? [finisher] : []), ...cooldown]
  )

  const reasoning: WorkoutReasoning = {
    selectedMuscles: preferences.targetMuscles.join(', '),
    recoveryStatus: recentlyTrained.length > 0 ? 'Avoiding recently trained muscles' : 'All muscles recovered',
    equipmentFit: `Using available equipment: ${preferences.availableEquipment.join(', ') || 'bodyweight'}`,
    timefit: `${estimatedDuration}min session`,
  }

  return {
    name: generateWorkoutName(preferences.targetMuscles),
    smartGoal: generateSmartGoal(mainExercises, preferences.targetMuscles),
    estimatedDuration,
    exercises: [...mainExercises, ...accessories],
    warmup: warmupExercises,
    finisher,
    cooldown,
    reasoning,
  }
}

function generateMainLifts(
  targetMuscles: string[],
  exercises: ExerciseLibrary[],
  equipment: string[],
  recentlyTrained: string[]
): GeneratedExercise[] {
  const results: GeneratedExercise[] = []

  for (const muscle of targetMuscles) {
    if (recentlyTrained.includes(normalizeMuscle(muscle))) {
      continue
    }

    let candidates = findExercisesForMuscle(muscle, exercises, equipment, true)

    if (candidates.length === 0) {
      candidates = findExercisesForMuscle(muscle, exercises, equipment, false)
    }

    if (candidates.length > 0) {
      const selected = candidates[Math.floor(Math.random() * Math.min(3, candidates.length))]
      results.push({
        name: selected.name,
        primaryMuscle: selected.primary_muscle,
        secondaryMuscles: selected.secondary_muscles || [],
        sets: 3,
        reps: '6-10',
        restSeconds: 120,
        difficulty: selected.difficulty,
        type: 'main',
        tips: selected.tips || ['Control the weight', 'Full range of motion'],
      })
    }
  }

  return results
}

function generateAccessories(
  targetMuscles: string[],
  exercises: ExerciseLibrary[],
  mainLifts: GeneratedExercise[],
  equipment: string[]
): GeneratedExercise[] {
  const results: GeneratedExercise[] = []

  for (const muscle of targetMuscles) {
    let candidates = findExercisesForMuscle(muscle, exercises, equipment, false).filter(
      (e) => !mainLifts.some((m) => m.name === e.name)
    )

    if (candidates.length > 0) {
      const selected = candidates[Math.floor(Math.random() * Math.min(3, candidates.length))]
      results.push({
        name: selected.name,
        primaryMuscle: selected.primary_muscle,
        secondaryMuscles: selected.secondary_muscles || [],
        sets: 3,
        reps: '10-15',
        restSeconds: 60,
        difficulty: selected.difficulty,
        type: 'accessory',
        tips: selected.tips || ['Controlled tempo', 'Mind-muscle connection'],
      })
    }
  }

  return results
}

function findWarmupExercises(exercises: ExerciseLibrary[]): GeneratedExercise[] {
  const warmups = exercises.filter((e) => e.category === 'warmup').slice(0, 1)
  if (warmups.length === 0) {
    return [
      {
        name: 'Dynamic Warmup',
        primaryMuscle: 'general',
        secondaryMuscles: [],
        sets: 1,
        reps: '5-10 min',
        restSeconds: 0,
        difficulty: 'beginner',
        type: 'warmup',
        tips: ['Increase heart rate', 'Prepare joints'],
      },
    ]
  }
  return warmups.map((e) => ({
    name: e.name,
    primaryMuscle: e.primary_muscle,
    secondaryMuscles: e.secondary_muscles || [],
    sets: 1,
    reps: '5-10 min',
    restSeconds: 0,
    difficulty: e.difficulty,
    type: 'warmup',
    tips: e.tips || [],
  }))
}

function findFinisher(exercises: ExerciseLibrary[]): GeneratedExercise | null {
  const cardio = exercises.filter((e) => e.category === 'cardio').slice(0, 1)
  if (cardio.length === 0) return null
  const selected = cardio[0]
  return {
    name: selected.name,
    primaryMuscle: selected.primary_muscle,
    secondaryMuscles: selected.secondary_muscles || [],
    sets: 1,
    reps: '2-3 min',
    restSeconds: 0,
    difficulty: selected.difficulty,
    type: 'finisher',
    tips: ['All out effort', 'High intensity'],
  }
}

function findCooldownExercises(exercises: ExerciseLibrary[]): GeneratedExercise[] {
  const cooldowns = exercises.filter((e) => e.category === 'cooldown').slice(0, 1)
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
        tips: ['Hold 30 seconds each', 'Relax and breathe'],
      },
    ]
  }
  return cooldowns.map((e) => ({
    name: e.name,
    primaryMuscle: e.primary_muscle,
    secondaryMuscles: e.secondary_muscles || [],
    sets: 1,
    reps: '5-10 min',
    restSeconds: 0,
    difficulty: e.difficulty,
    type: 'cooldown',
    tips: e.tips || [],
  }))
}

function computeWorkoutDuration(exercises: GeneratedExercise[]): number {
  let total = 0
  exercises.forEach((e) => {
    const timePerSet = e.type === 'warmup' ? 3 : e.type === 'cooldown' ? 5 : e.type === 'finisher' ? 3 : 4
    const numSets = e.sets || 1
    total += timePerSet * numSets + e.restSeconds / 60
  })
  return Math.round(total)
}

function generateSmartGoal(mainLifts: GeneratedExercise[], targetMuscles: string[]): string {
  if (mainLifts.length === 0) return 'Complete a balanced workout'
  const muscleStr = targetMuscles.join(' and ')
  return 'Complete ' + mainLifts.length + ' compounds for ' + muscleStr + ' with quality form'
}

function generateWorkoutName(targetMuscles: string[]): string {
  const shortened = targetMuscles.slice(0, 2).map((m) => m.charAt(0).toUpperCase() + m.slice(1))
  return shortened.join(' & ')
}
