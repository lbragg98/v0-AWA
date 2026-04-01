'use server'

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

type Exercise = Database['public']['Tables']['exercise_library']['Row']
type MuscleProgress = Database['public']['Tables']['muscle_progress']['Row']

/**
 * EXERCISE TO MUSCLE GROUP MAPPING
 * Maps exercise muscle groups to database muscle group slugs
 */
const EXERCISE_MUSCLE_MAP: Record<string, { primary: string; secondary: string[] }> = {
  'barbell-bench-press': { primary: 'chest', secondary: ['triceps', 'shoulders'] },
  'barbell-squats': { primary: 'quadriceps', secondary: ['glutes', 'hamstrings'] },
  'deadlift': { primary: 'hamstrings', secondary: ['glutes', 'back'] },
  'dumbbell-curls': { primary: 'biceps', secondary: ['forearms'] },
  'push-ups': { primary: 'chest', secondary: ['triceps', 'shoulders'] },
  'pull-ups': { primary: 'back', secondary: ['biceps', 'shoulders'] },
  'overhead-press': { primary: 'shoulders', secondary: ['triceps', 'chest'] },
  'lat-pulldowns': { primary: 'back', secondary: ['biceps'] },
  'leg-press': { primary: 'quadriceps', secondary: ['glutes', 'hamstrings'] },
  'treadmill-running': { primary: 'quadriceps', secondary: ['hamstrings', 'calves'] },
}

/**
 * XP FORMULAS (V1)
 */
const XP_PER_SET = 10
const XP_PER_REP = 5
const SECONDARY_MUSCLE_XP_MULTIPLIER = 0.5

/**
 * TIER THRESHOLDS (based on level)
 */
const TIER_THRESHOLDS = {
  unawakened: 0,
  weakling: 5,
  novice: 15,
  builder: 30,
  beast: 50,
  elite: 75,
  god_tier: 100,
}

/**
 * Calculate XP gained from a completed set
 * Formula: Base XP (10) + Rep bonus (5 per rep)
 */
function calculateSetXP(reps: number): number {
  return XP_PER_SET + reps * XP_PER_REP
}

/**
 * Get muscle groups for an exercise by slug or muscle names
 * Falls back to direct muscle name matching if slug not found
 */
async function getMuscleGroupsForExercise(
  exercise: Exercise
): Promise<{ primary: string | null; secondary: string[] }> {
  // First try slug-based mapping
  const slugMapping = EXERCISE_MUSCLE_MAP[exercise.slug]
  if (slugMapping) {
    return {
      primary: slugMapping.primary,
      secondary: slugMapping.secondary,
    }
  }

  // Fallback: use exercise's primary_muscle and secondary_muscles directly
  return {
    primary: exercise.primary_muscle,
    secondary: exercise.secondary_muscles || [],
  }
}

/**
 * Calculate tier based on level
 */
function calculateTier(level: number): keyof typeof TIER_THRESHOLDS {
  if (level >= TIER_THRESHOLDS.god_tier) return 'god_tier'
  if (level >= TIER_THRESHOLDS.elite) return 'elite'
  if (level >= TIER_THRESHOLDS.beast) return 'beast'
  if (level >= TIER_THRESHOLDS.builder) return 'builder'
  if (level >= TIER_THRESHOLDS.novice) return 'novice'
  if (level >= TIER_THRESHOLDS.weakling) return 'weakling'
  return 'unawakened'
}

/**
 * Calculate strength score contribution from a set
 * Heavy sets (high estimated 1RM relative to reps) contribute more
 */
function calculateStrengthBonus(weight: number, reps: number): number {
  // Estimate 1RM using Epley formula
  const estimated1RM = weight * (1 + 0.0333 * reps)
  // Strength bonus: +0.5 per heavy set (estimated 1RM high relative to reps)
  return reps <= 5 ? 0.5 : reps <= 10 ? 0.3 : 0.1
}

/**
 * Calculate consistency score bonus
 * Simple V1: small daily bonus if training
 */
function calculateConsistencyBonus(): number {
  return 0.1 // Small daily bonus
}

/**
 * Calculate recovery score change
 * V1: Simple implementation - slight decrease for recent training
 */
function calculateRecoveryChange(): number {
  return -0.05 // Slight recovery penalty after training
}

/**
 * Update muscle progress for a user based on completed workout data
 */
export async function updateMuscleProgressFromWorkout(
  userId: string,
  completedSets: Array<{
    exerciseId: string
    weight: number
    reps: number
  }>
): Promise<void> {
  try {
    const supabase = await createClient()

    // Group sets by exercise
    const setsByExercise = new Map<string, typeof completedSets>()
    for (const set of completedSets) {
      if (!setsByExercise.has(set.exerciseId)) {
        setsByExercise.set(set.exerciseId, [])
      }
      setsByExercise.get(set.exerciseId)!.push(set)
    }

    // For each exercise, get muscle groups and update progress
    for (const [exerciseId, sets] of setsByExercise.entries()) {
      // Get exercise data
      const { data: exercise, error: exerciseError } = await supabase
        .from('exercise_library')
        .select('*')
        .eq('id', exerciseId)
        .single()

      if (exerciseError || !exercise) {
        console.error(`[v0] Exercise ${exerciseId} not found`)
        continue
      }

      // Get muscle groups for this exercise
      const { primary: primaryMuscleSlug, secondary: secondaryMuscleSlugs } =
        await getMuscleGroupsForExercise(exercise as Exercise)

      // Calculate total stats from all sets of this exercise
      let totalXP = 0
      let totalVolume = 0
      let totalStrengthBonus = 0
      for (const set of sets) {
        totalXP += calculateSetXP(set.reps)
        totalVolume += set.weight * set.reps
        totalStrengthBonus += calculateStrengthBonus(set.weight, set.reps)
      }

      // Update primary muscle group
      if (primaryMuscleSlug) {
        await updateMuscleProgress(
          supabase,
          userId,
          primaryMuscleSlug,
          totalXP,
          totalVolume,
          totalStrengthBonus,
          sets.length
        )
      }

      // Update secondary muscle groups with reduced XP
      for (const secondarySlug of secondaryMuscleSlugs) {
        const secondaryXP = totalXP * SECONDARY_MUSCLE_XP_MULTIPLIER
        const secondaryVolume = totalVolume * SECONDARY_MUSCLE_XP_MULTIPLIER
        const secondaryStrength = totalStrengthBonus * SECONDARY_MUSCLE_XP_MULTIPLIER

        await updateMuscleProgress(
          supabase,
          userId,
          secondarySlug,
          secondaryXP,
          secondaryVolume,
          secondaryStrength,
          sets.length
        )
      }
    }
  } catch (error) {
    console.error('[v0] Error updating muscle progression:', error)
  }
}

/**
 * Update a specific muscle group's progress
 */
async function updateMuscleProgress(
  supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never,
  userId: string,
  muscleSlug: string,
  xpGain: number,
  volumeGain: number,
  strengthGain: number,
  setCount: number
): Promise<void> {
  try {
    // Get muscle group ID
    const { data: muscleGroup, error: muscleError } = await supabase
      .from('muscle_groups')
      .select('id')
      .eq('slug', muscleSlug)
      .single()

    if (muscleError || !muscleGroup) {
      console.error(`[v0] Muscle group ${muscleSlug} not found`)
      return
    }

    // Get or create muscle progress record
    const { data: existing, error: fetchError } = await supabase
      .from('muscle_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('muscle_group_id', muscleGroup.id)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error(`[v0] Error fetching muscle progress:`, fetchError)
      return
    }

    // Calculate new values
    const currentXP = existing?.xp || 0
    const currentLevel = existing?.level || 0
    const newXP = currentXP + Math.round(xpGain)
    const newLevel = Math.floor(newXP / 10) // Level = XP / 10

    const newStrengthScore = (existing?.strength_score || 0) + strengthGain
    const newConsistencyScore =
      (existing?.consistency_score || 0) + calculateConsistencyBonus()
    const newRecoveryScore =
      Math.max(0, (existing?.recovery_score || 5) + calculateRecoveryChange())

    const tier = calculateTier(newLevel)

    if (existing) {
      // Update existing record
      await supabase
        .from('muscle_progress')
        .update({
          xp: newXP,
          level: newLevel,
          tier,
          weekly_volume: (existing.weekly_volume || 0) + Math.round(volumeGain),
          strength_score: newStrengthScore,
          consistency_score: newConsistencyScore,
          recovery_score: newRecoveryScore,
          last_trained_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
    } else {
      // Create new record
      await supabase.from('muscle_progress').insert({
        user_id: userId,
        muscle_group_id: muscleGroup.id,
        xp: newXP,
        level: newLevel,
        tier,
        weekly_volume: Math.round(volumeGain),
        strength_score: strengthGain,
        consistency_score: calculateConsistencyBonus(),
        recovery_score: 5, // Start with neutral recovery
        last_trained_at: new Date().toISOString(),
      })
    }
  } catch (error) {
    console.error(`[v0] Error updating muscle progress for ${muscleSlug}:`, error)
  }
}
