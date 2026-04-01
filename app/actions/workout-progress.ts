'use server'

import { createClient } from '@/lib/supabase/server'
import { updateStreakAfterWorkout } from '@/lib/workout-utils'
import { updateMuscleProgressFromWorkout } from '@/lib/muscle-progression'
import type { CompletedSet } from '@/types/workouts'

interface WorkoutProgressData {
  userId: string
  completedWorkoutId: string
  sets: CompletedSet[]
  workoutDate: Date
}

/**
 * Process workout completion:
 * 1. Update user streaks
 * 2. Detect PRs from sets
 * 3. Update muscle progression
 */
export async function processWorkoutCompletion(data: WorkoutProgressData) {
  try {
    // Update streak
    await updateStreakAfterWorkout(data.userId, data.workoutDate)

    // Detect and save PRs
    await detectAndSavePRs(data.userId, data.sets)

    // Update muscle progression
    await updateMuscleProgressFromWorkout(
      data.userId,
      data.sets.map((set) => ({
        exerciseId: set.exerciseId,
        weight: set.weight || 0,
        reps: set.reps || 0,
      }))
    )
  } catch (error) {
    console.error('[v0] Error processing workout completion:', error)
    throw error
  }
}

/**
 * Detect PRs from completed sets and save them
 */
async function detectAndSavePRs(userId: string, sets: CompletedSet[]) {
  try {
    const supabase = await createClient()

    for (const set of sets) {
      if (!set.weight || set.weight <= 0 || !set.reps || set.reps <= 0) continue

      // Get previous best for this exercise
      const { data: previousPRs } = await supabase
        .from('personal_records')
        .select('estimated_1rm')
        .eq('user_id', userId)
        .eq('exercise_id', set.exerciseId)
        .order('estimated_1rm', { ascending: false })
        .limit(1)

      const previousBest = previousPRs?.[0]?.estimated_1rm || null

      // Estimate 1RM for this set
      const estimated1RM = set.weight * (1 + 0.0333 * set.reps)

      // Check if it's a PR
      const isPR = !previousBest || estimated1RM > previousBest

      if (isPR) {
        await supabase.from('personal_records').insert({
          user_id: userId,
          exercise_id: set.exerciseId,
          weight: set.weight,
          weight_unit: set.weightUnit || 'lbs',
          reps: set.reps,
          estimated_1rm: estimated1RM,
          achieved_at: new Date().toISOString(),
          completed_set_id: set.id,
        })
      }
    }
  } catch (error) {
    console.error('[v0] Error detecting PRs:', error)
  }
}

