import { createClient } from '@/lib/supabase/server'
import type { UserStreak, CompletedWorkout, PersonalRecord } from '@/types/database'

/**
 * Updates user streak after a workout is completed
 * - Increment current streak if last workout was yesterday or today
 * - Reset to 1 if workout after a gap
 * - Update longest streak if needed
 */
export async function updateStreakAfterWorkout(userId: string, workoutDate: Date) {
  try {
    const supabase = await createClient()

    // Get current streak record
    const { data: streak, error: fetchError } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (fetchError || !streak) {
      console.error('[v0] Error fetching streak:', fetchError)
      return
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const lastWorkoutDate = streak.last_workout_date ? new Date(streak.last_workout_date) : null
    lastWorkoutDate?.setHours(0, 0, 0, 0)

    let newStreak = 1
    let newStreakStarted = today.toISOString()

    // If last workout was yesterday or today, continue streak
    if (lastWorkoutDate) {
      const daysDiff = Math.floor((today.getTime() - lastWorkoutDate.getTime()) / (1000 * 60 * 60 * 24))

      if (daysDiff === 0) {
        // Same day, don't increment
        newStreak = streak.current_streak
        newStreakStarted = streak.streak_started_at
      } else if (daysDiff === 1) {
        // Yesterday, increment
        newStreak = (streak.current_streak || 0) + 1
        newStreakStarted = streak.streak_started_at
      }
      // Else: gap detected, reset to 1
    }

    const longestStreak = Math.max(newStreak, streak.longest_streak || 0)

    // Update streak record
    await supabase
      .from('user_streaks')
      .update({
        current_streak: newStreak,
        longest_streak: longestStreak,
        last_workout_date: today.toISOString().split('T')[0],
        streak_started_at: newStreakStarted,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
  } catch (error) {
    console.error('[v0] Error updating streak:', error)
  }
}

/**
 * Detects if a set is a personal record
 * Compares weight x reps against previous records
 */
export function isPersonalRecord(weight: number, reps: number, estimatedPriorPR: number | null): boolean {
  if (!estimatedPriorPR) return true // First record

  const newEstimated1RM = estimate1RM(weight, reps)
  const priorEstimated1RM = estimatedPriorPR

  return newEstimated1RM > priorEstimated1RM
}

/**
 * Estimates 1-rep max using Epley formula
 * 1RM = weight × (1 + 0.0333 × reps)
 */
export function estimate1RM(weight: number, reps: number): number {
  if (reps === 1) return weight
  return weight * (1 + 0.0333 * reps)
}

/**
 * Saves a personal record to the database
 */
export async function savePR(
  userId: string,
  exerciseId: string,
  weight: number,
  weightUnit: 'kg' | 'lbs',
  reps: number,
  completedSetId: string | null,
  exerciseName?: string,
) {
  try {
    const supabase = await createClient()

    const estimated1RM = estimate1RM(weight, reps)

    await supabase.from('personal_records').insert({
      user_id: userId,
      exercise_id: exerciseId,
      weight,
      weight_unit: weightUnit,
      reps,
      estimated_1rm: estimated1RM,
      achieved_at: new Date().toISOString(),
      completed_set_id: completedSetId,
    })
  } catch (error) {
    console.error('[v0] Error saving PR:', error)
  }
}

/**
 * Gets recent PRs for display on activity page
 */
export async function getRecentPRs(userId: string, limit: number = 5) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('personal_records')
      .select('*')
      .eq('user_id', userId)
      .order('achieved_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[v0] Error fetching PRs:', error)
      return []
    }

    return (data || []) as PersonalRecord[]
  } catch (error) {
    console.error('[v0] Error getting recent PRs:', error)
    return []
  }
}
