import type {
  WorkoutPlan,
  WorkoutDay,
  WorkoutExercise,
  ExerciseLibrary,
  MuscleProgress,
  CompletedWorkout,
  FitnessProfile,
  Goal,
} from '@/types/database'

/**
 * Adjustment suggestion types for adaptive planning
 */
export type AdjustmentType = 'exercise_swap' | 'volume_reduction' | 'volume_increase' | 'exercise_remove' | 'weak_muscle_support' | 'recovery_modification'

export interface AdjustmentSuggestion {
  id: string
  type: AdjustmentType
  dayIndex: number
  exerciseIndex?: number
  title: string
  reason: string
  currentState: any
  suggestedState: any
  confidence: number // 0-100
  category: 'recovery' | 'balance' | 'strength' | 'efficiency'
}

export interface PlanAnalysis {
  suggestions: AdjustmentSuggestion[]
  overallBalance: 'well_balanced' | 'slightly_imbalanced' | 'highly_imbalanced'
  recoveryFit: 'good' | 'moderate' | 'risky'
  averageWeeklyVolume: number
  muscleImbalances: Array<{ muscle: string; issue: string }>
}

/**
 * Analyze a workout plan and generate adaptive adjustment suggestions
 *
 * Returns deterministic suggestions based on:
 * - Recent recovery scores and muscle progress
 * - Exercise fatigue patterns
 * - Volume distribution across week
 * - Weak muscle identification
 * - Equipment availability
 */
export function analyzeWorkoutPlan(
  plan: WorkoutPlan,
  workoutDays: WorkoutDay[],
  workoutExercises: Map<string, WorkoutExercise[]>, // Map of day_id -> exercises
  exercises: ExerciseLibrary[],
  muscleProgress: MuscleProgress[],
  recentWorkouts: CompletedWorkout[],
  fitnessProfile: FitnessProfile | null,
  goals: Goal[]
): PlanAnalysis {
  const suggestions: AdjustmentSuggestion[] = []

  // 1. Analyze recovery fit and suggest modifications
  const recoveryAnalysis = analyzeRecoveryFit(
    workoutDays,
    workoutExercises,
    exercises,
    muscleProgress,
    recentWorkouts
  )
  suggestions.push(...recoveryAnalysis.suggestions)

  // 2. Analyze muscle balance and suggest adjustments
  const balanceAnalysis = analyzeMuscleBalance(
    workoutDays,
    workoutExercises,
    exercises,
    muscleProgress,
    goals,
    fitnessProfile
  )
  suggestions.push(...balanceAnalysis.suggestions)

  // 3. Analyze volume and suggest reductions if needed
  const volumeAnalysis = analyzeWeeklyVolume(workoutDays, workoutExercises, recentWorkouts)
  suggestions.push(...volumeAnalysis.suggestions)

  // 4. Suggest exercise swaps for better variations
  const swapAnalysis = suggestExerciseSwaps(
    workoutDays,
    workoutExercises,
    exercises,
    muscleProgress,
    fitnessProfile
  )
  suggestions.push(...swapAnalysis.suggestions)

  // Calculate overall metrics
  const overallBalance = calculateOverallBalance(balanceAnalysis.imbalances)
  const recoveryFit = recoveryAnalysis.fit

  return {
    suggestions: suggestions.sort((a, b) => b.confidence - a.confidence),
    overallBalance,
    recoveryFit,
    averageWeeklyVolume: volumeAnalysis.totalVolume,
    muscleImbalances: balanceAnalysis.imbalances,
  }
}

/**
 * Analyze if plan fits current recovery capacity
 */
function analyzeRecoveryFit(
  workoutDays: WorkoutDay[],
  workoutExercises: Map<string, WorkoutExercise[]>,
  exercises: ExerciseLibrary[],
  muscleProgress: MuscleProgress[],
  recentWorkouts: CompletedWorkout[]
): { suggestions: AdjustmentSuggestion[]; fit: 'good' | 'moderate' | 'risky' } {
  const suggestions: AdjustmentSuggestion[] = []

  // Count high-fatigue exercises in plan
  const threeWeeksAgo = new Date()
  threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21)
  const recentHighIntensity = recentWorkouts
    .filter((w) => new Date(w.started_at) > threeWeeksAgo && w.effort_level && w.effort_level >= 4)
    .length

  // Check recovery scores
  const lowRecoveryMuscles = muscleProgress.filter((mp) => mp.recovery_score && mp.recovery_score < 50)

  // If low recovery and recent high intensity, suggest modifications
  if (lowRecoveryMuscles.length > 0 && recentHighIntensity > 3) {
    lowRecoveryMuscles.forEach((muscle, idx) => {
      if (idx < 2) {
        // Suggest reducing volume for this muscle
        suggestions.push({
          id: `recovery-${muscle.id}`,
          type: 'volume_reduction',
          dayIndex: 0,
          title: `Reduce ${muscle.muscle_group?.display_name || 'unknown'} volume`,
          reason: `Low recovery score (${muscle.recovery_score}/100). Plan includes heavy training for this muscle within 3 days.`,
          currentState: { muscle: muscle.id },
          suggestedState: { reduce_by_percent: 30 },
          confidence: 70,
          category: 'recovery',
        })
      }
    })
  }

  const fit = lowRecoveryMuscles.length > 2 ? 'risky' : lowRecoveryMuscles.length > 0 ? 'moderate' : 'good'

  return { suggestions, fit }
}

/**
 * Analyze muscle balance in plan
 */
function analyzeMuscleBalance(
  workoutDays: WorkoutDay[],
  workoutExercises: Map<string, WorkoutExercise[]>,
  exercises: ExerciseLibrary[],
  muscleProgress: MuscleProgress[],
  goals: Goal[],
  fitnessProfile: FitnessProfile | null
): { suggestions: AdjustmentSuggestion[]; imbalances: Array<{ muscle: string; issue: string }> } {
  const suggestions: AdjustmentSuggestion[] = []
  const imbalances: Array<{ muscle: string; issue: string }> = []

  // Calculate volume per muscle in plan
  const plannedMuscleVolume = new Map<string, number>()
  workoutDays.forEach((day, dayIdx) => {
    const dayExercises = workoutExercises.get(day.id) || []
    dayExercises.forEach((we) => {
      const exercise = exercises.find((e) => e.id === we.exercise_id)
      if (exercise) {
        const sets = we.sets || 3
        const reps = ((we.reps_min || 0) + (we.reps_max || 0)) / 2
        const volume = sets * reps

        const primary = exercise.primary_muscle.toLowerCase()
        plannedMuscleVolume.set(primary, (plannedMuscleVolume.get(primary) || 0) + volume)

        exercise.secondary_muscles?.forEach((sec) => {
          const secLower = sec.toLowerCase()
          plannedMuscleVolume.set(secLower, (plannedMuscleVolume.get(secLower) || 0) + volume * 0.5)
        })
      }
    })
  })

  // Find weak muscles (low level, low recent volume)
  const weakMuscles = muscleProgress
    .filter((mp) => mp.level && mp.level < 10)
    .sort((a, b) => a.level - b.level)
    .slice(0, 3)

  // Check if weak muscles are in plan
  weakMuscles.forEach((weakMuscle, idx) => {
    const muscleKey = weakMuscle.muscle_group?.name?.toLowerCase() || ''
    const plannedVolume = plannedMuscleVolume.get(muscleKey) || 0

    if (plannedVolume === 0 && idx < 2) {
      suggestions.push({
        id: `weak-muscle-${weakMuscle.id}`,
        type: 'weak_muscle_support',
        dayIndex: 0,
        title: `Add ${weakMuscle.muscle_group?.display_name || 'exercise'} work`,
        reason: `${weakMuscle.muscle_group?.display_name || 'This muscle'} is at level ${weakMuscle.level} and not trained in this plan.`,
        currentState: { planned_volume: plannedVolume },
        suggestedState: { add_exercise: true, suggested_volume: 30 },
        confidence: 75,
        category: 'strength',
      })

      imbalances.push({
        muscle: weakMuscle.muscle_group?.display_name || '',
        issue: `Not trained in current plan (Level ${weakMuscle.level})`,
      })
    }
  })

  // Check for common imbalances (e.g., chest > back)
  const chestVolume = plannedMuscleVolume.get('chest') || 0
  const backVolume = plannedMuscleVolume.get('back') || 0
  const quadsVolume = plannedMuscleVolume.get('quads') || 0
  const hamsVolume = plannedMuscleVolume.get('hamstrings') || 0

  if (chestVolume > backVolume * 1.5 && backVolume > 0) {
    suggestions.push({
      id: 'imbalance-chest-back',
      type: 'exercise_swap',
      dayIndex: 0,
      title: 'Increase back volume',
      reason: `Chest volume (${Math.round(chestVolume)}) is significantly higher than back (${Math.round(backVolume)}).`,
      currentState: { chest_volume: chestVolume, back_volume: backVolume },
      suggestedState: { increase_back_by_percent: 30 },
      confidence: 65,
      category: 'balance',
    })

    imbalances.push({
      muscle: 'Chest vs Back',
      issue: `Chest heavily prioritized (${Math.round(chestVolume)} vs ${Math.round(backVolume)} volume)`,
    })
  }

  if (quadsVolume > hamsVolume * 1.5 && hamsVolume > 0) {
    suggestions.push({
      id: 'imbalance-quads-hams',
      type: 'exercise_swap',
      dayIndex: 0,
      title: 'Add hamstring accessory work',
      reason: `Quad volume (${Math.round(quadsVolume)}) is higher than hamstrings (${Math.round(hamsVolume)}).`,
      currentState: { quads_volume: quadsVolume, hams_volume: hamsVolume },
      suggestedState: { add_hams_accessory: true },
      confidence: 60,
      category: 'balance',
    })

    imbalances.push({
      muscle: 'Quads vs Hamstrings',
      issue: `Quads prioritized (${Math.round(quadsVolume)} vs ${Math.round(hamsVolume)} volume)`,
    })
  }

  return { suggestions, imbalances }
}

/**
 * Analyze weekly volume
 */
function analyzeWeeklyVolume(
  workoutDays: WorkoutDay[],
  workoutExercises: Map<string, WorkoutExercise[]>,
  recentWorkouts: CompletedWorkout[]
): { suggestions: AdjustmentSuggestion[]; totalVolume: number } {
  const suggestions: AdjustmentSuggestion[] = []
  let totalVolume = 0

  // Calculate planned volume
  workoutDays.forEach((day) => {
    const dayExercises = workoutExercises.get(day.id) || []
    dayExercises.forEach((we) => {
      const sets = we.sets || 3
      const reps = ((we.reps_min || 0) + (we.reps_max || 0)) / 2
      totalVolume += sets * reps
    })
  })

  // Compare with recent average
  const lastWeek = new Date()
  lastWeek.setDate(lastWeek.getDate() - 7)
  const recentAvgVolume = recentWorkouts
    .filter((w) => new Date(w.started_at) > lastWeek && w.total_volume)
    .reduce((sum, w) => sum + (w.total_volume || 0), 0) / Math.max(1, recentWorkouts.filter((w) => new Date(w.started_at) > lastWeek).length)

  // If planned is significantly higher, suggest reduction
  if (recentAvgVolume > 0 && totalVolume > recentAvgVolume * 1.4) {
    suggestions.push({
      id: 'volume-high',
      type: 'volume_reduction',
      dayIndex: 0,
      title: 'Reduce weekly volume',
      reason: `Planned volume (${Math.round(totalVolume)}) is 40% higher than recent average (${Math.round(recentAvgVolume)}).`,
      currentState: { planned_volume: totalVolume, recent_avg: recentAvgVolume },
      suggestedState: { reduce_to: Math.round(recentAvgVolume * 1.1) },
      confidence: 70,
      category: 'recovery',
    })
  }

  return { suggestions, totalVolume }
}

/**
 * Suggest exercise swaps based on fatigue and alternatives
 */
function suggestExerciseSwaps(
  workoutDays: WorkoutDay[],
  workoutExercises: Map<string, WorkoutExercise[]>,
  exercises: ExerciseLibrary[],
  muscleProgress: MuscleProgress[],
  fitnessProfile: FitnessProfile | null
): { suggestions: AdjustmentSuggestion[] } {
  const suggestions: AdjustmentSuggestion[] = []

  // Find heavy/compound exercises that could be swapped
  const compoundExercises = exercises.filter((e) => e.is_compound && e.difficulty === 'advanced')
  const lowFatigueAlternatives = exercises.filter((e) => !e.is_compound && e.difficulty === 'beginner')

  // If user has low recovery, suggest swapping heavy lifts for lower-fatigue versions
  const avgRecovery =
    muscleProgress.reduce((sum, mp) => sum + (mp.recovery_score || 0), 0) / Math.max(1, muscleProgress.length)

  if (avgRecovery < 50 && compoundExercises.length > 0 && lowFatigueAlternatives.length > 0) {
    // Suggest swapping in first day
    suggestions.push({
      id: 'swap-lower-fatigue',
      type: 'exercise_swap',
      dayIndex: 0,
      title: 'Use lower-fatigue exercise alternatives',
      reason: `Average recovery score is ${Math.round(avgRecovery)}/100. Consider dumbbells instead of barbells for reduced CNS fatigue.`,
      currentState: { exercise_type: 'barbell', fatigue_profile: 'high' },
      suggestedState: { exercise_type: 'dumbbell', fatigue_profile: 'moderate' },
      confidence: 65,
      category: 'recovery',
    })
  }

  // If user has limited equipment, suggest swaps
  const availableEquipment = fitnessProfile?.available_equipment || []
  if (availableEquipment.length > 0 && availableEquipment.includes('bodyweight')) {
    // Find bodyweight alternatives
    const bodyweightOptions = exercises.filter((e) => e.equipment === 'bodyweight' && e.difficulty !== 'advanced')
    if (bodyweightOptions.length > 0) {
      suggestions.push({
        id: 'swap-bodyweight',
        type: 'exercise_swap',
        dayIndex: 0,
        title: 'Use bodyweight alternatives',
        reason: 'Bodyweight movements reduce setup time and equipment needs.',
        currentState: { equipment: 'varied' },
        suggestedState: { equipment: 'bodyweight' },
        confidence: 50,
        category: 'efficiency',
      })
    }
  }

  return { suggestions }
}

/**
 * Calculate overall balance rating
 */
function calculateOverallBalance(
  imbalances: Array<{ muscle: string; issue: string }>
): 'well_balanced' | 'slightly_imbalanced' | 'highly_imbalanced' {
  if (imbalances.length === 0) return 'well_balanced'
  if (imbalances.length <= 2) return 'slightly_imbalanced'
  return 'highly_imbalanced'
}
