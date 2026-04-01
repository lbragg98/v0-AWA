import type { MuscleProgress, ExerciseLibrary } from '@/types/database'

export type MuscleState = 'undertrained' | 'balanced' | 'fatigued'

export interface MuscleAnalysis {
  state: MuscleState
  daysSinceLastTrain: number
  recommendation: string
  suggestedExercises: ExerciseLibrary[]
  recoveryStatus: 'fresh' | 'recovered' | 'fatigued'
}

/**
 * Determine if a muscle is undertrained, balanced, or fatigued based on:
 * - Time since last training (3+ days = undertrained)
 * - Weekly volume trends
 * - Recovery score
 */
export function analyzeMuscleState(muscle: MuscleProgress, allMuscles: MuscleProgress[]): MuscleAnalysis {
  const lastTrained = muscle.last_trained_at ? new Date(muscle.last_trained_at) : null
  const now = new Date()
  const daysSinceLastTrain = lastTrained ? Math.floor((now.getTime() - lastTrained.getTime()) / (1000 * 60 * 60 * 24)) : 999

  // Determine state
  let state: MuscleState = 'balanced'
  let recoveryStatus: 'fresh' | 'recovered' | 'fatigued' = 'recovered'

  if (daysSinceLastTrain >= 7) {
    state = 'undertrained'
    recoveryStatus = 'fresh'
  } else if (daysSinceLastTrain >= 3) {
    state = 'undertrained'
    recoveryStatus = 'recovered'
  } else if (daysSinceLastTrain < 2) {
    state = 'fatigued'
    recoveryStatus = 'fatigued'
  }

  // Generate recommendation
  let recommendation = ''
  if (state === 'undertrained') {
    recommendation = `Time to train this! Last worked ${daysSinceLastTrain} days ago. Recovery score is good.`
  } else if (state === 'fatigued') {
    recommendation = `Recently trained. Let it recover a bit more before heavy work.`
  } else {
    recommendation = `Good balance. Ready for focused training in 1-2 days.`
  }

  return {
    state,
    daysSinceLastTrain,
    recommendation,
    suggestedExercises: [],
    recoveryStatus,
  }
}

/**
 * Find the weakest muscle group (for progress page)
 */
export function findWeakestMuscle(muscles: MuscleProgress[]): MuscleProgress | null {
  if (muscles.length === 0) return null
  return muscles.reduce((weakest, current) => {
    return current.level < weakest.level ? current : weakest
  })
}

/**
 * Find undertrained muscles (for body map focus badges)
 */
export function getUndertrainedMuscles(muscles: MuscleProgress[]): string[] {
  return muscles
    .filter((m) => {
      const lastTrained = m.last_trained_at ? new Date(m.last_trained_at) : null
      if (!lastTrained) return true // Never trained
      const daysSince = (Date.now() - lastTrained.getTime()) / (1000 * 60 * 60 * 24)
      return daysSince >= 5 // More than 5 days
    })
    .map((m) => m.muscle_group?.slug || m.muscle_group?.name.toLowerCase() || '')
    .filter(Boolean)
}

/**
 * Calculate recovery score impact on training readiness
 * Returns 0-1 where 1 = fully recovered, ready to train
 */
export function getRecoveryReadiness(muscle: MuscleProgress): number {
  const lastTrained = muscle.last_trained_at ? new Date(muscle.last_trained_at) : null
  if (!lastTrained) return 1 // Never trained, fully ready

  const daysSince = (Date.now() - lastTrained.getTime()) / (1000 * 60 * 60 * 24)

  // Recovery curve: 0 hours = 0%, 24 hours = 60%, 48 hours = 85%, 72+ hours = 100%
  if (daysSince < 1) {
    return 0.3 + daysSince * 0.3 // 0-0.6 over first 24 hours
  } else if (daysSince < 2) {
    return 0.6 + (daysSince - 1) * 0.25 // 0.6-0.85 over second 24 hours
  } else {
    return Math.min(1, 0.85 + (daysSince - 2) * 0.05) // 0.85-1.0 after
  }
}

/**
 * Suggest if a muscle should be prioritized in next workout
 */
export function shouldPrioritizeMuscle(muscle: MuscleProgress, allMuscles: MuscleProgress[]): boolean {
  const analysis = analyzeMuscleState(muscle, allMuscles)

  // Prioritize if undertrained and recovered
  if (analysis.state === 'undertrained' && analysis.recoveryStatus !== 'fatigued') {
    return true
  }

  // Prioritize if it's one of the weakest
  const weakest = findWeakestMuscle(allMuscles)
  if (weakest && muscle.id === weakest.id && analysis.state === 'undertrained') {
    return true
  }

  return false
}
