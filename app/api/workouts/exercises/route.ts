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
      exerciseId,
      sets,
      repsMin,
      repsMax,
      restSeconds,
      notes,
      exerciseType,
    } = await request.json()

    // Validate input
    if (!workoutDayId || !exerciseId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (sets < 1 || repsMin < 1 || repsMax < repsMin) {
      return NextResponse.json(
        { error: 'Invalid sets or reps' },
        { status: 400 }
      )
    }

    console.log('[v0] Adding exercise to workout day:', {
      workoutDayId,
      exerciseId,
      sets,
      repsMin,
      repsMax,
    })

    // Get the current max order_index for this day
    const { data: existingExercises } = await supabase
      .from('workout_exercises')
      .select('order_index')
      .eq('workout_day_id', workoutDayId)
      .order('order_index', { ascending: false })
      .limit(1)

    const nextOrderIndex = (existingExercises?.[0]?.order_index ?? -1) + 1

    // Insert the exercise
    const { data: savedExercise, error: insertError } = await supabase
      .from('workout_exercises')
      .insert([
        {
          workout_day_id: workoutDayId,
          exercise_id: exerciseId,
          sets,
          reps_min: repsMin,
          reps_max: repsMax,
          rest_seconds: restSeconds,
          notes: notes || null,
          exercise_type: exerciseType || 'main',
          order_index: nextOrderIndex,
        },
      ])
      .select()

    if (insertError) {
      console.error('[v0] Error inserting exercise:', insertError)
      return NextResponse.json(
        { error: 'Failed to add exercise' },
        { status: 500 }
      )
    }

    console.log('[v0] Exercise added successfully:', savedExercise?.[0]?.id)

    // Fetch the new exercise with library data
    const { data: exercisesWithLibrary, error: fetchError } = await supabase
      .from('workout_exercises')
      .select('*, exercise_library(*)')
      .eq('workout_day_id', workoutDayId)
      .order('order_index')

    if (fetchError) {
      console.error('[v0] Error fetching exercises:', fetchError)
    }

    return NextResponse.json({ exercises: exercisesWithLibrary || savedExercise })
  } catch (error) {
    console.error('[v0] Error in POST /api/workouts/exercises:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
