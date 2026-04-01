import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { processWorkoutCompletion } from '@/app/actions/workout-progress'
import type { CompletedSet } from '@/types/workouts'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      workoutDayId,
      planId,
      workoutName,
      completedAt,
      durationMinutes,
      effortLevel,
      energyLevel,
      notes,
      totalSets,
      totalReps,
      totalVolume,
      completedSets,
    } = await request.json()

    // Validate required fields
    if (!workoutDayId || !workoutName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create completed workout
    const { data: completedWorkout, error: workoutError } = await supabase
      .from('completed_workouts')
      .insert([
        {
          user_id: user.id,
          workout_plan_id: planId || null,
          workout_day_id: workoutDayId,
          name: workoutName,
          started_at: new Date(Date.now() - durationMinutes * 60000).toISOString(),
          completed_at: completedAt,
          duration_minutes: durationMinutes,
          total_volume: totalVolume,
          total_sets: totalSets,
          total_reps: totalReps,
          effort_level: effortLevel,
          energy_level: energyLevel,
          notes: notes || null,
        },
      ])
      .select()
      .single()

    if (workoutError) {
      console.error('Error creating completed workout:', workoutError)
      return NextResponse.json(
        { error: 'Failed to save workout' },
        { status: 500 }
      )
    }

    // Save completed sets
    const savedSets: CompletedSet[] = []
    if (completedSets && completedSets.length > 0) {
      const setsToInsert = completedSets.flatMap((exerciseGroup: any) =>
        exerciseGroup.sets.map((set: any) => ({
          completed_workout_id: completedWorkout.id,
          exercise_id: exerciseGroup.exerciseId,
          set_number: set.setNumber,
          weight: set.weight,
          weight_unit: set.weightUnit,
          reps: set.reps,
          rpe: set.rpe,
          is_warmup: false,
          is_pr: false,
          notes: null,
        }))
      )

      const { data: insertedSets, error: setsError } = await supabase
        .from('completed_sets')
        .insert(setsToInsert)
        .select()

      if (setsError) {
        console.error('Error saving completed sets:', setsError)
        // Don't fail the entire operation if sets fail
      } else if (insertedSets) {
        savedSets.push(...insertedSets.map((set: any) => ({
          id: set.id,
          exerciseId: set.exercise_id,
          weight: set.weight,
          weightUnit: set.weight_unit,
          reps: set.reps,
        })))
      }
    }

    // Process workout completion (update streaks, detect PRs, etc.)
    try {
      await processWorkoutCompletion({
        userId: user.id,
        completedWorkoutId: completedWorkout.id,
        sets: savedSets,
        workoutDate: new Date(completedAt),
      })
    } catch (progressError) {
      console.error('Error processing workout progress:', progressError)
      // Don't fail the response if progress processing fails
    }

    return NextResponse.json({
      id: completedWorkout.id,
      message: 'Workout saved successfully',
    })
  } catch (error) {
    console.error('Error in POST /api/workouts/complete:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
