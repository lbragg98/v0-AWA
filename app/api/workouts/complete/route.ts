import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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

      const { error: setsError } = await supabase
        .from('completed_sets')
        .insert(setsToInsert)

      if (setsError) {
        console.error('Error saving completed sets:', setsError)
        // Don't fail the entire operation if sets fail
      }
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
