import type { CompletedWorkout, MuscleProgress, FitnessProfile, CompletedSet } from '@/types/database'

/**
 * User-facing readiness states mapped from 0-100 score
 */
export type ReadinessState = 'recovery_focus' | 'take_it_lighter' | 'solid_to_train' | 'ready_to_push'

export interface UserReadiness {
  score: number // 0-100
  state: ReadinessState
  message: string
  recommendation: string
  factors: ReadinessFactor[]
}

export interface ReadinessFactor {
  name: string
  value: number // 0-100
  impact: 'positive' | 'neutral' | 'negative'
}

/**
 * Muscle-level recovery score (used for updated muscle_progress.recovery_score)
 * Base 100 (fully recovered) → decreases with workout load → recovers over time
 */
export interface MuscleRecoveryState {
  muscleGroupId: string
  recoveryScore: number // 0-100
  daysToFullRecovery: number
  state: 'fully_recovered' | 'recovering' | 'heavily_fatigued'
}

/**
 * Calculate user-level readiness score based on:
 * - Recent workout frequency (1-7 day trend)
 * - Total volume load from last 3 workouts
 * - Energy and effort ratings from last workout
 * - Days since last workout
 *
 * Formula (100 = fully recovered and ready):
 * Base = 70 (starting point)
 * + Workout frequency impact (-20 to +10)
 * + Volume load impact (-25 to +15)
 * + Rest recovery (-30 to +20)
 * Final = clamp to 0-100
 */
export function calculateUserReadiness(
  workouts: CompletedWorkout[],
  muscleProgress: MuscleProgress[],
  fitnessProfile: FitnessProfile | null
): UserReadiness {
  const factors: ReadinessFactor[] = []
  let score = 70 // Base score

  // Factor 1: Workout frequency (last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const workoutsLastWeek = workouts.filter((w) => new Date(w.started_at) > sevenDaysAgo).length

  const frequencyTarget = fitnessProfile?.workout_frequency || 4
  let frequencyImpact = 0
  if (workoutsLastWeek < frequencyTarget - 1) {
    // Under-training: positive impact
    frequencyImpact = (frequencyTarget - workoutsLastWeek) * 2 // -20 to +20
  } else if (workoutsLastWeek > frequencyTarget + 1) {
    // Over-training: negative impact
    frequencyImpact = -((workoutsLastWeek - frequencyTarget) * 3) // -15 max
  }
  score += frequencyImpact
  factors.push({
    name: 'Workout Frequency',
    value: Math.min(100, Math.max(0, 50 + frequencyImpact * 2.5)),
    impact: frequencyImpact > 0 ? 'positive' : frequencyImpact < 0 ? 'negative' : 'neutral',
  })

  // Factor 2: Volume load (last 3 workouts)
  const last3Workouts = workouts.slice(0, 3)
  const totalVolume = last3Workouts.reduce((sum, w) => sum + (w.total_volume || 0), 0)
  const avgVolumePerWorkout = last3Workouts.length > 0 ? totalVolume / last3Workouts.length : 0

  // Rough estimate: 500 sets/reps = moderate, 2000+ = high volume
  let volumeImpact = 0
  if (avgVolumePerWorkout > 1500) {
    volumeImpact = -25 // High volume = more fatigue
  } else if (avgVolumePerWorkout > 800) {
    volumeImpact = -10 // Moderate volume
  } else if (avgVolumePerWorkout > 0) {
    volumeImpact = +5 // Low volume = good
  }
  score += volumeImpact
  factors.push({
    name: 'Training Load',
    value: Math.min(100, Math.max(0, 70 + volumeImpact)),
    impact: volumeImpact < 0 ? 'negative' : 'positive',
  })

  // Factor 3: Rest recovery (days since last workout)
  const lastWorkout = workouts.length > 0 ? new Date(workouts[0].started_at) : null
  const daysSinceLastWorkout = lastWorkout ? Math.floor((Date.now() - lastWorkout.getTime()) / (1000 * 60 * 60 * 24)) : 999

  let recoveryImpact = 0
  if (daysSinceLastWorkout >= 3) {
    recoveryImpact = +20 // Fully recovered
  } else if (daysSinceLastWorkout >= 2) {
    recoveryImpact = +10 // Good recovery
  } else if (daysSinceLastWorkout >= 1) {
    recoveryImpact = 0 // Neutral
  } else {
    recoveryImpact = -15 // Same day or very recent
  }
  score += recoveryImpact
  factors.push({
    name: 'Rest Days',
    value: Math.min(100, Math.max(0, 50 + recoveryImpact * 2)),
    impact: recoveryImpact > 0 ? 'positive' : recoveryImpact < 0 ? 'negative' : 'neutral',
  })

  // Factor 4: Effort and energy from last workout
  if (workouts.length > 0) {
    const lastWorkoutData = workouts[0]
    const effortLevel = lastWorkoutData.effort_level || 0
    const energyLevel = lastWorkoutData.energy_level || 0

    // High effort (4-5) with low energy = more fatigue
    let effortImpact = 0
    if (effortLevel >= 4 && energyLevel <= 2) {
      effortImpact = -10
    } else if (effortLevel >= 4 && energyLevel >= 4) {
      effortImpact = +5 // Felt good despite effort
    }
    score += effortImpact
    factors.push({
      name: 'Recent Effort',
      value: Math.min(100, Math.max(0, 50 + effortImpact * 5)),
      impact: effortImpact < 0 ? 'negative' : 'positive',
    })
  }

  // Clamp score to 0-100
  score = Math.max(0, Math.min(100, score))

  // Determine state and messaging
  const state = getReadinessState(score)
  const { message, recommendation } = getReadinessMessaging(state, daysSinceLastWorkout, workoutsLastWeek, frequencyTarget)

  return {
    score,
    state,
    message,
    recommendation,
    factors,
  }
}

/**
 * Calculate muscle-level recovery score based on:
 * - Days since last trained
 * - Recent set volume on that muscle
 * - Recovery score decay over time
 *
 * Formula (100 = fully recovered):
 * Base = last recorded recovery_score
 * - Decay per day (10 points/day × days since workout)
 * + Recovery gain per day (15 points/day × days since last workout)
 * Final = clamp to 0-100
 */
export function calculateMuscleRecovery(
  muscle: MuscleProgress,
  recentWorkouts: CompletedWorkout[],
  recentSets: CompletedSet[]
): MuscleRecoveryState {
  const muscleId = muscle.muscle_group_id
  
  // Find last time this muscle was trained
  const lastTrainedDate = muscle.last_trained_at ? new Date(muscle.last_trained_at) : null
  const daysSinceLastTrained = lastTrainedDate 
    ? Math.floor((Date.now() - lastTrainedDate.getTime()) / (1000 * 60 * 60 * 24))
    : 999

  let recoveryScore = muscle.recovery_score || 100

  // If recently trained (< 24 hours), reduce score based on volume
  if (daysSinceLastTrained <= 1) {
    // Get volume from last training session for this muscle
    const recentVolumeForMuscle = recentSets
      .filter((set) => {
        // Assuming set has exercise relationship that links to muscle
        // This is simplified - in reality you'd join with exercise_library
        return true // Simplified for now
      })
      .length

    // High volume (10+ sets) = more fatigue
    if (recentVolumeForMuscle > 15) {
      recoveryScore -= 30 // Heavy session
    } else if (recentVolumeForMuscle > 8) {
      recoveryScore -= 15 // Moderate session
    } else if (recentVolumeForMuscle > 0) {
      recoveryScore -= 5 // Light session
    }
  }

  // Recovery gain per day since last training
  // Each day adds 15 points (full recovery in ~7 days)
  if (daysSinceLastTrained > 0) {
    recoveryScore += daysSinceLastTrained * 15
  }

  // Clamp to 0-100
  recoveryScore = Math.max(0, Math.min(100, recoveryScore))

  // Determine recovery state
  let state: 'fully_recovered' | 'recovering' | 'heavily_fatigued'
  if (recoveryScore >= 85) {
    state = 'fully_recovered'
  } else if (recoveryScore >= 50) {
    state = 'recovering'
  } else {
    state = 'heavily_fatigued'
  }

  // Estimate days to full recovery
  const pointsNeeded = 100 - recoveryScore
  const daysToFullRecovery = Math.ceil(pointsNeeded / 15)

  return {
    muscleGroupId: muscleId,
    recoveryScore,
    daysToFullRecovery,
    state,
  }
}

/**
 * Map score (0-100) to user-facing readiness state
 */
function getReadinessState(score: number): ReadinessState {
  if (score >= 80) return 'ready_to_push'
  if (score >= 60) return 'solid_to_train'
  if (score >= 40) return 'take_it_lighter'
  return 'recovery_focus'
}

/**
 * Generate human-friendly messaging for readiness state
 */
function getReadinessMessaging(
  state: ReadinessState,
  daysSinceLastWorkout: number,
  workoutsLastWeek: number,
  targetFrequency: number
): { message: string; recommendation: string } {
  const messages = {
    ready_to_push: {
      message: 'You\'re firing on all cylinders',
      recommendation: 'Perfect time for a challenging workout or try a new PR',
    },
    solid_to_train: {
      message: 'Good to go for a solid session',
      recommendation: 'You\'re well-recovered. Stick to your normal routine',
    },
    take_it_lighter: {
      message: 'Consider a lighter session today',
      recommendation: 'Your body could use some easy movement or active recovery',
    },
    recovery_focus: {
      message: 'Recovery is the priority today',
      recommendation: 'Take a rest day or do low-intensity activity like walking or stretching',
    },
  }

  return messages[state]
}

/**
 * Get color and badge styling for readiness state
 */
export function getReadinessStyle(state: ReadinessState): { color: string; bgColor: string } {
  const styles = {
    ready_to_push: { color: 'text-green-700 dark:text-green-400', bgColor: 'bg-green-500/20' },
    solid_to_train: { color: 'text-blue-700 dark:text-blue-400', bgColor: 'bg-blue-500/20' },
    take_it_lighter: { color: 'text-yellow-700 dark:text-yellow-400', bgColor: 'bg-yellow-500/20' },
    recovery_focus: { color: 'text-orange-700 dark:text-orange-400', bgColor: 'bg-orange-500/20' },
  }
  return styles[state]
}

/**
 * Get a simple label for readiness state
 */
export function getReadinessLabel(state: ReadinessState): string {
  const labels = {
    ready_to_push: 'Ready to Push',
    solid_to_train: 'Solid to Train',
    take_it_lighter: 'Take It Lighter',
    recovery_focus: 'Recovery Focus',
  }
  return labels[state]
}
